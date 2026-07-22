"""
/* ========================================================================== */
/* GEB L3: Seller 账号服务                                                    */
/* ========================================================================== */
/**
 * [INPUT]: 依赖 SQLAlchemy Session/select 与 app.models
 * [OUTPUT]: 对外提供 create_seller、get_seller_by_email，给 auth 注册/登录端点调用
 * [POS]: services 的租户创建边界，不拥有 API key 逻辑（由 auth_keys 负责）
 * [PROTOCOL]: 变更时同步更新相关测试与公开文档
 */
"""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models


def create_seller(session: Session, *, name: str, email: str, plan: str = "free") -> models.Seller:
    seller = models.Seller(name=name.strip(), email=email.strip().lower(), plan=plan)
    session.add(seller)
    session.flush()
    return seller


def get_seller_by_email(session: Session, email: str) -> models.Seller | None:
    return session.scalar(
        select(models.Seller)
        .where(models.Seller.email == email.strip().lower())
        .where(models.Seller.deleted_at.is_(None))
    )
