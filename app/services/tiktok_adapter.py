"""TikTok for Business Lead Generation 适配器。"""

from __future__ import annotations

import hashlib
import hmac
import json
from datetime import UTC, datetime
from typing import Any
from urllib.request import Request, urlopen

from app.schemas import ChannelContact, InboundMessage

_TIKTOK_API = "https://business-api.tiktok.com/open_api/v1.3"


class TikTokAdapter:
    channel = "tiktok"

    # ------------------------------------------------------------------
    # 签名校验（HMAC-SHA256，字节序列化后取十六进制）
    # ------------------------------------------------------------------

    def verify_signature(self, raw_body: bytes, signature: str, secret: str) -> bool:
        expected = hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, signature)

    # ------------------------------------------------------------------
    # 入站标准化
    # ------------------------------------------------------------------

    def normalize_webhook(
        self,
        payload: dict[str, Any],
        access_token: str | None = None,
        advertiser_id: str | None = None,
    ) -> InboundMessage:
        event_type = payload.get("event_type") or payload.get("type") or ""
        if "LEAD" not in event_type.upper():
            raise ValueError(f"Unsupported TikTok event type: {event_type}")

        data = payload.get("data") or payload
        lead_id = str(data.get("lead_id") or data.get("leadId") or "")
        form_id = str(data.get("form_id") or data.get("formId") or "")
        adv_id = str(data.get("advertiser_id") or advertiser_id or "")
        create_time = data.get("create_time") or data.get("createTime")

        fields: dict[str, str] = {}
        if lead_id and access_token and adv_id:
            try:
                fields = self.fetch_lead_data(lead_id, access_token, adv_id)
            except Exception:
                pass

        name = fields.get("name") or None
        email = fields.get("email") or None
        phone = fields.get("phone_number") or fields.get("phone") or None
        company = fields.get("company_name") or None
        country = fields.get("country") or None

        extra_parts = [f"{k}: {v}" for k, v in fields.items()
                       if k not in {"name", "email", "phone_number", "phone", "company_name", "country"}]
        content = "\n".join(extra_parts) or f"TikTok Lead Gen submission (form_id={form_id})"

        return InboundMessage(
            channel="tiktok",
            channel_message_id=f"tiktok_lead:{lead_id or form_id}:{create_time or ''}",
            **{"from": ChannelContact(name=name, email=email, phone=phone, company=company, country=country)},
            content=content,
            received_at=datetime.fromtimestamp(int(create_time) / 1000, tz=UTC) if create_time else None,
            headers={"form_id": form_id, "advertiser_id": adv_id, "lead_id": lead_id},
        )

    # ------------------------------------------------------------------
    # TikTok Ads API：获取 Lead 字段
    # ------------------------------------------------------------------

    def fetch_lead_data(self, lead_id: str, access_token: str, advertiser_id: str, timeout: float = 10.0) -> dict[str, str]:
        url = f"{_TIKTOK_API}/leads/?advertiser_id={advertiser_id}&lead_id={lead_id}"
        req = Request(url, headers={"Access-Token": access_token})
        with urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read().decode())
        leads = (data.get("data") or {}).get("leads") or []
        if not leads:
            return {}
        fields: dict[str, str] = {}
        for item in leads[0].get("answers") or []:
            fields[item.get("name", "")] = item.get("value", "")
        return fields
