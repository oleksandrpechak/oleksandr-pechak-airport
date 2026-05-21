from django.contrib import admin
from .models import (Airplane, Airline, Fleet, Airport)

admin.site.register(Airplane)
admin.site.register(Airline)
admin.site.register(Fleet)
admin.site.register(Airport)