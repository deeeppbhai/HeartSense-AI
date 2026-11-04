from rest_framework import serializers
from .models import MLModel


class MLModelSerializer(serializers.ModelSerializer):
    """
    Table 9: ML Model Serializer from Data Dictionary
    """
    id = serializers.IntegerField(source='model_id', read_only=True)
    name = serializers.CharField(source='model_name', read_only=True)
    model_type = serializers.CharField(source='algorithm', read_only=True)
    is_active = serializers.BooleanField(source='status', read_only=True)
    roc_auc = serializers.FloatField(source='auc_score', read_only=True)

    class Meta:
        model = MLModel
        fields = [
            'model_id', 'id', 'model_name', 'name', 'algorithm', 'model_type',
            'version', 'status', 'is_active', 'accuracy', 'precision', 'recall',
            'f1_score', 'auc_score', 'roc_auc', 'trained_date', 'confusion_matrix',
            'feature_importances', 'selection_notes'
        ]


# Backward compatibility alias
MLModelVersionSerializer = MLModelSerializer
