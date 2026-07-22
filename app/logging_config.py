import logging
import os
import sys


def configure_logging() -> None:
    level_name = os.environ.get("CLOSER_LOG_LEVEL", "INFO").upper()
    level = getattr(logging, level_name, logging.INFO)

    fmt = "%(asctime)s %(levelname)s %(name)s %(message)s"
    logging.basicConfig(stream=sys.stdout, level=level, format=fmt, force=True)

    # Quiet noisy third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
