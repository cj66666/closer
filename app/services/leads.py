"""
/* ========================================================================== */
/* GEB L3: 线索生命周期服务                                                   */
/* ========================================================================== */
/**
 * [INPUT]: 依赖 SQLAlchemy Session、ContactOnlyLeadCreate、channel_gateway 与 inquiry_triage
 * [OUTPUT]: 对外提供 create_contact_only_lead 与 list_leads
 * [POS]: services 的线索生命周期边界,支持仅留联系方式线索、首次联系任务与客户阶段管理
 * [PROTOCOL]: 变更时同步更新相关测试与公开文档
 */
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app import models
from app.schemas import ContactOnlyLeadCreate
from app.services import inquiry_triage
from app.services.catalog_domain.common import page as clamp_page
from app.services.channel_gateway import ensure_channel_account, ensure_seller, find_or_create_customer


def create_contact_only_lead(session: Session, seller_id: int, payload: ContactOnlyLeadCreate) -> dict[str, Any]:
    """创建仅留联系方式线索:建客户、建线索、排首次联系任务,不伪造客户消息。"""
    ensure_seller(session, seller_id)
    account = ensure_channel_account(session, seller_id, payload.channel)
    customer = find_or_create_customer(session, seller_id, payload.contact, payload.channel)
    received_at = payload.received_at or datetime.now(UTC)
    note = payload.note or ""
    context = inquiry_triage.TriageContext(
        channel=payload.channel,
        content=note,
        sender_email=payload.contact.email,
        sender_name=payload.contact.name,
        extra={
            "company": payload.contact.company,
            "phone": payload.contact.phone,
            "contact": payload.contact.email or payload.contact.phone,
        },
    )
    assessment = inquiry_triage.assess_lead_context(context, contact_only=True)
    tags = _merge_tags(assessment["tags"], payload.tags)
    inquiry = models.Inquiry(
        seller_id=seller_id,
        customer_id=customer.id,
        channel_account_id=account.id,
        source_channel=payload.channel,
        lead_type="contact_only",
        contact_source=payload.contact_source,
        raw_content=note or "Contact-only lead; seller should initiate the first conversation.",
        parsed={
            "lead_assessment": assessment,
            "source_url": payload.source_url,
            "contact_source": payload.contact_source,
        },
        grade=assessment["deal_probability"],
        lifecycle_stage="first_contact_due",
        intent_level=assessment["intent_level"],
        tags=tags,
        takeover_required=True,
        takeover_reason="first_contact_required",
        status="first_contact_due",
        language=payload.language,
        received_at=received_at,
    )
    session.add(inquiry)
    session.flush()

    customer.lifecycle_stage = "first_contact_due"
    customer.intent_level = assessment["intent_level"]
    customer.tags = _merge_tags(customer.tags or [], tags)
    customer.takeover_status = "human_required"
    if not customer.grade:
        customer.grade = assessment["deal_probability"]

    conversation = models.Conversation(
        seller_id=seller_id,
        customer_id=customer.id,
        inquiry_id=inquiry.id,
        channel=payload.channel,
        language=payload.language,
        is_human_takeover=True,
        status="pending_first_contact",
    )
    session.add(conversation)
    session.flush()

    task = models.FollowupTask(
        seller_id=seller_id,
        inquiry_id=inquiry.id,
        conversation_id=conversation.id,
        schedule={
            "kind": "first_contact",
            "stage": "first_contact_due",
            "message": assessment["recommended_next_step"],
            "attempt": 0,
            "max_attempts": 1,
        },
        next_run_at=received_at,
        status="active",
    )
    session.add(task)
    session.flush()
    inquiry.next_followup_at = task.next_run_at
    customer.next_followup_at = task.next_run_at
    session.add(
        models.AuditLog(
            seller_id=seller_id,
            actor="system",
            action_type="contact_only_lead_created",
            target_type="inquiry",
            target_id=inquiry.id,
            is_auto=True,
            snapshot={
                "channel": payload.channel,
                "contact_source": payload.contact_source,
                "customer_id": customer.id,
                "followup_id": task.id,
            },
        )
    )
    return lead_detail(session, inquiry, conversation, task)


def list_leads(
    session: Session,
    seller_id: int,
    *,
    lifecycle_stage: str | None = None,
    status: str | None = None,
    channel: str | None = None,
    q: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> tuple[list[dict[str, Any]], int, int, int]:
    page, page_size = clamp_page(page, page_size)
    conditions = [models.Inquiry.seller_id == seller_id, models.Inquiry.deleted_at.is_(None)]
    if lifecycle_stage:
        conditions.append(models.Inquiry.lifecycle_stage == lifecycle_stage)
    if status:
        conditions.append(models.Inquiry.status == status)
    if channel:
        conditions.append(models.Inquiry.source_channel == channel)
    if q:
        like = f"%{q}%"
        conditions.append(
            or_(
                models.Inquiry.raw_content.ilike(like),
                models.Inquiry.source_channel.ilike(like),
                models.Customer.name.ilike(like),
                models.Customer.company.ilike(like),
                models.Customer.email.ilike(like),
                models.Customer.phone.ilike(like),
            )
        )
    base = select(models.Inquiry).join(models.Customer, models.Customer.id == models.Inquiry.customer_id).where(*conditions)
    total = session.scalar(select(func.count()).select_from(models.Inquiry).join(models.Customer).where(*conditions)) or 0
    inquiries = session.scalars(
        base.order_by(models.Inquiry.next_followup_at.asc().nullslast(), models.Inquiry.received_at.desc().nullslast(), models.Inquiry.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return [_lead_item(session, inquiry) for inquiry in inquiries], total, page, page_size


def lead_detail(
    session: Session,
    inquiry: models.Inquiry,
    conversation: models.Conversation | None = None,
    followup: models.FollowupTask | None = None,
) -> dict[str, Any]:
    return _lead_item(session, inquiry, conversation=conversation, followup=followup)


def _lead_item(
    session: Session,
    inquiry: models.Inquiry,
    *,
    conversation: models.Conversation | None = None,
    followup: models.FollowupTask | None = None,
) -> dict[str, Any]:
    customer = session.get(models.Customer, inquiry.customer_id)
    conversation = conversation or session.scalar(
        select(models.Conversation)
        .where(models.Conversation.seller_id == inquiry.seller_id, models.Conversation.inquiry_id == inquiry.id)
        .order_by(models.Conversation.updated_at.desc(), models.Conversation.id.desc())
        .limit(1)
    )
    followup = followup or session.scalar(
        select(models.FollowupTask)
        .where(models.FollowupTask.seller_id == inquiry.seller_id, models.FollowupTask.inquiry_id == inquiry.id)
        .order_by(models.FollowupTask.next_run_at.asc().nullslast(), models.FollowupTask.id.desc())
        .limit(1)
    )
    assessment = (inquiry.parsed or {}).get("lead_assessment") or {}
    return {
        "id": inquiry.id,
        "customer_id": inquiry.customer_id,
        "conversation_id": conversation.id if conversation else None,
        "followup_id": followup.id if followup else None,
        "customer": _customer_snapshot(customer),
        "source_channel": inquiry.source_channel,
        "lead_type": inquiry.lead_type,
        "contact_source": inquiry.contact_source,
        "lifecycle_stage": inquiry.lifecycle_stage,
        "intent_level": inquiry.intent_level,
        "tags": inquiry.tags or [],
        "grade": inquiry.grade,
        "status": inquiry.status,
        "takeover_required": inquiry.takeover_required,
        "takeover_reason": inquiry.takeover_reason,
        "next_followup_at": inquiry.next_followup_at,
        "summary": assessment.get("need_summary") or (inquiry.raw_content[:160] if inquiry.raw_content else None),
        "lead_assessment": assessment,
        "received_at": inquiry.received_at,
    }


def _customer_snapshot(customer: models.Customer | None) -> dict[str, Any] | None:
    if customer is None:
        return None
    return {
        "id": customer.id,
        "name": customer.name,
        "company": customer.company,
        "country": customer.country,
        "email": customer.email,
        "phone": customer.phone,
        "lifecycle_stage": customer.lifecycle_stage,
        "intent_level": customer.intent_level,
        "tags": customer.tags or [],
        "next_followup_at": customer.next_followup_at,
        "takeover_status": customer.takeover_status,
    }


def _merge_tags(*tag_lists: list) -> list[str]:
    result: list[str] = []
    for tags in tag_lists:
        for tag in tags or []:
            tag = str(tag)
            if tag and tag not in result:
                result.append(tag)
    return result
