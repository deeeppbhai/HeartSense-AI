from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Patient, MedicalAssessment, Prediction, ExplainableAI,
    Recommendation, AIChat, Report, AuditLog
)
from authentication.serializers import UserSerializer
from ml_engine.serializers import MLModelVersionSerializer

User = get_user_model()


class PatientSerializer(serializers.ModelSerializer):
    """Table 2: Patient Table Serializer"""
    id = serializers.IntegerField(source='patient_id', read_only=True)
    user_details = UserSerializer(source='user_id', read_only=True)
    latest_assessment = serializers.SerializerMethodField()
    assessment_count = serializers.SerializerMethodField()

    # User fields surfaced directly for frontend convenience
    username = serializers.CharField(source='user_id.username', read_only=True)
    email = serializers.CharField(source='user_id.email', read_only=True)
    first_name = serializers.CharField(source='user_id.first_name', read_only=True)
    last_name = serializers.CharField(source='user_id.last_name', read_only=True)
    full_name = serializers.SerializerMethodField()
    phone = serializers.CharField(source='user_id.phone', read_only=True)
    phone_number = serializers.CharField(source='user_id.phone', read_only=True)
    blood_group = serializers.SerializerMethodField()
    assigned_doctor_detail = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = [
            'id', 'patient_id', 'user_id', 'user_details', 'age', 'gender',
            'height', 'weight', 'blood_pressure', 'cholesterol',
            'fasting_blood_sugar', 'smoking_status', 'family_history',
            'created_at', 'latest_assessment', 'assessment_count',
            'username', 'email', 'first_name', 'last_name', 'full_name',
            'phone', 'phone_number', 'blood_group',
            'assigned_doctor', 'assigned_doctor_detail'
        ]
        read_only_fields = ['id', 'patient_id', 'created_at']

    def get_full_name(self, obj):
        name = obj.user_id.full_name or f"{obj.user_id.first_name} {obj.user_id.last_name}".strip()
        return name if name else obj.user_id.username

    def get_blood_group(self, obj):
        return getattr(obj.user_id, 'blood_group', 'N/A') or 'N/A'

    def get_assigned_doctor_detail(self, obj):
        doc = getattr(obj, 'assigned_doctor', None)
        if doc:
            doc_name = doc.full_name or f"{doc.first_name} {doc.last_name}".strip() or doc.username
            if not doc_name.lower().startswith('dr.'):
                doc_name = f"Dr. {doc_name}"
            return {
                'id': doc.id,
                'full_name': doc_name,
                'specialization': getattr(doc, 'specialization', 'Cardiologist') or 'Cardiologist',
                'email': doc.email
            }
        return None

    def get_latest_assessment(self, obj):
        latest = obj.assessments.order_by('-assessment_date').first()
        if latest and hasattr(latest, 'prediction'):
            pred = latest.prediction
            return {
                'id': pred.prediction_id,
                'risk_level': pred.risk_level,
                'probability': round(pred.risk_score / 100.0, 4),
                'risk_score': pred.risk_score,
                'created_at': pred.prediction_date,
                'follow_up_recommended': pred.follow_up_recommended,
            }
        return None

    def get_assessment_count(self, obj):
        return obj.assessments.count()


class MedicalAssessmentSerializer(serializers.ModelSerializer):
    """Table 3: Medical Assessment Table Serializer"""
    class Meta:
        model = MedicalAssessment
        fields = [
            'assessment_id', 'patient_id', 'chest_pain_type', 'resting_bp',
            'cholesterol', 'fasting_bs', 'resting_ecg', 'max_heart_rate',
            'exercise_angina', 'oldpeak', 'st_slope', 'vessels',
            'thalassemia', 'assessment_date'
        ]
        read_only_fields = ['assessment_id', 'assessment_date']


class ExplainableAISerializer(serializers.ModelSerializer):
    """Table 5: Explainable AI Table Serializer"""
    class Meta:
        model = ExplainableAI
        fields = [
            'explanation_id', 'prediction_id', 'method', 'feature_name',
            'feature_value', 'contribution', 'explanation_text'
        ]


class RecommendationSerializer(serializers.ModelSerializer):
    """Table 6: Recommendation Table Serializer"""
    class Meta:
        model = Recommendation
        fields = [
            'recommendation_id', 'prediction_id', 'diet_advice',
            'exercise_advice', 'lifestyle_advice', 'medical_advice', 'created_at'
        ]


CP_REVERSE = {'Typical Angina': 0, 'Atypical Angina': 1, 'Non-anginal Pain': 2, 'Asymptomatic': 3}
ECG_REVERSE = {'Normal': 0, 'ST-T Abnormality': 1, 'LV Hypertrophy': 2}
SLOPE_REVERSE = {'Upsloping': 0, 'Flat': 1, 'Downsloping': 2}
THAL_REVERSE = {'Normal': 1, 'Fixed Defect': 2, 'Reversible Defect': 3}


