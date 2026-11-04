from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import HttpResponse
from django.db.models import Count, Q, Avg
from django.contrib.auth import get_user_model

from .models import (
    Patient, MedicalAssessment, Prediction, ExplainableAI,
    Recommendation, AIChat, Report, AuditLog
)
from .serializers import (
    PatientSerializer,
    MedicalAssessmentSerializer,
    PredictionSerializer,
    PredictionCreateSerializer,
    AIChatSerializer,
    ReportSerializer,
    AuditLogSerializer
)
from .reports import generate_clinical_pdf
from authentication.permissions import (
    IsDoctor,
    IsDoctorOrAdmin,
    IsAdminUserCustom,
    IsOwnerOrDoctorOrAdmin
)
from authentication.views import log_audit
from ml_engine.predictor import predict_heart_disease
from ml_engine.models import MLModel

User = get_user_model()

CP_MAP = {0: 'Typical Angina', 1: 'Atypical Angina', 2: 'Non-anginal Pain', 3: 'Asymptomatic'}
ECG_MAP = {0: 'Normal', 1: 'ST-T Abnormality', 2: 'LV Hypertrophy'}
SLOPE_MAP = {0: 'Upsloping', 1: 'Flat', 2: 'Downsloping'}
THAL_MAP = {1: 'Normal', 2: 'Fixed Defect', 3: 'Reversible Defect'}


def get_or_create_patient_for_user(user, age=50, gender='Male'):
    patient, _ = Patient.objects.get_or_create(
        user_id=user,
        defaults={
            'age': age,
            'gender': gender,
            'height': 172.0,
            'weight': 72.0,
            'blood_pressure': '120/80',
            'cholesterol': 200.0,
            'fasting_blood_sugar': 95.0,
            'smoking_status': False,
            'family_history': False,
        }
    )
    return patient


