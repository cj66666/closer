# Closer 工作台

> 跨境 B2B 中小卖家的 AI 询盘成交操作系统

从多渠道询盘进入到成交闭环,AI 陪伴每一步判断,但**不能绕过服务端业务护栏**:底价、敏感承诺、大额合同和 PI 必须人工审批,`hard_min_price` 由后端硬熔断。

- 产品定位、痛点、三层价值与 ROI:见 [docs/PRODUCT_OVERVIEW.md](docs/PRODUCT_OVERVIEW.md)
- 完整文档清单:见文末「文档导航」

## 在线 Demo

```text
Ubuntu 全栈 Demo: https://61.29.254.154:9443/
GitHub Pages 在线 Demo: https://cj66666.github.io/chengjiaoguan/
```

说明:如果比赛页或镜像仓库页面仍显示 `.git` 仓库地址,请以上面的在线地址为准。Ubuntu Demo 是真实 FastAPI 后端 + nginx 静态前端,打开后点击 `Demo Seed` 即可体验工作台、询盘收件箱、审批护栏、产品库、报价规则和 readiness。GitHub Pages 版本是只读/静态演示(`VITE_DEMO_MODE=mock`,浏览器内置数据),适合在服务器维护时作为备用入口。

工作台 Demo Seed 与 Agent/Skills 主链路:

![Closer 在线 Demo 工作台](docs/assets/online-demo-workbench.png)

询盘收件箱中的 A 级询盘、评分结果和审批护栏:

![Closer 在线 Demo 询盘收件箱](docs/assets/online-demo-inbox.png)

产品库、SKU 和价格规则维护入口:

![Closer 在线 Demo 产品库](docs/assets/online-demo-products.png)

## 架构概览

前后端分离 + 确定性优先(rule-first)的 Agent。

- **后端** FastAPI,纯 `/api/v1` JSON API(`app/`)。SQLAlchemy 2.0 ORM,生产用 PostgreSQL + pgvector,本地测试用 SQLite 保持确定性。
- **前端** React + Vite 工作台(`frontend/`),开发期通过 `/api` 代理联调后端,Playwright 桌面/移动 E2E。
- **Agent** PydanticAI runtime + Pydantic Graph 八步状态机(`app/agent/`):

  ```text
  receive -> qualify -> understand -> quote -> answer -> followup -> handoff -> persist
  ```

- **决策边界** 规则优先,LLM 可选,由 `CLOSER_GRAPH_DECISION_PROVIDER` 切换(`rule_based` / `http` / `openai`);本地与线上 Demo 都保留 deterministic 最小路径。
- **护栏** 高风险动作强制人工审批,Agent 不能绕过服务端;`hard_min_price` 触碰时即使已有审批也在执行时重新校验并阻断。

规则、LLM 与人工确认的边界:

- **规则完成**:认证、租户隔离、询盘入库、A/B/C 评分、产品匹配 confidence、报价计算、底价/硬底价校验、审批创建、投递记录、跟进调度、readiness/alerts。
- **LLM/provider 可增强**:非结构化询盘理解、多语言表达、Graph decision、知识检索/embedding 和回复润色。
- **必须人工确认**:低于软底价、触碰敏感承诺、大额合同条款、未匹配产品、PI 生成、需要销售接管的会话。`hard_min_price` 触碰时即使人工审批也不能绕过。

## 8 个可评审 Skills

一张 Web 工作台,8 个可评审 Skill,由 Closer Operating Agent 串联执行:

| 顺序 | Skill | 解决的问题 | 核心入口 |
| --- | --- | --- | --- |
| 1 | 多渠道询盘接入 | 把站点表单、Email、WhatsApp 询盘标准化入库 | `POST /api/v1/webhooks/site_form` |
| 2 | 询盘甄别评分 | 判断买家意图、数量、预算、时效和风险信号 | `score_inquiry` |
| 3 | 客户画像与 CRM 建档 | 聚合买家公司、联系人、历史询盘、会话和报价 | `get_customer`、`GET /api/v1/customers/{id}` |
| 4 | 产品匹配与知识检索 | 根据询盘匹配产品并检索知识证据 | `match_product`、`search_knowledge` |
| 5 | 报价与 PI 草稿 | 生成报价草稿、金额、条款和 PI 文档 | `calc_quote`、`generate_pi` |
| 6 | 风险护栏与人工审批 | 拦住底价、敏感承诺、大额合同和未匹配产品 | `send_message`、`request_handoff` |
| 7 | 投递记录、重试与跟进 | 记录发送结果、失败重试和到期跟进 | `create_followup`、`POST /api/v1/workers/run-due` |
| 8 | 原型运维就绪检查 | 展示 LLM、RAG、投递、凭据、汇率、监控等接线状态 | `GET /api/v1/ops/readiness` |

每个 Skill 的拆解见 [skills/README.md](skills/README.md);用同一条询盘串起 8 步、并区分确定性能力与 LLM/provider 依赖的证据表见 [docs/END_TO_END_EVIDENCE.md](docs/END_TO_END_EVIDENCE.md)。

## 快速开始