class PredictionSerializer(serializers.ModelSerializer):
    """Table 4: Prediction Table Serializer with related XAI and Recommendations"""
    id = serializers.IntegerField(source='prediction_id', read_only=True)
    created_at = serializers.DateTimeField(source='prediction_date', read_only=True)
    assessment = MedicalAssessmentSerializer(source='assessment_id', read_only=True)
    explanations = ExplainableAISerializer(many=True, read_only=True)
    recommendations_set = RecommendationSerializer(many=True, read_only=True)
    patient_detail = serializers.SerializerMethodField()
    probability = serializers.SerializerMethodField()
    top_factors = serializers.SerializerMethodField()
    recommendations = serializers.SerializerMethodField()
    shap_values = serializers.SerializerMethodField()

    # Biomarker aliases so frontend components get direct values
    trestbps = serializers.SerializerMethodField()
    chol = serializers.SerializerMethodField()
    thalach = serializers.SerializerMethodField()
    oldpeak = serializers.SerializerMethodField()
    cp = serializers.SerializerMethodField()
    fbs = serializers.SerializerMethodField()
    restecg = serializers.SerializerMethodField()
    exang = serializers.SerializerMethodField()
    slope = serializers.SerializerMethodField()
    ca = serializers.SerializerMethodField()
    thal = serializers.SerializerMethodField()
    age = serializers.SerializerMethodField()
    sex = serializers.SerializerMethodField()
    assessed_by_detail = serializers.SerializerMethodField()

    class Meta:
        model = Prediction
        fields = [
            'prediction_id', 'assessment_id', 'assessment', 'model_name',
            'prediction', 'risk_score', 'risk_level', 'confidence_score',
            'prediction_date', 'doctor_notes', 'follow_up_recommended',
            'explanations', 'recommendations_set', 'patient_detail',
            'probability', 'top_factors', 'recommendations',
            # Aliases for frontend backward compatibility
            'id', 'created_at', 'shap_values',
            'trestbps', 'chol', 'thalach', 'oldpeak', 'cp', 'fbs',
            'restecg', 'exang', 'slope', 'ca', 'thal', 'age', 'sex',
            'assessed_by_detail'
        ]

    def get_assessed_by_detail(self, obj):
        report = obj.reports.first()
        doctor = None
        if report and report.generated_by:
            doctor = report.generated_by
        elif hasattr(obj.assessment_id.patient_id, 'assigned_doctor') and obj.assessment_id.patient_id.assigned_doctor:
            doctor = obj.assessment_id.patient_id.assigned_doctor

        if doctor:
            doc_name = doctor.full_name or f"{doctor.first_name} {doctor.last_name}".strip() or doctor.username
            if not doc_name.lower().startswith('dr.'):
                doc_name = f"Dr. {doc_name}"
            return {
                'id': doctor.id,
                'full_name': doc_name,
                'specialization': getattr(doctor, 'specialization', 'Cardiologist') or 'Cardiologist',
                'email': doctor.email
            }
        return None

    def get_trestbps(self, obj):
        try:
            return obj.assessment_id.resting_bp
        except Exception:
            return 120.0

    def get_chol(self, obj):
        try:
            return obj.assessment_id.cholesterol
        except Exception:
            return 200.0

    def get_thalach(self, obj):
        try:
            return obj.assessment_id.max_heart_rate
        except Exception:
            return 150

    def get_oldpeak(self, obj):
        try:
            return obj.assessment_id.oldpeak
        except Exception:
            return 0.0

    def get_cp(self, obj):
        try:
            return CP_REVERSE.get(obj.assessment_id.chest_pain_type, 1)
        except Exception:
            return 1

    def get_fbs(self, obj):
        try:
            return 1 if obj.assessment_id.fasting_bs else 0
        except Exception:
            return 0

    def get_restecg(self, obj):
        try:
            return ECG_REVERSE.get(obj.assessment_id.resting_ecg, 0)
        except Exception:
            return 0

    def get_exang(self, obj):
        try:
            return 1 if obj.assessment_id.exercise_angina else 0
        except Exception:
            return 0

    def get_slope(self, obj):
        try:
            return SLOPE_REVERSE.get(obj.assessment_id.st_slope, 1)
        except Exception:
            return 1

    def get_ca(self, obj):
        try:
            return obj.assessment_id.vessels
        except Exception:
            return 0

    def get_thal(self, obj):
        try:
            return THAL_REVERSE.get(obj.assessment_id.thalassemia, 2)
        except Exception:
            return 2

    def get_age(self, obj):
        try:
            return obj.assessment_id.patient_id.age
        except Exception:
            return 50

    def get_sex(self, obj):
        try:
            return 1 if obj.assessment_id.patient_id.gender.lower() == 'male' else 0
        except Exception:
            return 1

    def get_shap_values(self, obj):
        return [
            {
                'name': e.feature_name,
                'value': e.feature_value,
                'shap_value': e.contribution,
                'impact': 'increases_risk' if e.contribution > 0 else 'decreases_risk'
            }
            for e in obj.explanations.all()
        ]

    def get_patient_detail(self, obj):
        user = obj.assessment_id.patient_id.user_id
        return {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'full_name': user.full_name or user.get_full_name() or user.username,
            'phone': user.phone,
            'role': user.role
        }

    def get_probability(self, obj):
        return round(obj.risk_score / 100.0, 4)

    def get_top_factors(self, obj):
        return [
            {
                'name': e.feature_name,
                'value': e.feature_value,
                'shap_value': e.contribution,
                'impact': 'increases_risk' if e.contribution > 0 else 'decreases_risk'
            }
            for e in obj.explanations.all()[:6]
        ]

    def get_recommendations(self, obj):
        rec = obj.recommendations_set.first()
        if rec:
            return [
                {'category': 'Dietary Guidance', 'text': rec.diet_advice},
                {'category': 'Physical Activity', 'text': rec.exercise_advice},
                {'category': 'Lifestyle Modifications', 'text': rec.lifestyle_advice},
                {'category': 'Clinical Care', 'text': rec.medical_advice},
            ]
        return []


