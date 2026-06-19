import logging
from datetime import datetime
from google.genai import types
from flights.models import Flight, Ticket
from flights.services.flight_service import create_booking


logger = logging.getLogger(__name__)

def execute_tool(name: str, args: dict, user=None):
    func_to_call = tools_map.get(name)
    if not func_to_call:
        raise ValueError(f"Unknown tool: {name}")
    result = func_to_call(**args, user=user)

    def serialize(obj):
        from decimal import Decimal
        from django.db.models.query import QuerySet
        if obj is None or isinstance(obj, (str, int, float, bool)):
            return obj
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, QuerySet):
            return [serialize(item) for item in list(obj)]
        if isinstance(obj, (list, tuple)):
            return [serialize(item) for item in obj]
        if hasattr(obj, "_meta"):
            data = {"model": obj.__class__.__name__}
            try:
                data["id"] = getattr(obj, "id", None)
            except Exception:
                data["id"] = None
            try:
                data["repr"] = str(obj)
            except Exception:
                data["repr"] = None
            return data
        # fallback
        try:
            return str(obj)
        except Exception:
            return None

    return serialize(result)

get_flights_declaration = types.FunctionDeclaration(
    name="get_flights",
    description="Search for available flights by origin, destination or date",
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={
            "departure_city": types.Schema(type=types.Type.STRING, description="City of departure e.g. Lviv"),
            "departure_country": types.Schema(type=types.Type.STRING, description="Country of departure e.g. Ukraine"),
            "arrival_city": types.Schema(type=types.Type.STRING, description="City of arrival e.g. London"),
            "arrival_country": types.Schema(type=types.Type.STRING, description="Country of arrival e.g. Spain"),
            "date": types.Schema(type=types.Type.STRING, description="Date of flight in YYYY-MM-DD format e.g. 2026-06-15"),
        },
    )
) 
def get_flights(
        departure_city=None, departure_country=None, arrival_city=None,
        arrival_country=None, date=None, user=None
        ):
    queryset = Flight.objects.all()
    if departure_city:
        queryset = queryset.filter(departure_airport__city__city=departure_city)
    if departure_country:
        queryset = queryset.filter(departure_airport__city__country__country = departure_country)
    if arrival_city:
        queryset = queryset.filter(arrival_airport__city__city=arrival_city)
    if arrival_country:
        queryset = queryset.filter(arrival_airport__city__country__country = arrival_country)
    if date:
        try:
            parsed_date = datetime.strptime(date, "%Y-%m-%d").date()
            queryset = queryset.filter(departure_time__date=parsed_date)
        except ValueError:
            logger.warning("Date is wrong format.")
    queryset = queryset.filter(flight_status = Flight.FlightStatus.SCHEDULED)
    return [
        {
        **flight,
        "ticket_price": float(flight["ticket_price"]),
        "departure_time": str(flight["departure_time"]),
        "arrival_time": str(flight["arrival_time"]),
        }
        for flight in queryset.values(
                "flight_number",
                "departure_time",
                "arrival_time",
                "ticket_price",
                "flight_status",
                "departure_airport__name",
                "departure_airport__city__city",
                "arrival_airport__name",
                "arrival_airport__city__city",
            )
    ]

book_ticket_declaration = types.FunctionDeclaration(
    name="book_ticket",
    description="Book available tickets for a flight",
    parameters=types.Schema(
        type=types.Type.OBJECT,
        properties={
            "flight_id": types.Schema(type=types.Type.STRING, description="Flight number, e.g. 'UA101'"),
            "num_tickets": types.Schema(type=types.Type.INTEGER, description="Number of tickets to b"),
        },
        required=["flight_id", "num_tickets"]
    )
) 

def book_ticket(flight_id, num_tickets, user=None):
    logger.info(f"book_ticket called with flight_id={flight_id}, num_tickets={num_tickets}, user={user}")
    available = Ticket.objects.filter(
        flight_number__flight_number = flight_id,
        ticket_status = Ticket.TicketStatus.AVAILABLE
        ).select_related('flight_seat')
    if available.count() < num_tickets:
        return "Not enough available tickets for this flight."
    tickets = list(available[:num_tickets])
    try:
        booking = create_booking(
            user=user, ticket_ids=[t.id for t in tickets]
            )
        booking_id = int(booking.id) if booking else None
        total_price = float(booking.total_price) if booking and booking.total_price else 0
        logger.info(f"Booking created: id={booking_id} (type: {type(booking_id)}), total_price={total_price} (type: {type(total_price)})")
        
        if booking_id is None:
            return "Booking was not created properly."

        ticket_details = "; ".join(
            f"Ticket {t.id} (seat {t.flight_seat})" for t in tickets
        )
        return (
            f"Successfully booked {num_tickets} tickets for flight {flight_id}: "
            f"{ticket_details}. Booking ID: {booking_id}. Total price: {total_price}."
        )
    except Exception as e:
        logger.exception(f"Error creating booking: {e}")
        raise

tools_map = {
    "get_flights": get_flights,
    "book_ticket": book_ticket
}

ALL_TOOLS = [
    types.Tool(function_declarations=[get_flights_declaration]),
    types.Tool(function_declarations=[book_ticket_declaration])
]