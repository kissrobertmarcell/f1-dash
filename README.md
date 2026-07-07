# F1 Dashboard MVP

One-page Formula 1 dashboard with a React frontend and a Django/SQLite backend.

## Local development

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py fetch_f1_data
python manage.py runserver
```

Optionally run a dedicated scheduler in a second terminal (not required in
production, see "How refreshing works" below):

```bash
cd backend
.venv\Scripts\activate
python manage.py schedule_f1_fetch
```

### Frontend

```bash
cd frontend
cmd /c npm install
cmd /c npm run dev
```

In local development the frontend (port 5173) proxies `/api/*` to Django
(port 8000). Standings and schedule are served from SQLite; weather is
fetched live by Django because that payload is small.

## How refreshing works

- `dashboard.services.sync.refresh_if_due()` runs at the top of the
  `/api/dashboard/` view. If the cached data is stale (no successful sync
  yet, or past the scheduled `next_refresh_at`), it refetches synchronously
  before responding. This makes the app self-healing with a **single
  process** in production -- no cron job or background worker required.
- `next_refresh_at` is set to 4 hours after the next/most recent race start,
  since that's when official results settle.
- Live weather is fetched on every request (with a short server-side cache)
  since it's a small, fast payload that changes often.
- The standalone `schedule_f1_fetch` management command still exists for
  anyone who'd rather run a dedicated background worker instead; it updates
  the same `SyncState` row, so it's fully compatible with the lazy refresh
  above (whichever runs first for a given window wins, and the other
  becomes a no-op).

## Deployment

The app ships as a single Docker image: Django serves both the JSON API
*and* the built React app (from `/static/`), so there's only one service to
deploy, no CORS to configure, and no separate frontend host needed.

### Deploy to Render (recommended, fastest)

1. Push this repo to GitHub/GitLab.
2. In Render, choose **New +** -> **Blueprint**, point it at the repo. It
   will pick up [`render.yaml`](render.yaml) automatically and provision a
   free web service running the Dockerfile.
3. That's it -- Render builds the image, runs migrations, does an initial
   data fetch, and starts serving.

By default the free plan's filesystem is wiped on every deploy/restart.
That's fine here: the next dashboard request just lazily re-seeds itself
(see "How refreshing works"). If you'd rather persist the SQLite database
across restarts, upgrade the plan to `starter` (or higher, required for
disks on Render) and add a disk -- see the commented-out block at the
bottom of `render.yaml`.

### Deploy anywhere else (Docker)

The image is platform-agnostic -- Railway, Fly.io, a VPS with Docker, etc.
all work the same way:

```bash
docker build -t f1-dash .
docker run -p 8000:8000 \
  -e SECRET_KEY=replace-with-a-real-secret \
  -e DEBUG=False \
  -e ALLOWED_HOSTS=your-domain.com \
  f1-dash
```

Or test the full production image locally with `docker compose up --build`
(see [`docker-compose.yml`](docker-compose.yml)), which also persists the
SQLite file in a named volume between runs.

### Environment variables

| Variable          | Default                              | Notes                                                             |
| ------------------ | ------------------------------------- | ------------------------------------------------------------------ |
| `SECRET_KEY`       | dev-only placeholder                  | **Set a real value in production.**                                |
| `DEBUG`            | `True`                                | Set to `False` in production.                                     |
| `ALLOWED_HOSTS`    | `localhost,127.0.0.1,testserver`      | Comma-separated. Render's hostname is added automatically.        |
| `DATABASE_PATH`    | `backend/db.sqlite3`                  | Point at a mounted volume/disk to persist SQLite across restarts. |
