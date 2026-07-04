"""
/* ========================================================================== */
/* GEB L3: 入站编排与分诊 API 测试                                            */
/* ========================================================================== */
/**
 * [INPUT]: 依赖 pytest、db_session/client 夹具、InboundMessage 与 inbound_intake 编排
 * [OUTPUT]: 锁定邮箱过闸门、干净渠道直入、去重、确认升询盘、忽略归档与 /triage API
 * [POS]: tests 对 M2 入站智能编排的回归保护
 * [PROTOCOL]: 变更时同步更新相关测试与公开文档
 */
"""

from app import models
from app.schemas import ChannelContact, InboundMessage
from app.services import inbound_intake
from app.services.inbound_intake import (
    confirm_triage_item,
    dismiss_triage_item,
    intake_message,
)


def email(content, *, mid="m1", sender="buyer@acme-trading.com", name="Buyer", headers=None):
    return InboundMessage(
        channel="email",
        channel_message_id=mid,
        from_=ChannelContact(name=name, email=sender),
        content=content,
        headers=headers or {},
    )


def test_email_buying_intent_creates_inquiry(db_session):
    result = intake_message(db_session, 1, email("Please quote 5000 LED desk lamps CIF to US."))
    assert result.kind == "inquiry"
    assert result.inquiry_id is not None
    assert db_session.get(models.Inquiry, result.inquiry_id) is not None


def test_email_newsletter_goes_to_archive_not_inquiry(db_session):
    result = intake_message(
        db_session,
        1,
        email("weekly deals", headers={"List-Unsubscribe": "<mailto:u@n.com>"}),
    )
    assert result.kind == "triage"
    assert result.inquiry_id is None
    item = db_session.get(models.TriageItem, result.triage_item_id)
    assert item.bucket == "archive"
    assert item.category == "noise"


def test_email_low_signal_goes_to_triage_queue(db_session):
    result = intake_message(db_session, 1, email("hi, can you help?", sender="x@gmail.com"))
    assert result.kind == "triage"
    item = db_session.get(models.TriageItem, result.triage_item_id)
    assert item.bucket == "triage"
    assert item.status == "pending"


def test_site_form_bypasses_triage_gate(db_session):
    message = InboundMessage(
        channel="site_form",
        channel_message_id="sf1",
        from_=ChannelContact(name="A", email="a@b.com"),
        content="hi",
    )
    result = intake_message(db_session, 1, message)
    assert result.kind == "inquiry"
    assert result.inquiry_id is not None


def test_intake_is_idempotent(db_session):
    first = intake_message(db_session, 1, email("newsletter", mid="dup", headers={"List-Id": "x"}))
    second = intake_message(db_session, 1, email("newsletter", mid="dup", headers={"List-Id": "x"}))
    assert second.duplicate is True
    assert second.triage_item_id == first.triage_item_id


def test_confirm_promotes_triage_item_to_inquiry(db_session):
    triaged = intake_message(db_session, 1, email("hi there", sender="y@gmail.com"))
    result = confirm_triage_item(db_session, 1, triaged.triage_item_id)
    assert result.kind == "inquiry"
    assert result.inquiry_id is not None
    item = db_session.get(models.TriageItem, triaged.triage_item_id)
    assert item.status == "confirmed"
    assert item.inquiry_id == result.inquiry_id


def test_dismiss_archives_triage_item(db_session):
    triaged = intake_message(db_session, 1, email("hi there", sender="z@gmail.com"))
    item = dismiss_triage_item(db_session, 1, triaged.triage_item_id)
    assert item.status == "dismissed"
    assert item.bucket == "archive"


# --- API ---

def test_triage_api_list_and_confirm(client, db_session):
    triaged = intake_message(db_session, 1, email("need help pls", sender="api@gmail.com"))
    db_session.flush()

    listed = client.get("/api/v1/triage?bucket=triage&status=pending")
    assert listed.status_code == 200
    body = listed.json()
    assert body["total"] >= 1
    assert any(it["id"] == triaged.triage_item_id for it in body["items"])

    confirmed = client.post(f"/api/v1/triage/{triaged.triage_item_id}/confirm")
    assert confirmed.status_code == 200
    assert confirmed.json()["kind"] == "inquiry"
    assert confirmed.json()["inquiry_id"] is not None


def test_triage_api_dismiss(client, db_session):
    triaged = intake_message(db_session, 1, email("hello", sender="d@gmail.com"))
    db_session.flush()
    resp = client.post(f"/api/v1/triage/{triaged.triage_item_id}/dismiss")
    assert resp.status_code == 200
    assert resp.json()["status"] == "dismissed"


def test_triage_api_404_for_unknown(client):
    assert client.post("/api/v1/triage/9999/confirm").status_code == 404
