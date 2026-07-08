import json
from decimal import Decimal
from unittest.mock import patch

from django.test import TestCase
from django.test.client import RequestFactory

from .models import DriverResult, DriverStanding, Race, RaceResult
from .services.parsers import parse_driver_results, parse_race_results, status_value
from .views import driver_results, last_race_results


class DriverResultsViewTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.driver = DriverStanding.objects.create(
            position=1,
            driver_id="max_verstappen",
            given_name="Max",
            family_name="Verstappen",
            code="VER",
            nationality="Dutch",
            constructor="Red Bull",
            points="320.0",
            wins=10,
        )

    @patch("dashboard.views.get_driver_results")
    def test_driver_results_view_returns_profile_payload(self, mock_get_driver_results):
        mock_get_driver_results.return_value = {
            "results": [
                {
                    "round": 1,
                    "raceName": "Bahrain Grand Prix",
                    "circuitName": "Bahrain International Circuit",
                    "date": "2024-03-02",
                    "position": 1,
                    "points": 25,
                    "grid": 1,
                    "status": "Finished",
                    "constructor": "Red Bull",
                }
            ]
        }

        request = self.factory.get("/api/drivers/max_verstappen/results/")
        response = driver_results(request, self.driver.driver_id)

        self.assertEqual(response.status_code, 200)
        payload = json.loads(response.content)
        self.assertEqual(payload["driver"]["name"], "Max Verstappen")
        self.assertEqual(payload["results"][0]["raceName"], "Bahrain Grand Prix")

    def test_driver_results_view_reads_from_database_when_available(self):
        DriverResult.objects.create(
            driver=self.driver,
            round=2,
            race_name="Saudi Arabian Grand Prix",
            circuit_name="Jeddah Corniche Circuit",
            date="2024-03-09",
            position=2,
            points=18,
            grid=2,
            status="Finished",
            constructor="Red Bull",
        )

        request = self.factory.get("/api/drivers/max_verstappen/results/")
        response = driver_results(request, self.driver.driver_id)

        self.assertEqual(response.status_code, 200)
        payload = json.loads(response.content)
        self.assertEqual(payload["results"][0]["raceName"], "Saudi Arabian Grand Prix")


class DriverResultParsingTests(TestCase):
    """Regression coverage for the parsing helper shared by the bulk sync
    and the on-demand single-driver lookup (previously duplicated and,
    in the single-driver path, buggy for missing/plain-string statuses).
    """

    def test_status_value_handles_dict_plain_string_and_missing(self):
        self.assertEqual(status_value({"status": "Finished"}), "Finished")
        self.assertEqual(status_value("Retired"), "Retired")
        self.assertEqual(status_value(None), "")

    def test_parse_driver_results_only_returns_rows_for_requested_driver(self):
        races = [
            {
                "round": "1",
                "raceName": "Bahrain Grand Prix",
                "Circuit": {"circuitName": "Bahrain International Circuit"},
                "date": "2024-03-02",
                "Results": [
                    {
                        "Driver": {"driverId": "max_verstappen"},
                        "position": "1",
                        "points": "25",
                        "grid": "1",
                        "status": {"status": "Finished"},
                        "Constructor": {"name": "Red Bull"},
                    },
                    {
                        "Driver": {"driverId": "someone_else"},
                        "position": "2",
                        "points": "18",
                        "grid": "2",
                        "status": {"status": "Finished"},
                        "Constructor": {"name": "Mercedes"},
                    },
                ],
            }
        ]

        results = parse_driver_results(races, "max_verstappen")

        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["status"], "Finished")
        self.assertEqual(results[0]["points"], Decimal("25"))

    def test_parse_driver_results_supports_half_points_and_missing_status(self):
        races = [
            {
                "round": "12",
                "raceName": "Belgian Grand Prix",
                "Circuit": {"circuitName": "Circuit de Spa-Francorchamps"},
                "date": "2021-08-29",
                "Results": [
                    {
                        "Driver": {"driverId": "max_verstappen"},
                        "position": "1",
                        "points": "6.5",
                        "grid": "1",
                        "Constructor": {"name": "Red Bull"},
                    },
                ],
            }
        ]

        results = parse_driver_results(races, "max_verstappen")

        self.assertEqual(results[0]["points"], Decimal("6.5"))
        self.assertEqual(results[0]["status"], "")


class RaceResultParsingTests(TestCase):
    def test_parse_race_results_handles_finishers_and_dnf_without_time(self):
        results = [
            {
                "positionText": "1",
                "position": "1",
                "points": "25",
                "grid": "2",
                "laps": "52",
                "status": "Finished",
                "Time": {"millis": "5231335", "time": "1:27:11.335"},
                "Driver": {
                    "driverId": "leclerc",
                    "givenName": "Charles",
                    "familyName": "Leclerc",
                    "code": "LEC",
                },
                "Constructor": {"name": "Ferrari"},
            },
            {
                "positionText": "R",
                "position": "21",
                "points": "0",
                "grid": "16",
                "laps": "43",
                "status": "Retired",
                "Driver": {
                    "driverId": "albon",
                    "givenName": "Alexander",
                    "familyName": "Albon",
                    "code": "ALB",
                },
                "Constructor": {"name": "Williams"},
            },
        ]

        parsed = parse_race_results(results)

        self.assertEqual(len(parsed), 2)
        self.assertEqual(parsed[0]["order"], 0)
        self.assertEqual(parsed[0]["position"], "1")
        self.assertEqual(parsed[0]["time"], "1:27:11.335")
        self.assertEqual(parsed[0]["points"], Decimal("25"))
        self.assertEqual(parsed[1]["position"], "R")
        self.assertEqual(parsed[1]["time"], "")
        self.assertEqual(parsed[1]["status"], "Retired")


class LastRaceResultsViewTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.race = Race.objects.create(
            round=9,
            race_name="British Grand Prix",
            circuit_name="Silverstone Circuit",
            locality="Silverstone",
            country="UK",
            latitude="52.0786",
            longitude="-1.01694",
            race_start_at="2026-07-05T14:00:00Z",
        )
        RaceResult.objects.create(
            race=self.race,
            order=0,
            position_display="1",
            driver_id="leclerc",
            driver_name="Charles Leclerc",
            driver_code="LEC",
            constructor="Ferrari",
            grid=2,
            laps=52,
            status="Finished",
            time="1:27:11.335",
            points="25",
        )

    def test_last_race_results_view_returns_stored_classification(self):
        request = self.factory.get("/api/results/last/")
        response = last_race_results(request)

        self.assertEqual(response.status_code, 200)
        payload = json.loads(response.content)
        self.assertEqual(payload["race"]["raceName"], "British Grand Prix")
        self.assertEqual(payload["results"][0]["driverName"], "Charles Leclerc")
        self.assertEqual(payload["results"][0]["time"], "1:27:11.335")