class ReportSerializer(serializers.ModelSerializer):
    """Table 8: Report Table Serializer"""
    patient = PatientSerializer(source='patient_id', read_only=True)
    prediction = PredictionSerializer(source='prediction_id', read_only=True)

    class Meta:
        model = Report
        fields = [
            'report_id', 'patient_id', 'patient', 'prediction_id', 'prediction',
            'report_file', 'generated_by', 'generated_at'
        ]


class AIChatSerializer(serializers.ModelSerializer):
    """Table 7: AI Chat Table Serializer"""
    class Meta:
        model = AIChat
        fields = [
            'chat_id', 'user_id', 'question', 'ai_response', 'created_at'
        ]
        read_only_fields = ['chat_id', 'created_at']


class AuditLogSerializer(serializers.ModelSerializer):
    user_detail = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = ['id', 'user', 'user_detail', 'action', 'details', 'ip_address', 'timestamp']

    def get_user_detail(self, obj):
        if obj.user:
            return {
                'id': obj.user.id,
                'username': obj.user.username,
                'email': obj.user.email,
                'role': obj.user.role,
                'full_name': obj.user.full_name or obj.user.get_full_name() or obj.user.username
            }
        return None


class PredictionCreateSerializer(serializers.Serializer):
    """Input serializer mapping clinical parameters into MedicalAssessment and Prediction"""
    patient_id = serializers.IntegerField(required=False, allow_null=True)

    # 13 Clinical parameters matching Data Dictionary Table 3
    age = serializers.IntegerField(min_value=1, max_value=120)
    sex = serializers.ChoiceField(choices=[(1, 'Male'), (0, 'Female')])
    cp = serializers.ChoiceField(choices=[(0, 'Typical Angina'), (1, 'Atypical Angina'), (2, 'Non-anginal Pain'), (3, 'Asymptomatic')])
    trestbps = serializers.FloatField(min_value=50.0, max_value=300.0)
    chol = serializers.FloatField(min_value=50.0, max_value=800.0)
    fbs = serializers.ChoiceField(choices=[(0, '<= 120 mg/dl'), (1, '> 120 mg/dl')])
    restecg = serializers.ChoiceField(choices=[(0, 'Normal'), (1, 'ST-T Abnormality'), (2, 'LV Hypertrophy')])
    thalach = serializers.FloatField(min_value=40.0, max_value=250.0)
    exang = serializers.ChoiceField(choices=[(0, 'No'), (1, 'Yes')])
    oldpeak = serializers.FloatField(min_value=0.0, max_value=10.0)
    slope = serializers.ChoiceField(choices=[(0, 'Upsloping'), (1, 'Flat'), (2, 'Downsloping')])
    ca = serializers.ChoiceField(choices=[(0, '0 Vessels'), (1, '1 Vessel'), (2, '2 Vessels'), (3, '3 Vessels')])
    thal = serializers.ChoiceField(choices=[(1, 'Normal'), (2, 'Fixed Defect'), (3, 'Reversible Defect')])

    # Optional clinical & lifestyle notes
    doctor_notes = serializers.CharField(required=False, allow_blank=True, default='')
    follow_up_recommended = serializers.BooleanField(required=False, default=False)
