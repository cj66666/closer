"""
/* ========================================================================== */
/* GEB L3: 线索生命周期测试                                                   */
/* ========================================================================== */
/**
 * [INPUT]: 依赖 FastAPI TestClient、SQLite 会话夹具、leads 与入站 webhook
 * [OUTPUT]: 锁定完整询盘初筛、Facebook 仅留联系方式线索、阶段同步和人工接管边界
 * [POS]: tests 对线索生命周期工作台的回归保护
 * [PROTOCOL]: 变更时同步更新相关测试与公开文档
 */
"""

from app import models


def test_complete_inquiry_gets_fixed_lead_assessment_and_handoff(client, db_session):
    payload = {
        "channel": "site_form",
        "channel_message_id": "lead-full-001",
        "from": {
            "name": "Sanne de Vries",
            "company": "Garden Living BV",
            "country": "NL",
            "email": "sanne@gardenliving.nl",
        },
        "content": "We need 300 custom PE rattan sofa sets shipped CIF Rotterdam. Please quote price and lead time.",
        "language": "en",
    }

    created = client.post("/api/v1/webhooks/site_form", json=payload)
    leads = client.get("/api/v1/leads", params={"lifecycle_stage": "human_takeover"})

    assert created.status_code == 201
    assert leads.status_code == 200
    assert leads.json()["total"] == 1
    item = leads.json()["items"][0]
    assert item["takeover_required"] is True
    assert item["intent_level"] == "high"
    assert item["lead_assessment"]["authenticity"] == "likely_real"
    assert item["lead_assessment"]["human_takeover_required"] is True
    assert "solution_or_quote_needs_human" in item["lead_assessment"]["human_takeover_reasons"]
    assert "需人工报价" in item["tags"]

    inquiry = db_session.get(models.Inquiry, created.json()["inquiry_id"])
    customer = db_session.get(models.Customer, created.json()["customer_id"])
    assert inquiry.lifecycle_stage == "human_takeover"
    assert customer.lifecycle_stage == "human_takeover"
    assert customer.takeover_status == "human_required"


def test_facebook_contact_only_lead_enters_first_contact_queue(client, db_session):
    payload = {
        "channel": "facebook",
        "contact_source": "lead_ads_manual",
        "contact": {
            "name": "Daniel Carter",
            "company": "Westfield Retail Group",
            "country": "UK",
            "phone": "+44 20 0000 0000",
        },
        "note": "Facebook Lead Ads form: interested in outdoor furniture catalog.",
        "tags": ["展会再营销"],
        "received_at": "2026-07-04T08:00:00Z",
    }

    response = client.post("/api/v1/leads/contact-only", json=payload)

    assert response.status_code == 201
    body = response.json()
    assert body["source_channel"] == "facebook"
    assert body["lead_type"] == "contact_only"
    assert body["contact_source"] == "lead_ads_manual"
    assert body["lifecycle_stage"] == "first_contact_due"
    assert body["status"] == "first_contact_due"
    assert body["takeover_required"] is True
    assert body["next_followup_at"] is not None
    assert "Facebook 来源" in body["tags"]
    assert "仅留联系方式" in body["tags"]
    assert "展会再营销" in body["tags"]

    conversation = db_session.get(models.Conversation, body["conversation_id"])
    followup = db_session.get(models.FollowupTask, body["followup_id"])
    customer = db_session.get(models.Customer, body["customer_id"])
    assert conversation.status == "pending_first_contact"
    assert conversation.is_human_takeover is True
    assert followup.schedule["kind"] == "first_contact"
    assert followup.status == "active"
    assert customer.lifecycle_stage == "first_contact_due"
    assert customer.takeover_status == "human_required"


def test_lifecycle_patch_syncs_inquiry_and_customer(client, db_session):
    created = client.post(
        "/api/v1/leads/contact-only",
        json={
            "channel": "facebook",
            "contact": {"name": "Olivia Bennett", "email": "olivia@example.co.uk"},
            "note": "Asked for garden parasol catalog.",
        },
    )
    lead_id = created.json()["id"]
    customer_id = created.json()["customer_id"]

    patched = client.patch(
        f"/api/v1/inquiries/{lead_id}",
        json={
            "lifecycle_stage": "needs_discovery",
            "intent_level": "medium",
            "tags": ["待补需求", "Facebook 来源"],
            "takeover_required": False,
            "next_followup_at": "2026-07-05T09:30:00Z",
        },
    )
    customer = client.get(f"/api/v1/customers/{customer_id}")
    filtered = client.get("/api/v1/customers", params={"lifecycle_stage": "needs_discovery"})

    assert patched.status_code == 200
    assert patched.json()["lifecycle_stage"] == "needs_discovery"
    assert patched.json()["takeover_required"] is False
    assert customer.json()["lifecycle_stage"] == "needs_discovery"
    assert customer.json()["next_followup_at"] is not None
    assert filtered.json()["total"] == 1
