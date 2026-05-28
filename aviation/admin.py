from django.contrib import admin
from .models import Airplane, Airline, Airport

admin.site.register(Airplane)
admin.site.register(Airline)
admin.site.register(Airport)