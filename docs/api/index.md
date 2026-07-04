# API 导读

Closer 后端是纯 JSON API,所有业务端点统一前缀 `/api/v1`。本页讲清**鉴权、分页、错误约定和常用调用链**;逐端点的请求/响应结构见[完整参考(OpenAPI)](./reference.md)。

后端运行时自带交互式文档:

- Swagger UI:`http://127.0.0.1:8000/docs`
- ReDoc:`http://127.0.0.1:8000/redoc`
- 原始 schema:`http://127.0.0.1:8000/api/v1/openapi.json`(或本站 [openapi.json](../openapi.json))

## 鉴权

除 `GET /api/v1/health` 和 `GET /api/v1/demo/wave3` 外,所有端点都需要租户身份。鉴权走 `Authorization` 头:

```http
Authorization: Bearer cak_<your_api_key>
```

API key 以 `cak_` 开头,数据库只存其 SHA-256 哈希,明文 token **仅在创建时返回一次**。

### 申请与吊销 key

```bash
# 创建(响应里的 token 字段就是明文 cak_... ,请妥善保存)
curl -s -X POST http://127.0.0.1:8000/api/v1/auth/api-keys \
  -H "Authorization: Bearer cak_<existing_key>" \
  -H "Content-Type: application/json" \
  -d '{"name": "ci-bot"}'

# 列出 / 吊销
curl -s http://127.0.0.1:8000/api/v1/auth/api-keys -H "Authorization: Bearer cak_<key>"
curl -s -X POST http://127.0.0.1:8000/api/v1/auth/api-keys/{id}/revoke -H "Authorization: Bearer cak_<key>"
```

### 本地开发快捷鉴权

设 `CLOSER_ALLOW_DEV_AUTH=true` 后,可跳过真实 key,用卖家 id 直连(仅限本地):

```http
Authorization: Bearer seller:1
```

也可用 `X-Seller-Id: 1` 头;开启 dev 鉴权且不带任何身份时默认落到 seller `1`。生产环境请勿开启。参见 [app/dependencies.py](https://github.com/cj66666/chengjiaoguan/blob/main/app/dependencies.py)、`app/services/auth_keys.py`。

## 分页

列表端点(线索、询盘、客户、产品、通知、投递记录等)使用统一分页参数:

| 参数 | 默认 | 说明 |
| --- | --- | --- |
| `page` | 1 | 页码,从 1 开始 |
| `page_size` | 20 | 每页条数,上限 100 |

响应通常形如 `{ "items": [...], "total": <int> }`,部分端点附带筛选/排序参数(如询盘的 `status`/`grade`/`channel`/`q`)。

## 错误约定

错误返回非 2xx 状态码,响应体统一为:

```json
{ "detail": { "code": "invalid_token", "message": "可读的错误说明" } }
```

常见状态码:

| 状态码 | 含义 |
| --- | --- |
| 401 | 鉴权失败(缺失/非法 Bearer token) |
| 404 | 资源不存在或不属于当前租户 |
| 409 | 状态冲突(如重复操作) |
| 422 | 请求体校验失败(FastAPI 标准校验) |
| 202 | 已受理但需人工审批(如发送报价触碰底价护栏) |

## 端点速查(按域)

完整结构见 [OpenAPI 参考](./reference.md);下表帮助快速定位。

| 域 | 关键端点 |
| --- | --- |
| 鉴权 | `GET/POST /auth/api-keys`、`POST /auth/api-keys/{id}/revoke` |
| 入站 webhook | `POST /webhooks/{channel}`(`site_form` / `whatsapp`) |
| 线索 | `GET /leads`、`POST /leads/contact-only` |
| 询盘 | `GET /inquiries`、`GET/PATCH /inquiries/{id}` |
| 客户 CRM | `GET /customers`、`GET/PATCH/DELETE /customers/{id}` |
| 会话 | `GET /conversations/{id}`、`/messages`、`/takeover`、`/release` |
| 产品与价格 | `GET/POST /products`、`POST /products/import`、`GET/POST/PUT /pricing-rules` |
| 渠道 | `GET/POST /channels`、`/rotate-credentials`、`/poll-email`、`/sync-receipts`、`/test-delivery` |
| 知识库 | `POST /knowledge`、`GET /knowledge`(检索) |
| 报价 | `GET/PATCH /quotations/{id}`、`POST /quotations/{id}/send` |
| 审批护栏 | `GET /approvals`、`POST /approvals/{id}/approve` `/reject` |
| 投递 | `GET /delivery-attempts`、`/retry`、`/retry-due` |
| 通知 | `GET /notifications`、`PATCH /notifications/{id}` |
| 跟进与调度 | `POST /workers/run-due`、`POST /ops/scheduler/run` |
| 运维就绪 | `GET /ops/readiness`、`GET /ops/alerts` |
| 看板/导出/设置 | `GET /dashboard/metrics`、`GET /exports/{dataset}.csv`、`GET/PATCH /settings` |
| 演示 | `POST /demo/seed`、`GET /demo/wave3`(免鉴权) |

## 一条最短调用链

下面用 dev 鉴权演示"造数据 → 看询盘 → 处理审批",真实环境把 `seller:1` 换成 `cak_<key>` 即可。

```bash
BASE=http://127.0.0.1:8000/api/v1
AUTH="Authorization: Bearer seller:1"   # 需 CLOSER_ALLOW_DEV_AUTH=true

# 1. 生成演示数据(产品、价格规则、A 级询盘、报价、待审批、跟进)
curl -s -X POST "$BASE/demo/seed" -H "$AUTH"

# 2. 看高优先询盘
curl -s "$BASE/inquiries?grade=A" -H "$AUTH"

# 3. 看待审批队列(报价/消息发送被护栏挂起)
curl -s "$BASE/approvals?status=pending" -H "$AUTH"

# 4. 批准后由后端执行真实投递并记录 delivery attempt
curl -s -X POST "$BASE/approvals/{approval_id}/approve" -H "$AUTH"

# 5. 触发到期任务(跟进、投递重试、邮件轮询)
curl -s -X POST "$BASE/workers/run-due" -H "$AUTH"
```

> 护栏不可绕过:`hard_min_price` 触碰时即使已有审批,后端在执行阶段也会重新校验并阻断。详见[架构概览 · 护栏](../guide/architecture.md)与[端到端证据](../END_TO_END_EVIDENCE.md)。
