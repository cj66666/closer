"""
Vercel Python Function entrypoint for the Closer FastAPI backend.

The application keeps its API routes under /api/v1/*, so this file only
exposes the existing ASGI app to Vercel without changing route ownership.
"""

from app.main import app
