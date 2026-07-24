"""阿里国际站 / Made-in-China / 环球资源 邮件桥接解析器。

当平台将买家询盘以邮件形式转发给卖家时，本模块负责：
1. 识别邮件来源（detect_source）
2. 从邮件正文中提取真实买家信息（extract_customer）
3. 重写 InboundMessage，将 channel 从 "email" 改为平台专属值
"""

from __future__ import annotations

import re
from dataclasses import dataclass

# ──────────────────────────────────────────────
# 来源检测规则
# ──────────────────────────────────────────────

_ALIBABA_FROM_PATTERNS = [
    r"@alibaba(?:-inc)?\.com$",
    r"@trade\.alibaba\.com$",
    r"@mail\.alibaba\.com$",
]
_ALIBABA_SUBJECT_KEYWORDS = [
    "alibaba.com inquiry",
    "new inquiry from alibaba",
    "alibaba trade message",
    "alibaba lead",
]

_MIC_FROM_PATTERNS = [
    r"@made-in-china\.com$",
    r"@mail\.made-in-china\.com$",
]
_MIC_SUBJECT_KEYWORDS = [
    "made-in-china.com",
    "inquiry from made in china",
]

_GS_FROM_PATTERNS = [
    r"@globalsources\.com$",
    r"@mail\.globalsources\.com$",
]
_GS_SUBJECT_KEYWORDS = [
    "global sources",
    "globalsources.com inquiry",
]


@dataclass
class BridgeSource:
    platform: str  # "alibaba" | "made_in_china" | "global_sources"
    confidence: float  # 0–1


def detect_source(from_email: str, subject: str, body: str) -> BridgeSource | None:
    """识别邮件是否来自已知 B2B 平台转发，返回 BridgeSource 或 None。"""
    from_lower = from_email.lower()
    subject_lower = subject.lower()

    def _match_patterns(patterns: list[str], text: str) -> bool:
        return any(re.search(p, text) for p in patterns)

    def _match_keywords(keywords: list[str], text: str) -> bool:
        return any(k in text for k in keywords)

    # Alibaba
    if _match_patterns(_ALIBABA_FROM_PATTERNS, from_lower):
        return BridgeSource("alibaba", 0.97)
    if _match_keywords(_ALIBABA_SUBJECT_KEYWORDS, subject_lower):
        return BridgeSource("alibaba", 0.85)
    if "alibaba.com" in from_lower or "alibaba.com" in body.lower()[:400]:
        return BridgeSource("alibaba", 0.70)

    # Made-in-China
    if _match_patterns(_MIC_FROM_PATTERNS, from_lower):
        return BridgeSource("made_in_china", 0.97)
    if _match_keywords(_MIC_SUBJECT_KEYWORDS, subject_lower):
        return BridgeSource("made_in_china", 0.85)

    # Global Sources
    if _match_patterns(_GS_FROM_PATTERNS, from_lower):
        return BridgeSource("global_sources", 0.97)
    if _match_keywords(_GS_SUBJECT_KEYWORDS, subject_lower):
        return BridgeSource("global_sources", 0.85)

    return None


# ──────────────────────────────────────────────
# 买家信息提取
# ──────────────────────────────────────────────

@dataclass
class ExtractedCustomer:
    name: str | None
    email: str | None
    phone: str | None
    company: str | None
    country: str | None
    content: str  # 询盘正文


def extract_customer(body: str, platform: str) -> ExtractedCustomer:
    """从转发邮件正文中提取买家真实信息。"""
    if platform == "alibaba":
        return _extract_alibaba(body)
    if platform == "made_in_china":
        return _extract_mic(body)
    if platform == "global_sources":
        return _extract_gs(body)
    return _extract_generic(body)


def _extract_alibaba(body: str) -> ExtractedCustomer:
    """
    阿里转发邮件常见格式：
    Buyer Name: John Smith
    Buyer Email: john@example.com
    Country/Region: United States
    Message: I am interested in...
    """
    name = _find(body, [
        r"Buyer Name[:\s]+(.+)",
        r"Contact Person[:\s]+(.+)",
        r"Name[:\s]+([A-Z][a-z]+ [A-Z][a-z]+)",
    ])
    email = _find(body, [
        r"Buyer Email[:\s]+([\w.+-]+@[\w.-]+)",
        r"Email[:\s]+([\w.+-]+@[\w.-]+)",
        r"([\w.+-]+@[\w.-]+\.[a-zA-Z]{2,})",
    ])
    phone = _find(body, [
        r"(?:Tel|Phone|Mobile)[:\s]+([\d\s\+\-\(\)]{7,})",
    ])
    company = _find(body, [
        r"Company[:\s]+(.+)",
        r"Organization[:\s]+(.+)",
    ])
    country = _find(body, [
        r"Country[/\s]*Region[:\s]+(.+)",
        r"Country[:\s]+(.+)",
    ])
    content = _find(body, [
        r"(?:Message|Inquiry|Requirement)[:\s]+([\s\S]+?)(?:\n{2,}|$)",
        r"(?:Dear .*?,?\n)([\s\S]+)",
    ]) or body[:800]

    return ExtractedCustomer(
        name=_clean(name),
        email=_clean(email),
        phone=_clean(phone),
        company=_clean(company),
        country=_clean(country),
        content=content.strip(),
    )


def _extract_mic(body: str) -> ExtractedCustomer:
    """Made-in-China 转发格式（类似 Alibaba，字段名略有不同）。"""
    name = _find(body, [r"(?:From|Sender|Name)[:\s]+(.+)", r"([A-Z][a-z]+ [A-Z][a-z]+)"])
    email = _find(body, [r"Email[:\s]+([\w.+-]+@[\w.-]+)", r"([\w.+-]+@[\w.-]+\.[a-zA-Z]{2,})"])
    country = _find(body, [r"Country[:\s]+(.+)", r"Location[:\s]+(.+)"])
    content = _find(body, [r"(?:Message|Content|Inquiry)[:\s]+([\s\S]+?)(?:\n{2,}|$)"]) or body[:800]
    return ExtractedCustomer(name=_clean(name), email=_clean(email), phone=None, company=None, country=_clean(country), content=content.strip())


def _extract_gs(body: str) -> ExtractedCustomer:
    """Global Sources 转发格式。"""
    name = _find(body, [r"(?:Buyer|Contact|Name)[:\s]+(.+)"])
    email = _find(body, [r"Email[:\s]+([\w.+-]+@[\w.-]+)", r"([\w.+-]+@[\w.-]+\.[a-zA-Z]{2,})"])
    country = _find(body, [r"Country[:\s]+(.+)"])
    content = _find(body, [r"(?:Message|Inquiry)[:\s]+([\s\S]+?)(?:\n{2,}|$)"]) or body[:800]
    return ExtractedCustomer(name=_clean(name), email=_clean(email), phone=None, company=None, country=_clean(country), content=content.strip())


def _extract_generic(body: str) -> ExtractedCustomer:
    email = _find(body, [r"([\w.+-]+@[\w.-]+\.[a-zA-Z]{2,})"])
    return ExtractedCustomer(name=None, email=_clean(email), phone=None, company=None, country=None, content=body[:800])


def _find(text: str, patterns: list[str]) -> str | None:
    for pattern in patterns:
        m = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
        if m:
            return m.group(1).strip()
    return None


def _clean(value: str | None) -> str | None:
    if not value:
        return None
    cleaned = value.strip().strip(":").strip()
    return cleaned if cleaned else None