推荐用 [pixi](https://pixi.sh) 统一管理 Python 3.12、后端依赖、node 前端工具链和本地 PostgreSQL + pgvector。

```bash
pixi install          # 一次性:解析并安装环境
pixi run dev          # 一键全栈:后端(SQLite,8000)+ 前端(5173)
```

打开 **http://127.0.0.1:5173/**(前端工作台;后端 `:8000` 只提供 API,根路径无页面)。`Ctrl+C` 同时停止前后端。

常用任务:

```bash
pixi run test         # 后端 pytest
pixi run serve        # 仅后端(SQLite)
pixi run dev-pg       # 全栈,后端连本地 PostgreSQL(首次先执行 pixi run db-setup)
pixi run db-setup     # 一次性:初始化本地 PostgreSQL 集群 + 建库 + 迁移
pixi run fe-build     # 前端生产构建
pixi run e2e          # 前端 Playwright E2E
```

不使用 pixi 的手动方式:

```bash
python -m pip install -e .[dev]                                  # 仅 SQLite
python -m pip install -e .[dev,postgres]                         # 含 PostgreSQL 驱动
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
cd frontend && npm install && npm run dev -- --port 5173
```

常用地址:

- Backend health: `http://127.0.0.1:8000/api/v1/health`
- Frontend workbench: `http://127.0.0.1:5173/`
- Vite proxy check: `http://127.0.0.1:5173/api/v1/dashboard/metrics`
- 机器可读提交 manifest: `GET /api/v1/demo/wave3`

命令行端到端演示:

```bash
python scripts/demo_flow.py --base-url http://127.0.0.1:8000 --approve --run-workers --json
```

## 验证命令

```bash
pixi run test         # 后端测试
pixi run fe-build     # 前端构建
pixi run e2e          # 前端 E2E
```

2026-06-14 本地验证结果:

- `python -m pytest`(`pixi run test`): 197 passed
- `npm run build`(`pixi run fe-build`): passed
- `npm run test:e2e`: 2026-06-04 浏览器回归记录为 12 passed

## 项目结构

```text
app/            FastAPI 后端:routers(/api/v1)、services(业务规则)、agent(图与决策 provider)、models
frontend/       React + Vite 工作台与 Playwright E2E
skills/         8 个可评审 Skill 的 SKILL.md
migrations/     PostgreSQL 迁移(JSONB、pgvector)
scripts/        demo_flow / production_check 命令行脚本
tests/          后端测试(默认 SQLite)
docs/           规格、提交、运维与产品文档(见下)
pyproject.toml  后端依赖 + pixi 工作区与任务定义
```

## 文档导航

| 文档 | 内容 |
| --- | --- |
| [docs/PRODUCT_OVERVIEW.md](docs/PRODUCT_OVERVIEW.md) | 产品定位、痛点、三层价值、商业价值与 ROI |
| [docs/SPECS.md](docs/SPECS.md) | 系统规格 |
| [docs/END_TO_END_EVIDENCE.md](docs/END_TO_END_EVIDENCE.md) | 一条询盘串起 8 个 Skill 的证据表(确定性 vs LLM 依赖) |
| [docs/DATA_OPERATIONS.md](docs/DATA_OPERATIONS.md) | 数据维护、产品 CSV/价格规则模板、多语言与 ROI 口径 |
| [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) | 环境变量与外部 provider 接线 |
| [docs/DEMO_RUNBOOK.md](docs/DEMO_RUNBOOK.md) | 演示彩排手册 |
| [docs/PRODUCTION_RUNBOOK.md](docs/PRODUCTION_RUNBOOK.md) | 生产部署与生产边界 |
| [docs/WAVE3_SUBMISSION.md](docs/WAVE3_SUBMISSION.md) | Wave 3 半决赛提交定位与 manifest |
| [docs/WAVE2_SUBMISSION.md](docs/WAVE2_SUBMISSION.md) | Wave 2 提交 |
| [docs/COMPETITION_SUBMISSION.md](docs/COMPETITION_SUBMISSION.md) | 比赛提交说明 |
| [docs/CROSS_REVIEW_ACTION_PLAN.md](docs/CROSS_REVIEW_ACTION_PLAN.md) | 交叉评测议题(#1-#6)响应计划 |
| [docs/PUBLIC_REVIEW_CHECKLIST.md](docs/PUBLIC_REVIEW_CHECKLIST.md) | 公开评审前的脱敏检查 |
| [docs/COMPLETION_AUDIT.md](docs/COMPLETION_AUDIT.md) · [docs/IMPLEMENTATION_AUDIT.md](docs/IMPLEMENTATION_AUDIT.md) | 完成度与实现审计 |
| [docs/EXECUTION_PLAN.md](docs/EXECUTION_PLAN.md) · [docs/VISUAL_QA.md](docs/VISUAL_QA.md) | 执行计划与视觉 QA |

## 生产边界

仓库内已提供 provider/client/API/脚本/readiness 边界,真实生产闭环仍需外部系统接线(真实 LLM key/model、托管语义索引与 embedding/search/index provider、SMTP/IMAP/WhatsApp Cloud/外部汇率源/对象存储/监控 webhook/cron-queue,以及生产域名下的最终彩排与视觉 QA)。详见 [docs/PRODUCTION_RUNBOOK.md](docs/PRODUCTION_RUNBOOK.md) 与 [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md)。
