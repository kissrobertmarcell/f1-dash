import logging

from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import ConstructorStanding, DriverStanding, Race, SyncState
from .services import (
    get_driver_results,
    get_last_race_results,
    get_live_weather,
    refresh_if_due,
)

logger = logging.getLogger(__name__)


def _decimal(value):
    return None if value is None else float(value)


def _iso(value):
    return None if value is None else value.isoformat()


def dashboard(_request):
    refresh_if_due()

    next_race = Race.objects.filter(race_start_at__gte=timezone.now()).first()
    if next_race is None:
        next_race = Race.objects.order_by("-race_start_at").first()

    weather = None
    if next_race is not None:
        try:
            weather = get_live_weather(next_race)
        except Exception:
            logger.exception(
                "Failed to fetch live weather for race %s", next_race.race_name
            )
            weather = None

    sync = SyncState.objects.filter(key="f1_dashboard").first()

    payload = {
        "drivers": [
            _serialize_driver_standing(row) for row in DriverStanding.objects.all()
        ],
        "constructors": [
            _serialize_constructor_standing(row)
            for row in ConstructorStanding.objects.all()
        ],
        "nextRace": _serialize_race(next_race, weather),
        "sync": {
            "lastSuccessAt": _iso(sync.last_success_at) if sync else None,
            "nextRefreshAt": _iso(sync.next_refresh_at) if sync else None,
            "error": sync.error if sync else "",
        },
    }
    return JsonResponse(payload)


def driver_results(_request, driver_id):
    driver = get_object_or_404(DriverStanding, driver_id=driver_id)

    try:
        season_results = get_driver_results(driver_id)
    except Exception:
        logger.exception("Failed to fetch results for driver %s", driver_id)
        season_results = {"results": []}

    payload = {
        "driver": _serialize_driver_standing(driver),
        "results": [
            {**result, "points": _decimal(result["points"])}
            for result in season_results.get("results", [])
        ],
    }
    return JsonResponse(payload)


def last_race_results(_request):
    refresh_if_due()

    try:
        data = get_last_race_results()
    except Exception:
        logger.exception("Failed to fetch last race results")
        data = {"race": None, "results": []}

    payload = {
        "race": _serialize_race_summary(data["race"]),
        "results": [_serialize_race_result(row) for row in data["results"]],
    }
    return JsonResponse(payload)


def _serialize_race_summary(race):
    if race is None:
        return None

    return {
        "round": race.round,
        "raceName": race.race_name,
        "circuitName": race.circuit_name,
        "locality": race.locality,
        "country": race.country,
        "date": _iso(race.race_start_at),
    }


def _serialize_race_result(row):
    return {
        "position": row.position_display,
        "driverId": row.driver_id,
        "driverName": row.driver_name,
        "driverCode": row.driver_code,
        "constructor": row.constructor,
        "grid": row.grid,
        "laps": row.laps,
        "status": row.status,
        "time": row.time,
        "points": _decimal(row.points),
    }


def _serialize_driver_standing(row):
    return {
        "position": row.position,
        "driverId": row.driver_id,
        "name": f"{row.given_name} {row.family_name}",
        "code": row.code,
        "nationality": row.nationality,
        "constructor": row.constructor,
        "points": _decimal(row.points),
        "wins": row.wins,
    }


def _serialize_constructor_standing(row):
    return {
        "position": row.position,
        "constructorId": row.constructor_id,
        "name": row.name,
        "nationality": row.nationality,
        "points": _decimal(row.points),
        "wins": row.wins,
    }


def _serialize_race(race, weather):
    if race is None:
        return None

    return {
        "round": race.round,
        "raceName": race.race_name,
        "circuitName": race.circuit_name,
        "locality": race.locality,
        "country": race.country,
        "latitude": _decimal(race.latitude),
        "longitude": _decimal(race.longitude),
        "schedule": {
            "practice1": _iso(race.first_practice_at),
            "practice2": _iso(race.second_practice_at),
            "practice3": _iso(race.third_practice_at),
            "qualifying": _iso(race.qualifying_at),
            "sprint": _iso(race.sprint_at),
            "race": _iso(race.race_start_at),
        },
        "weather": weather,
    }
