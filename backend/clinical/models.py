from django.db import models
from django.conf import settings
from django.utils import timezone
from ml_engine.models import MLModel


class Patient(models.Model):
    """
    Table 2: Patient Table from Data Dictionary
    """
    patient_id = models.AutoField(primary_key=True, help_text="Unique patient identifier")
    user_id = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='patient_profile',
        help_text="References User(user_id)"
    )
    assigned_doctor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_patients',
        help_text="References User(user_id) for the attending doctor"
    )
    age = models.IntegerField(default=50, help_text="Patient age in years")
    gender = models.CharField(max_length=20, default='Male', help_text="Gender (Male / Female / Other)")
    height = models.DecimalField(max_digits=5, decimal_places=2, default=170.0, help_text="Height in centimeters")
    weight = models.DecimalField(max_digits=5, decimal_places=2, default=70.0, help_text="Weight in kilograms")
    blood_pressure = models.CharField(max_length=20, default='120/80', help_text="Baseline blood pressure reading")
    cholesterol = models.FloatField(default=200.0, help_text="Cholesterol level")
    fasting_blood_sugar = models.FloatField(default=100.0, help_text="Fasting blood sugar level")
    smoking_status = models.BooleanField(default=False, help_text="Smoking history flag")
    family_history = models.BooleanField(default=False, help_text="Family history of heart disease")
    created_at = models.DateTimeField(default=timezone.now, help_text="Record creation timestamp")

    def __str__(self):
        name = self.user_id.full_name or self.user_id.username
        return f"Patient #{self.patient_id}: {name} ({self.gender}, {self.age} yrs)"

    @property
    def id(self):
        return self.patient_id


class MedicalAssessment(models.Model):
    """
    Table 3: Medical Assessment Table from Data Dictionary
    """
    assessment_id = models.AutoField(primary_key=True, help_text="Unique assessment identifier")
    patient_id = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name='assessments',
        help_text="References Patient(patient_id)"
    )
    chest_pain_type = models.CharField(max_length=50, help_text="Type of chest pain experienced")
    resting_bp = models.FloatField(help_text="Resting blood pressure (mmHg)")
    cholesterol = models.FloatField(help_text="Serum cholesterol (mg/dl)")
    fasting_bs = models.BooleanField(default=False, help_text="Fasting blood sugar > 120 mg/dl")
    resting_ecg = models.CharField(max_length=50, help_text="Resting ECG results")
    max_heart_rate = models.IntegerField(help_text="Maximum heart rate achieved")
    exercise_angina = models.BooleanField(default=False, help_text="Exercise-induced angina status")
    oldpeak = models.FloatField(help_text="ST depression induced by exercise")
    st_slope = models.CharField(max_length=50, help_text="Slope of peak exercise ST segment")
    vessels = models.IntegerField(default=0, help_text="Number of major vessels colored by fluoroscopy")
    thalassemia = models.CharField(max_length=50, help_text="Thalassemia diagnostic result")
    assessment_date = models.DateTimeField(default=timezone.now, help_text="Date and time of assessment")

    def __str__(self):
        return f"Assessment #{self.assessment_id} - Patient #{self.patient_id.patient_id} ({self.assessment_date.strftime('%Y-%m-%d')})"

    @property
    def id(self):
        return self.assessment_id


class Prediction(models.Model):
    """
    Table 4: Prediction Table from Data Dictionary
    """
    prediction_id = models.AutoField(primary_key=True, help_text="Unique prediction identifier")
    assessment_id = models.OneToOneField(
        MedicalAssessment,
        on_delete=models.CASCADE,
        related_name='prediction',
        help_text="References Medical Assessment(assessment_id)"
    )
    model_name = models.CharField(max_length=100, help_text="ML model used for evaluation")
    prediction = models.CharField(max_length=50, help_text="Predicted disease outcome")
    risk_score = models.FloatField(help_text="Calculated risk percentage (0-100%)")
    risk_level = models.CharField(max_length=20, help_text="Risk classification (Low, Moderate, High)")
    confidence_score = models.FloatField(default=0.85, help_text="Model confidence score")
    prediction_date = models.DateTimeField(default=timezone.now, help_text="Timestamp of prediction generation")

    # Optional doctor notes
    doctor_notes = models.TextField(blank=True, null=True)
    follow_up_recommended = models.BooleanField(default=False)

    def __str__(self):
        return f"Prediction #{self.prediction_id}: {self.prediction} - {self.risk_level} ({self.risk_score:.1f}%)"

    @property
    def id(self):
        return self.prediction_id


