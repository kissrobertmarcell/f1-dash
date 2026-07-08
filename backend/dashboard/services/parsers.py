"""Pure functions that turn Ergast API payloads into plain Python data."""

import logging
from datetime import datetime
from datetime import timezone as dt_timezone
from decimal import Decimal

logger = logging.getLogger(__name__)


def parse_driver_results(races, driver_id):
    """Flatten an Ergast ``Races`` payload into result rows for one driver.

    Shared by the bulk sync (all drivers) and the on-demand single-driver
    lookup, so the parsing rules only need to be correct in one place.
    """
    return [
        {
            "round": int(race["round"]),
            "raceName": race["raceName"],
            "circuitName": race["Circuit"]["circuitName"],
            "date": race.get("date"),
            "position": int(result["position"]),
            "points": Decimal(result.get("points", 0)),
            "grid": int(result.get("grid", 0)),
            "status": status_value(result.get("status")),
            "constructor": result.get("Constructor", {}).get("name", ""),
        }
        for race in races
        for result in race.get("Results", [])
        if result.get("Driver", {}).get("driverId") == driver_id
    ]


def parse_race_results(results):
    """Flatten an Ergast race's ``Results`` list into the full classification.

    Unlike `parse_driver_results` (one driver, many races), this is one
    race, every driver -- used for the "last race results" view.
    """
    parsed = []
    for order, result in enumerate(results):
        driver = result.get("Driver", {})
        constructor = result.get("Constructor", {})
        time_info = result.get("Time") or {}
        parsed.append(
            {
                "order": order,
                "position": result.get("positionText") or result.get("position", ""),
                "driverId": driver.get("driverId", ""),
                "driverName": f"{driver.get('givenName', '')} {driver.get('familyName', '')}".strip(),
                "driverCode": driver.get("code", ""),
                "constructor": constructor.get("name", ""),
                "grid": int(result.get("grid", 0)),
                "laps": int(result.get("laps", 0)),
                "status": status_value(result.get("status")),
                "time": time_info.get("time") or "",
                "points": Decimal(result.get("points", 0)),
            }
        )
    return parsed


def status_value(status):
    if isinstance(status, dict):
        return status.get("status", "")
    return str(status or "")


def constructor_name(row):
    constructors = row.get("Constructors") or []
    if not constructors:
        logger.warning(
            "Driver standing missing constructor: %s",
            row.get("Driver", {}).get("driverId"),
        )
        return ""
    return constructors[0].get("name", "")


def parse_session(session):
    if not session:
        return None
    return parse_datetime(session["date"], session.get("time"))


def parse_datetime(date, time_value):
    if not time_value:
        time_value = "00:00:00Z"
    value = datetime.fromisoformat(f"{date}T{time_value.replace('Z', '+00:00')}")
    if value.tzinfo is None:
        value = value.replace(tzinfo=dt_timezone.utc)
    return value


def parse_date(value):
    if not value:
        return None
    return datetime.fromisoformat(value).date()
