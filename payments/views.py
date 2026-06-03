from rest_framework import viewsets
from .models import Payment
from flights.models import Booking
from rest_framework.response import Response
from rest_framework import status
from .serializers import PaymentSerializer
from .services.stripe_service import create_checkout_session
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'], url_path='pay/(?P<booking_id>[^/.]+)')
    def pay(self, request, booking_id=None):
        booking = Booking.objects.get(id = booking_id)
        session = create_checkout_session(booking)
        Payment.objects.create(
            booking = booking,
            amount = booking.total_price,
            stripe_session_id = session.id )

        return Response({'chekout_url': session.url}, status=status.HTTP_200_OK)
