from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from authentication.models import UserRole, Admin
from ml_engine.models import MLModel
from clinical.models import (
    Patient, MedicalAssessment, Prediction, ExplainableAI,
    Recommendation, AIChat, Report, AuditLog
)
from clinical.reports import generate_clinical_pdf

User = get_user_model()


class HeartSenseDataDictionaryTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # 1. Admin User (Table 1 & Table 10)
        self.admin = User.objects.create_superuser(
            username='test_admin',
            email='admin@test.com',
            password='AdminPass123!',
            role=UserRole.ADMIN,
            full_name='System Admin'
        )
        self.admin_profile = Admin.objects.create(
            user_id=self.admin,
            permissions='{"all": true}',
            status=True
        )

        # 2. Doctor User (Table 1)
        self.doctor = User.objects.create_user(
            username='test_doc',
            email='doc@test.com',
            password='DocPass123!',
            role=UserRole.DOCTOR,
            full_name='Dr. Test Cardiologist',
            medical_license='MD-TEST-1234',
            specialization='Cardiology',
            is_approved=True
        )

        # 3. Patient User (Table 1) & Patient Profile (Table 2)
        self.patient_user = User.objects.create_user(
            username='test_pat',
            email='pat@test.com',
            password='PatPass123!',
            role=UserRole.PATIENT,
            full_name='John Test'
        )
        self.patient = Patient.objects.create(
            user_id=self.patient_user,
            age=55,
            gender='Male',
            height=175.0,
            weight=78.0,
            blood_pressure='135/88',
            cholesterol=230.0,
            fasting_blood_sugar=105.0,
            smoking_status=False,
            family_history=True
        )

        # 4. ML Model (Table 9)
        self.ml_model = MLModel.objects.create(
            model_name='Random Forest Classifier',
            algorithm='Random Forest Classifier',
            version='1.0.0',
            file_path='ml_engine/artifacts/random_forest_model.joblib',
            status=True,
            accuracy=0.904,
            precision=0.930,
            recall=0.736,
            f1_score=0.822,
            auc_score=0.967
        )

    def test_auth_login_jwt(self):
        """Verify JWT login returns access and refresh tokens along with user payload."""
        response = self.client.post('/api/auth/login/', {
            'username': 'pat@test.com',
            'password': 'PatPass123!'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['role'].lower(), 'patient')

    def test_doctor_license_required_on_registration(self):
        """Doctor registration must enforce medical license number."""
        response = self.client.post('/api/auth/register/', {
            'username': 'new_doc_without_lic',
            'email': 'nolic@test.com',
            'password': 'TestPass123!',
            'password_confirm': 'TestPass123!',
            'role': 'doctor'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('medical_license', response.data)

    def test_clinical_assessment_multi_table_flow(self):
        """Verify submitting clinical features populates MedicalAssessment, Prediction, ExplainableAI, Recommendation, and Report."""
        self.client.force_authenticate(user=self.patient_user)
        payload = {
            'age': 55,
            'sex': 1,
            'cp': 1,
            'trestbps': 135.0,
            'chol': 230.0,
            'fbs': 0,
            'restecg': 0,
            'thalach': 148.0,
            'exang': 0,
            'oldpeak': 1.1,
            'slope': 1,
            'ca': 0,
            'thal': 2
        }
        response = self.client.post('/api/clinical/assessments/', payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('risk_level', response.data)
        self.assertIn('risk_score', response.data)

        # Verify Table 3: MedicalAssessment created
        self.assertTrue(MedicalAssessment.objects.filter(patient_id=self.patient).exists())

        # Verify Table 4: Prediction created
        prediction_id = response.data['prediction_id']
        pred = Prediction.objects.get(prediction_id=prediction_id)
        self.assertEqual(pred.assessment_id.patient_id, self.patient)

        # Verify Table 5: ExplainableAI created
        exps = ExplainableAI.objects.filter(prediction_id=pred)
        self.assertTrue(exps.count() > 0)

        # Verify Table 6: Recommendation created
        recs = Recommendation.objects.filter(prediction_id=pred)
        self.assertTrue(recs.count() > 0)

        # Verify Table 8: Report created
        reports = Report.objects.filter(prediction_id=pred)
        self.assertTrue(reports.count() > 0)

        # Check audit log written
        audit = AuditLog.objects.filter(action='ASSESSMENT_COMPLETED').first()
        self.assertIsNotNone(audit)

    def test_pdf_report_generation(self):
        """Verify ReportLab produces valid non-empty PDF document from Data Dictionary Prediction record."""
        assessment = MedicalAssessment.objects.create(
            patient_id=self.patient,
            chest_pain_type='Atypical Angina',
            resting_bp=135.0,
            cholesterol=230.0,
            fasting_bs=False,
            resting_ecg='Normal',
            max_heart_rate=148,
            exercise_angina=False,
            oldpeak=1.1,
            st_slope='Flat',
            vessels=0,
            thalassemia='Fixed Defect'
        )
        prediction = Prediction.objects.create(
            assessment_id=assessment,
            model_name='Random Forest Classifier',
            prediction='Absence',
            risk_score=32.0,
            risk_level='Moderate',
            confidence_score=0.88,
            doctor_notes='Patient advised to reduce sodium.'
        )
        pdf_buffer = generate_clinical_pdf(prediction)
        content = pdf_buffer.getvalue()
        self.assertTrue(len(content) > 1000)
        self.assertTrue(content.startswith(b'%PDF'))

    def test_ai_chat_persistence(self):
        """Verify Table 7: AIChat records are stored and retrieved."""
        self.client.force_authenticate(user=self.patient_user)
        chat_payload = {
            'question': 'What lifestyle changes improve cardiovascular health?',
            'ai_response': 'Regular aerobic exercise, smoking cessation, and Mediterranean or DASH diet patterns.'
        }
        response = self.client.post('/api/clinical/chat/', chat_payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(AIChat.objects.filter(user_id=self.patient_user).count(), 1)
