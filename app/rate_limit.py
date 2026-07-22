import os

from slowapi import Limiter
from slowapi.util import get_remote_address

# Default: 60 requests/minute per IP. Override via CLOSER_RATE_LIMIT env var.
_default_limit = os.environ.get("CLOSER_RATE_LIMIT", "60/minute")

limiter = Limiter(key_func=get_remote_address, default_limits=[_default_limit])
