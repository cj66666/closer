"""
/* ========================================================================== */
/* GEB L3: 入站消息分诊大脑                                                    */
/* ========================================================================== */
/**
 * [INPUT]: 依赖 os/json/urllib、dataclass 与归一化后的 TriageContext(渠道无关)
 * [OUTPUT]: 对外提供 TriageContext、TriageDecision、TriageProvider、RuleBasedTriageProvider、HttpTriageProvider、OpenAICompatibleTriageProvider、get_triage_provider、get_triage_provider_config、triage_message、CATEGORY_*/ROUTE_*
 * [POS]: services 的入站智能层,在"创建询盘之前"判定噪音/询盘/老客户/平台通知,把规则优先与生产 LLM provider 从入站网关中分离;各渠道适配器归一化后共用这一个分诊大脑
 * [PROTOCOL]: 变更时同步更新相关测试与公开文档
 */
"""

from __future__ import annotations

import json
import os
from collections.abc import Mapping, Sequence
from dataclasses import dataclass, field
from typing import Any, Protocol
from urllib.request import Request, urlopen


# 分诊类别
CATEGORY_INQUIRY = "inquiry"
CATEGORY_EXISTING_CUSTOMER = "existing_customer"
CATEGORY_PLATFORM_BRIDGE = "platform_bridge"
CATEGORY_NOTIFICATION = "notification"
CATEGORY_NOISE = "noise"
CATEGORY_UNCERTAIN = "uncertain"

# 路由(决定入站消息的去向)
ROUTE_CREATE_INQUIRY = "create_inquiry"  # 高置信新询盘 -> 创建询盘 + 评分
ROUTE_ATTACH_CUSTOMER = "attach_customer"  # 老客户/在跟会话 -> 挂时间线
ROUTE_BRIDGE_PARSE = "bridge_parse"  # 平台通知 -> 桥接解析为询盘
ROUTE_TRIAGE_QUEUE = "triage_queue"  # 拿不准 -> 待确认队列,人工一键判定
ROUTE_ARCHIVE = "archive"  # 噪音 -> 其他/已归档桶(可恢复,不硬删)

# 干净渠道:每条提交都是询盘,跳过分诊
CLEAN_CHANNELS = {"site_form"}

# 复用打分服务的公共邮箱判定口径
PUBLIC_EMAIL_DOMAINS = {
    "gmail.com",
    "hotmail.com",
    "outlook.com",
    "yahoo.com",
    "qq.com",
    "163.com",
}
SPAM_KEYWORDS = {"seo", "casino", "loan", "crypto", "free traffic", "backlink"}
# 向我方推销 / 冷启动外呼(供应商找我),不是买家询盘
VENDOR_PITCH_KEYWORDS = {
    "we offer",
    "we provide",
    "our services",
    "增长服务",
    "代运营",
    "partnership opportunity",
    "list your product",
}
# 采购意图词:命中即倾向 inquiry
BUYING_KEYWORDS = {
    "quote",
    "quotation",
    "price",
    "pricing",
    "moq",
    "rfq",
    "order",
    "purchase",
    "interested in",
    "supply",
    "wholesale",
    "fob",
    "cif",
    "incoterm",
    "lead time",
    "pcs",
    "units",
    "ship to",
    "采购",
    "报价",
    "询价",
    "下单",
}
# 自动化发件人本地名
AUTOMATED_LOCAL_PARTS = {"noreply", "no-reply", "donotreply", "do-not-reply", "mailer-daemon", "postmaster"}
# 已知通知/群发服务商域名(非买家)
NOTIFICATION_DOMAINS = {
    "mailchimp.com",
    "sendgrid.net",
    "mailgun.org",
    "amazonses.com",
    "notifications.google.com",
    "paypal.com",
    "stripe.com",
    "dhl.com",
    "fedex.com",
    "ups.com",
}
# 平台站内信通知域名(伪装成通知的线索 -> 桥接解析)
PLATFORM_NOTIFICATION_DOMAINS = {
    "alibaba.com",
    "message.alibaba.com",
    "made-in-china.com",
    "globalsources.com",
}

