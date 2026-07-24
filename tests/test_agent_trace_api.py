"""
/* ========================================================================== */
/* GEB L3: Agent 决策回放 API 测试                                            */
/* ========================================================================== */
/**
 * [INPUT]: 依赖 FastAPI TestClient、SQLite 会话夹具、app.models 与 graph runtime
 * [OUTPUT]: 验证 Agent run/event 查询和询盘聚合时间线可还原输入、工具调用和最终输出
 * [POS]: tests 的可追溯回放证明文件，锁住“事后复盘”API 契约
 * [PROTOCOL]: 变更时同步更新 agent_trace 路由和前端回放卡片
 */
"""

from decimal import Decimal

from app import models
from app.agent_runtime import run_closer_graph_result


def test_agent_run_events_api_returns_replayable_trace(client, db_session):
    inquiry, conversation = _seed_replayable_inquiry(db_session)

    graph_result = run_closer_graph_result(
        db_session,
        1,
        "Handle this inquiry with replay trace.",
        inquiry_id=inquiry.id,
        conversation_id=conversation.id,
    )
    run_id = graph_result.state.agent_run_id

    detail = client.get(f"/api/v1/agent-runs/{run_id}")
    events = client.get(f"/api/v1/agent-runs/{run_id}/events")

    assert detail.status_code == 200
    assert detail.json()["status"] == "completed"
    assert detail.json()["user_prompt"] == "Handle this inquiry with replay trace."
    assert events.status_code == 200
    payload = events.json()
    assert payload["total"] >= 8
    assert payload["items"][0]["event_type"] == "input_received"
    assert payload["items"][-1]["event_type"] == "final_output"
    assert {"score_inquiry", "match_product", "send_message"}.issubset(
        {item["tool_name"] for item in payload["items"] if item["event_type"] == "tool_call"}
    )


def test_inquiry_timeline_aggregates_input_audit_and_agent_events(client, db_session):
    inquiry, conversation = _seed_replayable_inquiry(db_session)
    run_closer_graph_result(
        db_session,
        1,
        "Explain the full journey later.",
        inquiry_id=inquiry.id,
        conversation_id=conversation.id,
    )

    response = client.get(f"/api/v1/inquiries/{inquiry.id}/timeline")

    assert response.status_code == 200
    timeline = response.json()
    assert timeline["inquiry_id"] == inquiry.id
    assert timeline["conversation_ids"] == [conversation.id]
    kinds = {item["kind"] for item in timeline["items"]}
    assert {"inquiry", "message", "audit", "agent_run", "agent_event"}.issubset(kinds)
    event_types = {item["event_type"] for item in timeline["items"]}
    assert {"input_received", "inbound_message_ingested", "tool_call", "final_output"}.issubset(event_types)


def test_agent_run_api_is_tenant_scoped(client, db_session):
    inquiry, conversation = _seed_replayable_inquiry(db_session)
    result = run_closer_graph_result(
        db_session,
        1,
        "Tenant scoped trace.",
        inquiry_id=inquiry.id,
        conversation_id=conversation.id,
    )

    response = client.get(f"/api/v1/agent-runs/{result.state.agent_run_id}", headers={"Authorization": "Bearer seller:2"})

    assert response.status_code == 404


def _seed_replayable_inquiry(db_session):
    seller = models.Seller(id=1, name="Demo Exporter", email="owner@example.com")
    customer = models.Customer(
        seller_id=1,
        email="buyer@acme-trading.com",
        company="ACME Trading",
        country="US",
        status="active",
    )
    product = models.Product(
        seller_id=1,
        name="LED Desk Lamp",
        sku="LAMP-10W",
        cost=Decimal("2.00"),
        moq=100,
        description="10W aluminum LED desk lamp for office buyers.",
        status="active",
    )
    db_session.add_all([seller, customer, product])
    db_session.flush()
    inquiry = models.Inquiry(
        seller_id=1,
        customer_id=customer.id,
        source_channel="email",
        raw_content="Need 500 LED desk lamps shipped to US.",
        parsed={"product": "led desk lamp", "quantity": 500, "destination": "US"},
        status="new",
        language="en",
    )
    db_session.add(inquiry)
    db_session.flush()
    conversation = models.Conversation(
        seller_id=1,
        customer_id=customer.id,
        inquiry_id=inquiry.id,
        channel="email",
        language="en",
    )
    db_session.add(conversation)
    db_session.flush()
    db_session.add(
        models.Message(
            conversation_id=conversation.id,
            sender_role="customer",
            channel_message_id="replay-email-001",
            content=inquiry.raw_content,
        )
    )
    db_session.add(
        models.PricingRule(
            seller_id=1,
            product_id=product.id,
            margin_rate=Decimal("0.25"),
            logistics_template={"unit_cost": "0.10"},
            valid_days=14,
            floor_price=Decimal("2.00"),
            currency="USD",
        )
    )
    db_session.add(
        models.AuditLog(
            seller_id=1,
            actor="system",
            action_type="inbound_message_ingested",
            target_type="inquiry",
            target_id=inquiry.id,
            is_auto=True,
            snapshot={"channel": "email", "channel_message_id": "replay-email-001"},
        )
    )
    db_session.flush()
    return inquiry, conversation
