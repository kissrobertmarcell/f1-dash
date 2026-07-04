from datetime import datetime, timedelta, timezone as dt_timezone
from decimal import Decimal

import requests
from django.db import transaction
from django.utils import timezone

from .models import ConstructorStanding, DriverStanding, Race, SyncState

F1_BASE_URL = "https://api.jolpi.ca/ergast/f1/current"
OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

WEATHER_CODES = {
    0: "Clear",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Rime fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Heavy drizzle",
    61: "Light rain",
    63: "Rain",
    65: "Heavy rain",
    71: "Light snow",
    73: "Snow",
    75: "Heavy snow",
    80: "Rain showers",
    81: "Rain showers",
    82: "Heavy showers",
    95: "Thunderstorm",
}


def fetch_dashboard_data():
    drivers = _get_f1("driverStandings.json")["MRData"]["StandingsTable"]["StandingsLists"]
    constructors = _get_f1("constructorStandings.json")["MRData"]["StandingsTable"]["StandingsLists"]
    races = _get_current_races()["MRData"]["RaceTable"]["Races"]

    with transaction.atomic():
        _store_drivers(drivers[0]["DriverStandings"] if drivers else [])
        _store_constructors(constructors[0]["ConstructorStandings"] if constructors else [])
        _store_races(races)

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


def get_live_weather(race):
    current = _fetch_weather(race)
    return {
        "temperatureC": current.get("temperature_2m"),
        "apparentTemperatureC": current.get("apparent_temperature"),
        "precipitationMm": current.get("precipitation"),
        "windSpeedKmh": current.get("wind_speed_10m"),
        "summary": WEATHER_CODES.get(current.get("weather_code"), "Current conditions"),
        "fetchedAt": timezone.now().isoformat(),
    }


def next_refresh_after_race():
    upcoming_or_recent = Race.objects.filter(
        race_start_at__gte=timezone.now() - timedelta(hours=4)
    ).first()
    if upcoming_or_recent is None:
        return timezone.now() + timedelta(hours=12)
    return upcoming_or_recent.race_start_at + timedelta(hours=4)


def _get_f1(path):
    response = requests.get(f"{F1_BASE_URL}/{path}", timeout=20)
    response.raise_for_status()
    return response.json()


def _get_current_races():
    response = requests.get(f"{F1_BASE_URL}.json", timeout=20)
    response.raise_for_status()
    return response.json()


def _store_drivers(rows):
    DriverStanding.objects.all().delete()
    DriverStanding.objects.bulk_create(
        [
            DriverStanding(
                position=int(row["position"]),
                driver_id=row["Driver"]["driverId"],
                given_name=row["Driver"]["givenName"],
                family_name=row["Driver"]["familyName"],
                code=row["Driver"].get("code", ""),
                nationality=row["Driver"].get("nationality", ""),
                constructor=row["Constructors"][0]["name"],
                points=Decimal(row["points"]),
                wins=int(row["wins"]),
            )
            for row in rows
        ]
    )


def _store_constructors(rows):
    ConstructorStanding.objects.all().delete()
    ConstructorStanding.objects.bulk_create(
        [
            ConstructorStanding(
                position=int(row["position"]),
                constructor_id=row["Constructor"]["constructorId"],
                name=row["Constructor"]["name"],
                nationality=row["Constructor"].get("nationality", ""),
                points=Decimal(row["points"]),
                wins=int(row["wins"]),
            )
            for row in rows
        ]
    )


def _store_races(rows):
    for row in rows:
        race = Race.objects.update_or_create(
            round=int(row["round"]),
            defaults={
                "race_name": row["raceName"],
                "circuit_name": row["Circuit"]["circuitName"],
                "locality": row["Circuit"]["Location"]["locality"],
                "country": row["Circuit"]["Location"]["country"],
                "latitude": Decimal(row["Circuit"]["Location"]["lat"]),
                "longitude": Decimal(row["Circuit"]["Location"]["long"]),
                "race_start_at": _parse_datetime(row["date"], row.get("time")),
                "first_practice_at": _parse_session(row.get("FirstPractice")),
                "second_practice_at": _parse_session(row.get("SecondPractice")),
                "third_practice_at": _parse_session(row.get("ThirdPractice")),
                "qualifying_at": _parse_session(row.get("Qualifying")),
                "sprint_at": _parse_session(row.get("Sprint")),
            },
        )
        race[0].save()


def _fetch_weather(race):
    response = requests.get(
        OPEN_METEO_URL,
        params={
            "latitude": str(race.latitude),
            "longitude": str(race.longitude),
            "current": "temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
            "forecast_days": 1,
        },
        timeout=20,
    )
    response.raise_for_status()
    return response.json().get("current", {})


def _parse_session(session):
    if not session:
        return None
    return _parse_datetime(session["date"], session.get("time"))


def _parse_datetime(date, time_value):
    if not time_value:
        time_value = "00:00:00Z"
    value = datetime.fromisoformat(f"{date}T{time_value.replace('Z', '+00:00')}")
    if value.tzinfo is None:
        value = value.replace(tzinfo=dt_timezone.utc)
    return value

