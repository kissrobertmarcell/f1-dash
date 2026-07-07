# ---- Stage 1: build the frontend static assets ----
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: Django + gunicorn runtime ----
FROM python:3.12-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app/backend

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

# Uses the dev-default SECRET_KEY at build time only; collectstatic doesn't
# touch the database, so this is safe even before real env vars are set.
RUN python manage.py collectstatic --noinput

COPY docker-entrypoint.sh /app/docker-entrypoint.sh
# Normalize line endings in case this was checked out/edited on Windows.
RUN sed -i 's/\r$//' /app/docker-entrypoint.sh && chmod +x /app/docker-entrypoint.sh

EXPOSE 8000
ENTRYPOINT ["/app/docker-entrypoint.sh"]
