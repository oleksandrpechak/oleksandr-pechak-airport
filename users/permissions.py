from rest_framework.permissions import BasePermission
from users.models import CustomUser


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.role == CustomUser.Roles.ADMIN
    
class IsOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user
