"""
/* ========================================================================== */
/* GEB L3: 分诊路由                                                           */
/* ========================================================================== */
/**
 * [INPUT]: 依赖 FastAPI APIRouter/Depends、SQLAlchemy Session、app.models 与 inbound_intake 确认/忽略
 * [OUTPUT]: 对外提供 router，暴露 /api/v1/triage 列表、确认升询盘与忽略归档接口
 * [POS]: routers 的入站分诊桶边界,让前端读取待确认/其他桶,并支持人工一键确认或忽略
 * [PROTOCOL]: 变更时同步更新相关测试与公开文档
 */
"""

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app import models
from app.database import get_session
from app.dependencies import get_seller_id
from app.errors import api_error
from app.services.inbound_intake import confirm_triage_item, dismiss_triage_item


router = APIRouter(prefix="/api/v1")


def triage_item_view(item: models.TriageItem) -> dict:
    return {
        "id": item.id,
        "channel_type": item.channel_type,
        "channel_message_id": item.channel_message_id,
        "sender_email": item.sender_email,
        "sender_name": item.sender_name,
        "subject": item.subject,
        "content": item.content,
        "category": item.category,
        "route": item.route,
        "bucket": item.bucket,
        "confidence": float(item.confidence) if item.confidence is not None else None,
        "signals": item.signals or [],
        "status": item.status,
        "customer_id": item.customer_id,
        "inquiry_id": item.inquiry_id,
        "received_at": item.received_at.isoformat() if item.received_at else None,
    }


@router.get("/triage")
def list_triage_items(
    bucket: str | None = None,
    status: str | None = "pending",
    page: int = 1,
    page_size: int = 20,
    seller_id: int = Depends(get_seller_id),
    session: Session = Depends(get_session),
) -> dict:
    page = max(1, page)
    page_size = max(1, min(page_size, 100))
    conditions = [models.TriageItem.seller_id == seller_id]
    if bucket:
        conditions.append(models.TriageItem.bucket == bucket)
    if status:
        conditions.append(models.TriageItem.status == status)

    total = session.scalar(select(func.count()).select_from(models.TriageItem).where(*conditions)) or 0
    items = session.scalars(
        select(models.TriageItem)
        .where(*conditions)
        .order_by(models.TriageItem.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return {
        "items": [triage_item_view(item) for item in items],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.post("/triage/{item_id}/confirm")
def confirm_triage(
    item_id: int,
    seller_id: int = Depends(get_seller_id),
    session: Session = Depends(get_session),
) -> dict:
    try:
        result = confirm_triage_item(session, seller_id, item_id)
    except LookupError as exc:
        raise api_error(404, "triage_item_not_found", "Triage item not found") from exc
    session.commit()
    return {
        "kind": result.kind,
        "inquiry_id": result.inquiry_id,
        "conversation_id": result.conversation_id,
        "customer_id": result.customer_id,
        "triage_item_id": result.triage_item_id,
        "duplicate": result.duplicate,
    }


@router.post("/triage/{item_id}/dismiss")
def dismiss_triage(
    item_id: int,
    seller_id: int = Depends(get_seller_id),
    session: Session = Depends(get_session),
) -> dict:
    try:
        item = dismiss_triage_item(session, seller_id, item_id)
    except LookupError as exc:
        raise api_error(404, "triage_item_not_found", "Triage item not found") from exc
    session.commit()
    return triage_item_view(item)
