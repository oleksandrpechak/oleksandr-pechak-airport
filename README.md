# oleksandr-pechak-airport

A Django REST backend for airport, flight, booking, payment, and AI chat operations.

This project provides a full-featured airport service API with user authentication, flight booking, payment processing, and real-time chat support for airline and travel applications.

## Technology Stack

- Django
- Django REST Framework
- PostgreSQL
- Docker / docker-compose
- JWT authentication
- Stripe payments
- SMTP email integration
- WebSockets for real-time chat
- Gemini AI chat integration
- Celery + Redis (background tasks)

## Main Features

- CRUD operations for users, locations, aircraft, airlines, airports, flights, bookings, and tickets
- JWT-based authentication and permission handling
- API pagination, validation, filtering, and logging
- Role-based permissions and protected endpoints
- Stripe payment flows, including service layer, views, and webhook handling
- ngrok-ready webhook / payment testing support
- Email notifications via SMTP
- AI-powered chat using Gemini with WebSocket streaming responses
- Real-time chat through WebSocket connections
- API filtering and search for flights, tickets, and bookings

## Notes

- Payment integration includes Stripe services, views, webhooks, and development-friendly ngrok support.
- The project supports streamed AI chat responses and interactive tools for chat messaging.

## Superuser credentials

Use the following account to access the admin interface during development:

- username: `adminuser`
- email: `admin@admin.ad`
- password: `testpass123`

## Tests

- **Total unit tests:** 39

- **Tests by app:**
	- **chat**: 10 tests — models referenced: `Conversation`, `Message` (from `chat.models`)
	- **aviation**: 5 tests — models referenced: `AirplaneSeat` (from `aviation.models`)
	- **flights**: 17 tests — models referenced: `Ticket`, `Booking` (from `flights.models`). Test utilities also import `Airport`, `Airline`, `FleetItem` (from `aviation.models`) and `Country`, `City` (from `locations.models`) in tests utilities.
	- **payments**: 7 tests — models referenced: `Payment` (from `payments.models`) and `Ticket`, `Booking` (from `flights.models`)
