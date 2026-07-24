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

import csv
import io

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_session
from app.dependencies import get_seller_id
from app.schemas import ChannelContact, ContactOnlyLeadCreate
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


_CSV_FIELD_MAP = {
    'name':    ['name', '姓名', '联系人', 'contact_name', 'full_name'],
    'company': ['company', '公司', '公司名', '企业名称', 'company_name'],
    'country': ['country', '国家', '地区', 'region'],
    'email':   ['email', '邮箱', '电子邮件', 'e-mail', 'mail'],
    'phone':   ['phone', '电话', '手机', '联系方式', 'mobile', 'tel'],
    'note':    ['note', '备注', '需求', '询盘', 'message', 'inquiry', 'comment'],
}


@router.post("/leads/import-csv", status_code=200)
async def import_csv_leads(
    file: UploadFile = File(...),
    seller_id: int = Depends(get_seller_id),
    session: Session = Depends(get_session),
) -> dict:
    if not (file.filename or "").lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="只支持 .csv 格式文件")
    raw = await file.read()
    text: str | None = None
    for enc in ("utf-8-sig", "utf-8", "gbk"):
        try:
            text = raw.decode(enc)
            break
        except UnicodeDecodeError:
            continue
    if text is None:
        raise HTTPException(status_code=400, detail="文件编码无法识别，请转换为 UTF-8 后重试")

    reader = csv.DictReader(io.StringIO(text))
    created = 0
    skipped = 0
    rows_out: list[dict] = []

    for i, row in enumerate(reader):
        norm = {k.strip().lower(): (v or "").strip() for k, v in row.items()}

        def pick(field: str) -> str:
            for alias in _CSV_FIELD_MAP[field]:
                if norm.get(alias):
                    return norm[alias]
            return ""

        name = pick("name")
        company = pick("company")
        country = pick("country")
        email = pick("email")
        phone = pick("phone")
        note = pick("note")

        if not name and not email and not phone:
            skipped += 1
            rows_out.append({"row": i + 2, "status": "skipped", "reason": "缺少姓名/邮箱/电话"})
            continue

        try:
            payload = ContactOnlyLeadCreate(
                channel="site_form",
                contact_source="csv_import",
                contact=ChannelContact(
                    name=name or None,
                    company=company or None,
                    country=country or None,
                    email=email or None,
                    phone=phone or None,
                ),
                note=note or None,
                tags=["CSV 导入"],
            )
            create_contact_only_lead(session, seller_id, payload)
            session.commit()
            created += 1
            rows_out.append({"row": i + 2, "status": "created", "name": name, "company": company, "email": email})
        except Exception as exc:
            session.rollback()
            skipped += 1
            rows_out.append({"row": i + 2, "status": "error", "reason": str(exc)[:120]})

    return {"created": created, "skipped": skipped, "total": created + skipped, "rows": rows_out}


@router.post("/leads/contact-only", status_code=201)
def create_contact_lead(
    payload: ContactOnlyLeadCreate,
    seller_id: int = Depends(get_seller_id),
    session: Session = Depends(get_session),
) -> dict:
    result = create_contact_only_lead(session, seller_id, payload)
    session.commit()
    return result
