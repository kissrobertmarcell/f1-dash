from pathlib import Path

from django.conf import settings
from django.http import HttpResponse, HttpResponseNotFound

_INDEX_HTML_PATH = Path(settings.STATIC_ROOT) / "index.html"


def frontend_index(_request):
    """Serve the built React app's index.html for the single-service deploy.

    Not used in local development, where the Vite dev server (port 5173)
    serves the frontend directly and proxies /api/ to Django.
    """
    try:
        html = _INDEX_HTML_PATH.read_text(encoding="utf-8")
    except FileNotFoundError:
        return HttpResponseNotFound(
            "Frontend build not found. Run `npm run build` in frontend/ and "
            "`python manage.py collectstatic` before serving in production."
        )
    return HttpResponse(html)
