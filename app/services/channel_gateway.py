"""
/* ========================================================================== */
/* GEB L3: 入站渠道网关                                                       */
/* ========================================================================== */
/**
 * [INPUT]: 依赖 SQLAlchemy Session、app.models 与 schemas.ChannelContact/InboundMessage
 * [OUTPUT]: 对外提供 ensure_seller、ensure_channel_account、find_or_create_customer、parse_inquiry_content、ingest_inbound_message
 * [POS]: services 的入站事实创建器，把渠道消息转成客户、询盘、会话、首条消息与审计日志
 * [PROTOCOL]: 变更时同步更新相关测试与公开文档
 */
"""

from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models
from app.schemas import ChannelContact, InboundMessage
from app.services import inquiry_triage


DEFAULT_SELLER_NAME = "Demo Exporter"
DEFAULT_SELLER_EMAIL_DOMAIN = "example.com"


def ensure_seller(session: Session, seller_id: int) -> models.Seller:
    seller = session.get(models.Seller, seller_id)
    if seller:
        return seller

    seller = models.Seller(
        id=seller_id,
        name=DEFAULT_SELLER_NAME,
        email=f"owner+seller-{seller_id}@{DEFAULT_SELLER_EMAIL_DOMAIN}",
    )
    session.add(seller)
    session.flush()
    return seller


def ensure_channel_account(session: Session, seller_id: int, channel: str) -> models.ChannelAccount:
    account = session.scalar(
        select(models.ChannelAccount).where(
            models.ChannelAccount.seller_id == seller_id,
            models.ChannelAccount.channel_type == channel,
        )
    )
    if account:
        return account

    account = models.ChannelAccount(
        seller_id=seller_id,
        channel_type=channel,
        name=f"{channel} default",
        credentials={},
        status="connected",
    )
    session.add(account)
    session.flush()
    return account


def _contact_identity(contact: ChannelContact, channel: str) -> tuple[str | None, dict]:
    channels: dict[str, str] = {}
    if contact.email:
        channels["email"] = str(contact.email).lower()
    if contact.phone:
        channels["phone"] = contact.phone
        channels[channel] = contact.phone
    return (str(contact.email).lower() if contact.email else None), channels


def find_or_create_customer(session: Session, seller_id: int, contact: ChannelContact, channel: str) -> models.Customer:
    email, channels = _contact_identity(contact, channel)
    customer = None
    if email:
        customer = session.scalar(
            select(models.Customer).where(
                models.Customer.seller_id == seller_id,
                models.Customer.email == email,
            )
        )
    if customer is None and contact.phone:
        customer = session.scalar(
            select(models.Customer).where(
                models.Customer.seller_id == seller_id,
                models.Customer.phone == contact.phone,
            )
        )
    if customer:
        current_channels = dict(customer.channels or {})
        current_channels.update(channels)
        customer.channels = current_channels
        _merge_customer_contact(customer, contact)
        return customer

    customer = models.Customer(
        seller_id=seller_id,
        name=contact.name,
        company=contact.company,
        country=contact.country,
        email=email,
        phone=contact.phone,
        channels=channels,
        status="active",
    )
    session.add(customer)
    session.flush()
    return customer


def _merge_customer_contact(customer: models.Customer, contact: ChannelContact) -> None:
    if contact.name and not customer.name:
        customer.name = contact.name
    if contact.company and not customer.company:
        customer.company = contact.company
    if contact.country and not customer.country:
        customer.country = contact.country
    if contact.phone and not customer.phone:
        customer.phone = contact.phone


def parse_inquiry_content(content: str) -> dict:
    text = content.lower()
    parsed: dict[str, object] = {"raw_summary": content[:240]}
    for marker in ["led desk lamp", "desk lamp", "lamp", "textile", "tool"]:
        if marker in text:
            parsed["product"] = marker
            break
    numbers = [int(token) for token in text.replace(",", " ").split() if token.isdigit()]
    if numbers:
        parsed["quantity"] = max(numbers)
    for country in ["us", "usa", "united states", "germany", "uk", "france"]:
        if country in text:
            parsed["destination"] = "US" if country in {"us", "usa", "united states"} else country.upper()
            break
    return parsed


