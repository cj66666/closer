#!/usr/bin/env python3
"""
/* ========================================================================== */
/* GEB L3: OpenAPI schema 导出脚本                                            */
/* ========================================================================== */
/**
 * [INPUT]: 依赖标准库 argparse/json/pathlib 与 app.main:app 的 FastAPI OpenAPI schema
 * [OUTPUT]: 对外提供 CLI，把 app.openapi() 写到 docs/public/openapi.json 供文档站 Redoc 渲染
 * [POS]: scripts 的文档构建入口，让 API 文档始终与后端路由/模型同步，不手工维护
 * [PROTOCOL]: 变更时同步更新相关测试与公开文档
 */
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.main import app


DEFAULT_OUTPUT = Path("docs/public/openapi.json")


def export_openapi(output: Path = DEFAULT_OUTPUT) -> Path:
    schema = app.openapi()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(schema, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return output


def main() -> int:
    parser = argparse.ArgumentParser(description="Export the FastAPI OpenAPI schema to a JSON file.")
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help=f"Output path for the OpenAPI schema (default: {DEFAULT_OUTPUT}).",
    )
    args = parser.parse_args()
    path = export_openapi(args.output)
    schema = json.loads(path.read_text(encoding="utf-8"))
    print(f"Wrote {path} ({len(schema.get('paths', {}))} paths)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
