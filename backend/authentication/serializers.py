from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from .models import User, UserRole, Admin


class UserSerializer(serializers.ModelSerializer):
    """Table 1: User Table serializer matching Data Dictionary."""
    user_id = serializers.IntegerField(source='id', read_only=True)
    phone_number = serializers.CharField(source='phone', required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = User
        fields = [
            'id', 'user_id', 'username', 'email', 'full_name', 'first_name', 'last_name',
            'role', 'phone', 'phone_number', 'status', 'is_active', 'created_at',
            'medical_license', 'specialization', 'hospital_affiliation', 'is_approved'
        ]
        read_only_fields = ['id', 'user_id', 'created_at']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if not ret.get('full_name'):
            name = f"{instance.first_name} {instance.last_name}".strip()
            ret['full_name'] = name if name else instance.username
        return ret


class RegisterSerializer(serializers.ModelSerializer):
    """Registration serializer supporting Data Dictionary Table 1."""
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)
    role = serializers.CharField(default=UserRole.PATIENT)
    full_name = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    phone_number = serializers.CharField(write_only=True, required=False, allow_blank=True)

    def validate_role(self, value):
        val = str(value).strip().capitalize()
        if val not in [UserRole.PATIENT, UserRole.DOCTOR]:
            raise serializers.ValidationError("Role must be Patient or Doctor.")
        return val

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm', 'role',
            'full_name', 'phone', 'phone_number',
            # Doctor specific
            'medical_license', 'specialization', 'hospital_affiliation'
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Passwords do not match."})

        # Doctor validations
        if attrs.get('role') == UserRole.DOCTOR:
            if not attrs.get('medical_license'):
                raise serializers.ValidationError({"medical_license": "Medical license number is required for doctor accounts."})

        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm', None)
        phone_num = validated_data.pop('phone_number', None)
        if phone_num and not validated_data.get('phone'):
            validated_data['phone'] = phone_num

        password = validated_data.pop('password')
        role = validated_data.get('role')

        user = User.objects.create_user(
            password=password,
            is_approved=True,
            **validated_data
        )
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['email'] = user.email
        token['role'] = user.role
        token['full_name'] = user.full_name or f"{user.first_name} {user.last_name}".strip() or user.username
        token['is_approved'] = user.is_approved
        token['status'] = user.status
        return token

    def validate(self, attrs):
        username_or_email = attrs.get('username')
        if username_or_email and '@' in username_or_email:
            try:
                user_obj = User.objects.get(email__iexact=username_or_email)
                attrs['username'] = user_obj.username
            except User.DoesNotExist:
                pass

        data = super().validate(attrs)
        user = self.user

        if user.role == UserRole.DOCTOR and not user.is_approved:
            raise serializers.ValidationError("Your doctor account is pending administrator approval.")

        data['user'] = {
            'id': user.id,
            'user_id': user.id,
            'username': user.username,
            'email': user.email,
            'full_name': user.full_name or f"{user.first_name} {user.last_name}".strip() or user.username,
            'role': user.role,
            'status': user.status,
            'is_approved': user.is_approved,
            'phone': user.phone,
            'phone_number': user.phone,
            'specialization': user.specialization,
            'hospital_affiliation': user.hospital_affiliation,
            'medical_license': user.medical_license,
        }
        return data


class UserAdminUpdateSerializer(serializers.ModelSerializer):
    """Serializer used by Admins to modify user role, active status, approval."""
    phone_number = serializers.CharField(source='phone', required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'full_name',
            'role', 'status', 'is_active', 'is_approved', 'phone', 'phone_number',
            'specialization', 'hospital_affiliation', 'medical_license'
        ]
