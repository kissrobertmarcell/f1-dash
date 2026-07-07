"""Thin HTTP client for the Open-Meteo weather API."""

import requests

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


def fetch_current_weather(latitude, longitude):
    response = requests.get(
        OPEN_METEO_URL,
        params={
            "latitude": str(latitude),
            "longitude": str(longitude),
            "current": "temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
            "forecast_days": 1,
        },
        timeout=20,
    )
    response.raise_for_status()
    return response.json().get("current", {})


def describe_weather_code(code):
    return WEATHER_CODES.get(code, "Current conditions")
