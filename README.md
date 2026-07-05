# F1 Dashboard MVP

One-page Formula 1 dashboard with a React frontend and a Django/SQLite backend.

## Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py fetch_f1_data
python manage.py runserver
```

The scheduler can run in a second terminal:

```bash
cd backend
.venv\Scripts\activate
python manage.py schedule_f1_fetch
```

It refreshes cached standings and schedule after each race start time plus four hours. Weather is fetched live by Django when the dashboard API is requested.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend reads from `/api/dashboard/` only. Standings and schedule are served from SQLite; weather is fetched live by Django because that payload is small.
