from .models import Airplane, Airline, Airport, Fleet
from .serializers import AirplaneSerializer, AirlineSerializer, AirportSerializer, FleetSerializer
from rest_framework import viewsets


class AirplaneViewSet(viewsets.ModelViewSet):
    queryset = Airplane.objects.all()
    serializer_class = AirplaneSerializer

    def get_queryset(self):
        queryset = Airplane.objects.all()
        brand = self.request.query_params.get("brand")
        model = self.request.query_params.get("model")
        if brand:
            queryset = queryset.filter(airplane_brand__icontains=brand)
        if model:
            queryset = queryset.filter(airplane_model__icontains=model)
        return queryset


class AirlineViewSet(viewsets.ModelViewSet):
    queryset = Airline.objects.all()
    serializer_class = AirlineSerializer
    
    def get_queryset(self):
        queryset = Airline.objects.all()
        name = self.request.query_params.get("name")
        is_active = self.request.query_params.get("is_active")
        founded_year = self.request.query_params.get("founded_year")

        if name:
            queryset = queryset.filter(airline_name__icontains=name)
        if is_active:
            queryset = queryset.filter(airline_is_active__icontains=is_active)
        if founded_year:
            queryset = queryset.filter(airline_founded_year__icontains=founded_year)
        return queryset

class FleetViewSet(viewsets.ModelViewSet):
    queryset = Fleet.objects.all()
    serializer_class = FleetSerializer


class AirportViewSet(viewsets.ModelViewSet):
    queryset = Airport.objects.all()
    serializer_class = AirportSerializer
 