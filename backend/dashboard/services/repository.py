"""Persistence of parsed F1 data into SQLite."""

import logging
from decimal import Decimal

import requests

from ..models import ConstructorStanding, DriverResult, DriverStanding, Race
from . import ergast_client
from .parsers import (
    constructor_name,
    parse_date,
    parse_datetime,
    parse_driver_results,
    parse_session,
)

logger = logging.getLogger(__name__)


def store_drivers(rows):
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
                constructor=constructor_name(row),
                points=Decimal(row["points"]),
                wins=int(row["wins"]),
            )
            for row in rows
        ]
    )


def store_constructors(rows):
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


def store_races(rows):
    for row in rows:
        Race.objects.update_or_create(
            round=int(row["round"]),
            defaults={
                "race_name": row["raceName"],
                "circuit_name": row["Circuit"]["circuitName"],
                "locality": row["Circuit"]["Location"]["locality"],
                "country": row["Circuit"]["Location"]["country"],
                "latitude": Decimal(row["Circuit"]["Location"]["lat"]),
                "longitude": Decimal(row["Circuit"]["Location"]["long"]),
                "race_start_at": parse_datetime(row["date"], row.get("time")),
                "first_practice_at": parse_session(row.get("FirstPractice")),
                "second_practice_at": parse_session(row.get("SecondPractice")),
                "third_practice_at": parse_session(row.get("ThirdPractice")),
                "qualifying_at": parse_session(row.get("Qualifying")),
                "sprint_at": parse_session(row.get("Sprint")),
            },
        )


def store_driver_results_for_driver(driver, results):
    DriverResult.objects.filter(driver=driver).delete()
    DriverResult.objects.bulk_create(
        [
            DriverResult(
                driver=driver,
                round=result["round"],
                race_name=result["raceName"],
                circuit_name=result["circuitName"],
                date=parse_date(result.get("date")),
                position=result["position"],
                points=result["points"],
                grid=result["grid"],
                status=result["status"],
                constructor=result["constructor"],
            )
            for result in results
        ]
    )


def store_all_driver_results():
    for driver in DriverStanding.objects.all():
        try:
            payload = ergast_client.get_json(f"drivers/{driver.driver_id}/results.json")
        except requests.RequestException:
            logger.warning("Skipping driver results for %s", driver.driver_id)
            continue

        races = payload["MRData"]["RaceTable"].get("Races", [])
        results = parse_driver_results(races, driver.driver_id)
        store_driver_results_for_driver(driver, results)
