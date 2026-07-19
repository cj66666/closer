"""
/* ========================================================================== */
/* GEB L3: 线索生命周期路由                                                   */
/* ========================================================================== */
/**
 * [INPUT]: 依赖 FastAPI、ContactOnlyLeadCreate、leads 服务与租户依赖
 * [OUTPUT]: 对外提供 /api/v1/leads 列表与 /api/v1/leads/contact-only 创建接口
 * [POS]: routers 的线索工作台资源边界,覆盖完整询盘与仅留联系方式两类入口
 * [PROTOCOL]: 变更时同步更新相关测试与公开文档
 */
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_session
from app.dependencies import get_seller_id
from app.schemas import ContactOnlyLeadCreate
from app.services.leads import create_contact_only_lead, list_leads as list_leads_service


router = APIRouter(prefix="/api/v1")


@router.get("/leads")
def list_leads(
    lifecycle_stage: str | None = None,
    status: str | None = None,
    channel: str | None = None,
    q: str | None = None,
    page: int = 1,
    page_size: int = 20,
    seller_id: int = Depends(get_seller_id),
    session: Session = Depends(get_session),
) -> dict:
    items, total, page, page_size = list_leads_service(
        session,
        seller_id,
        lifecycle_stage=lifecycle_stage,
        status=status,
        channel=channel,
        q=q,
        page=page,
        page_size=page_size,
    )
    return {"items": items, "total": total, "page": page, "page_size": page_size}


@router.post("/leads/contact-only", status_code=201)
def create_contact_lead(
    payload: ContactOnlyLeadCreate,
    seller_id: int = Depends(get_seller_id),
    session: Session = Depends(get_session),
) -> dict:
    result = create_contact_only_lead(session, seller_id, payload)
    session.commit()
    return result
