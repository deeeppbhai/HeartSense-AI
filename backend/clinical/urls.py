from django.urls import path
from .views import (
    AssessmentCreateView,
    PredictionHistoryView,
    PredictionDetailView,
    PDFReportDownloadView,
    PatientRosterView,
    PatientDetailCRUDView,
    DoctorDashboardStatsView,
    AdminDashboardStatsView,
    AuditLogListView,
    AIChatView
)

urlpatterns = [
    path('assessments/', AssessmentCreateView.as_view(), name='assessment_create'),
    path('assessments/history/', PredictionHistoryView.as_view(), name='assessment_history'),
    path('assessments/<int:pk>/', PredictionDetailView.as_view(), name='assessment_detail'),
    path('assessments/<int:pk>/pdf/', PDFReportDownloadView.as_view(), name='assessment_pdf'),
    path('patients/', PatientRosterView.as_view(), name='patient_roster'),
    path('patients/<int:pk>/', PatientDetailCRUDView.as_view(), name='patient_detail_crud'),
    path('chat/', AIChatView.as_view(), name='ai_chat'),
    path('doctor/dashboard/', DoctorDashboardStatsView.as_view(), name='doctor_dashboard'),
    path('admin/dashboard/', AdminDashboardStatsView.as_view(), name='admin_dashboard'),
    path('admin/audit-logs/', AuditLogListView.as_view(), name='admin_audit_logs'),
]
