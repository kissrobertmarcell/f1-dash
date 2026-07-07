"""Orchestration: refresh scheduling, weather lookups, and driver results."""

from datetime import timedelta

from django.core.cache import cache
from django.db import transaction
from django.utils import timezone

from ..models import DriverStanding, Race, SyncState
from . import ergast_client, repository, weather_client
from .parsers import parse_driver_results

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


def record_sync_error(error):
    sync, _ = SyncState.objects.get_or_create(key="f1_dashboard")
    sync.error = str(error)
    sync.next_refresh_at = timezone.now() + timedelta(minutes=30)
    sync.save()


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
