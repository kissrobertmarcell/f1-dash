"""Thin HTTP client for the Ergast-compatible F1 API."""

import requests

F1_BASE_URL = "https://api.jolpi.ca/ergast/f1/current"


def get_json(path):
    response = requests.get(f"{F1_BASE_URL}/{path}", timeout=20)
    response.raise_for_status()
    return response.json()


def get_current_races():
    response = requests.get(f"{F1_BASE_URL}.json", timeout=20)
    response.raise_for_status()
    return response.json()
