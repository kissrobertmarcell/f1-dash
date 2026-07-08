from django.contrib import admin

from .models import ConstructorStanding, DriverStanding, Race, RaceResult, SyncState

admin.site.register(ConstructorStanding)
admin.site.register(DriverStanding)
admin.site.register(Race)
admin.site.register(RaceResult)
admin.site.register(SyncState)
