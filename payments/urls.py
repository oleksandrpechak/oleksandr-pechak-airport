from django.urls import path
from .views import PaymentView, PaymentCreateView, WebhookView, PaymentSuccessView


urlpatterns = [
    path('<int:pk>/', PaymentView.as_view(), name='payment-detail'),
    path('pay/<int:booking_id>/', PaymentCreateView.as_view(), name='payment-create'),
    path('webhook/', WebhookView.as_view(), name='payment-webhook'),
    path('success/', PaymentSuccessView.as_view(), name='payment-success'),
]