TRIAGE_PROVIDER_ENV = "CLOSER_TRIAGE_PROVIDER"
TRIAGE_ENDPOINT_ENV = "CLOSER_TRIAGE_ENDPOINT"
TRIAGE_AUTH_TOKEN_ENV = "CLOSER_TRIAGE_AUTH_TOKEN"
TRIAGE_MODEL_ENV = "CLOSER_TRIAGE_MODEL"
TRIAGE_BASE_URL_ENV = "CLOSER_TRIAGE_BASE_URL"
TRIAGE_API_KEY_ENV = "CLOSER_TRIAGE_API_KEY_ENV"
TRIAGE_TIMEOUT_ENV = "CLOSER_TRIAGE_TIMEOUT_SECONDS"
OPENAI_API_KEY_ENV = "OPENAI_API_KEY"
DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1"
RULE_BASED_PROVIDER = "rule_based"
HTTP_PROVIDER_ALIASES = {"http", "remote"}
OPENAI_PROVIDER_ALIASES = {"openai", "openai_compatible", "llm"}

VALID_CATEGORIES = {
    CATEGORY_INQUIRY,
    CATEGORY_EXISTING_CUSTOMER,
    CATEGORY_PLATFORM_BRIDGE,
    CATEGORY_NOTIFICATION,
    CATEGORY_NOISE,
    CATEGORY_UNCERTAIN,
}
VALID_ROUTES = {
    ROUTE_CREATE_INQUIRY,
    ROUTE_ATTACH_CUSTOMER,
    ROUTE_BRIDGE_PARSE,
    ROUTE_TRIAGE_QUEUE,
    ROUTE_ARCHIVE,
}
# 每个类别的默认路由
CATEGORY_ROUTE = {
    CATEGORY_INQUIRY: ROUTE_CREATE_INQUIRY,
    CATEGORY_EXISTING_CUSTOMER: ROUTE_ATTACH_CUSTOMER,
    CATEGORY_PLATFORM_BRIDGE: ROUTE_BRIDGE_PARSE,
    CATEGORY_NOTIFICATION: ROUTE_ARCHIVE,
    CATEGORY_NOISE: ROUTE_ARCHIVE,
    CATEGORY_UNCERTAIN: ROUTE_TRIAGE_QUEUE,
}

OPENAI_TRIAGE_SYSTEM_PROMPT = """You triage one inbound message for a cross-border B2B inquiry workbench.
Decide if it is a real buyer inquiry worth following up, or noise.
Return only JSON with keys: category, confidence, reason, signals.
category must be one of: inquiry, existing_customer, platform_bridge, notification, noise, uncertain.
Use "uncertain" when you are not confident, never guess. confidence is 0..1."""


@dataclass(frozen=True)
class TriageContext:
    """渠道适配器归一化后的分诊输入(与 DB 解耦,纯数据,便于测试)。"""

    channel: str
    content: str
    sender_email: str | None = None
    sender_name: str | None = None
    subject: str | None = None
    headers: Mapping[str, str] = field(default_factory=dict)
    seller_domains: Sequence[str] = field(default_factory=tuple)
    is_known_customer: bool = False
    has_open_conversation: bool = False
    extra: Mapping[str, Any] = field(default_factory=dict)

    def header(self, name: str) -> str | None:
        for key, value in self.headers.items():
            if key.lower() == name.lower():
                return value
        return None

    def payload(self) -> dict[str, Any]:
        return {
            "channel": self.channel,
            "content": self.content,
            "sender_email": self.sender_email,
            "sender_name": self.sender_name,
            "subject": self.subject,
            "headers": dict(self.headers),
            "is_known_customer": self.is_known_customer,
            "has_open_conversation": self.has_open_conversation,
            "extra": dict(self.extra or {}),
        }


