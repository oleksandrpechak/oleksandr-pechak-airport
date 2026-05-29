from ..models import Airplane, AirplaneSeat
from decimal import Decimal
from django.db import transaction


BUSINESS_ROWS = 3

def get_class_type(row:int) -> str:
    if row <= BUSINESS_ROWS:
        return 'BUSINESS'
    return 'ECONOMY'

def create_airplane_with_seats(validated_data: dict):
    with transaction.atomic():
        airplane = Airplane.objects.create(**validated_data)

        AirplaneSeat.objects.bulk_create([
            AirplaneSeat(airplane=airplane, row=row, seat=chr(64+seat), class_type=get_class_type(row))
            for row in range(1, airplane.rows + 1)
            for seat in range(1, airplane.seats_per_row +1)
        ])
        return airplane