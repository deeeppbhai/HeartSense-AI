from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.db import models
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    CustomTokenObtainPairSerializer,
    UserAdminUpdateSerializer
)
from .permissions import IsAdminUserCustom
from clinical.models import AuditLog

User = get_user_model()


def log_audit(user, action, details, request=None):
    ip = None
    if request:
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
    try:
        AuditLog.objects.create(
            user=user if user and user.is_authenticated else None,
            action=action,
            details=details,
            ip_address=ip
        )
    except Exception as e:
        print(f"Failed to write audit log: {e}")


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            username = request.data.get('username')
            try:
                user = User.objects.get(username=username)
                log_audit(user, 'USER_LOGIN', f"User {username} successfully logged in as {user.role}.", request)
            except User.DoesNotExist:
                pass
        return response


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        log_audit(user, 'USER_REGISTERED', f"New account registered: {user.username} with role {user.role}.", request)
        user_data = UserSerializer(user).data
        return Response({
            "message": "User registered successfully.",
            "user": user_data
        }, status=status.HTTP_201_CREATED)


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def perform_update(self, serializer):
        user = serializer.save()
        log_audit(user, 'PROFILE_UPDATED', f"User {user.username} updated profile information.", self.request)


class AdminUserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAdminUserCustom]

    def get_queryset(self):
        queryset = User.objects.all().order_by('-date_joined')
        role = self.request.query_params.get('role')
        search = self.request.query_params.get('search')

        if role:
            queryset = queryset.filter(role=role)
        if search:
            queryset = queryset.filter(
                models.Q(username__icontains=search) |
                models.Q(email__icontains=search) |
                models.Q(first_name__icontains=search) |
                models.Q(last_name__icontains=search)
            )
        return queryset


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserAdminUpdateSerializer
    permission_classes = [IsAdminUserCustom]

    def perform_update(self, serializer):
        user = serializer.save()
        log_audit(self.request.user, 'USER_ADMIN_MODIFIED', f"Administrator updated user #{user.id} ({user.username}).", self.request)

    def perform_destroy(self, instance):
        username = instance.username
        instance.delete()
        log_audit(self.request.user, 'USER_DELETED', f"Administrator deleted user {username}.", self.request)
