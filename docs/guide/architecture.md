# 架构概览

Closer 是**前后端分离 + 确定性优先(rule-first)的 Agent** 应用。核心理念:AI 可以理解、判断和生成,但**不能绕过服务端业务护栏**。

## 分层

```text
app/
  routers/        FastAPI 路由,统一 /api/v1 前缀,只做 HTTP 编排与租户校验
  services/       业务规则(评分、报价引擎、护栏、投递、跟进、readiness…)
  agent/          PydanticAI runtime + Pydantic Graph 八步状态机 + 决策 provider
  models.py       SQLAlchemy ORM(JSONB,生产 PostgreSQL,测试 SQLite)
  dependencies.py 请求上下文:Bearer API key / dev token 解析为 seller_id(租户隔离)
  main.py         组合根:lifespan + 错误处理 + 装配 router
```

- **后端** FastAPI,纯 `/api/v1` JSON API。SQLAlchemy 2.0 ORM,生产用 PostgreSQL + pgvector,本地测试用 SQLite 保持确定性。
- **前端** React + Vite 工作台(`frontend/`),开发期经 `/api` 代理联调,Playwright 桌面/移动 E2E。
- **租户隔离**:每个请求经 `get_seller_id` 解析出 `seller_id`,所有查询按租户过滤。

## 八步 Agent 图

Agent 用 [Pydantic Graph](https://ai.pydantic.dev/) 表达为八步状态机(`app/agent/graph_domain/nodes.py`):

```text
receive -> qualify -> understand -> quote -> answer -> followup -> handoff -> persist
```

| 节点 | 职责 | 关键工具 |
| --- | --- | --- |
| ReceiveInquiry | 装载询盘上下文 | `get_inquiry` |
| QualifyInquiry | 评分定级,C 级或缺询盘转人工 | `score_inquiry` |
| UnderstandRequirement | 产品匹配 + 知识检索 | `match_product`、`search_knowledge` |
| ReplyWithQuote | 生成报价草稿;触碰底价转人工 | `calc_quote` |
| NegotiateAndAnswer | 发送回复;敏感内容挂起审批 | `send_message` |
| ScheduleFollowup | 报价后排到期跟进 | `create_followup` |
| RequestHumanHandoff | 创建人工审批/接管 | `request_handoff` |
| PersistMemory | 回写客户上下文,结束 | `get_customer` |

每个节点只表达跳转、工具调用、policy 消费与状态写入;具体业务规则在 `app/services/` 中执行。

## 决策边界:规则优先,LLM 可选

节点的"下一步该怎么走"由可插拔的决策 provider 给出(`app/agent/graph_domain/policy.py`),通过环境变量 `CLOSER_GRAPH_DECISION_PROVIDER` 切换:

| provider | 说明 |
| --- | --- |
| `rule_based`(默认) | 纯确定性规则,无需 LLM;本地与线上 Demo 的最小可用路径 |
| `http` / `remote` | 把决策上下文 POST 给自建决策服务 |
| `openai` / `llm` | OpenAI 兼容 Chat Completions,返回结构化决策 JSON |

这样设计让"业务可跑"不依赖 LLM,而 LLM 在可增强处(非结构化理解、多语言、决策、检索润色)按需接入。相关环境变量见[环境变量配置](../ENVIRONMENT.md)。

## 护栏(不可绕过)

高风险动作强制走服务端审批,Agent 无法越权:

- **软底价 `floor_price`**:命中后创建审批,不能由 Agent 自动发送。
- **硬底价 `hard_min_price`**:触碰后直接阻断 PI 生成与报价发送;**即使已有审批,后端在执行阶段也会重新校验并阻断**。
- **敏感承诺**:`send_message` 识别敏感承诺与低于底价的金额表达,创建 `message_send` 审批。
- **未匹配产品**:低置信度 `match_product` 返回 `needs_review` 与备选品,引导人工确认。

规则 / LLM / 人工的完整边界与可验证证据见[端到端证据](../END_TO_END_EVIDENCE.md)。

## 数据与外部边界

报价质量依赖四类数据:产品、价格规则、知识库、渠道凭证(维护频率与模板见[数据维护与 ROI](../DATA_OPERATIONS.md))。生产闭环还需外部 provider 接线(LLM、embedding/检索、SMTP/IMAP/WhatsApp、汇率源、对象存储、监控、cron/queue),仓库已提供 provider/client/readiness 边界,接线清单见[环境变量配置](../ENVIRONMENT.md)与[生产手册](../PRODUCTION_RUNBOOK.md)。
