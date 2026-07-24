"""
/* ========================================================================== */
/* GEB L3: 出站渠道客户端                                                     */
/* ========================================================================== */
/**
 * [INPUT]: 依赖 os、json、smtplib、urllib、EmailMessage 与渠道 payload/credentials
 * [OUTPUT]: 对外提供 DeliveryClient、PayloadOnlyDeliveryClient、SmtpDeliveryClient、WhatsAppCloudDeliveryClient、send_with_delivery_client
 * [POS]: services 的真实渠道发送客户端边界，让 channel_delivery 只选择客户端，不直接理解 SMTP/HTTP 细节
 * [PROTOCOL]: 变更时同步更新相关测试与公开文档
 */
"""

from __future__ import annotations

import json
import os
import smtplib
from email.message import EmailMessage
from typing import Any, Protocol
from urllib.request import Request, urlopen


class DeliveryClient(Protocol):
    name: str

    def send(self, payload: dict[str, Any], credentials: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError


class PayloadOnlyDeliveryClient:
    name = "payload_only"

    def send(self, payload: dict[str, Any], credentials: dict[str, Any]) -> dict[str, Any]:
        return {"status": "queued", "client": self.name, "provider_message_id": None}


class SmtpDeliveryClient:
    name = "smtp"

    def send(self, payload: dict[str, Any], credentials: dict[str, Any]) -> dict[str, Any]:
        host = _required_any(credentials, "smtp_host", "host")
        port = int(credentials.get("smtp_port") or credentials.get("port") or 465)
        timeout = float(credentials.get("timeout_seconds") or 10)
        message = _email_message(payload)
        if credentials.get("use_ssl", True):
            smtp = smtplib.SMTP_SSL(host, port, timeout=timeout)
        else:
            smtp = smtplib.SMTP(host, port, timeout=timeout)
        with smtp:
            if credentials.get("starttls"):
                smtp.starttls()
            username = credentials.get("username")
            password = credentials.get("password")
            if username and password:
                smtp.login(str(username), str(password))
            smtp.send_message(message)
        return {"status": "sent", "client": self.name, "provider_message_id": payload.get("message_id")}


class WhatsAppCloudDeliveryClient:
    name = "whatsapp_cloud"

    def send(self, payload: dict[str, Any], credentials: dict[str, Any]) -> dict[str, Any]:
        token = _required(credentials, "access_token")
        phone_number_id = _required(credentials, "phone_number_id")
        api_version = credentials.get("api_version") or "v20.0"
        endpoint = credentials.get("endpoint") or f"https://graph.facebook.com/{api_version}/{phone_number_id}/messages"
        request = Request(
            str(endpoint),
            data=json.dumps(payload).encode("utf-8"),
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            method="POST",
        )
        with urlopen(request, timeout=float(credentials.get("timeout_seconds") or 10)) as response:
            result = json.loads(response.read().decode("utf-8"))
        messages = result.get("messages") if isinstance(result, dict) else None
        provider_id = messages[0].get("id") if messages else None
        return {"status": "sent", "client": self.name, "provider_message_id": provider_id, "response": result}


def send_with_delivery_client(
    channel: str,
    payload: dict[str, Any],
    credentials: dict[str, Any] | None = None,
) -> dict[str, Any]:
    client = _client_for(channel)
    return client.send(payload, credentials or {})


class FacebookDeliveryClient:
    """Facebook Messenger / Instagram 应用消息 — credentials: {page_access_token}。"""
    name = "facebook_graph"

    def send(self, payload: dict[str, Any], credentials: dict[str, Any]) -> dict[str, Any]:
        token = _required(credentials, "page_access_token")
        api_version = credentials.get("api_version") or "v20.0"
        endpoint = f"https://graph.facebook.com/{api_version}/me/messages"
        req = Request(
            endpoint,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            method="POST",
        )
        with urlopen(req, timeout=float(credentials.get("timeout_seconds") or 10)) as resp:
            result = json.loads(resp.read().decode("utf-8"))
        return {"status": "sent", "client": self.name, "provider_message_id": result.get("message_id"), "response": result}


class TelegramDeliveryClient:
    """Telegram Bot API — credentials: {bot_token}。"""
    name = "telegram_bot"

    def send(self, payload: dict[str, Any], credentials: dict[str, Any]) -> dict[str, Any]:
        token = _required(credentials, "bot_token")
        endpoint = f"https://api.telegram.org/bot{token}/sendMessage"
        req = Request(
            endpoint,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urlopen(req, timeout=float(credentials.get("timeout_seconds") or 10)) as resp:
            result = json.loads(resp.read().decode("utf-8"))
        ok = result.get("ok", False)
        msg_id = (result.get("result") or {}).get("message_id")
        return {"status": "sent" if ok else "error", "client": self.name, "provider_message_id": str(msg_id) if msg_id else None, "response": result}


class WeComDeliveryClient:
    """企业微信 — 优先群机器人 webhook_url，否则走应用消息 API。"""
    name = "wecom"

    def send(self, payload: dict[str, Any], credentials: dict[str, Any]) -> dict[str, Any]:
        if credentials.get("webhook_url"):
            from app.services.wecom_adapter import WeComBotDeliveryClient
            return WeComBotDeliveryClient().send(payload, credentials)
        from app.services.wecom_adapter import WeComAppDeliveryClient
        return WeComAppDeliveryClient().send(payload, credentials)


def _client_for(channel: str) -> DeliveryClient:
    if os.getenv("CLOSER_DELIVERY_MODE") != "live":
        return PayloadOnlyDeliveryClient()
    if channel == "email":
        return SmtpDeliveryClient()
    if channel == "whatsapp":
        return WhatsAppCloudDeliveryClient()
    if channel in ("facebook", "instagram"):
        return FacebookDeliveryClient()
    if channel == "telegram":
        return TelegramDeliveryClient()
    if channel == "wecom":
        return WeComDeliveryClient()
    # tiktok / linkedin / alibaba / made_in_china / global_sources: 记录 payload 即可
    return PayloadOnlyDeliveryClient()


def _email_message(payload: dict[str, Any]) -> EmailMessage:
    message = EmailMessage()
    message["From"] = str(payload.get("from") or "")
    message["To"] = str(payload.get("to") or "")
    message["Subject"] = str(payload.get("subject") or "")
    if payload.get("message_id"):
        message["Message-ID"] = f"<{str(payload['message_id']).strip('<>')}>"
    message.set_content(str(payload.get("body") or ""))
    return message


def _required(credentials: dict[str, Any], key: str) -> str:
    value = credentials.get(key)
    if value in (None, ""):
        raise ValueError(f"{key} credential is required")
    return str(value)


def _required_any(credentials: dict[str, Any], *keys: str) -> str:
    for key in keys:
        value = credentials.get(key)
        if value not in (None, ""):
            return str(value)
    raise ValueError(f"{keys[0]} credential is required")
