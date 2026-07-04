# API 端点清单（Closer API v0.1.0）

> 由 `docs/public/openapi.json` 自动生成（`pixi run openapi` 后跑 `python scripts/gen_api_markdown.py`），共 **65** 个端点、统一前缀 `/api/v1`。
> 鉴权/分页/错误约定见 [API 导读](./index.md)；交互式完整结构见 [OpenAPI 参考](./reference.md)。

## `approvals`

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/v1/approvals` | Get Approvals |
| `PATCH` | `/api/v1/approvals/{approval_id}` | Update Approval |
| `POST` | `/api/v1/approvals/{approval_id}/approve` | Approve Pending Approval |
| `POST` | `/api/v1/approvals/{approval_id}/reject` | Reject Pending Approval |

## `auth`

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/v1/auth/api-keys` | Get Api Keys |
| `POST` | `/api/v1/auth/api-keys` | Create Api Key Endpoint |
| `POST` | `/api/v1/auth/api-keys/{api_key_id}/revoke` | Revoke Api Key Endpoint |

## `channels`

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/v1/channels` | List Channels Endpoint |
| `POST` | `/api/v1/channels` | Create Channel Endpoint |
| `POST` | `/api/v1/channels/{channel_account_id}/poll-email` | Poll Email Channel Endpoint |
| `POST` | `/api/v1/channels/{channel_account_id}/rotate-credentials` | Rotate Channel Credentials Endpoint |
| `POST` | `/api/v1/channels/{channel_account_id}/sync-receipts` | Sync Channel Receipts Endpoint |
| `POST` | `/api/v1/channels/{channel_account_id}/test-delivery` | Test Channel Delivery Endpoint |

## `conversations`

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/v1/conversations/{conversation_id}` | Get Conversation |
| `GET` | `/api/v1/conversations/{conversation_id}/messages` | List Messages |
| `POST` | `/api/v1/conversations/{conversation_id}/messages` | Create Message |
| `POST` | `/api/v1/conversations/{conversation_id}/release` | Release Conversation |
| `POST` | `/api/v1/conversations/{conversation_id}/takeover` | Takeover Conversation |

## `customers`

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/v1/customers` | List Customers |
| `GET` | `/api/v1/customers/{customer_id}` | Get Customer Detail |
| `PATCH` | `/api/v1/customers/{customer_id}` | Patch Customer |
| `DELETE` | `/api/v1/customers/{customer_id}` | Delete Customer |

## `dashboard`

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/v1/dashboard/metrics` | Get Dashboard Metrics |

## `delivery-attempts`

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/v1/delivery-attempts` | Get Delivery Attempts |
| `POST` | `/api/v1/delivery-attempts/retry-due` | Retry Due Delivery Attempts |
| `POST` | `/api/v1/delivery-attempts/{attempt_id}/retry` | Retry One Delivery Attempt |

## `demo`

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/api/v1/demo/seed` | Seed Demo |
| `GET` | `/api/v1/demo/wave3` | Wave3 Demo Manifest |

## `exports`

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/v1/exports/{dataset}.csv` | Export Dataset |

## `health`

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/v1/health` | Health |

## `inquiries`

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/v1/inquiries` | List Inquiries |
| `GET` | `/api/v1/inquiries/{inquiry_id}` | Get Inquiry Detail |
| `PATCH` | `/api/v1/inquiries/{inquiry_id}` | Patch Inquiry |

## `knowledge`

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/v1/knowledge` | List Knowledge |
| `POST` | `/api/v1/knowledge` | Create Knowledge |

## `leads`

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/v1/leads` | List Leads |
| `POST` | `/api/v1/leads/contact-only` | Create Contact Lead |

## `notifications`

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/v1/notifications` | Get Notifications |
| `PATCH` | `/api/v1/notifications/{notification_id}` | Patch Notification |

## `ops`

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/v1/ops/alerts` | Get Ops Alerts |
| `GET` | `/api/v1/ops/readiness` | Get Ops Readiness |
| `POST` | `/api/v1/ops/scheduler/run` | Run Ops Scheduler |

## `pricing-rules`

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/v1/pricing-rules` | List Pricing Rules Endpoint |
| `POST` | `/api/v1/pricing-rules` | Create Pricing Rule Endpoint |
| `GET` | `/api/v1/pricing-rules/{rule_id}` | Get Pricing Rule Endpoint |
| `PUT` | `/api/v1/pricing-rules/{rule_id}` | Update Pricing Rule Endpoint |
| `POST` | `/api/v1/pricing-rules/{rule_id}/confirm-exchange-rate-cache` | Confirm Exchange Rate Cache Endpoint |
| `POST` | `/api/v1/pricing-rules/{rule_id}/refresh-exchange-rate-cache` | Refresh Exchange Rate Cache Endpoint |
| `GET` | `/api/v1/pricing-rules/{rule_id}/versions` | List Pricing Rule Versions Endpoint |

## `products`

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/v1/products` | List Products |
| `POST` | `/api/v1/products` | Create Product Endpoint |
| `POST` | `/api/v1/products/import` | Import Products Endpoint |
| `GET` | `/api/v1/products/{product_id}` | Get Product Endpoint |
| `PATCH` | `/api/v1/products/{product_id}` | Update Product Endpoint |
| `DELETE` | `/api/v1/products/{product_id}` | Delete Product Endpoint |

## `quotations`

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/v1/quotations/{quotation_id}` | Get Quotation Detail |
| `PATCH` | `/api/v1/quotations/{quotation_id}` | Update Quotation |
| `POST` | `/api/v1/quotations/{quotation_id}/send` | Send Quotation Endpoint |

## `settings`

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/v1/settings` | Get Settings |
| `PATCH` | `/api/v1/settings` | Patch Settings |

## `triage`

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/api/v1/triage` | List Triage Items |
| `POST` | `/api/v1/triage/{item_id}/confirm` | Confirm Triage |
| `POST` | `/api/v1/triage/{item_id}/dismiss` | Dismiss Triage |

## `webhooks`

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/api/v1/webhooks/{channel}` | Ingest Webhook |

## `workers`

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/api/v1/workers/run-due` | Run Due Workers |
