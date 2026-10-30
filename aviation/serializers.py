from rest_framework import serializers
from .models import Airline, Airplane, Airport, AirplaneSeat, FleetItem
from .services.airplane_seat_service import create_airplane_with_seats
from django.utils import timezone

class AirplaneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Airplane
        fields = '__all__'
        read_only_fields = ["id"]
        
    def validate_business_rows_percent(self, value):
        if value < 1 or value > 50:
            raise serializers.ValidationError(
                "Business rows percent must be between 1 and 50."
            )
        return value

    def create(self, validated_data):
        return create_airplane_with_seats(validated_data)

class AirplaneSeatSerializer(serializers.ModelSerializer):
    class Meta:
        model = AirplaneSeat
        fields = ["id", "airplane", "row", "seat", "class_type" ]

class AirlineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Airline
        fields = ["id", "name", "is_active", "founded_year"]

    def validate_founded_year(self, value):
        if value is not None and not 1900 <= value <= timezone.now().year:
            raise serializers.ValidationError(
                f"Founded year must be between 1900 and {timezone.now().year}."
            )
        return value

class AirportSerializer(serializers.ModelSerializer):
    city_name = serializers.CharField(source="city.city", read_only=True)
    country_code = serializers.CharField(source="city.country.code", read_only=True)
    class Meta:
        model = Airport
        fields = ["id", "name", "iata_code", "city", "city_name", "country_code", "airline"]

class FleetItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = FleetItem
        fields = '__all__'