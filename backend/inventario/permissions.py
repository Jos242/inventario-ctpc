from rest_framework import permissions
from rest_framework.request import Request

class IsAdminUser(permissions.BasePermission):
    """
    Only Admin User Access
    """
    def has_permission(self, request:Request, view):
        user = request.user
        return (user and user.is_superuser)

class IsFuncionarioUser(permissions.BasePermission):
    """
    Only Observador User Access
    """
    def has_permission(self, request:Request, view):
        user = request.user
        return (user and user.is_staff)


class IsAdminOrFuncionarioUser(permissions.BasePermission):
    """
    Admin or Funcionario User Access
    """
    def has_permission(self, request, view):
        user = request.user 
        return user.is_staff or user.is_superuser

