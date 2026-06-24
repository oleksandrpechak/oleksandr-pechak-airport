from rest_framework.permissions import BasePermission
from users.models import CustomUser


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.role == CustomUser.Roles.ADMIN
    
class IsOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        owner = getattr(obj, 'user', None) or getattr(obj, 'passenger_name', None)
        return owner == request.user
