from django.core.management.base import BaseCommand, CommandError

from dashboard.services import fetch_dashboard_data, record_sync_error


class Command(BaseCommand):
    help = "Fetch F1 standings and schedule into SQLite."

    def handle(self, *args, **options):
        try:
            fetch_dashboard_data()
        except Exception as exc:
            record_sync_error(exc)
            raise CommandError(str(exc)) from exc

        self.stdout.write(self.style.SUCCESS("F1 dashboard data refreshed."))
