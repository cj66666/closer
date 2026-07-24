"""
/* ========================================================================== */
/* GEB L3: Agent 运行入口                                                     */
/* ========================================================================== */
/**
 * [INPUT]: 依赖 PydanticAI Agent、SQLAlchemy Session、app.agent.model_config、app.agent.types 与 app.agent.tools
 * [OUTPUT]: 对外提供 build_closer_agent、closer_agent、run_closer_agent，运行时可用显式 model 或 CLOSER_AGENT_MODEL
 * [POS]: app/agent 的 PydanticAI 组合根，负责模型运行入口和模型选择，不承载图节点逻辑
 * [PROTOCOL]: 变更时同步更新相关测试与公开文档
 */
"""

from __future__ import annotations

from typing import Any

from pydantic_ai import Agent
from sqlalchemy.orm import Session

from app.agent.model_config import selected_agent_model
from app.agent.tools import CLOSER_AGENT_TOOLS
from app.agent.types import CloserAgentDeps, CloserAgentOutput
from app.services.agent_tracing import bind_trace_run, complete_agent_run, fail_agent_run, start_agent_run


def build_closer_agent(model: str | None = None) -> Agent[CloserAgentDeps, CloserAgentOutput]:
    return Agent(
        model,
        deps_type=CloserAgentDeps,
        output_type=CloserAgentOutput,
        instructions=(
            "You are the operating agent for a cross-border B2B seller. "
            "Use tools before making factual claims about inquiries, customers, or quotes. "
            "Never promise discounts, payment terms, delivery guarantees, or legal commitments "
            "unless a tool result explicitly supports them. Return structured output only."
        ),
        tools=CLOSER_AGENT_TOOLS,
    )


closer_agent = build_closer_agent()


def run_closer_agent(
    session: Session,
    seller_id: int,
    user_prompt: str,
    *,
    inquiry_id: int | None = None,
    conversation_id: int | None = None,
    model: Any | None = None,
) -> CloserAgentOutput:
    runtime_model = selected_agent_model(model)
    run = start_agent_run(
        session,
        seller_id,
        user_prompt,
        inquiry_id=inquiry_id,
        conversation_id=conversation_id,
        source="pydanticai",
        model=runtime_model,
    )
    deps = CloserAgentDeps(
        seller_id=seller_id,
        session=session,
        inquiry_id=inquiry_id,
        conversation_id=conversation_id,
    )
    bind_trace_run(deps, run)
    try:
        result = closer_agent.run_sync(
            user_prompt,
            deps=deps,
            model=runtime_model,
        )
    except Exception as exc:
        fail_agent_run(deps, run, exc)
        raise
    complete_agent_run(
        deps,
        run,
        {
            "output": result.output.model_dump(mode="json"),
            "requires_human_review": result.output.requires_human_review,
            "next_actions": result.output.next_actions,
        },
    )
    return result.output