@dataclass(frozen=True)
class TriageDecision:
    category: str
    route: str
    confidence: float
    reason: str
    signals: list[str] = field(default_factory=list)

    @property
    def is_inquiry(self) -> bool:
        return self.route == ROUTE_CREATE_INQUIRY

    def snapshot(self) -> dict[str, Any]:
        return {
            "category": self.category,
            "route": self.route,
            "confidence": self.confidence,
            "reason": self.reason,
            "signals": self.signals,
        }


class TriageProvider(Protocol):
    name: str

    def triage(self, context: TriageContext) -> TriageDecision:
        raise NotImplementedError


class RuleBasedTriageProvider:
    """确定性分诊:零成本预过滤 + 轻量判别。LLM 不可用时的兜底路径。"""

    name = RULE_BASED_PROVIDER

    def triage(self, context: TriageContext) -> TriageDecision:
        # 干净渠道:每条都是询盘
        if context.channel in CLEAN_CHANNELS:
            return _decision(CATEGORY_INQUIRY, 1.0, "clean_channel", ["clean_channel"])

        text = (context.content or "").lower()
        subject = (context.subject or context.header("subject") or "").lower()
        domain = _sender_domain(context.sender_email)
        local = _sender_local_part(context.sender_email)

        # --- 第 0 层:确定性预过滤 ---
        if self._is_auto_reply(context, subject):
            return _decision(CATEGORY_NOISE, 0.97, "auto_reply", ["auto_reply"])
        if self._is_bulk_mail(context):
            return _decision(CATEGORY_NOISE, 0.95, "bulk_mail", ["bulk_mail"])
        if self._is_bounce(context, local):
            return _decision(CATEGORY_NOTIFICATION, 0.95, "bounce", ["bounce"])
        if domain and _domain_in(domain, context.seller_domains):
            return _decision(CATEGORY_NOISE, 0.9, "internal_sender", ["internal_sender"])
        if domain and _domain_in(domain, PLATFORM_NOTIFICATION_DOMAINS):
            return _decision(CATEGORY_PLATFORM_BRIDGE, 0.85, "platform_notification", ["platform_notification"])
        if (local in AUTOMATED_LOCAL_PARTS) or (domain and _domain_in(domain, NOTIFICATION_DOMAINS)):
            return _decision(CATEGORY_NOTIFICATION, 0.9, "automated_sender", ["automated_sender"])

        # --- 第 1 层:轻量判别 ---
        if context.is_known_customer or context.has_open_conversation:
            return _decision(CATEGORY_EXISTING_CUSTOMER, 0.8, "known_customer", ["known_customer"])

        haystack = f"{subject}\n{text}"
        if any(keyword in haystack for keyword in SPAM_KEYWORDS):
            return _decision(CATEGORY_NOISE, 0.85, "spam_keyword", ["spam_keyword"])
        if any(keyword in haystack for keyword in VENDOR_PITCH_KEYWORDS):
            return _decision(CATEGORY_NOISE, 0.7, "vendor_pitch", ["vendor_pitch"])

        signals: list[str] = []
        has_buying = any(keyword in haystack for keyword in BUYING_KEYWORDS)
        if has_buying:
            signals.append("buying_intent")
        if _has_quantity(haystack):
            signals.append("specific_quantity")
        if domain and domain not in PUBLIC_EMAIL_DOMAINS:
            signals.append("corporate_domain")
        if len((context.content or "").strip()) < 24:
            signals.append("too_short")

        # 采购意图明确 -> 询盘;其余进待确认,绝不静默创建或丢弃
        if has_buying and "too_short" not in signals:
            confidence = 0.85 if "corporate_domain" in signals or "specific_quantity" in signals else 0.7
            return _decision(CATEGORY_INQUIRY, confidence, "buying_intent", signals)
        return _decision(CATEGORY_UNCERTAIN, 0.5, "needs_review", signals)

    @staticmethod
    def _is_auto_reply(context: TriageContext, subject: str) -> bool:
        auto = (context.header("auto-submitted") or "").lower()
        if auto and auto != "no":
            return True
        if context.header("x-autoreply") or context.header("x-autorespond"):
            return True
        return subject.startswith(("out of office", "automatic reply", "auto-reply", "自动回复"))

    @staticmethod
    def _is_bulk_mail(context: TriageContext) -> bool:
        if context.header("list-unsubscribe") or context.header("list-id"):
            return True
        precedence = (context.header("precedence") or "").lower()
        return precedence in {"bulk", "list", "junk"}

    @staticmethod
    def _is_bounce(context: TriageContext, local: str | None) -> bool:
        if context.header("x-failed-recipients"):
            return True
        return local in {"mailer-daemon", "postmaster"}


