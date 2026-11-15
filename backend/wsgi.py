"""Production entry point: `gunicorn backend.wsgi:app` (run from the repository root)."""
from backend.app import create_app

app = create_app()
