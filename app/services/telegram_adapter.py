"""Telegram Bot API 适配器。"""

from __future__ import annotations

import hashlib
import hmac
from datetime import UTC, datetime
from typing import Any

from app.schemas import ChannelContact, InboundMessage


class TelegramAdapter:
    channel = "telegram"

    # ------------------------------------------------------------------
    # 签名校验（X-Telegram-Bot-Api-Secret-Token header）
    # ------------------------------------------------------------------

    def verify_token(self, token_header: str | None, bot_token: str) -> bool:
        """用 HMAC-SHA256 校验 secret_token header（Telegram setWebhook secret_token 选项）。"""
        if not token_header:
            return True  # 未配置 secret_token 时跳过校验
        secret = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
        expected = hmac.new(secret, bot_token.encode(), hashlib.sha256).hexdigest()
        return hmac.compare_digest(token_header, expected)

    # ------------------------------------------------------------------
    # 入站标准化
    # ------------------------------------------------------------------

    def normalize_webhook(self, payload: dict[str, Any]) -> InboundMessage:
        message = payload.get("message") or payload.get("channel_post") or {}
        if not message:
            edited = payload.get("edited_message") or {}
            if edited:
                message = edited
        if not message:
            raise ValueError("Telegram webhook contains no message")

        from_ = message.get("from") or {}
        chat = message.get("chat") or {}
        chat_id = str(chat.get("id") or from_.get("id") or "")
        message_id = str(message.get("message_id") or "")
        text = message.get("text") or self._caption_or_type(message)
        ts = message.get("date")

        name_parts = [from_.get("first_name") or "", from_.get("last_name") or ""]
        name = " ".join(p for p in name_parts if p).strip() or None
        username = from_.get("username")

        return InboundMessage(
            channel="telegram",
            channel_message_id=f"tg:{chat_id}:{message_id}",
            **{"from": ChannelContact(
                name=name,
                phone=chat_id,  # chat_id 作为唯一标识
            )},
            content=text,
            received_at=datetime.fromtimestamp(int(ts), tz=UTC) if ts else None,
            headers={"chat_id": chat_id, "username": username or ""},
        )

    def _caption_or_type(self, message: dict[str, Any]) -> str:
        if message.get("caption"):
            return message["caption"]
        for key in ("photo", "video", "document", "audio", "voice", "sticker", "location", "contact"):
            if message.get(key):
                return f"[{key}]"
        return "[message]"

    # ------------------------------------------------------------------
    # 出站组合
    # ------------------------------------------------------------------

    def compose_message_payload(self, chat_id: str, text: str, parse_mode: str | None = None) -> dict[str, Any]:
        payload: dict[str, Any] = {"chat_id": chat_id, "text": text}
        if parse_mode:
            payload["parse_mode"] = parse_mode
        return payload
