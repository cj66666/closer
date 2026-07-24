"""LinkedIn Lead Gen Forms 适配器。"""

from __future__ import annotations

import hashlib
import hmac
from datetime import UTC, datetime
from typing import Any

from app.schemas import ChannelContact, InboundMessage

# LinkedIn Lead Gen Form field URNs → 通用字段名映射
_FIELD_MAP: dict[str, str] = {
    "firstName": "first_name",
    "lastName": "last_name",
    "emailAddress": "email",
    "phoneNumber": "phone",
    "company": "company",
    "title": "title",
    "country": "country",
    "linkedInProfileUrl": "linkedin_url",
    "postalCode": "postal_code",
    "message": "message",
    "question": "message",
}


class LinkedInAdapter:
    channel = "linkedin"

    # ------------------------------------------------------------------
    # 签名校验（X-Li-Signature 或 X-Hub-Signature-256）
    # ------------------------------------------------------------------

    def verify_signature(self, raw_body: bytes, signature: str, client_secret: str) -> bool:
        expected = hmac.new(client_secret.encode(), raw_body, hashlib.sha256).hexdigest()
        sig_value = signature.lstrip("sha256=")
        return hmac.compare_digest(expected, sig_value)

    # ------------------------------------------------------------------
    # 入站标准化
    # ------------------------------------------------------------------

    def normalize_webhook(self, payload: dict[str, Any]) -> InboundMessage:
        """
        LinkedIn Lead Gen 推送格式（Lead Sync Webhook v2）：
        {
          "eventType": "LEAD_GEN_FORM_RESPONSE",
          "formResponse": {
            "id": "urn:li:leadFormResponse:...",
            "submittedAt": 1720000000000,
            "form": "urn:li:leadGenForm:...",
            "fieldValues": [
              {"name": "firstName", "value": "John"},
              ...
            ]
          }
        }
        """
        event_type = payload.get("eventType") or ""
        if "LEAD" not in event_type.upper():
            raise ValueError(f"Unsupported LinkedIn event type: {event_type}")

        response = payload.get("formResponse") or payload.get("leadGenFormResponse") or {}
        response_id = response.get("id") or ""
        submitted_at = response.get("submittedAt")
        form_urn = response.get("form") or ""

        fields: dict[str, str] = {}
        for fv in response.get("fieldValues") or []:
            key = _FIELD_MAP.get(fv.get("name", ""), fv.get("name", ""))
            fields[key] = str(fv.get("value") or "")

        first = fields.get("first_name", "")
        last = fields.get("last_name", "")
        name = f"{first} {last}".strip() or None
        email = fields.get("email") or None
        phone = fields.get("phone") or None
        company = fields.get("company") or None
        country = fields.get("country") or None

        content_parts: list[str] = []
        for k, v in fields.items():
            if k not in {"first_name", "last_name", "email", "phone", "company", "country"} and v:
                content_parts.append(f"{k}: {v}")
        content = "\n".join(content_parts) or f"LinkedIn Lead Gen submission (form={form_urn})"

        return InboundMessage(
            channel="linkedin",
            channel_message_id=f"li_lead:{response_id}",
            **{"from": ChannelContact(name=name, email=email, phone=phone, company=company, country=country)},
            content=content,
            received_at=datetime.fromtimestamp(int(submitted_at) / 1000, tz=UTC) if submitted_at else None,
            headers={"form_urn": form_urn, "response_id": response_id},
        )
