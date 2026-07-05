import json
from unittest.mock import patch

from django.test import TestCase
from django.test.client import RequestFactory

from .models import DriverStanding, DriverResult
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