@dataclass(frozen=True)
class HttpTriageProvider:
    endpoint: str
    auth_token: str | None = None
    timeout_seconds: float = 10.0
    name: str = "http"

    def triage(self, context: TriageContext) -> TriageDecision:
        headers = {"Content-Type": "application/json"}
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        request = Request(
            self.endpoint,
            data=json.dumps(context.payload()).encode("utf-8"),
            headers=headers,
            method="POST",
        )
        with urlopen(request, timeout=self.timeout_seconds) as response:
            payload = json.loads(response.read().decode("utf-8"))
        if isinstance(payload, Mapping) and isinstance(payload.get("decision"), Mapping):
            payload = payload["decision"]
        return _decision_from_mapping(payload)


@dataclass(frozen=True)
class OpenAICompatibleTriageProvider:
    endpoint: str
    api_key: str
    model: str
    timeout_seconds: float = 10.0
    name: str = "openai"

    def triage(self, context: TriageContext) -> TriageDecision:
        request = Request(
            self.endpoint,
            data=json.dumps(self._payload(context)).encode("utf-8"),
            headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
            method="POST",
        )
        with urlopen(request, timeout=self.timeout_seconds) as response:
            payload = json.loads(response.read().decode("utf-8"))
        return _decision_from_openai_response(payload)

    def _payload(self, context: TriageContext) -> dict[str, Any]:
        return {
            "model": self.model,
            "temperature": 0,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": OPENAI_TRIAGE_SYSTEM_PROMPT},
                {"role": "user", "content": json.dumps({"context": context.payload()})},
            ],
        }


@dataclass(frozen=True)
class TriageProviderConfig:
    provider: str
    endpoint: str | None
    auth_token_configured: bool
    timeout_seconds: float | None
    status: str
    message: str
    model: str | None = None
    api_key_env: str | None = None
    api_key_configured: bool = False

    def details(self) -> dict[str, Any]:
        return {
            "provider": self.provider,
            "endpoint": self.endpoint,
            "auth_token_configured": self.auth_token_configured,
            "timeout_seconds": self.timeout_seconds,
            "model": self.model,
            "api_key_env": self.api_key_env,
            "api_key_configured": self.api_key_configured,
        }


def triage_message(context: TriageContext, provider: TriageProvider | None = None) -> TriageDecision:
    """对单条入站消息分诊。默认用配置的 provider(规则优先);LLM 出错时降级到规则。"""
    provider = provider or get_triage_provider()
    if isinstance(provider, RuleBasedTriageProvider):
        return provider.triage(context)
    try:
        return provider.triage(context)
    except Exception:  # noqa: BLE001 - LLM/网络不可用时降级到确定性兜底
        return RuleBasedTriageProvider().triage(context)


