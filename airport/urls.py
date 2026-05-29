from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from django.http import JsonResponse

# api/aviation/ для всіх
# api/aviation

urlpatterns = [
    path('admin/', admin.site.urls),

    path("api/users/", include("users.urls")),
    path("api/locations/", include("locations.urls")),
    path("api/aviation/", include("aviation.urls",)),
    path("api/flights/", include("flights.urls")),


    # Spectacular
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema')),
]
