from rest_framework import serializers
from .models import Airline, Airplane, Airport, Fleet


class AirplaneSerializer(serializers.ModelSerializer):
    seats = serializers.IntegerField(min_value = 1)
    class Meta:
        model = Airplane
        fields = ["id", "brand", "model", "seats"]

class AirlineSerializer(serializers.ModelSerializer):
    founded_year = serializers.DateField()

    class Meta:
        model = Airline
        fields = ["id", "name", "is_active", "founded_year"]

class FleetSerializer(serializers.ModelSerializer):
    fleet_size = serializers.IntegerField(min_value = 1)
    class Meta:
        model = Fleet
        fields = ["id", "airline", "airplane", "fleet_size"]

class AirportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Airport
        fields = ["id", "airport_name", "iata_code", "city", "airline"]