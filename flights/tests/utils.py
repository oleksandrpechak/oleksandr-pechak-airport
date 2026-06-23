from aviation.models import Airport, Airline, FleetItem
from aviation.services.airplane_seat_service import create_airplane_with_seats
from locations.models import Country, City
from flights.services.flight_service import create_flight_with_tickets
from django.utils.timezone import now
from datetime import timedelta

def create_test_flight():
    country = Country.objects.create(country = "Ukraine", code= "UA")
    departure_city = City.objects.create(city = "Lviv", country = country)
    arrival_city = City.objects.create(city = "Kyiv", country = country)

    airline = Airline.objects.create(name = "Test airline", founded_year = 2002)
    airplane = create_airplane_with_seats({
        "brand" : "Boeing", "model" : "737", "rows" : 30,
        "seats_per_row" : 6, "business_rows_percent" : 20
        })
    fleet_item = FleetItem.objects.create(
        tail_number = "N721AF", airplane = airplane, airline = airline
        )
    departure_airport = Airport.objects.create(
        name = "Test dep airport", iata_code = "TDA", city = departure_city
        )
    departure_airport.airline.add(airline)
    arrival_airport = Airport.objects.create(
        name = "Test arr airport", iata_code = "TAA", city = arrival_city
        )
    arrival_airport.airline.add(airline)
    valid_payload = {
        "flight_number": "LWA23",
        "departure_airport": departure_airport,
        "arrival_airport": arrival_airport,
        "departure_time": now() + timedelta(days=1),
        "arrival_time": now() + timedelta(days=1, hours=2),
        "ticket_price": 200,
        "business_percent": 35,
        "airplane": fleet_item,
        "airline_name": airline,
    }
    flight = create_flight_with_tickets(valid_payload)
    return flight