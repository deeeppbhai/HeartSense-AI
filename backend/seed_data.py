import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'heartsense_backend.settings')

import django
django.setup()

from django.contrib.auth import get_user_model
from authentication.models import UserRole, Admin
from clinical.models import (
    Patient, MedicalAssessment, Prediction, ExplainableAI,
    Recommendation, AIChat, Report, AuditLog
)
from ml_engine.models import MLModel
from ml_engine.predictor import predict_heart_disease
from ml_engine.train_models import train_and_evaluate_all_models

User = get_user_model()


def seed_database():
    print("Seeding HeartSense AI database strictly following the Data Dictionary...")

    # Table 9: ML Model Table
    if MLModel.objects.count() < 4:
        print("Training and persisting all 4 ML models into Table 9...")
        train_and_evaluate_all_models()
    else:
        print("Table 9: ML Model Table already populated.")

    # Clean existing clinical assessments & predictions for clean re-seeding
    MedicalAssessment.objects.all().delete()
    AIChat.objects.all().delete()

    # 1. User Table (Table 1) - Admin User
    admin_user, _ = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@heartsense.ai',
            'full_name': 'System Administrator',
            'first_name': 'System',
            'last_name': 'Administrator',
            'role': UserRole.ADMIN,
            'phone': '+1-800-555-0199',
            'status': True,
            'is_staff': True,
            'is_superuser': True,
            'is_approved': True,
        }
    )
    admin_user.set_password('AdminPass123!')
    admin_user.full_name = 'System Administrator'
    admin_user.role = UserRole.ADMIN
    admin_user.status = True
    admin_user.save()

    # Table 10: Admin Table
    Admin.objects.get_or_create(
        user_id=admin_user,
        defaults={
            'permissions': '{"all": true, "user_management": true, "model_management": true, "audit_review": true}',
            'status': True
        }
    )
    print("Created Table 1: User & Table 10: Admin records (admin / AdminPass123!)")

    # Table 1: Doctors
    doc1, _ = User.objects.get_or_create(
        username='dr_sarah',
        defaults={
            'email': 'doctor@heartsense.ai',
            'full_name': 'Dr. Sarah Jenkins',
            'first_name': 'Sarah',
            'last_name': 'Jenkins',
            'role': UserRole.DOCTOR,
            'phone': '+1-555-014-8822',
            'status': True,
            'medical_license': 'MD-CAR-84920',
            'specialization': 'Interventional Cardiology',
            'hospital_affiliation': 'St. Jude Heart & Vascular Institute',
            'is_approved': True,
        }
    )
    doc1.set_password('DoctorPass123!')
    doc1.full_name = 'Dr. Sarah Jenkins'
    doc1.role = UserRole.DOCTOR
    doc1.save()

    doc2, _ = User.objects.get_or_create(
        username='dr_marcus',
        defaults={
            'email': 'marcus.chen@heartsense.ai',
            'full_name': 'Dr. Marcus Chen',
            'first_name': 'Marcus',
            'last_name': 'Chen',
            'role': UserRole.DOCTOR,
            'phone': '+1-555-019-3341',
            'status': True,
            'medical_license': 'MD-CAR-91043',
            'specialization': 'Cardiac Electrophysiology',
            'hospital_affiliation': 'Metropolitan University Hospital',
            'is_approved': True,
        }
    )
    doc2.set_password('DoctorPass123!')
    doc2.full_name = 'Dr. Marcus Chen'
    doc2.role = UserRole.DOCTOR
    doc2.save()
    print("Created Doctor User records (doctor@heartsense.ai, marcus.chen@heartsense.ai)")

    # Table 1: Patients & Table 2: Patient Table
    pat1_user, _ = User.objects.get_or_create(
        username='john_doe',
        defaults={
            'email': 'patient@heartsense.ai',
            'full_name': 'Johnathan Doe',
            'first_name': 'Johnathan',
            'last_name': 'Doe',
            'role': UserRole.PATIENT,
            'phone': '+1-555-012-3456',
            'status': True,
        }
    )
    pat1_user.set_password('PatientPass123!')
    pat1_user.full_name = 'Johnathan Doe'
    pat1_user.role = UserRole.PATIENT
    pat1_user.save()

    p1, _ = Patient.objects.get_or_create(
        user_id=pat1_user,
        defaults={
            'age': 58,
            'gender': 'Male',
            'height': 178.0,
            'weight': 84.5,
            'blood_pressure': '142/90',
            'cholesterol': 255.0,
            'fasting_blood_sugar': 110.0,
            'smoking_status': True,
            'family_history': True,
        }
    )

    pat2_user, _ = User.objects.get_or_create(
        username='emily_clark',
        defaults={
            'email': 'emily.clark@heartsense.ai',
            'full_name': 'Emily Clark',
            'first_name': 'Emily',
            'last_name': 'Clark',
            'role': UserRole.PATIENT,
            'phone': '+1-555-018-9921',
            'status': True,
        }
    )
    pat2_user.set_password('PatientPass123!')
    pat2_user.full_name = 'Emily Clark'
    pat2_user.role = UserRole.PATIENT
    pat2_user.save()

    p2, _ = Patient.objects.get_or_create(
        user_id=pat2_user,
        defaults={
            'age': 42,
            'gender': 'Female',
            'height': 165.0,
            'weight': 61.0,
            'blood_pressure': '116/76',
            'cholesterol': 188.0,
            'fasting_blood_sugar': 88.0,
            'smoking_status': False,
            'family_history': False,
        }
    )

    pat3_user, _ = User.objects.get_or_create(
        username='robert_miller',
        defaults={
            'email': 'robert.miller@heartsense.ai',
            'full_name': 'Robert Miller',
            'first_name': 'Robert',
            'last_name': 'Miller',
            'role': UserRole.PATIENT,
            'phone': '+1-555-017-4433',
            'status': True,
        }
    )
    pat3_user.set_password('PatientPass123!')
    pat3_user.full_name = 'Robert Miller'
    pat3_user.role = UserRole.PATIENT
    pat3_user.save()

    p3, _ = Patient.objects.get_or_create(
        user_id=pat3_user,
        defaults={
            'age': 65,
            'gender': 'Male',
            'height': 175.0,
            'weight': 89.0,
            'blood_pressure': '165/98',
            'cholesterol': 282.0,
            'fasting_blood_sugar': 140.0,
            'smoking_status': True,
            'family_history': True,
        }
    )
    print("Created Table 2: Patient records for Johnathan Doe, Emily Clark, Robert Miller")

    # Table 3: Medical Assessment Table & Table 4: Prediction & Table 5: Explainable AI & Table 6: Recommendation
    active_model = MLModel.objects.filter(status=True).first()
    model_name = active_model.model_name if active_model else "Random Forest Classifier"

    # Case 1: Johnathan Doe (Moderate Risk)
    f1 = {'age': 58, 'sex': 1, 'cp': 1, 'trestbps': 142.0, 'chol': 255.0, 'fbs': 0, 'restecg': 1, 'thalach': 138.0, 'exang': 1, 'oldpeak': 1.6, 'slope': 1, 'ca': 1, 'thal': 2}
    res1 = predict_heart_disease(f1)
    
    a1 = MedicalAssessment.objects.create(
        patient_id=p1,
        chest_pain_type='Atypical Angina',
        resting_bp=142.0,
        cholesterol=255.0,
        fasting_bs=False,
        resting_ecg='ST-T Abnormality',
        max_heart_rate=138,
        exercise_angina=True,
        oldpeak=1.6,
        st_slope='Flat',
        vessels=1,
        thalassemia='Fixed Defect'
    )
    pred1 = Prediction.objects.create(
        assessment_id=a1,
        model_name=model_name,
        prediction=res1['prediction'],
        risk_score=res1['risk_score'],
        risk_level='Moderate',
        confidence_score=res1['confidence_score'],
        doctor_notes="Patient presents with exertional tightness. Initiated beta-blocker titration and requested outpatient echocardiogram.",
        follow_up_recommended=True
    )
    for exp in res1.get('explanations', []):
        ExplainableAI.objects.create(
            prediction_id=pred1,
            method='SHAP',
            feature_name=exp['feature_name'],
            feature_value=str(exp['feature_value']),
            contribution=exp['contribution'],
            explanation_text=exp['explanation_text']
        )
    Recommendation.objects.create(
        prediction_id=pred1,
        diet_advice="Adopt DASH diet pattern: reduce dietary sodium (< 2g/day), increase leafy greens and potassium-rich foods.",
        exercise_advice="Engage in low-impact aerobic exercise for 30 minutes 4 times weekly; avoid sudden maximal isometric strain.",
        lifestyle_advice="Monitor home blood pressure twice daily, cease tobacco smoking, and maintain sleep hygiene.",
        medical_advice="Follow up with attending cardiologist in 2 weeks with ambulatory BP log."
    )
    Report.objects.create(
        patient_id=p1,
        prediction_id=pred1,
        report_file=f"HeartSense_Report_HS-{pred1.prediction_id:06d}.pdf",
        generated_by=doc1
    )

    # Case 2: Emily Clark (Low Risk)
    f2 = {'age': 42, 'sex': 0, 'cp': 2, 'trestbps': 116.0, 'chol': 188.0, 'fbs': 0, 'restecg': 0, 'thalach': 172.0, 'exang': 0, 'oldpeak': 0.2, 'slope': 0, 'ca': 0, 'thal': 1}
    res2 = predict_heart_disease(f2)
    a2 = MedicalAssessment.objects.create(
        patient_id=p2,
        chest_pain_type='Non-anginal Pain',
        resting_bp=116.0,
        cholesterol=188.0,
        fasting_bs=False,
        resting_ecg='Normal',
        max_heart_rate=172,
        exercise_angina=False,
        oldpeak=0.2,
        st_slope='Upsloping',
        vessels=0,
        thalassemia='Normal'
    )
    pred2 = Prediction.objects.create(
        assessment_id=a2,
        model_name=model_name,
        prediction=res2['prediction'],
        risk_score=res2['risk_score'],
        risk_level='Low',
        confidence_score=res2['confidence_score'],
        doctor_notes="Excellent baseline cardiovascular health. Continue athletic conditioning.",
        follow_up_recommended=False
    )
    for exp in res2.get('explanations', []):
        ExplainableAI.objects.create(
            prediction_id=pred2,
            method='SHAP',
            feature_name=exp['feature_name'],
            feature_value=str(exp['feature_value']),
            contribution=exp['contribution'],
            explanation_text=exp['explanation_text']
        )
    Recommendation.objects.create(
        prediction_id=pred2,
        diet_advice="Maintain balanced whole-food Mediterranean diet with adequate hydration.",
        exercise_advice="Continue regular 150+ minutes of aerobic activity and recreational sports.",
        lifestyle_advice="Sustain active lifestyle and healthy work-life balance.",
        medical_advice="Routine preventive medical examination in 12 months."
    )
    Report.objects.create(
        patient_id=p2,
        prediction_id=pred2,
        report_file=f"HeartSense_Report_HS-{pred2.prediction_id:06d}.pdf",
        generated_by=doc1
    )

    # Case 3: Robert Miller (High / Severe Risk)
    f3 = {'age': 65, 'sex': 1, 'cp': 0, 'trestbps': 165.0, 'chol': 282.0, 'fbs': 1, 'restecg': 1, 'thalach': 112.0, 'exang': 1, 'oldpeak': 2.8, 'slope': 2, 'ca': 2, 'thal': 3}
    res3 = predict_heart_disease(f3)
    a3 = MedicalAssessment.objects.create(
        patient_id=p3,
        chest_pain_type='Typical Angina',
        resting_bp=165.0,
        cholesterol=282.0,
        fasting_bs=True,
        resting_ecg='ST-T Abnormality',
        max_heart_rate=112,
        exercise_angina=True,
        oldpeak=2.8,
        st_slope='Downsloping',
        vessels=2,
        thalassemia='Reversible Defect'
    )
    pred3 = Prediction.objects.create(
        assessment_id=a3,
        model_name=model_name,
        prediction=res3['prediction'],
        risk_score=res3['risk_score'],
        risk_level='High',
        confidence_score=res3['confidence_score'],
        doctor_notes="CRITICAL: Exercise-induced angina, multi-vessel calcification risk, and 2.8mm ST depression. Urgent coronary angiography recommended.",
        follow_up_recommended=True
    )
    for exp in res3.get('explanations', []):
        ExplainableAI.objects.create(
            prediction_id=pred3,
            method='SHAP',
            feature_name=exp['feature_name'],
            feature_value=str(exp['feature_value']),
            contribution=exp['contribution'],
            explanation_text=exp['explanation_text']
        )
    Recommendation.objects.create(
        prediction_id=pred3,
        diet_advice="Strict low-sodium, low-cholesterol cardiac diet. Eliminate all processed meats and high-glycemic carbohydrates.",
        exercise_advice="Refrain from strenuous exertion until invasive coronary evaluation is completed.",
        lifestyle_advice="Immediate smoking cessation program referral; minimize acute emotional stressors.",
        medical_advice="URGENT: Cardiac catheterization and invasive coronary angiogram consultation scheduled."
    )
    Report.objects.create(
        patient_id=p3,
        prediction_id=pred3,
        report_file=f"HeartSense_Report_HS-{pred3.prediction_id:06d}.pdf",
        generated_by=doc2
    )

    # Table 7: AI Chat Table (AIChat)
    AIChat.objects.create(
        user_id=pat1_user,
        question="What does my resting blood pressure of 142 mmHg mean?",
        ai_response="A resting blood pressure of 142 mmHg indicates Stage 2 Hypertension according to ACC/AHA guidelines. Reducing dietary sodium, monitoring home BP readings, and consulting your doctor are recommended."
    )
    AIChat.objects.create(
        user_id=pat1_user,
        question="What do SHAP values explain in my report?",
        ai_response="SHAP values show which clinical factors (like ST depression or cholesterol) contributed most toward increasing or decreasing your estimated risk percentage."
    )
    print("Created Table 7: AIChat records")

    # Audit Logs
    AuditLog.objects.create(user=admin_user, action='SYSTEM_INITIALIZED', details='System initialized with Data Dictionary schema.', ip_address='127.0.0.1')
    AuditLog.objects.create(user=doc1, action='USER_LOGIN', details='Dr. Sarah Jenkins logged in.', ip_address='192.168.1.10')
    AuditLog.objects.create(user=doc1, action='ASSESSMENT_COMPLETED', details=f"Assessment #{a1.assessment_id} & Prediction #{pred1.prediction_id} generated for Johnathan Doe.", ip_address='192.168.1.10')
    AuditLog.objects.create(user=pat1_user, action='REPORT_DOWNLOADED', details=f"Downloaded report #{pred1.prediction_id}.", ip_address='192.168.1.44')

    print("Successfully seeded all 10 Data Dictionary tables!")


if __name__ == '__main__':
    seed_database()
