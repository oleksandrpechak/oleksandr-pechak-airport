from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


urlpatterns = [
    path('admin/', admin.site.urls),

    path("api/users/", include("users.urls")),
    path("api/locations/", include("locations.urls")),
    path("api/aviation/", include("aviation.urls",)),
    path("api/flights/", include("flights.urls")),
    path("api/payments/", include("payments.urls")),
    path("api/chat/", include("chat.urls")),

    path('api/token/', TokenObtainPairView.as_view()),
    path('api/token/refresh/', TokenRefreshView.as_view()),

    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema')),
]
