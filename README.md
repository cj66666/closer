# Closer 工作台

> 跨境 B2B 中小卖家的 AI 询盘成交操作系统

从多渠道询盘进入到成交闭环,AI 陪伴每一步判断,但**不能绕过服务端业务护栏**:底价、敏感承诺、大额合同和 PI 必须人工审批,`hard_min_price` 由后端硬熔断。

完整文档(开发文档 / 使用手册 / API 参考)见 **[docs/](docs/)**,本地预览 `pixi run docs`;产品定位与价值见 [docs/PRODUCT_OVERVIEW.md](docs/PRODUCT_OVERVIEW.md)。

## 在线 Demo

```text
全栈 Demo: https://61.29.254.154:94432
```

真实 FastAPI 后端 + nginx 静态前端,点击 `Demo Seed` 即可体验工作台、询盘收件箱、审批护栏、产品库、报价规则和 readiness。备用只读静态版(浏览器内置 mock 数据):<https://cj66666.github.io/chengjiaoguan/>。

![Closer 工作台](docs/assets/online-demo-workbench.png)
![询盘收件箱与审批护栏](docs/assets/online-demo-inbox.png)

## 架构概览

前后端分离 + 确定性优先(rule-first)的 Agent,详见 [docs/guide/architecture.md](docs/guide/architecture.md)。

- **后端** FastAPI,纯 `/api/v1` JSON API(`app/`);SQLAlchemy 2.0,生产 PostgreSQL + pgvector,本地测试 SQLite。
- **前端** React + Vite 工作台(`frontend/`),经 `/api` 代理联调,Playwright 桌面/移动 E2E。
- **Agent** PydanticAI + Pydantic Graph 八步图:`receive → qualify → understand → quote → answer → followup → handoff → persist`。
- **决策边界** 规则优先、LLM 可选(`CLOSER_GRAPH_DECISION_PROVIDER`);**护栏**让高风险动作强制审批,`hard_min_price` 即使审批也在执行时硬熔断。

## 快速开始

推荐用 [pixi](https://pixi.sh) 统一管理 Python 3.12、后端依赖、node 前端工具链和本地 PostgreSQL + pgvector。

```bash
pixi install     # 一次性:解析并安装环境
pixi run dev     # 一键全栈:后端(SQLite,8000)+ 前端(5173)
```

打开 **http://127.0.0.1:5173/**(前端工作台;后端 `:8000` 只提供 API,根路径无页面)。`Ctrl+C` 同时停止前后端。

```bash
pixi run dev-pg  # 全栈,后端连本地 PostgreSQL(首次先 pixi run db-setup)
pixi run test    # 后端 pytest(197 passed)
pixi run docs    # 本地预览文档站
```

手动 pip/npm、数据库、OpenAPI 等完整命令见 [docs/guide/getting-started.md](docs/guide/getting-started.md) 与 [docs/guide/development.md](docs/guide/development.md)。

## 文档

`docs/` 是一个可独立部署 / 可嵌入产品站的 VitePress 文档站(`pixi run docs` 预览,`pixi run docs-build` 构建)。核心入口:

- 指南:[快速开始](docs/guide/getting-started.md) · [架构概览](docs/guide/architecture.md) · [开发手册](docs/guide/development.md)
- 使用:[使用手册](docs/manual/overview.md) · [API 导读](docs/api/index.md) · [环境变量](docs/ENVIRONMENT.md)
- 运维:[演示手册](docs/DEMO_RUNBOOK.md) · [生产手册](docs/PRODUCTION_RUNBOOK.md)
- 产品:[产品概述](docs/PRODUCT_OVERVIEW.md) · [系统规格](docs/SPECS.md) · [端到端证据](docs/END_TO_END_EVIDENCE.md)

8 个可评审 Skill 的拆解见 [skills/README.md](skills/README.md)。赛事提交、审计等内部文档保留在 `docs/`,默认不发布到公开站点。
