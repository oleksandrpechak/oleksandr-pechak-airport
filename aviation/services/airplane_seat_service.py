from ..models import Airplane, AirplaneSeat
from django.db import transaction
import logging

logger = logging.getLogger(__name__)



def get_class_type(row:int, airplane: Airplane) -> str:
    business_rows = round(airplane.business_rows_percent/100 * airplane.rows)
    if row <= business_rows:
        return 'BUSINESS'
    return 'ECONOMY'

def create_airplane_with_seats(validated_data: dict):
    try:
        with transaction.atomic():
            airplane = Airplane.objects.create(**validated_data)
            logger.info(f"Started to create airplane: {airplane.id}")
            AirplaneSeat.objects.bulk_create([
                AirplaneSeat(airplane=airplane, row=row, seat=chr(64+seat), class_type=get_class_type(row, airplane))
                for row in range(1, airplane.rows + 1)
                for seat in range(1, airplane.seats_per_row +1)
            ])
            logger.info(f"Successfully created airplane {airplane.brand} {airplane.model} with {airplane.rows*airplane.seats_per_row} seats")
            return airplane
    except Exception:
        logger.exception(f"Failed to create airplane {airplane.id}")
        raise