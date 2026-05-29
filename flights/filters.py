import django_filters
from django.db.models import Count, Q
from .models import Flight, AirplaneSeat, Booking, Ticket

class FlightFilter(django_filters.FilterSet):
    class Meta:
        model = Flight

        fields = {
            "flight_number": ["iexact"],
        }
    min_price = django_filters.NumberFilter(
        field_name="ticket_price",
        lookup_expr="gte"
    )
    max_price = django_filters.NumberFilter(
        field_name="ticket_price",
        lookup_expr="lte"
    )
    departure_after = django_filters.DateTimeFilter(
        field_name="departure_time",
        lookup_expr="gte"
    )
    departure_before = django_filters.DateTimeFilter(
        field_name="departure_time",
        lookup_expr="lte"
    )

    def filter_available_seats(self, queryset, name, value):
        queryset = queryset.annotate(
            available_seats=Count(
                "seats", filter=Q(seats__status="available")
            )
        )
        if value is True:
            return queryset.filter(available_seats__gt=0)

        return queryset
    
class AirplaneSeatFilter(django_filters.FilterSet):
    class Meta:
        model = AirplaneSeat
        fields = {
            "status": ["iexact"],
            "class_type": ["iexact"]
        }

class BookingFilter(django_filters.FilterSet):
    class Meta:
        model = Booking
        fields = {
            "status": ["iexact"]
        }

class TicketFilter(django_filters.FilterSet):
    class Meta:
        model = Ticket
        fields = {
            "ticket_status": ["iexact"]
        }