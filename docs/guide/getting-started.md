# 快速开始

Closer 是前后端分离的应用:**后端** FastAPI(纯 `/api/v1` JSON API),**前端** React + Vite 工作台。推荐用 [pixi](https://pixi.sh) 统一管理 Python 3.12、后端依赖、node 前端工具链和本地 PostgreSQL + pgvector。

## 一键全栈

```bash
pixi install     # 一次性:解析并安装环境
pixi run dev     # 同时拉起后端(SQLite,:8000)+ 前端(:5173)
```

打开 **http://127.0.0.1:5173/** —— 这是工作台界面。`Ctrl+C` 同时停止前后端。

> 后端 `:8000` 只提供 API,**根路径没有网页**(返回 404 属正常)。网页永远在前端 `:5173`。开发期前端通过 `/api` 代理转发到后端,因此需要两个进程;生产环境则由 nginx 托管前端静态文件并反代 `/api`。

## 常用任务

| 命令 | 作用 |
| --- | --- |
| `pixi run dev` | 全栈,后端用 SQLite(零配置,开箱即用) |
| `pixi run dev-pg` | 全栈,后端连本地 PostgreSQL(首次先 `pixi run db-setup`) |
| `pixi run serve` | 仅后端(SQLite) |
| `pixi run test` | 后端 pytest |
| `pixi run fe-build` | 前端生产构建 |
| `pixi run e2e` | 前端 Playwright E2E |
| `pixi run docs` | 本地预览这套文档站 |

更多任务(数据库、OpenAPI 导出等)见[开发手册](./development.md)。

## 用 PostgreSQL 跑

默认 SQLite 适合开发与演示。要贴近生产(JSONB、pgvector):

```bash
pixi run db-setup   # 一次性:初始化本地集群 + 建库 + 执行 migrations/001_initial.sql
pixi run dev-pg     # 之后每次用这个;内部会确保 PostgreSQL 在运行
```

本地库默认监听 `127.0.0.1:5433`,数据目录 `.pgdata/`(已 gitignore)。后端通过 `CLOSER_DATABASE_URL` 切换数据库,`dev-pg` 任务已内置 `postgresql+psycopg://closer@127.0.0.1:5433/closer`。

## 常用地址

- 后端健康检查:`http://127.0.0.1:8000/api/v1/health`
- 前端工作台:`http://127.0.0.1:5173/`
- 后端交互式 API 文档:`http://127.0.0.1:8000/docs`(Swagger)、`/redoc`
- 机器可读提交 manifest:`GET /api/v1/demo/wave3`

## 不使用 pixi 的手动方式

```bash
python -m pip install -e .[dev]              # 仅 SQLite
python -m pip install -e .[dev,postgres]     # 含 PostgreSQL 驱动 psycopg
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
cd frontend && npm install && npm run dev -- --port 5173
```

## 下一步

- [架构概览](./architecture.md) —— 分层、八步 Agent 图、决策 provider 与护栏。
- [开发手册](./development.md) —— pixi 任务全表、测试约定、代码规范。
- [API 导读](../api/index.md) —— 鉴权、分页、错误与调用链。
- [使用手册](../manual/overview.md) —— 工作台逐页操作。
