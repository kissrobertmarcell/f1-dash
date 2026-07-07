from django.contrib import admin
from django.urls import include, path

from .views import frontend_index

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("dashboard.urls")),
    path("", frontend_index, name="frontend-index"),
]