class AssessmentCreateView(APIView):
    """
    Table 3 & 4: Submits a new clinical assessment and runs ML prediction pipeline,
    persisting into MedicalAssessment, Prediction, ExplainableAI, and Recommendation tables.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PredictionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Determine target patient
        if request.user.role.lower() == 'patient':
            target_user = request.user
            target_patient = get_or_create_patient_for_user(
                target_user,
                age=data['age'],
                gender='Male' if data['sex'] == 1 else 'Female'
            )
        else: # Doctor or Admin
            patient_id = data.get('patient_id')
            if patient_id:
                try:
                    # Check if patient_id matches Patient PK or User PK
                    target_patient = Patient.objects.filter(Q(patient_id=patient_id) | Q(user_id__id=patient_id)).first()
                    if not target_patient:
                        user_obj = User.objects.get(id=patient_id)
                        target_patient = get_or_create_patient_for_user(user_obj, age=data['age'], gender='Male' if data['sex'] == 1 else 'Female')
                except Exception:
                    return Response({"error": f"Patient with ID #{patient_id} not found."}, status=status.HTTP_404_NOT_FOUND)
                    target_patient = get_or_create_patient_for_user(request.user, age=data['age'], gender='Male' if data['sex'] == 1 else 'Female')

        # Automatically associate patient with attending doctor if doctor conducts assessment
        if request.user.role.lower() == 'doctor' and target_patient:
            target_patient.assigned_doctor = request.user
            target_patient.save(update_fields=['assigned_doctor'])

        # 1. Create MedicalAssessment record (Table 3)
        assessment = MedicalAssessment.objects.create(
            patient_id=target_patient,
            chest_pain_type=CP_MAP.get(data['cp'], 'Typical Angina'),
            resting_bp=data['trestbps'],
            cholesterol=data['chol'],
            fasting_bs=(data['fbs'] == 1),
            resting_ecg=ECG_MAP.get(data['restecg'], 'Normal'),
            max_heart_rate=int(data['thalach']),
            exercise_angina=(data['exang'] == 1),
            oldpeak=data['oldpeak'],
            st_slope=SLOPE_MAP.get(data['slope'], 'Upsloping'),
            vessels=data['ca'],
            thalassemia=THAL_MAP.get(data['thal'], 'Normal')
        )

        # 2. Run ML Prediction pipeline
        features = {
            'age': data['age'],
            'sex': data['sex'],
            'cp': data['cp'],
            'trestbps': data['trestbps'],
            'chol': data['chol'],
            'fbs': data['fbs'],
            'restecg': data['restecg'],
            'thalach': data['thalach'],
            'exang': data['exang'],
            'oldpeak': data['oldpeak'],
            'slope': data['slope'],
            'ca': data['ca'],
            'thal': data['thal']
        }

        try:
            result = predict_heart_disease(features)
        except Exception as e:
            return Response({"error": f"ML Inference error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # 3. Create Prediction record (Table 4)
        prediction = Prediction.objects.create(
            assessment_id=assessment,
            model_name=result['model_name'],
            prediction=result['prediction'],
            risk_score=result['risk_score'],
            risk_level=result['risk_level'],
            confidence_score=result['confidence_score'],
            doctor_notes=data.get('doctor_notes', ''),
            follow_up_recommended=data.get('follow_up_recommended', False)
        )

        # 4. Create ExplainableAI records (Table 5)
        for exp in result.get('explanations', []):
            ExplainableAI.objects.create(
                prediction_id=prediction,
                method=exp.get('method', 'SHAP'),
                feature_name=exp.get('feature_name', ''),
                feature_value=str(exp.get('feature_value', '')),
                contribution=float(exp.get('contribution', 0.0)),
                explanation_text=exp.get('explanation_text', '')
            )

        # 5. Create Recommendation record (Table 6)
        recs_dict = result.get('recommendations_data', {})
        Recommendation.objects.create(
            prediction_id=prediction,
            diet_advice=recs_dict.get('diet_advice', ''),
            exercise_advice=recs_dict.get('exercise_advice', ''),
            lifestyle_advice=recs_dict.get('lifestyle_advice', ''),
            medical_advice=recs_dict.get('medical_advice', '')
        )

        # 6. Create Report record (Table 8)
        Report.objects.create(
            patient_id=target_patient,
            prediction_id=prediction,
            report_file=f"HeartSense_Report_HS-{prediction.prediction_id:06d}.pdf",
            generated_by=request.user
        )

        log_audit(
            request.user,
            'ASSESSMENT_COMPLETED',
            f"Prediction #{prediction.prediction_id} generated for {target_patient.user_id.username}: {prediction.risk_level} ({prediction.risk_score}%).",
            request
        )

        return Response(PredictionSerializer(prediction).data, status=status.HTTP_201_CREATED)


class PredictionHistoryView(generics.ListAPIView):
    """
    Returns prediction history matching Data Dictionary Table 4.
    """
    serializer_class = PredictionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Prediction.objects.select_related(
            'assessment_id',
            'assessment_id__patient_id',
            'assessment_id__patient_id__user_id'
        ).prefetch_related('explanations', 'recommendations_set').all()

        if user.role.lower() == 'patient':
            queryset = queryset.filter(assessment_id__patient_id__user_id=user)
        elif user.role.lower() == 'doctor':
            queryset = queryset.filter(
                Q(assessment_id__patient_id__assigned_doctor=user) |
                Q(reports__generated_by=user)
            ).distinct()
        else:
            doctor_id = self.request.query_params.get('doctor_id')
            if doctor_id:
                queryset = queryset.filter(
                    Q(assessment_id__patient_id__assigned_doctor__id=doctor_id) |
                    Q(reports__generated_by__id=doctor_id)
                ).distinct()

        patient_id = self.request.query_params.get('patient_id')
        if patient_id:
            queryset = queryset.filter(
                Q(assessment_id__patient_id__patient_id=patient_id) |
                Q(assessment_id__patient_id__user_id__id=patient_id)
            )
        risk_level = self.request.query_params.get('risk_level')
        if risk_level:
            queryset = queryset.filter(risk_level__iexact=risk_level)

        return queryset.order_by('-prediction_date')


class PredictionDetailView(generics.RetrieveUpdateAPIView):
    """
    Retrieve single prediction details (Table 4) or update doctor notes.
    """
    queryset = Prediction.objects.select_related(
        'assessment_id',
        'assessment_id__patient_id',
        'assessment_id__patient_id__user_id'
    ).prefetch_related('explanations', 'recommendations_set').all()
    serializer_class = PredictionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        pk = self.kwargs.get('pk')
        try:
            return Prediction.objects.get(prediction_id=pk)
        except Prediction.DoesNotExist:
            return Prediction.objects.get(pk=pk)

    def perform_update(self, serializer):
        pred = serializer.save()
        log_audit(
            self.request.user,
            'DOCTOR_NOTE_UPDATED',
            f"Physician notes updated for prediction #{pred.prediction_id}.",
            self.request
        )


class PDFReportDownloadView(APIView):
    """Generates and streams a clinical ReportLab PDF download."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            pred = Prediction.objects.select_related(
                'assessment_id',
                'assessment_id__patient_id',
                'assessment_id__patient_id__user_id'
            ).prefetch_related('explanations', 'recommendations_set').get(Q(prediction_id=pk) | Q(pk=pk))
        except Prediction.DoesNotExist:
            return Response({"error": "Prediction record not found."}, status=status.HTTP_404_NOT_FOUND)

        # Access check
        patient_user = pred.assessment_id.patient_id.user_id
        if request.user.role.lower() == 'patient' and patient_user != request.user:
            return Response({"error": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

        pdf_buffer = generate_clinical_pdf(pred)

        log_audit(
            request.user,
            'REPORT_DOWNLOADED',
            f"User {request.user.username} downloaded PDF report for prediction #{pred.prediction_id}.",
            request
        )

        response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
        filename = f"HeartSense_Report_HS-{pred.prediction_id:06d}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response


class PatientRosterView(generics.ListAPIView):
    """Table 2: Patient Table listing for physicians and administrators."""
    serializer_class = PatientSerializer
    permission_classes = [IsDoctorOrAdmin]

    def get_queryset(self):
        user = self.request.user
        queryset = Patient.objects.select_related('user_id', 'assigned_doctor').prefetch_related('assessments').all()

        if user.role.lower() == 'doctor':
            queryset = queryset.filter(
                Q(assigned_doctor=user) |
                Q(reports__generated_by=user)
            ).distinct()

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(user_id__first_name__icontains=search) |
                Q(user_id__last_name__icontains=search) |
                Q(user_id__username__icontains=search) |
                Q(user_id__email__icontains=search) |
                Q(user_id__phone__icontains=search)
            )
        return queryset.order_by('-created_at')


class PatientDetailCRUDView(generics.RetrieveUpdateDestroyAPIView):
    """
    Table 2: Full CRUD for patient record:
    - GET: view patient record
    - PATCH / PUT: update patient profile / clinical parameters
    - DELETE: delete patient record
    """
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [IsDoctorOrAdmin]

    def perform_update(self, serializer):
        patient = serializer.save()
        log_audit(
            self.request.user,
            'PATIENT_RECORD_UPDATED',
            f"Patient #{patient.patient_id} ({patient.user_id.username}) updated.",
            self.request
        )

    def perform_destroy(self, instance):
        pid = instance.patient_id
        uname = instance.user_id.username
        instance.delete()
        log_audit(
            self.request.user,
            'PATIENT_RECORD_DELETED',
            f"Patient #{pid} ({uname}) deleted.",
            self.request
        )


class AIChatView(APIView):
    """
    Table 7: AI Chat Table endpoint.
    Records user inquiries and responses into AIChat table.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        question = request.data.get('question', '').strip()
        ai_response = request.data.get('ai_response', '').strip()

        if not question or not ai_response:
            return Response({"error": "Both question and ai_response are required."}, status=status.HTTP_400_BAD_REQUEST)

        chat_record = AIChat.objects.create(
            user_id=request.user,
            question=question,
            ai_response=ai_response
        )
        return Response(AIChatSerializer(chat_record).data, status=status.HTTP_201_CREATED)

    def get(self, request):
        chats = AIChat.objects.filter(user_id=request.user).order_by('-created_at')[:20]
        return Response(AIChatSerializer(chats, many=True).data)


class DoctorDashboardStatsView(APIView):
    """Caseload statistics matching Data Dictionary schemas."""
    permission_classes = [IsDoctor]

    def get(self, request):
        total_patients = Patient.objects.count()
        total_predictions = Prediction.objects.count()

        risk_counts = {
            'Low': Prediction.objects.filter(risk_level='Low').count(),
            'Moderate': Prediction.objects.filter(risk_level='Moderate').count(),
            'High': Prediction.objects.filter(risk_level='High').count(),
            'Severe': Prediction.objects.filter(risk_level='Severe').count(),
        }
        # If Severe count was merged into High
        if risk_counts['Severe'] == 0:
            risk_counts['Severe'] = Prediction.objects.filter(risk_score__gte=75.0).count()

        pending_followups = Prediction.objects.filter(follow_up_recommended=True).count()
        recent = Prediction.objects.select_related(
            'assessment_id',
            'assessment_id__patient_id',
            'assessment_id__patient_id__user_id'
        ).order_by('-prediction_date')[:5]

        recent_data = PredictionSerializer(recent, many=True).data

        return Response({
            'total_patients': total_patients,
            'total_predictions': total_predictions,
            'risk_distribution': risk_counts,
            'pending_followups': pending_followups,
            'recent_assessments': recent_data
        })


class AdminDashboardStatsView(APIView):
    """Telemetry and system health for administrators."""
    permission_classes = [IsAdminUserCustom]

    def get(self, request):
        user_counts = {
            'patients': User.objects.filter(role__iexact='patient').count(),
            'doctors': User.objects.filter(role__iexact='doctor').count(),
            'admins': User.objects.filter(role__iexact='admin').count(),
            'total': User.objects.count(),
            'pending_doctors': User.objects.filter(role__iexact='doctor', is_approved=False).count()
        }

        total_predictions = Prediction.objects.count()
        avg_risk = Prediction.objects.aggregate(avg=Avg('risk_score'))['avg'] or 0.0

        active_model = MLModel.objects.filter(status=True).first()
        active_model_data = {
            'name': active_model.model_name if active_model else 'None',
            'version': active_model.version if active_model else 'N/A',
            'accuracy': active_model.accuracy if active_model else 0.0,
            'roc_auc': active_model.auc_score if active_model else 0.0,
            'f1_score': active_model.f1_score if active_model else 0.0,
        } if active_model else None

        recent_audits = AuditLog.objects.select_related('user').order_by('-timestamp')[:8]
        recent_audits_data = AuditLogSerializer(recent_audits, many=True).data

        return Response({
            'users': user_counts,
            'total_predictions': total_predictions,
            'average_risk_probability': round(float(avg_risk) / 100.0, 4),
            'active_model': active_model_data,
            'recent_audits': recent_audits_data
        })


class AuditLogListView(generics.ListAPIView):
    """Security audit logs for administrators."""
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminUserCustom]

    def get_queryset(self):
        queryset = AuditLog.objects.select_related('user').order_by('-timestamp')
        action = self.request.query_params.get('action')
        search = self.request.query_params.get('search')

        if action:
            queryset = queryset.filter(action=action)
        if search:
            queryset = queryset.filter(
                Q(details__icontains=search) |
                Q(user__username__icontains=search) |
                Q(user__email__icontains=search)
            )
        return queryset