def ingest_inbound_message(session: Session, seller_id: int, message: InboundMessage) -> tuple[models.Inquiry, models.Conversation, models.Message, bool]:
    ensure_seller(session, seller_id)
    account = ensure_channel_account(session, seller_id, message.channel)

    existing_message = session.scalar(
        select(models.Message).where(models.Message.channel_message_id == message.channel_message_id)
    )
    if existing_message:
        conversation = session.get(models.Conversation, existing_message.conversation_id)
        inquiry = session.get(models.Inquiry, conversation.inquiry_id) if conversation else None
        if not conversation or not inquiry:
            raise ValueError("idempotent message points to missing conversation or inquiry")
        return inquiry, conversation, existing_message, True

    customer = find_or_create_customer(session, seller_id, message.from_, message.channel)
    received_at = message.received_at or datetime.now(UTC)
    inquiry = models.Inquiry(
        seller_id=seller_id,
        customer_id=customer.id,
        channel_account_id=account.id,
        source_channel=message.channel,
        raw_content=message.content,
        parsed=parse_inquiry_content(message.content),
        status="new",
        language=message.language,
        received_at=received_at,
    )
    _apply_lifecycle_assessment(inquiry, customer, message)
    session.add(inquiry)
    session.flush()

    conversation = models.Conversation(
        seller_id=seller_id,
        customer_id=customer.id,
        inquiry_id=inquiry.id,
        channel=message.channel,
        language=message.language,
        status="open",
    )
    session.add(conversation)
    session.flush()

    persisted_message = models.Message(
        conversation_id=conversation.id,
        sender_role="customer",
        channel_message_id=message.channel_message_id,
        content=message.content,
        attachments=message.attachments,
        language=message.language,
        sent_at=received_at,
    )
    session.add(persisted_message)
    session.flush()

    session.add(
        models.AuditLog(
            seller_id=seller_id,
            actor="system",
            action_type="inbound_message_ingested",
            target_type="inquiry",
            target_id=inquiry.id,
            is_auto=True,
            snapshot={"channel": message.channel, "channel_message_id": message.channel_message_id},
        )
    )
    return inquiry, conversation, persisted_message, False


def _apply_lifecycle_assessment(
    inquiry: models.Inquiry,
    customer: models.Customer,
    message: InboundMessage,
) -> None:
    context = inquiry_triage.TriageContext(
        channel=message.channel,
        content=message.content or "",
        sender_email=message.from_.email,
        sender_name=message.from_.name,
        subject=(message.headers or {}).get("subject"),
        headers=message.headers or {},
        extra={
            "company": message.from_.company,
            "phone": message.from_.phone,
            "contact": message.from_.email or message.from_.phone,
        },
    )
    assessment = inquiry_triage.assess_lead_context(context)
    parsed = dict(inquiry.parsed or {})
    parsed["lead_assessment"] = assessment
    inquiry.parsed = parsed
    inquiry.lifecycle_stage = assessment["lifecycle_stage"]
    inquiry.intent_level = assessment["intent_level"]
    inquiry.tags = assessment["tags"]
    inquiry.takeover_required = bool(assessment["human_takeover_required"])
    inquiry.takeover_reason = ",".join(assessment["human_takeover_reasons"])[:80] or None
    if not inquiry.grade:
        inquiry.grade = assessment["deal_probability"]

    customer.lifecycle_stage = assessment["lifecycle_stage"]
    customer.intent_level = assessment["intent_level"]
    customer.tags = _merge_tags(customer.tags or [], assessment["tags"])
    if not customer.grade:
        customer.grade = assessment["deal_probability"]
    if inquiry.takeover_required:
        customer.takeover_status = "human_required"


def _merge_tags(existing: list, incoming: list[str]) -> list[str]:
    result = [str(tag) for tag in existing if tag]
    for tag in incoming:
        if tag not in result:
            result.append(tag)
    return result
