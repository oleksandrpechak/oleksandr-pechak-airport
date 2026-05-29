from rest_framework import serializers
from .models import Airline, Airplane, Airport


class AirplaneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Airplane
        fields = ["id", "brand", "model", "rows", "seats_per_row"]

class AirlineSerializer(serializers.ModelSerializer):
    founded_year = serializers.DateField()
    class Meta:
        model = Airline
        fields = ["id", "name", "is_active", "founded_year"]

class AirportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Airport
        fields = ["id", "name", "iata_code", "city", "airline"]