from django.urls import path

from .views import dashboard, driver_results

urlpatterns = [
    path("dashboard/", dashboard, name="dashboard"),
    path("drivers/<str:driver_id>/results/", driver_results, name="driver-results"),
]
