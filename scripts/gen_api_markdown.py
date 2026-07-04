#!/usr/bin/env python3
"""
/* ========================================================================== */
/* GEB L3: OpenAPI → Markdown 端点清单生成脚本                                 */
/* ========================================================================== */
/**
 * [INPUT]: 依赖标准库 json/pathlib 与 docs/public/openapi.json（先跑 export_openapi.py）
 * [OUTPUT]: 生成 docs/api/endpoints.md —— 按 URL 域分组的离线可读端点清单（method · path · summary）
 * [POS]: scripts 的文档构建补充，给不便开 Redoc 的场景一份纯文本 API 速查
 * [PROTOCOL]: 变更时同步更新相关测试与公开文档
 */
"""

from __future__ import annotations

import json
from pathlib import Path

SPEC = Path("docs/public/openapi.json")
OUT = Path("docs/api/endpoints.md")
METHOD_ORDER = ["get", "post", "put", "patch", "delete"]


def domain_of(path: str) -> str:
    parts = [p for p in path.split("/") if p and not p.startswith("{")]
    # /api/v1/<domain>/...  → <domain>
    if len(parts) >= 3 and parts[0] == "api":
        return parts[2]
    return parts[-1] if parts else "root"


def main() -> int:
    spec = json.loads(SPEC.read_text(encoding="utf-8"))
    info = spec.get("info", {})
    groups: dict[str, list[tuple[str, str, str]]] = {}
    total = 0
    for path, ops in spec.get("paths", {}).items():
        for method, op in ops.items():
            if method.lower() not in METHOD_ORDER:
                continue
            total += 1
            summary = op.get("summary") or op.get("operationId") or ""
            groups.setdefault(domain_of(path), []).append((method.upper(), path, summary))

    lines = [
        f"# API 端点清单（{info.get('title','API')} v{info.get('version','')}）",
        "",
        f"> 由 `docs/public/openapi.json` 自动生成（`pixi run openapi` 后跑 `python scripts/gen_api_markdown.py`），共 **{total}** 个端点、统一前缀 `/api/v1`。",
        "> 鉴权/分页/错误约定见 [API 导读](./index.md)；交互式完整结构见 [OpenAPI 参考](./reference.md)。",
        "",
    ]
    for domain in sorted(groups):
        rows = sorted(groups[domain], key=lambda r: (r[1], METHOD_ORDER.index(r[0].lower())))
        lines.append(f"## `{domain}`")
        lines.append("")
        lines.append("| 方法 | 路径 | 说明 |")
        lines.append("| --- | --- | --- |")
        for method, path, summary in rows:
            lines.append(f"| `{method}` | `{path}` | {summary} |")
        lines.append("")

    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {OUT} ({total} endpoints across {len(groups)} domains)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