def get_triage_provider(env: Mapping[str, str] | None = None) -> TriageProvider:
    env = env or os.environ
    provider = _provider_name(env)
    if provider == RULE_BASED_PROVIDER:
        return RuleBasedTriageProvider()
    if provider == "http":
        endpoint = _clean(env.get(TRIAGE_ENDPOINT_ENV))
        if endpoint is None:
            raise ValueError(f"{TRIAGE_ENDPOINT_ENV} is required for triage provider")
        return HttpTriageProvider(
            endpoint=endpoint,
            auth_token=_clean(env.get(TRIAGE_AUTH_TOKEN_ENV)),
            timeout_seconds=_timeout(env),
        )
    if provider == "openai":
        api_key_env = _api_key_env(env)
        api_key = _clean(env.get(api_key_env))
        model = _clean(env.get(TRIAGE_MODEL_ENV))
        if model is None:
            raise ValueError(f"{TRIAGE_MODEL_ENV} is required for triage LLM provider")
        if api_key is None:
            raise ValueError(f"{api_key_env} is required for triage LLM provider")
        return OpenAICompatibleTriageProvider(
            endpoint=_openai_endpoint(env),
            api_key=api_key,
            model=model,
            timeout_seconds=_timeout(env),
        )
    raise ValueError(f"Unsupported triage provider: {provider}")


def get_triage_provider_config(env: Mapping[str, str] | None = None) -> TriageProviderConfig:
    env = env or os.environ
    provider = _provider_name(env)
    if provider == RULE_BASED_PROVIDER:
        return TriageProviderConfig(
            provider=provider,
            endpoint=None,
            auth_token_configured=False,
            timeout_seconds=None,
            status="warning",
            message="Rule-based triage is active; configure an LLM provider for smart intake.",
        )
    if provider == "http":
        endpoint = _clean(env.get(TRIAGE_ENDPOINT_ENV))
        status = "ok" if endpoint else "failed"
        message = (
            "Triage provider is configured."
            if endpoint
            else f"{TRIAGE_ENDPOINT_ENV} is required for triage provider."
        )
        return TriageProviderConfig(
            provider=provider,
            endpoint=endpoint,
            auth_token_configured=bool(_clean(env.get(TRIAGE_AUTH_TOKEN_ENV))),
            timeout_seconds=_timeout_or_none(env),
            status=status,
            message=message,
        )
    if provider == "openai":
        api_key_env = _api_key_env(env)
        model = _clean(env.get(TRIAGE_MODEL_ENV))
        api_key_configured = _clean(env.get(api_key_env)) is not None
        if model is None:
            status, message = "failed", f"{TRIAGE_MODEL_ENV} is required for triage LLM provider."
        elif not api_key_configured:
            status, message = "failed", f"{api_key_env} is required for triage LLM provider."
        else:
            status, message = "ok", "Triage LLM provider is configured."
        return TriageProviderConfig(
            provider="openai",
            endpoint=_openai_endpoint(env),
            auth_token_configured=False,
            timeout_seconds=_timeout_or_none(env),
            status=status,
            message=message,
            model=model,
            api_key_env=api_key_env,
            api_key_configured=api_key_configured,
        )
    return TriageProviderConfig(
        provider=provider,
        endpoint=None,
        auth_token_configured=False,
        timeout_seconds=None,
        status="failed",
        message=f"Unsupported triage provider: {provider}",
    )


def _decision(category: str, confidence: float, reason: str, signals: list[str]) -> TriageDecision:
    return TriageDecision(
        category=category,
        route=CATEGORY_ROUTE[category],
        confidence=confidence,
        reason=reason,
        signals=signals,
    )


def _decision_from_openai_response(payload: Any) -> TriageDecision:
    if isinstance(payload, Mapping) and isinstance(payload.get("decision"), Mapping):
        return _decision_from_mapping(payload["decision"])
    content = _openai_message_content(payload)
    try:
        value = json.loads(content)
    except json.JSONDecodeError as exc:
        raise ValueError("Triage LLM response content must be valid JSON") from exc
    if isinstance(value, Mapping) and isinstance(value.get("decision"), Mapping):
        value = value["decision"]
    return _decision_from_mapping(value)


