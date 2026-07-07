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
