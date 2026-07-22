"""
/* ========================================================================== */
/* GEB L3: API 错误适配                                                       */
/* ========================================================================== */
/**
 * [INPUT]: 依赖 FastAPI 异常机制与 JSONResponse
 * [OUTPUT]: 对外提供 add_error_handlers 与 api_error
 * [POS]: app 的错误形状守门员，保证 API 输出符合统一 error contract
 * [PROTOCOL]: 变更时同步更新相关测试与公开文档
 */
"""

import logging
import time

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


def add_error_handlers(app: FastAPI) -> None:
    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        ms = (time.perf_counter() - start) * 1000
        logger.info("%.0fms %s %s %d", ms, request.method, request.url.path, response.status_code)
        return response

    @app.exception_handler(HTTPException)
    async def http_exception_handler(_: Request, exc: HTTPException):
        detail = exc.detail
        if isinstance(detail, dict) and "code" in detail and "message" in detail:
            payload = detail
        else:
            payload = {"code": str(exc.status_code), "message": str(detail)}
        return JSONResponse(status_code=exc.status_code, content={"error": payload})

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        logger.exception("Unhandled error: %s %s", request.method, request.url.path)
        return JSONResponse(
            status_code=500,
            content={"error": {"code": "internal_error", "message": "Internal server error"}},
        )


def api_error(status_code: int, code: str, message: str) -> HTTPException:
    return HTTPException(status_code=status_code, detail={"code": code, "message": message})
