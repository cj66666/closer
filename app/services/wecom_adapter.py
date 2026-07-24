"""企业微信（WeCom）适配器 — 支持回调消息接收和群机器人发送。"""

from __future__ import annotations

import base64
import hashlib
import json
import struct
import xml.etree.ElementTree as ET
from datetime import UTC, datetime
from typing import Any
from urllib.request import Request, urlopen

from app.schemas import ChannelContact, InboundMessage

# AES 解密需要 pycryptodome（Crypto.Cipher.AES）。
# Vercel 环境通过 requirements.txt 安装，本地用 pixi dev extras 安装。
try:
    from Crypto.Cipher import AES  # type: ignore[import-not-found]
    _AES_AVAILABLE = True
except ImportError:
    _AES_AVAILABLE = False


class WeComAdapter:
    channel = "wecom"

    # ------------------------------------------------------------------
    # GET 验证（echostr 挑战）
    # ------------------------------------------------------------------

    def verify_echo(
        self,
        token: str,
        timestamp: str,
        nonce: str,
        echostr: str,
        encoding_key: str | None = None,
    ) -> str:
        """验证签名后返回解密的 echostr（加密模式）或原始 echostr（明文模式）。"""
        if not self._check_signature(token, timestamp, nonce, echostr):
            raise ValueError("WeCom signature verification failed")
        if encoding_key:
            return self._decrypt_echostr(echostr, encoding_key)
        return echostr

    def verify_signature(self, token: str, timestamp: str, nonce: str, msg_signature: str) -> bool:
        return self._check_signature(token, timestamp, nonce, msg_signature)

    # ------------------------------------------------------------------
    # POST 消息解析
    # ------------------------------------------------------------------

    def parse_xml_message(self, xml_body: str, encoding_key: str | None = None) -> dict[str, str]:
        """解析 XML 消息，支持明文和加密两种模式。"""
        root = ET.fromstring(xml_body)
        if encoding_key and root.find("Encrypt") is not None:
            encrypted = root.findtext("Encrypt") or ""
            decrypted = self._decrypt(encrypted, encoding_key)
            root = ET.fromstring(decrypted)
        return {child.tag: (child.text or "") for child in root}

    def normalize_message(self, msg_dict: dict[str, str]) -> InboundMessage:
        msg_type = msg_dict.get("MsgType", "")
        from_user = msg_dict.get("FromUserName", "")
        to_user = msg_dict.get("ToUserName", "")
        msg_id = msg_dict.get("MsgId") or msg_dict.get("EventKey") or f"wecom:{from_user}:{msg_dict.get('CreateTime', '')}"
        create_time = msg_dict.get("CreateTime")

        if msg_type == "text":
            content = msg_dict.get("Content", "")
        elif msg_type == "event":
            event = msg_dict.get("Event", "")
            content = f"[event:{event}] {msg_dict.get('EventKey', '')}".strip()
        else:
            content = f"[{msg_type}]"

        return InboundMessage(
            channel="wecom",
            channel_message_id=msg_id,
            **{"from": ChannelContact(phone=from_user)},
            content=content,
            received_at=datetime.fromtimestamp(int(create_time), tz=UTC) if create_time else None,
            headers={"to_user": to_user, "msg_type": msg_type},
        )

    # ------------------------------------------------------------------
    # 出站：被动 XML 回复
    # ------------------------------------------------------------------

    def compose_text_reply(self, to_user: str, from_user: str, content: str) -> str:
        ts = int(datetime.now(UTC).timestamp())
        return (
            f"<xml>"
            f"<ToUserName><![CDATA[{to_user}]]></ToUserName>"
            f"<FromUserName><![CDATA[{from_user}]]></FromUserName>"
            f"<CreateTime>{ts}</CreateTime>"
            f"<MsgType><![CDATA[text]]></MsgType>"
            f"<Content><![CDATA[{content}]]></Content>"
            f"</xml>"
        )

    # ------------------------------------------------------------------
    # 内部：签名 & 解密
    # ------------------------------------------------------------------

    def _check_signature(self, token: str, timestamp: str, nonce: str, signature: str) -> bool:
        parts = sorted([token, timestamp, nonce])
        computed = hashlib.sha1("".join(parts).encode("utf-8")).hexdigest()
        return computed == signature

    def _decrypt_echostr(self, echostr: str, encoding_key: str) -> str:
        key = base64.b64decode(encoding_key + "=")
        cipher = AES.new(key, AES.MODE_CBC, key[:16]) if _AES_AVAILABLE else None
        if cipher is None:
            raise RuntimeError("pycryptodome is required for WeCom AES decryption")
        decrypted = cipher.decrypt(base64.b64decode(echostr))
        # PKCS7 unpad
        pad_len = decrypted[-1]
        decrypted = decrypted[:-pad_len]
        # 16 bytes random + 4 bytes length + content + appid
        content_len = struct.unpack(">I", decrypted[16:20])[0]
        return decrypted[20: 20 + content_len].decode("utf-8")

    def _decrypt(self, encrypted: str, encoding_key: str) -> str:
        return self._decrypt_echostr(encrypted, encoding_key)


