from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from .models import MLModel
from .serializers import MLModelSerializer
from authentication.permissions import IsAdminUserCustom
from authentication.views import log_audit
from ml_engine.train_models import train_and_evaluate_all_models
from ml_engine.predictor import _MODEL_CACHE


class MLModelListView(generics.ListAPIView):
    """Table 9: Lists all available ML models with their performance metrics."""
    queryset = MLModel.objects.all().order_by('-status', 'model_name')
    serializer_class = MLModelSerializer
    permission_classes = [permissions.IsAuthenticated]


class MLModelActivateView(APIView):
    """Allows an administrator to toggle which model actively serves predictions."""
    permission_classes = [IsAdminUserCustom]

    def post(self, request, pk):
        try:
            target_model = MLModel.objects.get(Q(model_id=pk) | Q(pk=pk))
            # Deactivate all others
            MLModel.objects.filter(status=True).update(status=False)
            target_model.status = True
            target_model.save()

            # Invalidate memory cache so newly active model is loaded
            _MODEL_CACHE.clear()

            log_audit(
                request.user,
                'MODEL_ACTIVATED',
                f"Activated model {target_model.model_name} (v{target_model.version}) for production inference.",
                request
            )

            return Response({
                "message": f"Successfully activated {target_model.model_name}.",
                "model": MLModelSerializer(target_model).data
            }, status=status.HTTP_200_OK)
        except MLModel.DoesNotExist:
            return Response({"error": "Model not found."}, status=status.HTTP_404_NOT_FOUND)


class MLModelRetrainView(APIView):
    """Allows an administrator to trigger re-training of all 4 models."""
    permission_classes = [IsAdminUserCustom]

    def post(self, request):
        try:
            results = train_and_evaluate_all_models()
            _MODEL_CACHE.clear()

            log_audit(
                request.user,
                'MODELS_RETRAINED',
                "Administrator triggered full retraining of all 4 model pipelines.",
                request
            )

            models = MLModel.objects.all()
            return Response({
                "message": "All models successfully retrained and updated.",
                "models": MLModelSerializer(models, many=True).data,
                "summary": results
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                "error": f"Model training failed: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
