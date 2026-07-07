import json
from decimal import Decimal
from unittest.mock import patch

from django.test import TestCase
from django.test.client import RequestFactory

from .models import DriverResult, DriverStanding
from .services.parsers import parse_driver_results, status_value
from .views import driver_results


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
