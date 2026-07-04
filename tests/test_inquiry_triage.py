"""
/* ========================================================================== */
/* GEB L3: 入站分诊测试                                                        */
/* ========================================================================== */
/**
 * [INPUT]: 依赖 pytest 与 app.services.inquiry_triage 的规则分诊、provider 选择与 LLM 解析
 * [OUTPUT]: 锁定干净渠道直通、预过滤、采购意图、待确认兜底、provider 配置与降级行为
 * [POS]: tests 对分诊大脑的回归保护
 * [PROTOCOL]: 变更时同步更新相关测试与公开文档
 */
"""

import pytest

from app.services import inquiry_triage as triage


def ctx(**kwargs) -> triage.TriageContext:
    base = {"channel": "email", "content": "Hello", "sender_email": "buyer@acme-trading.com"}
    base.update(kwargs)
    return triage.TriageContext(**base)


def decide(**kwargs) -> triage.TriageDecision:
    return triage.RuleBasedTriageProvider().triage(ctx(**kwargs))


def test_clean_channel_is_always_inquiry():
    result = triage.RuleBasedTriageProvider().triage(
        triage.TriageContext(channel="site_form", content="anything")
    )
    assert result.category == triage.CATEGORY_INQUIRY
    assert result.route == triage.ROUTE_CREATE_INQUIRY
    assert result.is_inquiry


def test_buying_intent_email_becomes_inquiry():
    result = decide(content="We want to order 5000 LED desk lamps, please send your best CIF quote.")
    assert result.category == triage.CATEGORY_INQUIRY
    assert result.is_inquiry
    assert "buying_intent" in result.signals
    assert "corporate_domain" in result.signals


def test_newsletter_is_archived_noise():
    result = decide(
        content="Check our weekly deals",
        headers={"List-Unsubscribe": "<mailto:unsub@news.com>"},
    )
    assert result.category == triage.CATEGORY_NOISE
    assert result.route == triage.ROUTE_ARCHIVE
    assert not result.is_inquiry


def test_auto_reply_is_noise():
    result = decide(content="I am away", headers={"Auto-Submitted": "auto-replied"})
    assert result.category == triage.CATEGORY_NOISE
    assert "auto_reply" in result.signals


def test_out_of_office_subject_is_noise():
    result = decide(content="back next week", subject="Out of Office: Re: quote")
    assert result.category == triage.CATEGORY_NOISE


def test_platform_notification_routes_to_bridge():
    result = decide(content="You have a new inquiry", sender_email="service@message.alibaba.com")
    assert result.category == triage.CATEGORY_PLATFORM_BRIDGE
    assert result.route == triage.ROUTE_BRIDGE_PARSE


def test_automated_sender_is_notification():
    result = decide(content="Your shipment is on the way", sender_email="noreply@dhl.com")
    assert result.category == triage.CATEGORY_NOTIFICATION
    assert result.route == triage.ROUTE_ARCHIVE


def test_internal_sender_is_noise():
    result = decide(content="team meeting notes", sender_email="bob@sunpath.com", seller_domains=["sunpath.com"])
    assert result.category == triage.CATEGORY_NOISE
    assert "internal_sender" in result.signals


def test_known_customer_attaches():
    result = decide(content="quick follow up on my order", is_known_customer=True)
    assert result.category == triage.CATEGORY_EXISTING_CUSTOMER
    assert result.route == triage.ROUTE_ATTACH_CUSTOMER


def test_spam_keyword_is_noise():
    result = decide(content="Boost your SEO ranking and get free traffic now")
    assert result.category == triage.CATEGORY_NOISE
    assert "spam_keyword" in result.signals


def test_vendor_pitch_is_noise():
    result = decide(content="We offer logistics 代运营 services for exporters, partnership opportunity")
    assert result.category == triage.CATEGORY_NOISE


def test_low_signal_goes_to_triage_queue():
    result = decide(content="hi, can you help me?", sender_email="someone@gmail.com")
    assert result.category == triage.CATEGORY_UNCERTAIN
    assert result.route == triage.ROUTE_TRIAGE_QUEUE
    assert not result.is_inquiry


def test_bounce_is_notification():
    result = decide(content="delivery failed", sender_email="mailer-daemon@acme-trading.com")
    assert result.category == triage.CATEGORY_NOTIFICATION


def test_get_provider_defaults_to_rule_based():
    provider = triage.get_triage_provider(env={})
    assert isinstance(provider, triage.RuleBasedTriageProvider)


def test_provider_config_rule_based_warns():
    config = triage.get_triage_provider_config(env={})
    assert config.provider == "rule_based"
    assert config.status == "warning"


def test_openai_provider_requires_model_and_key():
    config = triage.get_triage_provider_config(env={"CLOSER_TRIAGE_PROVIDER": "openai"})
    assert config.provider == "openai"
    assert config.status == "failed"
    with pytest.raises(ValueError):
        triage.get_triage_provider(env={"CLOSER_TRIAGE_PROVIDER": "openai"})


def test_openai_provider_configured():
    env = {
        "CLOSER_TRIAGE_PROVIDER": "openai",
        "CLOSER_TRIAGE_MODEL": "gpt-4o-mini",
        "OPENAI_API_KEY": "sk-test",
    }
    provider = triage.get_triage_provider(env=env)
    assert isinstance(provider, triage.OpenAICompatibleTriageProvider)
    assert triage.get_triage_provider_config(env=env).status == "ok"


def test_triage_message_falls_back_to_rules_on_provider_error():
    class Boom:
        name = "boom"

        def triage(self, context):
            raise RuntimeError("llm down")

    result = triage.triage_message(
        ctx(content="please quote 2000 pcs FOB"),
        provider=Boom(),
    )
    # 降级到规则分诊,仍能判为询盘
    assert result.category == triage.CATEGORY_INQUIRY


def test_decision_from_mapping_normalizes_invalid_category():
    decision = triage._decision_from_mapping({"category": "weird", "confidence": 5})
    assert decision.category == triage.CATEGORY_UNCERTAIN
    assert decision.route == triage.ROUTE_TRIAGE_QUEUE
    assert decision.confidence == 1.0  # 5 被收敛到 [0,1]
