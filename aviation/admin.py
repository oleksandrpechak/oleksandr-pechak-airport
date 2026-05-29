from django.contrib import admin
from .models import Airplane, Airline, Airport, AirplaneSeat, FleetItem

admin.site.register(Airplane)
admin.site.register(Airline)
admin.site.register(Airport)
admin.site.register(AirplaneSeat)
admin.site.register(FleetItem)