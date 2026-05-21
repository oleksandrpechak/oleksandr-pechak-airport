# oleksandr-pechak-airport
Building Django REST Framework for an Airport

## Apps and models

### users
- `CustomUser` — extends `AbstractUser`
  - `role` (choices: `ADMIN`, `USER`)

### locations
- `Countries`
  - `country`
  - `code`
- `Cities`
  - `city`
  - `country` (ForeignKey to `Countries`)

### aviation
- `Airplanes`
  - `airplane_brand`
  - `airplane_model`
- `Airlines`
  - `airline_name`
  - `is_active`
  - `airplane_capacity`
  - `founded_year`
- `Fleets`
  - `airline_name` (ForeignKey to `Airlines`)
  - `airplane_name` (ForeignKey to `Airplanes`)
  - `fleet_size`
- `Airports`
  - `airport_name`
  - `iata_code`
  - `city` (ForeignKey to `locations.Cities`)
  - `country` (ForeignKey to `locations.Countries`)
- `AirportsAirlines`
  - `airport_name` (ForeignKey to `Airports`)
  - `airline_name` (ForeignKey to `Airlines`)

### flights
- `Flight`
  - `departure_airport` (ForeignKey to `aviation.Airports`)
  - `arrival_airport` (ForeignKey to `aviation.Airports`)
  - `departure_time`
  - `arrival_time`
  - `airline_name` (ForeignKey to `aviation.Airlines`)
  - `flight_status` (choices: `SCHEDULED`, `BOARDING`, `DEPARTED`, `DELAYED`, `CANCELLED`)
- `Tickets`
  - `flight_id` (ForeignKey to `Flight`)
  - `client_id` (ForeignKey to `users.CustomUser`)
  - `ticket_price`
  - `ticket_status` (choices: `BOOKED`, `USED`, `PAID`, `CANCELLED`)

## Superuser credentials
Info for log in as a superuser:
- username: `adminuser`
- email: `admin@admin.ad`
- password: `testpass123`