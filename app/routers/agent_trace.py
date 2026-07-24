"""
/* ========================================================================== */
/* GEB L3: Agent 决策回放路由                                                 */
/* ========================================================================== */
/**
 * [INPUT]: 依赖 FastAPI APIRouter/Depends、SQLAlchemy 查询、AgentRun/AgentTraceEvent 与 common 租户校验
 * [OUTPUT]: 对外提供 /agent-runs、/agent-runs/{id}/events、/inquiries/{id}/timeline
 * [POS]: routers 的可追溯回放边界，给运营/老板复盘“输入-工具-决策-结果”的证据链
 * [PROTOCOL]: 变更时同步更新 OpenAPI 文档、前端展示与相关测试
 */
"""

from __future__ import annotations

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from fastapi import APIRouter, Depends

from app import models
from app.database import get_session
from app.dependencies import get_seller_id
from app.errors import api_error
from app.routers.common import require_inquiry, message_item
from app.services.agent_tracing import agent_run_item, trace_event_item


router = APIRouter(prefix="/api/v1")


@router.get("/agent-runs")
def list_agent_runs(
    inquiry_id: int | None = None,
    conversation_id: int | None = None,
    status: str | None = None,
    page: int = 1,
    page_size: int = 20,
    seller_id: int = Depends(get_seller_id),
    session: Session = Depends(get_session),
) -> dict:
    page = max(page, 1)
    page_size = min(max(page_size, 1), 100)
    query = select(models.AgentRun).where(models.AgentRun.seller_id == seller_id)
    count_query = select(func.count()).select_from(models.AgentRun).where(models.AgentRun.seller_id == seller_id)
    for condition in _run_filters(inquiry_id, conversation_id, status):
        query = query.where(condition)
        count_query = count_query.where(condition)
    total = session.scalar(count_query) or 0
    runs = session.scalars(
        query.order_by(models.AgentRun.created_at.desc(), models.AgentRun.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return {"items": [agent_run_item(run) for run in runs], "total": total, "page": page, "page_size": page_size}


@router.get("/agent-runs/{agent_run_id}")
def get_agent_run(
    agent_run_id: int,
    seller_id: int = Depends(get_seller_id),
    session: Session = Depends(get_session),
) -> dict:
    run = _require_agent_run(session, seller_id, agent_run_id)
    events = _events_for_runs(session, seller_id, [run.id])
    return agent_run_item(run) | {"events": [trace_event_item(event) for event in events]}


@router.get("/agent-runs/{agent_run_id}/events")
def list_agent_run_events(
    agent_run_id: int,
    seller_id: int = Depends(get_seller_id),
    session: Session = Depends(get_session),
) -> dict:
    run = _require_agent_run(session, seller_id, agent_run_id)
    events = _events_for_runs(session, seller_id, [run.id])
    return {"items": [trace_event_item(event) for event in events], "total": len(events)}


@router.get("/inquiries/{inquiry_id}/timeline")
def get_inquiry_timeline(
    inquiry_id: int,
    seller_id: int = Depends(get_seller_id),
    session: Session = Depends(get_session),
) -> dict:
    inquiry = require_inquiry(session, seller_id, inquiry_id)
    conversations = _conversations_for_inquiry(session, seller_id, inquiry.id)
    conversation_ids = [conversation.id for conversation in conversations]
    runs = _runs_for_inquiry(session, seller_id, inquiry.id, conversation_ids)
    run_ids = [run.id for run in runs]
    items = [
        _input_item(inquiry),
        *[_triage_item(item) for item in _triage_items(session, seller_id, inquiry.id)],
        *[_message_timeline_item(message) for message in _messages_for_conversations(session, conversation_ids)],
        *[_audit_timeline_item(audit) for audit in _audit_logs(session, seller_id, inquiry, conversation_ids)],
        *[_run_timeline_item(run) for run in runs],
        *[_event_timeline_item(event) for event in _events_for_runs(session, seller_id, run_ids)],
    ]
    items.sort(key=_timeline_sort_key)
    return {
        "inquiry_id": inquiry.id,
        "customer_id": inquiry.customer_id,
        "conversation_ids": conversation_ids,
        "agent_run_ids": run_ids,
        "items": items,
        "total": len(items),
    }


def _require_agent_run(session: Session, seller_id: int, agent_run_id: int) -> models.AgentRun:
    run = session.get(models.AgentRun, agent_run_id)
    if run is None or run.seller_id != seller_id:
        raise api_error(404, "agent_run_not_found", "Agent run not found")
    return run


def _run_filters(inquiry_id: int | None, conversation_id: int | None, status: str | None) -> list:
    filters = []
    if inquiry_id is not None:
        filters.append(models.AgentRun.inquiry_id == inquiry_id)
    if conversation_id is not None:
        filters.append(models.AgentRun.conversation_id == conversation_id)
    if status:
        filters.append(models.AgentRun.status == status)
    return filters


def _conversations_for_inquiry(session: Session, seller_id: int, inquiry_id: int) -> list[models.Conversation]:
    return session.scalars(
        select(models.Conversation)
        .where(models.Conversation.seller_id == seller_id)
        .where(models.Conversation.inquiry_id == inquiry_id)
        .order_by(models.Conversation.created_at.asc(), models.Conversation.id.asc())
    ).all()


def _runs_for_inquiry(
    session: Session,
    seller_id: int,
    inquiry_id: int,
    conversation_ids: list[int],
) -> list[models.AgentRun]:
    filters = [models.AgentRun.inquiry_id == inquiry_id]
    if conversation_ids:
        filters.append(models.AgentRun.conversation_id.in_(conversation_ids))
    return session.scalars(
        select(models.AgentRun)
        .where(models.AgentRun.seller_id == seller_id)
        .where(or_(*filters))
        .order_by(models.AgentRun.created_at.asc(), models.AgentRun.id.asc())
    ).all()


def _events_for_runs(session: Session, seller_id: int, run_ids: list[int]) -> list[models.AgentTraceEvent]:
    if not run_ids:
        return []
    return session.scalars(
        select(models.AgentTraceEvent)
        .where(models.AgentTraceEvent.seller_id == seller_id)
        .where(models.AgentTraceEvent.agent_run_id.in_(run_ids))
        .order_by(models.AgentTraceEvent.agent_run_id.asc(), models.AgentTraceEvent.sequence.asc())
    ).all()


def _triage_items(session: Session, seller_id: int, inquiry_id: int) -> list[models.TriageItem]:
    return session.scalars(
        select(models.TriageItem)
        .where(models.TriageItem.seller_id == seller_id)
        .where(models.TriageItem.inquiry_id == inquiry_id)
        .order_by(models.TriageItem.created_at.asc(), models.TriageItem.id.asc())
    ).all()


def _messages_for_conversations(session: Session, conversation_ids: list[int]) -> list[models.Message]:
    if not conversation_ids:
        return []
    return session.scalars(
        select(models.Message)
        .where(models.Message.conversation_id.in_(conversation_ids))
        .order_by(models.Message.sent_at.asc().nullslast(), models.Message.id.asc())
    ).all()


def _audit_logs(
    session: Session,
    seller_id: int,
    inquiry: models.Inquiry,
    conversation_ids: list[int],
) -> list[models.AuditLog]:
    filters = [
        (models.AuditLog.target_type == "inquiry") & (models.AuditLog.target_id == inquiry.id),
        (models.AuditLog.target_type == "customer") & (models.AuditLog.target_id == inquiry.customer_id),
    ]
    if conversation_ids:
        filters.append((models.AuditLog.target_type == "conversation") & (models.AuditLog.target_id.in_(conversation_ids)))
    return session.scalars(
        select(models.AuditLog)
        .where(models.AuditLog.seller_id == seller_id)
        .where(or_(*filters))
        .order_by(models.AuditLog.created_at.asc(), models.AuditLog.id.asc())
    ).all()


def _input_item(inquiry: models.Inquiry) -> dict:
    return {
        "kind": "inquiry",
        "event_type": "input_received",
        "id": inquiry.id,
        "title": "客户原始输入",
        "status": inquiry.status,
        "created_at": inquiry.received_at or inquiry.created_at,
        "payload": {
            "source_channel": inquiry.source_channel,
            "lead_type": inquiry.lead_type,
            "contact_source": inquiry.contact_source,
            "raw_content": inquiry.raw_content,
            "parsed": inquiry.parsed or {},
            "grade": inquiry.grade,
            "score": float(inquiry.score) if inquiry.score is not None else None,
            "tags": inquiry.tags or [],
        },
    }


def _triage_item(item: models.TriageItem) -> dict:
    return {
        "kind": "triage",
        "event_type": "inbound_triaged",
        "id": item.id,
        "title": "入站分诊",
        "status": item.status,
        "created_at": item.created_at,
        "payload": {
            "channel_type": item.channel_type,
            "category": item.category,
            "route": item.route,
            "bucket": item.bucket,
            "confidence": float(item.confidence) if item.confidence is not None else None,
            "signals": item.signals or [],
            "decision": item.decision or {},
        },
    }


def _message_timeline_item(message: models.Message) -> dict:
    return {
        "kind": "message",
        "event_type": f"message_{message.sender_role}",
        "id": message.id,
        "title": "会话消息",
        "status": "recorded",
        "created_at": message.sent_at or message.created_at,
        "payload": message_item(message) | {"conversation_id": message.conversation_id},
    }


def _audit_timeline_item(audit: models.AuditLog) -> dict:
    return {
        "kind": "audit",
        "event_type": audit.action_type,
        "id": audit.id,
        "title": "业务审计",
        "status": "auto" if audit.is_auto else "manual",
        "created_at": audit.created_at,
        "payload": {
            "actor": audit.actor,
            "target_type": audit.target_type,
            "target_id": audit.target_id,
            "snapshot": audit.snapshot or {},
        },
    }


def _run_timeline_item(run: models.AgentRun) -> dict:
    return {
        "kind": "agent_run",
        "event_type": "agent_run",
        "id": run.id,
        "title": "AI 运行",
        "status": run.status,
        "created_at": run.started_at or run.created_at,
        "payload": agent_run_item(run),
    }


def _event_timeline_item(event: models.AgentTraceEvent) -> dict:
    return {
        "kind": "agent_event",
        "event_type": event.event_type,
        "id": event.id,
        "agent_run_id": event.agent_run_id,
        "sequence": event.sequence,
        "title": event.tool_name or event.node or event.event_type,
        "status": event.status,
        "created_at": event.created_at,
        "payload": trace_event_item(event),
    }


def _timeline_sort_key(item: dict) -> tuple[str, int, int]:
    created_at = item.get("created_at")
    stamp = created_at.isoformat() if hasattr(created_at, "isoformat") else str(created_at or "")
    return stamp, int(item.get("sequence") or 0), int(item.get("id") or 0)
