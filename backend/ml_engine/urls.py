from django.urls import path
from .views import MLModelListView, MLModelActivateView, MLModelRetrainView

urlpatterns = [
    path('models/', MLModelListView.as_view(), name='ml_model_list'),
    path('models/<int:pk>/activate/', MLModelActivateView.as_view(), name='ml_model_activate'),
    path('models/retrain/', MLModelRetrainView.as_view(), name='ml_model_retrain'),
]
