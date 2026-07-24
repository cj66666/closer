"""
/* ========================================================================== */
/* GEB L3: Webhook 路由                                                       */
/* ========================================================================== */
/**
 * [INPUT]: 依赖 FastAPI APIRouter/Depends、数据库 session、seller 依赖、InboundMessage 与渠道适配服务
 * [OUTPUT]: 对外提供 router，暴露 GET/POST /api/v1/webhooks/{channel}
 * [POS]: routers 的公开入站边界，把渠道 payload 归一化后交给 inbound_intake
 * [PROTOCOL]: 变更时同步更新相关测试与公开文档
 */
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Header, Query, Request, Response
from sqlalchemy.orm import Session

from app.database import get_session
from app.dependencies import get_seller_id
from app.errors import api_error
from app.schemas import InboundMessage, WebhookIngestResponse
from app.services.channel_gateway import ensure_channel_account
from app.services.facebook_adapter import FacebookAdapter
from app.services.inbound_intake import intake_message
from app.services.linkedin_adapter import LinkedInAdapter
from app.services.telegram_adapter import TelegramAdapter
from app.services.tiktok_adapter import TikTokAdapter
from app.services.wecom_adapter import WeComAdapter
from app.services.whatsapp_adapter import WhatsAppAdapter

router = APIRouter(prefix="/api/v1")


# ──────────────────────────────────────────────────────────────────────────────
# GET — webhook 验证挑战（Facebook / Instagram / WeChat）
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/webhooks/facebook", include_in_schema=False)
@router.get("/webhooks/instagram", include_in_schema=False)
def facebook_webhook_verify(
    hub_mode: str = Query(alias="hub.mode", default=""),
    hub_verify_token: str = Query(alias="hub.verify_token", default=""),
    hub_challenge: str = Query(alias="hub.challenge", default=""),
    seller_id: int = Depends(get_seller_id),
    session: Session = Depends(get_session),
) -> Response:
    account = ensure_channel_account(session, seller_id, "facebook")
    verify_token = (account.credentials or {}).get("verify_token", "")
    try:
        challenge = FacebookAdapter().verify_webhook(hub_mode, hub_verify_token, hub_challenge, verify_token)
    except ValueError as exc:
        raise api_error(403, "webhook_verification_failed", str(exc)) from exc
    return Response(content=challenge, media_type="text/plain")


@router.get("/webhooks/wecom", include_in_schema=False)
def wecom_webhook_verify(
    msg_signature: str = Query(default=""),
    timestamp: str = Query(default=""),
    nonce: str = Query(default=""),
    echostr: str = Query(default=""),
    seller_id: int = Depends(get_seller_id),
    session: Session = Depends(get_session),
) -> Response:
    account = ensure_channel_account(session, seller_id, "wecom")
    creds = account.credentials or {}
    try:
        result = WeComAdapter().verify_echo(
            token=creds.get("token", ""),
            timestamp=timestamp,
            nonce=nonce,
            echostr=echostr,
            encoding_key=creds.get("encoding_key"),
        )
    except (ValueError, RuntimeError) as exc:
        raise api_error(403, "webhook_verification_failed", str(exc)) from exc
    return Response(content=result, media_type="text/plain")


# ──────────────────────────────────────────────────────────────────────────────
# POST — 通用入站 webhook
# ──────────────────────────────────────────────────────────────────────────────

@router.post("/webhooks/{channel}", response_model=WebhookIngestResponse, status_code=201)
async def ingest_webhook(
    channel: str,
    request: Request,
    seller_id: int = Depends(get_seller_id),
    session: Session = Depends(get_session),
    x_hub_signature_256: str | None = Header(default=None),
    x_telegram_bot_api_secret_token: str | None = Header(default=None),
) -> WebhookIngestResponse:
    raw_body = await request.body()
    payload: dict[str, Any] = await request.json()

    inbound = _normalize(
        channel=channel,
        payload=payload,
        raw_body=raw_body,
        session=session,
        seller_id=seller_id,
        sig_header=x_hub_signature_256,
        tg_token_header=x_telegram_bot_api_secret_token,
    )

    result = intake_message(session, seller_id, inbound)
    session.commit()

    return WebhookIngestResponse(
        inquiry_id=result.inquiry_id or 0,
        conversation_id=result.conversation_id or 0,
        message_id=result.message_id or 0,
        customer_id=result.customer_id or 0,
        duplicate=result.duplicate,
    )


# ──────────────────────────────────────────────────────────────────────────────
# WeChat POST（XML 响应体）
# ──────────────────────────────────────────────────────────────────────────────

@router.post("/webhooks/wecom/message", include_in_schema=False)
async def wecom_message(
    request: Request,
    msg_signature: str = Query(default=""),
    timestamp: str = Query(default=""),
    nonce: str = Query(default=""),
    seller_id: int = Depends(get_seller_id),
    session: Session = Depends(get_session),
) -> Response:
    account = ensure_channel_account(session, seller_id, "wecom")
    creds = account.credentials or {}
    adapter = WeComAdapter()

    if not adapter.verify_signature(creds.get("token", ""), timestamp, nonce, msg_signature):
        raise api_error(403, "invalid_signature", "WeCom signature mismatch")

    xml_body = (await request.body()).decode("utf-8")
    try:
        msg_dict = adapter.parse_xml_message(xml_body, creds.get("encoding_key"))
        inbound = adapter.normalize_message(msg_dict)
    except Exception as exc:
        raise api_error(400, "invalid_wecom_message", str(exc)) from exc

    intake_message(session, seller_id, inbound)
    session.commit()

    return Response(content="success", media_type="text/plain")


# ──────────────────────────────────────────────────────────────────────────────
# Telegram webhook 设置辅助接口
# ──────────────────────────────────────────────────────────────────────────────

@router.post("/webhooks/telegram/setup", include_in_schema=False)
def telegram_setup_webhook(
    seller_id: int = Depends(get_seller_id),
    session: Session = Depends(get_session),
) -> dict[str, str]:
    """调用 Telegram setWebhook 将 Bot webhook 指向本服务。"""
    import json
    from urllib.request import Request as Req, urlopen

    account = ensure_channel_account(session, seller_id, "telegram")
    creds = account.credentials or {}
    bot_token = creds.get("bot_token")
    webhook_url = creds.get("webhook_url")
    if not bot_token or not webhook_url:
        raise api_error(400, "missing_credentials", "bot_token and webhook_url are required")

    secret_token = creds.get("secret_token") or ""
    body: dict[str, Any] = {"url": webhook_url}
    if secret_token:
        body["secret_token"] = secret_token

    req = Req(
        f"https://api.telegram.org/bot{bot_token}/setWebhook",
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urlopen(req, timeout=10) as resp:
        result = json.loads(resp.read().decode())
    return {"ok": str(result.get("ok")), "description": result.get("description", "")}


# ──────────────────────────────────────────────────────────────────────────────
# 内部：归一化分发
# ──────────────────────────────────────────────────────────────────────────────

def _normalize(
    channel: str,
    payload: dict[str, Any],
    raw_body: bytes,
    session: Session,
    seller_id: int,
    sig_header: str | None,
    tg_token_header: str | None,
) -> InboundMessage:
    account = ensure_channel_account(session, seller_id, channel)
    creds = account.credentials or {}

    if channel == "site_form":
        return InboundMessage.model_validate(payload)

    if channel == "whatsapp":
        adapter = WhatsAppAdapter()
        app_secret = creds.get("app_secret", "")
        if app_secret and sig_header:
            if not adapter.verify_signature(raw_body, sig_header, app_secret):
                raise api_error(403, "invalid_signature", "WhatsApp signature mismatch")
        try:
            return adapter.normalize_webhook(payload)
        except ValueError as exc:
            raise api_error(400, "invalid_webhook_payload", str(exc)) from exc

    if channel in ("facebook", "instagram"):
        adapter = FacebookAdapter()
        app_secret = creds.get("app_secret", "")
        if app_secret and sig_header:
            if not adapter.verify_signature(raw_body, sig_header, app_secret):
                raise api_error(403, "invalid_signature", "Facebook signature mismatch")
        try:
            return adapter.normalize_webhook(
                payload,
                access_token=creds.get("page_access_token"),
                channel=channel,
            )
        except ValueError as exc:
            raise api_error(400, "invalid_webhook_payload", str(exc)) from exc

    if channel == "telegram":
        adapter = TelegramAdapter()
        bot_token = creds.get("bot_token", "")
        if bot_token and not adapter.verify_token(tg_token_header, bot_token):
            raise api_error(403, "invalid_signature", "Telegram token mismatch")
        try:
            return adapter.normalize_webhook(payload)
        except ValueError as exc:
            raise api_error(400, "invalid_webhook_payload", str(exc)) from exc

    if channel == "tiktok":
        adapter = TikTokAdapter()
        webhook_secret = creds.get("webhook_secret", "")
        if webhook_secret and sig_header:
            if not adapter.verify_signature(raw_body, sig_header, webhook_secret):
                raise api_error(403, "invalid_signature", "TikTok signature mismatch")
        try:
            return adapter.normalize_webhook(
                payload,
                access_token=creds.get("access_token"),
                advertiser_id=creds.get("advertiser_id"),
            )
        except ValueError as exc:
            raise api_error(400, "invalid_webhook_payload", str(exc)) from exc

    if channel == "linkedin":
        adapter = LinkedInAdapter()
        client_secret = creds.get("client_secret", "")
        if client_secret and sig_header:
            if not adapter.verify_signature(raw_body, sig_header, client_secret):
                raise api_error(403, "invalid_signature", "LinkedIn signature mismatch")
        try:
            return adapter.normalize_webhook(payload)
        except ValueError as exc:
            raise api_error(400, "invalid_webhook_payload", str(exc)) from exc

    raise api_error(400, "unsupported_channel", f"{channel!r} webhook is not supported")
