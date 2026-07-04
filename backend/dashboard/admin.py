from django.contrib import admin

from .models import ConstructorStanding, DriverStanding, Race, SyncState

admin.site.register(ConstructorStanding)
admin.site.register(DriverStanding)
admin.site.register(Race)
admin.site.register(SyncState)
