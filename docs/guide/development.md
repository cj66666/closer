# 开发手册

面向贡献者:环境、任务、测试与代码规范。先读[快速开始](./getting-started.md)与[架构概览](./architecture.md)。

## 项目结构

```text
app/            FastAPI 后端:routers(/api/v1)、services(业务规则)、agent(图与决策 provider)、models
frontend/       React + Vite 工作台与 Playwright E2E
skills/         8 个可评审 Skill 的 SKILL.md
migrations/     PostgreSQL 迁移(JSONB、pgvector)
scripts/        demo_flow / production_check / export_openapi 命令行脚本
tests/          后端测试(默认 SQLite)
docs/           VitePress 文档站(本站)
pyproject.toml  后端依赖 + pixi 工作区与任务定义
```

## pixi 任务全表

| 任务 | 作用 |
| --- | --- |
| `pixi install` | 安装/解析环境(Python 3.12、node、依赖) |
| `dev` / `dev-pg` | 全栈启动(SQLite / 本地 PostgreSQL) |
| `serve` / `serve-pg` | 仅后端(SQLite / PostgreSQL) |
| `test` | 后端 pytest |
| `openapi` | 导出 `docs/public/openapi.json` |
| `docs` / `docs-build` / `docs-preview` | 文档站 开发 / 构建 / 预览 |
| `fe-install` / `fe-dev` / `fe-build` / `e2e` | 前端 安装 / 开发 / 构建 / E2E |
| `db-setup` | 一次性:初始化本地 PostgreSQL + 建库 + 迁移 |
| `pg-up` / `pg-start` / `pg-stop` | 本地 PostgreSQL 起停(`pg-up` 幂等) |
| `pg-init` / `pg-create` / `pg-migrate` | 集群/库/迁移的细粒度步骤 |

## 依赖管理

后端依赖与 extras 在 `pyproject.toml [project]` 中定义,是唯一真源:

- 运行:`pip install -e .`
- 开发/测试:`.[dev]`(含 pytest、httpx)
- 生产 PostgreSQL:`.[postgres]`(psycopg)

pixi 通过 editable self-install 拉取这些依赖,并把 extras 映射为 feature;`pixi.lock` 提交以保证可复现。

## 本地 PostgreSQL

```bash
pixi run db-setup    # 首次:init + start + createdb + migrate(.pgdata/,:5433)
pixi run pg-start    # 日常起
pixi run pg-stop     # 停
```

需要 PostgreSQL 服务端 + pgvector(由 pixi 的 `postgres` feature 从 conda-forge 提供)。后端用 `CLOSER_DATABASE_URL` 选择数据库,默认 `sqlite:///./closer.db`。

## 测试约定

- `pixi run test` 运行 `tests/` 下全部测试,默认 SQLite,确定性、无外部依赖。
- 每个能力域都有对应测试(评分、报价引擎、护栏、投递、workers、各 API…)。
- 后端逻辑变更必须同步更新测试。

## 代码规范:GEB L3 文件头

每个源文件(及关键文档)以 `GEB L3` 注释块开头,声明四个契约字段:

```text
[INPUT]   依赖的输入/上游模块
[OUTPUT]  对外提供的导出/能力
[POS]     该文件在系统中的定位与职责边界
[PROTOCOL] 变更时同步更新相关测试与公开文档
```

新增或修改文件时保留并更新这个头部,保持职责边界清晰。

## 新增端点的 pattern

1. 在 `app/services/` 写业务规则(可单测,不依赖 HTTP)。
2. 在 `app/routers/<域>.py` 加薄路由,经 `Depends(get_seller_id)` 获取租户、`Depends(get_session)` 获取会话,调用 service。
3. 在 `app/main.py` 的 `_include_routers` 装配(若为新 router)。
4. 加 `tests/test_*.py`,用 `TestClient` 覆盖。
5. 运行 `pixi run test`;若改了对外 API,运行 `pixi run openapi` 刷新文档。

## API 文档同步

API 参考由 OpenAPI 自动生成:`pixi run openapi` 把 `app.main:app` 的 schema 写到 `docs/public/openapi.json`,文档站用 Redoc 渲染([完整参考](../api/reference.md))。改动 API 后重新导出即可,无需手工维护端点列表。
