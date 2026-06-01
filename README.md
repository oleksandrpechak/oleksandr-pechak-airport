# oleksandr-pechak-airport
Building Django REST Framework for an Airport

## Apps and models

### users
- `CustomUser` — extends `AbstractUser`
  - 'email'
  - 'firs_name'
  - 'last_name'
  - `role` (choices: `ADMIN`, `USER`)

### locations
- `Country`
  - `country`
  - `code`
- `City`
  - `city`
  - `country` (ForeignKey to `Country`)

### aviation
- `Airplane`
  - `brand`
  - `model`
  - 'rows'
  - 'seats_per_row'
- 'AirplaneSeat'
  - 'airplane' (fk)
  - row
  - seat
  - class_type
- `Airline`
  - `name`
  - `is_active`
  - `founded_year`
- `Airport`
  - `name`
  - `iata_code`
  - `city` (ForeignKey to `locations.City`)
  - `airline` (ManyToManyField to `aviation.Airline`)

### flights
- `Flight`
  - 'flight_number'
  - `departure_airport` (ForeignKey to `aviation.Airport`)
  - `arrival_airport` (ForeignKey to `aviation.Airport`)
  - `departure_time`
  - `arrival_time`
  - 'ticket_price'
  - `airline_name` (ForeignKey to `aviation.Airline`)
  - 'airplane' (ForeignKey TO aviation.Airplane)
  - `flight_status` (choices: `SCHEDULED`, `BOARDING`, `DEPARTED`, `DELAYED`, `CANCELLED`)
  - 'created_at'

- 'Booking'
  - 'user'
  - 'created_at'
  - 'status'
  - 'total_price'

- `Ticket`
  - 'flight_number' (fk to flight)
  - `booking` (ForeignKey to `Booking`)
  - `passenger_name` (ForeignKey to `users.CustomUser`)
  - `flight_seat`( fk to airplaneseat)
  - 'price'
  - `ticket_status` (choices: `BOOKED`, `USED`, `PAID`, `CANCELLED`)
  unique_together = flight_number + seat

## Superuser credentials
Info for log in as a superuser:
- username: `adminuser`
- email: `admin@admin.ad`
- password: `testpass123`


tail_number_standard_by_ICAO: One or two character prefix indicating the country of registration (e.g. "N" for the United States, "VH" for Australia)
A dash "-" is normally (not always) used between the prefix and suffix
One to five character suffix indicating a particular aircraft within the country
A sample registration code might be G-XLEE