from django.contrib import admin
from .models import Flight, Ticket, Booking


admin.site.register(Flight)
admin.site.register(Ticket)
admin.site.register(Booking)
