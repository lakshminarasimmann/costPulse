"""
main.py — Root application entrypoint for Vercel and ASGI runners.
Exposes the FastAPI `app` instance defined in backend/main.py.
"""

from backend.main import app

__all__ = ["app"]
