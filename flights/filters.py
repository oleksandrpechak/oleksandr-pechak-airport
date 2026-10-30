import django_filters
from .models import Flight, Booking, Ticket

class FlightFilter(django_filters.FilterSet):
    class Meta:
        model = Flight

        fields = {
            "flight_number": ["iexact"],
            "departure_airport": ["exact"],
            "arrival_airport": ["exact"],
            "airline_name": ["exact"],
            "flight_status": ["exact"],
        }
    departure_iata = django_filters.CharFilter(
        field_name="departure_airport__iata_code",
        lookup_expr="iexact"
    )
    arrival_iata = django_filters.CharFilter(
        field_name="arrival_airport__iata_code",
        lookup_expr="iexact"
    )
    departure_city = django_filters.NumberFilter(
        field_name="departure_airport__city"
    )
    arrival_city = django_filters.NumberFilter(
        field_name="arrival_airport__city"
    )
    departure_date = django_filters.DateFilter(
        field_name="departure_time",
        lookup_expr="date"
    )
    has_available_seats = django_filters.BooleanFilter(
        method="filter_available_seats"
    )
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
        # available_seats is annotated by FlightViewSet.get_queryset
        if value is True:
            return queryset.filter(available_seats__gt=0)
        if value is False:
            return queryset.filter(available_seats=0)
        return queryset
    
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