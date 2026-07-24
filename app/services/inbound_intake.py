"""
/* ========================================================================== */
/* GEB L3: 入站智能编排                                                        */
/* ========================================================================== */
/**
 * [INPUT]: 依赖 SQLAlchemy Session、app.models、schemas.InboundMessage、channel_gateway 与 inquiry_triage 分诊大脑
 * [OUTPUT]: 对外提供 IntakeResult、intake_message、confirm_triage_item、dismiss_triage_item、TRIAGE_CHANNELS
 * [POS]: services 的入站决策编排器,在创建询盘之前过一道分诊闸门(仅噪音渠道如 email);干净渠道与未纳管渠道保持原有直入行为
 * [PROTOCOL]: 变更时同步更新相关测试与公开文档
 */
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models
from app.schemas import ChannelContact, InboundMessage
from app.services import inquiry_triage as triage
from app.services.alibaba_email_bridge import detect_source, extract_customer
from app.services.channel_gateway import (
    ensure_channel_account,
    ensure_seller,
    ingest_inbound_message,
)

# 仅对内容嘈杂、需要 AI 甄别的渠道启用分诊闸门;site_form 等干净渠道与未列出的渠道直入。
TRIAGE_CHANNELS = {"email"}

# 路由 -> 收件桶(前端四桶心智模型的存储依据)
ROUTE_BUCKET = {
    triage.ROUTE_ATTACH_CUSTOMER: "existing",
    triage.ROUTE_TRIAGE_QUEUE: "triage",
    triage.ROUTE_ARCHIVE: "archive",
    triage.ROUTE_BRIDGE_PARSE: "bridge",
}


@dataclass
class IntakeResult:
    kind: str  # "inquiry" | "triage"
    duplicate: bool = False
    inquiry_id: int | None = None
    conversation_id: int | None = None
    message_id: int | None = None
    customer_id: int | None = None
    triage_item_id: int | None = None
    decision: dict | None = None


def intake_message(
    session: Session,
    seller_id: int,
    message: InboundMessage,
    provider: triage.TriageProvider | None = None,
) -> IntakeResult:
    """入站统一入口:嘈杂渠道先分诊,只有判为询盘才创建询盘,否则落入分诊桶。"""
    # 阿里国际站邮件桥接：email 渠道检测是否为平台转发，若是则重写 channel 和联系人
    if message.channel == "email":
        message = _apply_bridge(message)

    # 未纳管分诊的渠道(site_form/whatsapp 等):保持原有直入行为
    if message.channel not in TRIAGE_CHANNELS:
        return _ingest_as_inquiry(session, seller_id, message)

    # 跨 Message 与 TriageItem 双表去重(同一 channel_message_id 全局只处理一次)
    duplicate = _existing_triage(session, message.channel_message_id)
    if duplicate is not None:
        return IntakeResult(kind="triage", duplicate=True, triage_item_id=duplicate.id, decision=duplicate.decision)
    if _message_exists(session, message.channel_message_id):
        return _ingest_as_inquiry(session, seller_id, message)

    context = _build_context(session, seller_id, message)
    decision = triage.triage_message(context, provider=provider)

    if decision.route == triage.ROUTE_CREATE_INQUIRY:
        result = _ingest_as_inquiry(session, seller_id, message)
        result.decision = decision.snapshot()
        return result

    return _create_triage_item(session, seller_id, message, decision)


def confirm_triage_item(session: Session, seller_id: int, item_id: int) -> IntakeResult:
    """人工确认:把待确认/桶内条目提升为正式询盘。"""
    item = _get_item(session, seller_id, item_id)
    if item.status == "confirmed" and item.inquiry_id is not None:
        return IntakeResult(kind="inquiry", duplicate=True, inquiry_id=item.inquiry_id, triage_item_id=item.id)

    message = InboundMessage(
        channel=item.channel_type or "email",
        channel_message_id=item.channel_message_id or f"triage:{item.id}",
        **{"from": ChannelContact(name=item.sender_name, email=item.sender_email)},
        content=item.content or "",
        language=item.language,
    )
    result = _ingest_as_inquiry(session, seller_id, message)
    item.status = "confirmed"
    item.inquiry_id = result.inquiry_id
    item.customer_id = result.customer_id
    session.add(
        models.AuditLog(
            seller_id=seller_id,
            actor="user",
            action_type="triage_item_confirmed",
            target_type="inquiry",
            target_id=result.inquiry_id,
            is_auto=False,
            snapshot={"triage_item_id": item.id, "category": item.category},
        )
    )
    result.triage_item_id = item.id
    return result


def dismiss_triage_item(session: Session, seller_id: int, item_id: int) -> models.TriageItem:
    """人工忽略:归档该条目(可恢复,不硬删)。"""
    item = _get_item(session, seller_id, item_id)
    item.status = "dismissed"
    item.bucket = "archive"
    session.add(
        models.AuditLog(
            seller_id=seller_id,
            actor="user",
            action_type="triage_item_dismissed",
            target_type="triage_item",
            target_id=item.id,
            is_auto=False,
            snapshot={"category": item.category},
        )
    )
    return item


def _ingest_as_inquiry(session: Session, seller_id: int, message: InboundMessage) -> IntakeResult:
    inquiry, conversation, persisted, duplicate = ingest_inbound_message(session, seller_id, message)
    return IntakeResult(
        kind="inquiry",
        duplicate=duplicate,
        inquiry_id=inquiry.id,
        conversation_id=conversation.id,
        message_id=persisted.id,
        customer_id=inquiry.customer_id,
    )


def _create_triage_item(
    session: Session,
    seller_id: int,
    message: InboundMessage,
    decision: triage.TriageDecision,
) -> IntakeResult:
    ensure_seller(session, seller_id)
    account = ensure_channel_account(session, seller_id, message.channel)
    customer = _find_customer(session, seller_id, message.from_.email)
    item = models.TriageItem(
        seller_id=seller_id,
        channel_type=message.channel,
        channel_account_id=account.id,
        channel_message_id=message.channel_message_id,
        sender_email=(message.from_.email or None),
        sender_name=message.from_.name,
        subject=(message.headers or {}).get("subject"),
        content=message.content,
        category=decision.category,
        route=decision.route,
        bucket=ROUTE_BUCKET.get(decision.route, "triage"),
        confidence=decision.confidence,
        signals=list(decision.signals),
        decision=decision.snapshot(),
        status="pending",
        customer_id=customer.id if customer else None,
        language=message.language,
        received_at=message.received_at or datetime.now(UTC),
    )
    session.add(item)
    session.flush()
    session.add(
        models.AuditLog(
            seller_id=seller_id,
            actor="system",
            action_type="inbound_message_triaged",
            target_type="triage_item",
            target_id=item.id,
            is_auto=True,
            snapshot={
                "channel": message.channel,
                "channel_message_id": message.channel_message_id,
                "category": decision.category,
                "route": decision.route,
            },
        )
    )
    return IntakeResult(
        kind="triage",
        triage_item_id=item.id,
        customer_id=item.customer_id,
        decision=decision.snapshot(),
    )


def _build_context(session: Session, seller_id: int, message: InboundMessage) -> triage.TriageContext:
    email = (message.from_.email or "").lower() or None
    customer = _find_customer(session, seller_id, email)
    has_open = False
    if customer is not None:
        has_open = (
            session.scalar(
                select(models.Conversation.id).where(
                    models.Conversation.seller_id == seller_id,
                    models.Conversation.customer_id == customer.id,
                    models.Conversation.status == "open",
                )
            )
            is not None
        )
    return triage.TriageContext(
        channel=message.channel,
        content=message.content or "",
        sender_email=email,
        sender_name=message.from_.name,
        subject=(message.headers or {}).get("subject"),
        headers=message.headers or {},
        seller_domains=_seller_domains(session, seller_id),
        is_known_customer=customer is not None,
        has_open_conversation=has_open,
    )


def _find_customer(session: Session, seller_id: int, email: str | None) -> models.Customer | None:
    if not email:
        return None
    return session.scalar(
        select(models.Customer).where(
            models.Customer.seller_id == seller_id,
            models.Customer.email == email.lower(),
        )
    )


def _seller_domains(session: Session, seller_id: int) -> tuple[str, ...]:
    seller = session.get(models.Seller, seller_id)
    if seller and seller.email and "@" in seller.email:
        return (seller.email.rsplit("@", 1)[-1].lower(),)
    return ()


def _existing_triage(session: Session, channel_message_id: str | None) -> models.TriageItem | None:
    if not channel_message_id:
        return None
    return session.scalar(
        select(models.TriageItem).where(models.TriageItem.channel_message_id == channel_message_id)
    )


def _message_exists(session: Session, channel_message_id: str | None) -> bool:
    if not channel_message_id:
        return False
    return session.scalar(select(models.Message.id).where(models.Message.channel_message_id == channel_message_id)) is not None


def _apply_bridge(message: InboundMessage) -> InboundMessage:
    """检测邮件是否来自 B2B 平台转发，若匹配则重写 channel 和联系人信息。"""
    from_email = message.from_.email or ""
    subject = message.headers.get("subject") or ""
    body = message.content or ""

    source = detect_source(from_email, subject, body)
    if source is None:
        return message

    customer = extract_customer(body, source.platform)
    new_contact = ChannelContact(
        name=customer.name or message.from_.name,
        email=customer.email or message.from_.email,
        phone=customer.phone or message.from_.phone,
        company=customer.company or message.from_.company,
        country=customer.country or message.from_.country,
    )
    content = customer.content or message.content

    return InboundMessage(
        channel=source.platform,  # type: ignore[arg-type]
        channel_message_id=message.channel_message_id,
        **{"from": new_contact},
        content=content,
        attachments=message.attachments,
        received_at=message.received_at,
        language=message.language,
        headers={**message.headers, "bridge_source": source.platform, "bridge_confidence": str(source.confidence)},
    )


def _get_item(session: Session, seller_id: int, item_id: int) -> models.TriageItem:
    item = session.get(models.TriageItem, item_id)
    if item is None or item.seller_id != seller_id:
        raise LookupError("Triage item not found")
    return item
