# API 完整参考(OpenAPI)

下面的端点参考由后端 `app.main:app` 的 OpenAPI schema 自动生成(`pixi run openapi` → `openapi.json`),**始终与代码同步**。先读 [API 导读](./index.md) 了解鉴权、分页与错误约定,再在这里查具体端点。

- 在新标签页打开完整参考:[redoc.html](../redoc.html)
- 原始 schema:[openapi.json](../openapi.json)
- 后端运行时还自带交互式文档:`http://127.0.0.1:8000/docs`(Swagger UI)与 `/redoc`。

<iframe
  src="../redoc.html"
  title="Closer API 参考"
  style="width: 100%; height: 80vh; border: 1px solid var(--vp-c-divider); border-radius: 8px;"
  loading="lazy"
></iframe>
