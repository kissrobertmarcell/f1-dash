"""Orchestration: refresh scheduling, weather lookups, and driver results."""

import logging
from datetime import timedelta

from django.core.cache import cache
from django.db import transaction
from django.utils import timezone

from ..models import DriverStanding, Race, RaceResult, SyncState
from . import ergast_client, repository, weather_client
from .parsers import parse_driver_results, parse_race_results

logger = logging.getLogger(__name__)

WEATHER_CACHE_TTL_SECONDS = 10 * 60


def fetch_dashboard_data():
    drivers = ergast_client.get_json("driverStandings.json")["MRData"][
        "StandingsTable"
    ]["StandingsLists"]
    constructors = ergast_client.get_json("constructorStandings.json")["MRData"][
        "StandingsTable"
    ]["StandingsLists"]
    races = ergast_client.get_current_races()["MRData"]["RaceTable"]["Races"]

    with transaction.atomic():
        repository.store_drivers(drivers[0]["DriverStandings"] if drivers else [])
        repository.store_constructors(
            constructors[0]["ConstructorStandings"] if constructors else []
        )
        repository.store_races(races)
        repository.store_all_driver_results()

        sync, _ = SyncState.objects.get_or_create(key="f1_dashboard")
        sync.last_success_at = timezone.now()
        sync.next_refresh_at = next_refresh_after_race()
        sync.error = ""
        sync.save()

    # Kept outside the transaction above and isolated in its own try/except
    # so a hiccup fetching last-race results never rolls back an otherwise
    # successful standings/schedule sync.
    try:
        fetch_last_race_results()
    except Exception:
        logger.warning("Failed to refresh last race results", exc_info=True)


def fetch_last_race_results():
    payload = ergast_client.get_json("last/results.json")
    races = payload["MRData"]["RaceTable"].get("Races", [])
    if not races:
        return

    race_payload = races[0]
    race = Race.objects.filter(round=int(race_payload["round"])).first()
    if race is None:
        return

    results = parse_race_results(race_payload.get("Results", []))
    with transaction.atomic():
        repository.store_race_results(race, results)


def _latest_race_with_results():
    return (
        Race.objects.filter(pk__in=RaceResult.objects.values_list("race_id", flat=True))
        .order_by("-round")
        .first()
    )


def get_last_race_results():
    race = _latest_race_with_results()
    if race is None:
        try:
            fetch_last_race_results()
        except Exception as exc:
            logger.warning("Failed to fetch last race results: %s", exc)
            return {"race": None, "results": []}
        race = _latest_race_with_results()

    if race is None:
        return {"race": None, "results": []}

    return {"race": race, "results": list(race.results.all())}


def record_sync_error(error):
    sync, _ = SyncState.objects.get_or_create(key="f1_dashboard")
    sync.error = str(error)
    sync.next_refresh_at = timezone.now() + timedelta(minutes=30)
    sync.save()


def refresh_if_due():
    """Best-effort, synchronous refresh triggered from the dashboard view.

    This lets the app stay correct in production with a single web process
    and no separate scheduler/cron/worker: whichever request happens to
    land after data goes stale pays the (~1-3s) cost of a refetch, and
    every other request is a cheap no-op. A dedicated `schedule_f1_fetch`
    process (see management commands) remains available for anyone who
    prefers a background worker instead, and is fully compatible with this
    since both paths update the same `SyncState` row.
    """
    sync = SyncState.objects.filter(key="f1_dashboard").first()
    is_due = (
        sync is None
        or sync.next_refresh_at is None
        or sync.next_refresh_at <= timezone.now()
    )
    if not is_due:
        return

    try:
        fetch_dashboard_data()
    except Exception as exc:
        record_sync_error(exc)
        logger.warning("Deferred dashboard refresh failed: %s", exc)


def next_refresh_after_race():
    upcoming_or_recent = (
        Race.objects.filter(race_start_at__gte=timezone.now() - timedelta(hours=4))
        .order_by("race_start_at")
        .first()
    )
    if upcoming_or_recent is None:
        return timezone.now() + timedelta(hours=12)
    return upcoming_or_recent.race_start_at + timedelta(hours=4)


def get_live_weather(race):
    cache_key = f"weather:{race.pk}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    current = weather_client.fetch_current_weather(race.latitude, race.longitude)
    weather = {
        "temperatureC": current.get("temperature_2m"),
        "apparentTemperatureC": current.get("apparent_temperature"),
        "precipitationMm": current.get("precipitation"),
        "windSpeedKmh": current.get("wind_speed_10m"),
        "summary": weather_client.describe_weather_code(current.get("weather_code")),
        "fetchedAt": timezone.now().isoformat(),
    }
    cache.set(cache_key, weather, WEATHER_CACHE_TTL_SECONDS)
    return weather


def get_driver_results(driver_id):
    driver = DriverStanding.objects.filter(driver_id=driver_id).first()
    if driver is None:
        return {"results": []}

    results = list(driver.results.all())
    if results:
        return {
            "results": [
                {
                    "round": row.round,
                    "raceName": row.race_name,
                    "circuitName": row.circuit_name,
                    "date": row.date.isoformat() if row.date else None,
                    "position": row.position,
                    "points": row.points,
                    "grid": row.grid,
                    "status": row.status,
                    "constructor": row.constructor,
                }
                for row in results
            ]
        }

    payload = ergast_client.get_json(f"drivers/{driver_id}/results.json")
    races = payload["MRData"]["RaceTable"].get("Races", [])
    results_payload = parse_driver_results(races, driver_id)

    repository.store_driver_results_for_driver(driver, results_payload)
    return {"results": results_payload}
