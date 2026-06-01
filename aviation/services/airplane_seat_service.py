from ..models import Airplane, AirplaneSeat
from decimal import Decimal
from django.db import transaction




def get_class_type(row:int, airplane: Airplane) -> str:
    business_rows = round(airplane.business_rows_percent/100 * airplane.rows)
    if row <= business_rows:
        return 'BUSINESS'
    return 'ECONOMY'

def create_airplane_with_seats(validated_data: dict):
    with transaction.atomic():
        airplane = Airplane.objects.create(**validated_data)

        AirplaneSeat.objects.bulk_create([
            AirplaneSeat(airplane=airplane, row=row, seat=chr(64+seat), class_type=get_class_type(row, airplane))
            for row in range(1, airplane.rows + 1)
            for seat in range(1, airplane.seats_per_row +1)
        ])
        return airplane