def _openai_message_content(payload: Any) -> str:
    if not isinstance(payload, Mapping):
        raise ValueError("Triage LLM response must be a JSON object")
    choices = payload.get("choices")
    if not isinstance(choices, Sequence) or isinstance(choices, (str, bytes, bytearray)) or not choices:
        raise ValueError("Triage LLM response must contain choices")
    choice = choices[0]
    if not isinstance(choice, Mapping):
        raise ValueError("Triage LLM choice must be an object")
    message = choice.get("message")
    if not isinstance(message, Mapping):
        raise ValueError("Triage LLM choice must contain a message")
    content = message.get("content")
    if isinstance(content, str):
        return content
    raise ValueError("Triage LLM message content must be text")


def _decision_from_mapping(value: Any) -> TriageDecision:
    if not isinstance(value, Mapping):
        raise ValueError("Triage response must be an object")
    category = _clean(value.get("category")) or CATEGORY_UNCERTAIN
    if category not in VALID_CATEGORIES:
        category = CATEGORY_UNCERTAIN
    route = _clean(value.get("route"))
    if route not in VALID_ROUTES:
        route = CATEGORY_ROUTE[category]
    signals = value.get("signals")
    signals_list = [str(item) for item in signals] if isinstance(signals, Sequence) and not isinstance(signals, str) else []
    return TriageDecision(
        category=category,
        route=route,
        confidence=_confidence(value.get("confidence")),
        reason=_clean(value.get("reason")) or category,
        signals=signals_list,
    )


def _confidence(value: Any) -> float:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return 0.5
    return max(0.0, min(1.0, number))


def _sender_domain(email: str | None) -> str | None:
    if not email or "@" not in email:
        return None
    return email.rsplit("@", 1)[-1].strip().lower() or None


def _sender_local_part(email: str | None) -> str | None:
    if not email or "@" not in email:
        return None
    return email.split("@", 1)[0].strip().lower() or None


def _domain_in(domain: str, domains: Sequence[str] | set[str]) -> bool:
    domain = domain.lower()
    for candidate in domains:
        candidate = str(candidate).lower().strip()
        if candidate and (domain == candidate or domain.endswith("." + candidate)):
            return True
    return False


def _has_quantity(text: str) -> bool:
    for token in text.replace(",", " ").split():
        digits = token.strip("x*+.")
        if digits.isdigit() and int(digits) >= 10:
            return True
    return False


def _provider_name(env: Mapping[str, str]) -> str:
    value = (_clean(env.get(TRIAGE_PROVIDER_ENV)) or RULE_BASED_PROVIDER).lower()
    if value in HTTP_PROVIDER_ALIASES:
        return "http"
    if value in OPENAI_PROVIDER_ALIASES:
        return "openai"
    return value


def _api_key_env(env: Mapping[str, str]) -> str:
    return _clean(env.get(TRIAGE_API_KEY_ENV)) or OPENAI_API_KEY_ENV


def _openai_endpoint(env: Mapping[str, str]) -> str:
    explicit = _clean(env.get(TRIAGE_ENDPOINT_ENV))
    if explicit:
        return explicit
    base_url = (_clean(env.get(TRIAGE_BASE_URL_ENV)) or DEFAULT_OPENAI_BASE_URL).rstrip("/")
    if base_url.endswith("/chat/completions"):
        return base_url
    return f"{base_url}/chat/completions"


def _timeout(env: Mapping[str, str]) -> float:
    value = _clean(env.get(TRIAGE_TIMEOUT_ENV))
    timeout = float(value) if value else 10.0
    if timeout <= 0:
        raise ValueError("Triage timeout must be positive")
    return timeout


def _timeout_or_none(env: Mapping[str, str]) -> float | None:
    try:
        return _timeout(env)
    except ValueError:
        return None


def _clean(value: Any) -> str | None:
    if value is None:
        return None
    value = str(value).strip()
    return value or None