class ExplainableAI(models.Model):
    """
    Table 5: Explainable AI Table from Data Dictionary
    """
    explanation_id = models.AutoField(primary_key=True, help_text="Unique explanation identifier")
    prediction_id = models.ForeignKey(
        Prediction,
        on_delete=models.CASCADE,
        related_name='explanations',
        help_text="References Prediction(prediction_id)"
    )
    method = models.CharField(max_length=20, default='SHAP', help_text="XAI Method used (SHAP / LIME)")
    feature_name = models.CharField(max_length=100, help_text="Key medical feature evaluated")
    feature_value = models.CharField(max_length=100, help_text="Patient's feature value")
    contribution = models.FloatField(help_text="Feature contribution score to prediction")
    explanation_text = models.TextField(help_text="Human-readable explanation text")

    def __str__(self):
        return f"Explanation #{self.explanation_id} ({self.method}): {self.feature_name} = {self.contribution:+.3f}"


class Recommendation(models.Model):
    """
    Table 6: Recommendation Table from Data Dictionary
    """
    recommendation_id = models.AutoField(primary_key=True, help_text="Unique recommendation identifier")
    prediction_id = models.ForeignKey(
        Prediction,
        on_delete=models.CASCADE,
        related_name='recommendations_set',
        help_text="References Prediction(prediction_id)"
    )
    diet_advice = models.TextField(help_text="General dietary recommendations")
    exercise_advice = models.TextField(help_text="Physical activity and exercise guidelines")
    lifestyle_advice = models.TextField(help_text="General lifestyle modifications")
    medical_advice = models.TextField(help_text="Clinical recommendations & specialist care guidance")
    created_at = models.DateTimeField(default=timezone.now, help_text="Timestamp of recommendation creation")

    def __str__(self):
        return f"Recommendation #{self.recommendation_id} for Prediction #{self.prediction_id.prediction_id}"


class AIChat(models.Model):
    """
    Table 7: AI Chat Table from Data Dictionary
    """
    chat_id = models.AutoField(primary_key=True, help_text="Unique chat log identifier")
    user_id = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_logs',
        help_text="References User(user_id)"
    )
    question = models.TextField(help_text="User's query/question text")
    ai_response = models.TextField(help_text="AI-generated conversational response")
    created_at = models.DateTimeField(default=timezone.now, help_text="Chat interaction timestamp")

    def __str__(self):
        return f"Chat #{self.chat_id} by {self.user_id.username} ({self.created_at.strftime('%Y-%m-%d %H:%M')})"


class Report(models.Model):
    """
    Table 8: Report Table from Data Dictionary
    """
    report_id = models.AutoField(primary_key=True, help_text="Unique report identifier")
    patient_id = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name='reports',
        help_text="References Patient(patient_id)"
    )
    prediction_id = models.ForeignKey(
        Prediction,
        on_delete=models.CASCADE,
        related_name='reports',
        help_text="References Prediction(prediction_id)"
    )
    report_file = models.CharField(max_length=255, help_text="PDF report file path or filename")
    generated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='generated_reports',
        help_text="References User(user_id) who generated report"
    )
    generated_at = models.DateTimeField(default=timezone.now, help_text="Report generation timestamp")

    def __str__(self):
        return f"Report #{self.report_id} - File: {self.report_file}"


class AuditLog(models.Model):
    """Security and compliance audit trail."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=100)
    details = models.TextField(blank=True, null=True)
    ip_address = models.CharField(max_length=45, blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        u = self.user.username if self.user else "System"
        return f"[{self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}] {u} - {self.action}"
