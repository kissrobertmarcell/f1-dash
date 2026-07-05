import time
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from dashboard.services import fetch_dashboard_data, record_sync_error
from dashboard.models import SyncState


class Command(BaseCommand):
    help = "Run the MVP auto-fetch loop after each race start time plus four hours."

    def handle(self, *args, **options):
        self.stdout.write("Starting F1 fetch scheduler.")
        while True:
            sync, _ = SyncState.objects.get_or_create(key="f1_dashboard")
            next_refresh = sync.next_refresh_at or timezone.now()

            if next_refresh <= timezone.now():
                try:
                    fetch_dashboard_data()
                except Exception as exc:
                    record_sync_error(exc)
                    self.stderr.write(f"Refresh failed: {exc}")
                sync.refresh_from_db()
                next_refresh = sync.next_refresh_at or timezone.now() + timedelta(minutes=30)

            wait_seconds = max(60, min(3600, int((next_refresh - timezone.now()).total_seconds())))
            self.stdout.write(f"Next refresh at {next_refresh.isoformat()}. Sleeping {wait_seconds}s.")
            time.sleep(wait_seconds)
