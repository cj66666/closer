"""Facebook / Instagram 适配器（Messenger + Lead Ads）。"""

from __future__ import annotations

import hmac
import json
from datetime import UTC, datetime
from hashlib import sha256
from typing import Any
from urllib.request import Request, urlopen

from app.schemas import ChannelContact, InboundMessage

_GRAPH_API = "https://graph.facebook.com/v20.0"


class FacebookAdapter:
    channel = "facebook"

    # ------------------------------------------------------------------
    # Webhook 验证（GET）
    # ------------------------------------------------------------------

    def verify_webhook(self, mode: str, token: str, challenge: str, verify_token: str) -> str:
        if mode != "subscribe" or token != verify_token:
            raise ValueError("Webhook verification failed")
        return challenge

    # ------------------------------------------------------------------
    # 签名校验
    # ------------------------------------------------------------------

    def verify_signature(self, raw_body: bytes, signature: str, app_secret: str) -> bool:
        expected = "sha256=" + hmac.new(app_secret.encode(), raw_body, sha256).hexdigest()
        return hmac.compare_digest(expected, signature)

    # ------------------------------------------------------------------
    # 入站标准化
    # ------------------------------------------------------------------

    def normalize_webhook(
        self,
        payload: dict[str, Any],
        access_token: str | None = None,
        channel: str = "facebook",
    ) -> InboundMessage:
        """支持 Messenger 私信和 Lead Ads 表单提交两种入站类型。"""
        entry = (payload.get("entry") or [{}])[0]

        # ---- Lead Ads ----
        changes = entry.get("changes") or []
        if changes:
            change = changes[0]
            value = change.get("value") or {}
            if value.get("lead_id"):
                return self._normalize_lead_ads(value, access_token, channel)

        # ---- Messenger / Instagram DM ----
        messaging = entry.get("messaging") or []
        if messaging:
            return self._normalize_messenger(messaging[0], channel)

        raise ValueError("Unrecognised Facebook/Instagram webhook payload")

    def _normalize_messenger(self, event: dict[str, Any], channel: str) -> InboundMessage:
        sender_id = (event.get("sender") or {}).get("id", "")
        message = event.get("message") or {}
        text = message.get("text") or f"[{message.get('attachments', [{}])[0].get('type', 'attachment')}]"
        mid = message.get("mid") or f"fb:{sender_id}:{event.get('timestamp', '')}"
        ts = event.get("timestamp")
        return InboundMessage(
            channel=channel,
            channel_message_id=mid,
            **{"from": ChannelContact(phone=sender_id)},
            content=text,
            received_at=datetime.fromtimestamp(int(ts) / 1000, tz=UTC) if ts else None,
        )

    def _normalize_lead_ads(
        self,
        value: dict[str, Any],
        access_token: str | None,
        channel: str,
    ) -> InboundMessage:
        lead_id = value["lead_id"]
        form_id = value.get("form_id", "")
        page_id = value.get("page_id", "")
        created_time = value.get("created_time")

        fields: dict[str, str] = {}
        if access_token:
            try:
                fields = self.fetch_lead_fields(lead_id, access_token)
            except Exception:
                pass

        name = fields.get("full_name") or f"{fields.get('first_name', '')} {fields.get('last_name', '')}".strip() or None
        contact = ChannelContact(
            name=name or None,
            email=fields.get("email") or None,
            phone=fields.get("phone_number") or fields.get("phone") or None,
            company=fields.get("company_name") or fields.get("company") or None,
            country=fields.get("country") or None,
        )
        content_parts = [f"{k}: {v}" for k, v in fields.items() if k not in {"full_name", "first_name", "last_name", "email", "phone_number", "phone"}]
        content = "\n".join(content_parts) or f"Lead Ads form submission (form_id={form_id})"

        return InboundMessage(
            channel=channel,
            channel_message_id=f"fb_lead:{lead_id}",
            **{"from": contact},
            content=content,
            received_at=datetime.fromtimestamp(int(created_time), tz=UTC) if created_time else None,
            headers={"page_id": page_id, "form_id": form_id, "lead_id": lead_id},
        )

    # ------------------------------------------------------------------
    # Graph API 辅助
    # ------------------------------------------------------------------

    def fetch_lead_fields(self, lead_id: str, access_token: str, timeout: float = 10.0) -> dict[str, str]:
        url = f"{_GRAPH_API}/{lead_id}?fields=field_data&access_token={access_token}"
        with urlopen(url, timeout=timeout) as resp:
            data = json.loads(resp.read().decode())
        return {item["name"]: item["values"][0] for item in data.get("field_data", []) if item.get("values")}

    # ------------------------------------------------------------------
    # 出站组合
    # ------------------------------------------------------------------

    def compose_message_payload(self, recipient_id: str, text: str) -> dict[str, Any]:
        return {
            "recipient": {"id": recipient_id},
            "message": {"text": text},
            "messaging_type": "RESPONSE",
        }
