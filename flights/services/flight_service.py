# services/flight_service.py

from ..models import AirplaneSeat

SEAT_LETTERS = ["A", "B", "C", "D"]


def generate_flight_seats(flight):
    aircraft = flight.aircraft

    seats = []

    for row in range(1, aircraft.rows + 1):
        for seat_letter in SEAT_LETTERS[:aircraft.seats_per_row]:

            seats.append(
                AirplaneSeat(
                    flight=flight,
                    row=row,
                    seat=seat_letter,
                    class_type="economy",
                    status="available",
                    price=flight.base_price
                )
            )

    AirplaneSeat.objects.bulk_create(seats)