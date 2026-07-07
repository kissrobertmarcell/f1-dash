#!/bin/sh
set -e

python manage.py migrate --noinput

# Best-effort warm-up so the first visitor doesn't pay for it. Not fatal if
# it fails (e.g. transient network issue) -- the dashboard view's
# `refresh_if_due()` will retry lazily on the first real request.
python manage.py fetch_f1_data || echo "Initial fetch failed; will retry lazily on first request."

exec gunicorn f1dash.wsgi:application --bind 0.0.0.0:8000 --workers 1 --timeout 120
