import django_filters

from .models import Airline, Airplane, Airport

class AirplaneFilter(django_filters.FilterSet):
    class Meta:
        model = Airplane
        fields = {
            "brand": ["iexact"],
            "model": ["iexact"],
        }
class AirlineFilter(django_filters.FilterSet):
    class Meta:
        model = Airline
        fields = {
            "name": ["iexact"],
        }
class AirportFilter(django_filters.FilterSet):
    class Meta:
        model = Airport
        fields = {
            "iata_code": ["iexact"],
        }