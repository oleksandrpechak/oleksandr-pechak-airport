import logging
from datetime import datetime
from google.genai import types
from ..flights.models import Flight


logger = logging.getLogger(__name__)

def execute_tool(name: str, args: dict):
    func_to_call = tools_map.get(name)
    if not func_to_call:
        raise ValueError(f"Unknown tool: {name}")
    return func_to_call(**args)
 


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
        arrival_country=None, date=None
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
    return list(queryset.values(
        "flight_number",
        "departure_time",
        "arrival_time",
        "ticket_price",
        "flight_status",
        "departure_airport__name",
        "departure_airport__city__city",
        "arrival_airport__name",
        "arrival_airport__city__city",
    ))


tools_map = {
    "get_flights": get_flights,
}

ALL_TOOLS = [
    types.Tool(function_declarations=[get_flights_declaration])
]