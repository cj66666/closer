"""
/* ========================================================================== */
/* GEB L3: Agent 决策追踪服务                                                 */
/* ========================================================================== */
/**
 * [INPUT]: 依赖 SQLAlchemy Session、FastAPI jsonable_encoder、app.models 与 utcnow
 * [OUTPUT]: 对外提供 Agent run/event 创建、工具调用追踪、完成/失败收口与查询序列化
 * [POS]: services 的可回放事件流边界，只记录可解释证据链，不记录模型私密思维链
 * [PROTOCOL]: 变更时同步更新 Agent 运行入口、路由、迁移与测试
 */
"""

from __future__ import annotations

from collections.abc import Callable
from time import perf_counter
from typing import Any
from uuid import uuid4

from fastapi.encoders import jsonable_encoder
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app import models
from app.database import utcnow


def start_agent_run(
    session: Session,
    seller_id: int,
    user_prompt: str,
    *,
    inquiry_id: int | None = None,
    conversation_id: int | None = None,
    source: str = "graph",
    model: Any | None = None,
    run_metadata: dict[str, Any] | None = None,
) -> models.AgentRun:
    run = models.AgentRun(
        seller_id=seller_id,
        inquiry_id=inquiry_id,
        conversation_id=conversation_id,
        run_uid=str(uuid4()),
        source=source,
        model=_model_name(model),
        user_prompt=user_prompt,
        status="running",
        run_metadata=_json_safe(run_metadata or {}),
    )
    session.add(run)
    session.flush()
    record_trace_event(
        session,
        seller_id,
        run.id,
        "input_received",
        sequence=1,
        status="ok",
        input_payload={
            "user_prompt": user_prompt,
            "inquiry_id": inquiry_id,
            "conversation_id": conversation_id,
        },
        output_payload={"source": source, "model": run.model},
    )
    return run


def bind_trace_run(deps: Any, run: models.AgentRun) -> None:
    deps.agent_run_id = run.id
    deps.trace_sequence = 1


def record_event_for_deps(
    deps: Any,
    event_type: str,
    *,
    node: str | None = None,
    tool_name: str | None = None,
    status: str = "ok",
    input_payload: Any | None = None,
    output_payload: Any | None = None,
    duration_ms: int | None = None,
    error: str | None = None,
) -> models.AgentTraceEvent | None:
    run_id = getattr(deps, "agent_run_id", None)
    if run_id is None:
        return None
    deps.trace_sequence = int(getattr(deps, "trace_sequence", 0)) + 1
    try:
        return record_trace_event(
            deps.session,
            deps.seller_id,
            run_id,
            event_type,
            sequence=deps.trace_sequence,
            node=node,
            tool_name=tool_name,
            status=status,
            input_payload=input_payload,
            output_payload=output_payload,
            duration_ms=duration_ms,
            error=error,
        )
    except Exception:
        return None


def record_trace_event(
    session: Session,
    seller_id: int,
    agent_run_id: int,
    event_type: str,
    *,
    sequence: int | None = None,
    node: str | None = None,
    tool_name: str | None = None,
    status: str = "ok",
    input_payload: Any | None = None,
    output_payload: Any | None = None,
    duration_ms: int | None = None,
    error: str | None = None,
) -> models.AgentTraceEvent:
    event = models.AgentTraceEvent(
        seller_id=seller_id,
        agent_run_id=agent_run_id,
        sequence=sequence or _next_persisted_sequence(session, agent_run_id),
        event_type=event_type,
        node=node,
        tool_name=tool_name,
        status=status,
        input_payload=_payload_dict(input_payload),
        output_payload=_payload_dict(output_payload),
        duration_ms=duration_ms,
        error=error,
    )
    session.add(event)
    session.flush()
    return event


def trace_tool_call(
    deps: Any,
    tool_name: str,
    input_payload: Any,
    call: Callable[[], Any],
) -> Any:
    if getattr(deps, "agent_run_id", None) is None:
        return call()
    started = perf_counter()
    try:
        result = call()
    except Exception as exc:
        record_event_for_deps(
            deps,
            "tool_call",
            tool_name=tool_name,
            status="failed",
            input_payload=input_payload,
            duration_ms=_elapsed_ms(started),
            error=str(exc),
        )
        raise
    record_event_for_deps(
        deps,
        "tool_call",
        tool_name=tool_name,
        status="ok",
        input_payload=input_payload,
        output_payload=result,
        duration_ms=_elapsed_ms(started),
    )
    return result


def complete_agent_run(deps: Any, run: models.AgentRun, result_payload: Any) -> None:
    run.status = "completed"
    run.completed_at = utcnow()
    run.result = _json_safe(result_payload)
    run.error = None
    record_event_for_deps(
        deps,
        "final_output",
        status="ok",
        output_payload=result_payload,
    )
    deps.session.flush()


def fail_agent_run(deps: Any, run: models.AgentRun, exc: Exception) -> None:
    run.status = "failed"
    run.completed_at = utcnow()
    run.error = str(exc)
    run.result = {"status": "failed", "error": str(exc)}
    record_event_for_deps(
        deps,
        "run_failed",
        status="failed",
        error=str(exc),
    )
    deps.session.flush()


def agent_run_item(run: models.AgentRun) -> dict[str, Any]:
    return {
        "id": run.id,
        "run_uid": run.run_uid,
        "seller_id": run.seller_id,
        "inquiry_id": run.inquiry_id,
        "conversation_id": run.conversation_id,
        "source": run.source,
        "model": run.model,
        "user_prompt": run.user_prompt,
        "status": run.status,
        "result": run.result or {},
        "error": run.error,
        "run_metadata": run.run_metadata or {},
        "started_at": run.started_at,
        "completed_at": run.completed_at,
        "created_at": run.created_at,
        "updated_at": run.updated_at,
    }


def trace_event_item(event: models.AgentTraceEvent) -> dict[str, Any]:
    return {
        "id": event.id,
        "agent_run_id": event.agent_run_id,
        "sequence": event.sequence,
        "event_type": event.event_type,
        "node": event.node,
        "tool_name": event.tool_name,
        "status": event.status,
        "input_payload": event.input_payload or {},
        "output_payload": event.output_payload or {},
        "duration_ms": event.duration_ms,
        "error": event.error,
        "created_at": event.created_at,
    }


def _next_persisted_sequence(session: Session, agent_run_id: int) -> int:
    current = session.scalar(
        select(func.max(models.AgentTraceEvent.sequence)).where(models.AgentTraceEvent.agent_run_id == agent_run_id)
    )
    return int(current or 0) + 1


def _elapsed_ms(started: float) -> int:
    return max(0, int((perf_counter() - started) * 1000))


def _model_name(model: Any | None) -> str | None:
    if model is None:
        return None
    if isinstance(model, str):
        return model
    return model.__class__.__name__


def _json_safe(value: Any) -> Any:
    return jsonable_encoder(value)


def _payload_dict(value: Any | None) -> dict[str, Any]:
    safe = _json_safe(value or {})
    if isinstance(safe, dict):
        return safe
    return {"value": safe}
