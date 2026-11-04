from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from authentication.models import UserRole, Admin

User = get_user_model()


class AuthenticationDataDictionaryTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Admin User & Table 10 record
        self.admin = User.objects.create_superuser(
            username='admin_test',
            email='admin@heartsense.ai',
            password='AdminPass123!',
            role=UserRole.ADMIN,
            full_name='System Admin',
            phone='+1-800-555-0199'
        )
        self.admin_entry = Admin.objects.create(
            user_id=self.admin,
            permissions='{"all": true}',
            status=True
        )

        # Doctor User
        self.doctor = User.objects.create_user(
            username='dr_test',
            email='doctor@heartsense.ai',
            password='DoctorPass123!',
            role=UserRole.DOCTOR,
            full_name='Dr. Test',
            phone='+1-555-014-8822',
            medical_license='MD-999',
            is_approved=True
        )

    def test_table1_user_fields(self):
        """Verify Table 1 User table properties."""
        self.assertEqual(self.admin.role, UserRole.ADMIN)
        self.assertTrue(self.admin.status)
        self.assertEqual(self.admin.phone, '+1-800-555-0199')
        self.assertEqual(self.admin.user_id, self.admin.id)

    def test_table10_admin_fields(self):
        """Verify Table 10 Admin table properties."""
        self.assertEqual(self.admin_entry.user_id, self.admin)
        self.assertTrue(self.admin_entry.status)
        self.assertIn('all', self.admin_entry.permissions)

    def test_patient_registration_with_phone(self):
        """Verify patient registration creates user with Table 1 fields."""
        payload = {
            'username': 'new_patient',
            'email': 'newpat@test.com',
            'password': 'PatientPass123!',
            'password_confirm': 'PatientPass123!',
            'role': 'Patient',
            'full_name': 'New Patient',
            'phone': '+1-555-019-8765'
        }
        res = self.client.post('/api/auth/register/', payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username='new_patient')
        self.assertEqual(user.phone, '+1-555-019-8765')
        self.assertEqual(user.role, UserRole.PATIENT)
        self.assertTrue(user.status)

    def test_jwt_login_with_email(self):
        """Verify JWT login works with user email."""
        res = self.client.post('/api/auth/login/', {
            'username': 'admin@heartsense.ai',
            'password': 'AdminPass123!'
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access', res.data)
        self.assertEqual(res.data['user']['role'], 'Admin')