# ------------------------------------------------------------------
# 群机器人发送客户端（简单模式，无需鉴权）
# ------------------------------------------------------------------

class WeComBotDeliveryClient:
    """企业微信群机器人 webhook — credentials 只需 webhook_url。"""
    name = "wecom_bot"

    def send(self, payload: dict[str, Any], credentials: dict[str, Any]) -> dict[str, Any]:
        webhook_url = credentials.get("webhook_url") or ""
        if not webhook_url:
            raise ValueError("wecom webhook_url credential is required")
        body = json.dumps(payload).encode("utf-8")
        req = Request(webhook_url, data=body, headers={"Content-Type": "application/json"}, method="POST")
        with urlopen(req, timeout=float(credentials.get("timeout_seconds") or 10)) as resp:
            result = json.loads(resp.read().decode("utf-8"))
        ok = result.get("errcode") == 0
        return {"status": "sent" if ok else "error", "client": self.name, "response": result}

    def compose_text_payload(self, text: str) -> dict[str, Any]:
        return {"msgtype": "text", "text": {"content": text}}


# ------------------------------------------------------------------
# 企业微信应用消息发送客户端（需 corp_id + corp_secret + agent_id）
# ------------------------------------------------------------------

class WeComAppDeliveryClient:
    """企业微信应用消息 — credentials: {corp_id, corp_secret, agent_id, to_user}。"""
    name = "wecom_app"
    _QYAPI = "https://qyapi.weixin.qq.com/cgi-bin"

    def send(self, payload: dict[str, Any], credentials: dict[str, Any]) -> dict[str, Any]:
        token = self._get_access_token(credentials)
        url = f"{self._QYAPI}/message/send?access_token={token}"
        body = json.dumps(payload).encode("utf-8")
        req = Request(url, data=body, headers={"Content-Type": "application/json"}, method="POST")
        with urlopen(req, timeout=float(credentials.get("timeout_seconds") or 10)) as resp:
            result = json.loads(resp.read().decode("utf-8"))
        ok = result.get("errcode") == 0
        return {"status": "sent" if ok else "error", "client": self.name, "response": result}

    def compose_text_payload(self, to_user: str, agent_id: int, content: str) -> dict[str, Any]:
        return {
            "touser": to_user,
            "msgtype": "text",
            "agentid": agent_id,
            "text": {"content": content},
            "safe": 0,
        }

    def _get_access_token(self, credentials: dict[str, Any]) -> str:
        corp_id = credentials["corp_id"]
        corp_secret = credentials["corp_secret"]
        url = f"{self._QYAPI}/gettoken?corpid={corp_id}&corpsecret={corp_secret}"
        with urlopen(url, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        if data.get("errcode") not in (None, 0):
            raise ValueError(f"WeCom gettoken error: {data}")
        return data["access_token"]
