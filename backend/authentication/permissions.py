from rest_framework import permissions
from .models import UserRole


class IsPatient(permissions.BasePermission):
    """Allows access only to authenticated patients."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == UserRole.PATIENT)


class IsDoctor(permissions.BasePermission):
    """Allows access only to approved doctors or administrators."""
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and 
            (request.user.role == UserRole.DOCTOR or request.user.role == UserRole.ADMIN or request.user.is_superuser) and
            request.user.is_approved
        )


class IsAdminUserCustom(permissions.BasePermission):
    """Allows access only to administrators."""
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and 
            (request.user.role == UserRole.ADMIN or request.user.is_superuser or request.user.is_staff)
        )


class IsDoctorOrAdmin(permissions.BasePermission):
    """Allows access to doctors or administrators."""
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and 
            (request.user.role in [UserRole.DOCTOR, UserRole.ADMIN] or request.user.is_superuser)
        )


class IsOwnerOrDoctorOrAdmin(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object to view/edit it,
    or doctors and admins.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
            
        # Admin or Doctor can view clinical records
        if request.user.role in [UserRole.DOCTOR, UserRole.ADMIN] or request.user.is_superuser:
            return True

        # Patients can only view/edit their own records
        patient_user = getattr(obj, 'patient', None)
        if patient_user:
            return patient_user == request.user
            
        user = getattr(obj, 'user', None)
        if user:
            return user == request.user
            
        return obj == request.user
