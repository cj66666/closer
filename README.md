# Closer — 成交官

> **跨境 B2B 外贸线索与客户生命周期工作台**
> Cross-border B2B lead lifecycle workbench for small & mid-size exporters

Closer 将"线索进入 → 初筛 → 询盘沟通 → 客户建档 → 意向判断 → 跟进提醒 → 人工接管"串成一条流程。AI 负责识别、补全、总结和下一步建议；价格承诺、合同条款、定制需求等高风险动作强制提示业务员接管，`hard_min_price` 在后端硬熔断。

Closer pipelines leads through: **receive → qualify → understand → quote_prepare → answer → followup → handoff → persist**. AI handles identification, enrichment, summarisation, and next-step suggestions; price commitments, contract terms, and custom orders always escalate to a human. `hard_min_price` is enforced server-side as a hard circuit-breaker.

---

## 在线 Demo / Live Demo

**<https://closer.jingjinglearns.cc>**

真实 FastAPI 后端 + React 前端，前后端同域部署于 Vercel。注册账号或访客登录后即可体验完整工作台。  
Real FastAPI backend + React frontend, deployed together on Vercel under the same domain. Register or use guest login to explore the full workbench.

备用静态预览（GitHub Pages，mock 数据）/ Fallback static preview (GitHub Pages, mock data): <https://cj66666.github.io/chengjiaoguan/>

---

## 功能概览 / Features

| 模块 | 说明 | Module | Description |
|------|------|--------|-------------|
| 落地页 | 产品介绍 + 注册引导 | Landing | Product intro + sign-up |
| 仪表盘 | 线索漏斗与核心指标 | Dashboard | Lead funnel & KPIs |
| 线索池 | 导入、打分、分配 | Leads | Import, score, assign |
| 客户档案 | CRM 建档与标签管理 | CRM | Customer profiles & tags |
| 跟进提醒 | 任务清单与超时预警 | Followups | Task list & overdue alerts |
| 智能向导 | AI 逐步引导的询盘处理 | Wizard | AI-guided inquiry flow |
| 渠道接入 | 邮件 / WhatsApp / 飞书 | Channels | Email / WhatsApp / Feishu |
| 报价规则 | 硬熔断 + 审批链 | Quote Rules | Hard guardrails + approval chain |
| 数据分析 | 销售预测与团队报表 | Analytics | Forecast & team reports |
| 设置 | 用户、团队、权限管理 | Settings | User, team, access control |

---

## 架构概览 / Architecture

```
frontend/          React 18 + Vite
app/               FastAPI + SQLAlchemy 2.0
  routers/         REST API — /api/v1/*
  services/        Business logic
  agent/           PydanticAI 八步图 / 8-step graph
  logging_config   结构化日志 / Structured logging
  rate_limit       限流 (slowapi) / Rate limiting
api/index.py       Vercel Python Runtime 入口 / Vercel entry point
alembic/           数据库迁移 / DB migrations
migrations/        SQL schema (PostgreSQL)
vercel.json        Vercel 路由配置 / Routing config
tests/             pytest
docs/              VitePress 文档站 / Docs site
```

- **部署 / Deployment** — Vercel（前后端同域）；`/api/*` 路由到 FastAPI Python Runtime，前端静态文件由 Vercel CDN 分发
- **后端 / Backend** — FastAPI，纯 `/api/v1` JSON API；SQLAlchemy 2.0；Vercel 临时用 `/tmp` SQLite，生产建议接 Neon / Supabase（PostgreSQL）
- **前端 / Frontend** — React + Vite；JWT auth；仅在 `VITE_DEMO_MODE=mock` 时走 mock 数据
- **Agent** — PydanticAI + Pydantic Graph；规则优先，LLM 可选（`CLOSER_GRAPH_DECISION_PROVIDER`）
- **迁移 / Migrations** — Alembic（Python），`migrations/001_initial.sql`（PostgreSQL）

---

## 快速开始 / Quick Start

推荐用 [pixi](https://pixi.sh) 统一管理 Python 3.12、后端依赖和 Node 前端工具链。  
We recommend [pixi](https://pixi.sh) to manage Python 3.12, backend deps, and the Node frontend toolchain in one command.

```bash
# 安装环境 / Install environment
pixi install

# 全栈启动（SQLite，无需额外配置）/ Full-stack dev with SQLite
pixi run dev
```

打开 **http://127.0.0.1:5173** → 注册账号 → 开始使用  
Open **http://127.0.0.1:5173** → register → start exploring

`Ctrl+C` 同时停止前后端 / stops both frontend and backend.

### 其他常用命令 / Other commands

```bash
pixi run dev-pg       # 全栈，后端连本地 PostgreSQL / full-stack with local PostgreSQL
pixi run test         # 后端测试 / backend tests (pytest)
pixi run serve        # 仅后端 / backend only
pixi run fe-dev       # 仅前端 / frontend only
pixi run docs         # VitePress 文档预览 / docs preview
pixi run db-setup     # 初始化本地 PostgreSQL（首次）/ bootstrap local PostgreSQL (once)
```

### 环境变量 / Environment Variables

复制 `.env.example` 为 `.env.local` 并按需填写：  
Copy `.env.example` to `.env.local` and fill in as needed:

```bash
CLOSER_DATABASE_URL=sqlite:///./closer.db          # 默认 / default
# CLOSER_DATABASE_URL=postgresql+psycopg://closer@127.0.0.1:5433/closer
CLOSER_SECRET_KEY=your-secret-key
CLOSER_GRAPH_DECISION_PROVIDER=openai              # or rule
OPENAI_API_KEY=sk-...
```

完整变量列表见 [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md)。  
Full variable reference: [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md)

---

## 数据库迁移 / Database Migrations

```bash
# Alembic（SQLite / PostgreSQL 通用）
alembic upgrade head

# 或 PostgreSQL 原生 SQL
psql -h 127.0.0.1 -p 5433 -U closer -d closer -f migrations/001_initial.sql
```

---

## 文档 / Documentation

`docs/` 是一个可独立部署的 VitePress 站点（`pixi run docs` 本地预览）。  
`docs/` is a self-contained VitePress site (`pixi run docs` to preview locally).

- [快速开始 / Getting Started](docs/guide/getting-started.md)
- [架构概览 / Architecture](docs/guide/architecture.md)
- [开发手册 / Development](docs/guide/development.md)
- [API 导读 / API Reference](docs/api/index.md)
- [环境变量 / Environment](docs/ENVIRONMENT.md)
- [产品概述 / Product Overview](docs/PRODUCT_OVERVIEW.md)
- [生产运维 / Production Runbook](docs/PRODUCTION_RUNBOOK.md)

---

## 技术栈 / Tech Stack

| 层 / Layer | 技术 / Technology |
|-----------|------------------|
| 前端 / Frontend | React 18, Vite, CSS Modules |
| 后端 / Backend | FastAPI, SQLAlchemy 2.0, Alembic, slowapi |
| AI / Agent | PydanticAI, OpenAI-compatible LLM |
| 数据库 / Database | SQLite (dev / Vercel tmp) · PostgreSQL + pgvector (prod) |
| 部署 / Deployment | Vercel（前后端同域）· GitHub Actions 自动部署 |
| 环境管理 / Local Env | pixi (Python 3.12 + Node 20) |
| 测试 / Testing | pytest, Playwright E2E |

---

## 许可证 / License

MIT
