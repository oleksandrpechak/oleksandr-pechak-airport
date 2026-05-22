from rest_framework import serializers
from .models import Airline, Airplane, Airport, Fleet


class AirplaneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Airplane
        fields = ["id", "brand", "model"]

class AirlineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Airline
        fields = ["id", "name", "is_active"]

class FleetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fleet
        fields = ["id", "airline", "airplane", "fleet_size"]

class AirportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Airport
        fields = ["id", "airport_name", "iata_code", "city", "airline"]