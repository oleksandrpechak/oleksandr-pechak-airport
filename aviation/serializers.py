from rest_framework import serializers
from .models import Airline, Airplane, Airport, AirplaneSeat, FleetItem
from .services.airplane_seat_service import create_airplane_with_seats

class AirplaneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Airplane
        fields = '__all__'
        read_only_fields = ["id"]
    def create(self, validated_data):
        return create_airplane_with_seats(validated_data)

class AirplaneSeatSerializer(serializers.ModelSerializer):
    class Meta:
        model = AirplaneSeat
        fields = ["id", "airplane", "row", "seat", "class_type" ]

class AirlineSerializer(serializers.ModelSerializer):
    founded_year = serializers.DateField()
    class Meta:
        model = Airline
        fields = ["id", "name", "is_active", "founded_year"]

class AirportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Airport
        fields = ["id", "name", "iata_code", "city", "airline"]

class FleetItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = FleetItem
        fields = '__all__'