from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class UserRole(models.TextChoices):
    PATIENT = 'Patient', 'Patient'
    DOCTOR = 'Doctor', 'Doctor'
    ADMIN = 'Admin', 'Admin'


class User(AbstractUser):
    # Table 1: User Table from Data Dictionary
    # user_id: INT PK (Django default pk `id` alias `user_id`)
    full_name = models.CharField(max_length=150, blank=True, null=True, help_text="User's full name")
    email = models.EmailField(unique=True, help_text="User email address")
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.PATIENT,
        help_text="User role: Patient, Doctor, or Admin"
    )
    phone = models.CharField(max_length=30, blank=True, null=True, help_text="Contact phone number")
    created_at = models.DateTimeField(default=timezone.now, help_text="Account creation timestamp")
    status = models.BooleanField(default=True, help_text="Account status (Active/Inactive)")

    # Doctor specific metadata
    medical_license = models.CharField(max_length=50, blank=True, null=True)
    specialization = models.CharField(max_length=100, blank=True, null=True, default='Cardiologist')
    hospital_affiliation = models.CharField(max_length=150, blank=True, null=True, default='Cardiovascular Health Center')
    is_approved = models.BooleanField(default=True)

    REQUIRED_FIELDS = ['email', 'role']

    def __str__(self):
        return f"{self.email} - {self.full_name or self.username} ({self.role})"

    @property
    def user_id(self):
        return self.id

    @property
    def is_patient(self):
        return self.role.lower() == 'patient'

    @property
    def is_doctor(self):
        return self.role.lower() == 'doctor'

    @property
    def is_administrator(self):
        return self.role.lower() == 'admin' or self.is_superuser


class Admin(models.Model):
    # Table 10: Admin Table from Data Dictionary
    admin_id = models.AutoField(primary_key=True, help_text="Unique administrator identifier")
    user_id = models.ForeignKey(User, on_delete=models.CASCADE, related_name='admin_profile', help_text="References User(user_id)")
    permissions = models.TextField(default='{"all": true}', help_text="JSON/Text specification of permissions")
    last_login = models.DateTimeField(auto_now=True, help_text="Last administrative login timestamp")
    status = models.BooleanField(default=True, help_text="Admin account active status")

    def __str__(self):
        return f"Admin #{self.admin_id} ({self.user_id.email})"
