from django.db import models
from django.utils import timezone


class MLModel(models.Model):
    """
    Table 9: ML Model Table from Data Dictionary
    """
    model_id = models.AutoField(primary_key=True, help_text="Unique model identifier")
    model_name = models.CharField(max_length=100, help_text="Model name/identifier")
    algorithm = models.CharField(max_length=100, help_text="Algorithm (Random Forest, SVM, XGBoost, etc.)")
    accuracy = models.FloatField(default=0.0, help_text="Model accuracy score")
    precision = models.FloatField(default=0.0, help_text="Model precision score")
    recall = models.FloatField(default=0.0, help_text="Model recall score")
    f1_score = models.FloatField(default=0.0, help_text="F1 score")
    auc_score = models.FloatField(default=0.0, help_text="ROC-AUC evaluation score")
    version = models.CharField(max_length=20, default='1.0.0', help_text="Model version string")
    trained_date = models.DateTimeField(default=timezone.now, help_text="Model training completion date")
    status = models.BooleanField(default=False, help_text="Model active status flag")

    # Pipeline Artifact & Serialization paths
    file_path = models.CharField(max_length=255, blank=True, null=True)
    confusion_matrix = models.JSONField(default=dict, blank=True)
    feature_importances = models.JSONField(default=dict, blank=True)
    selection_notes = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-status', '-trained_date']

    def __str__(self):
        active_tag = " [ACTIVE]" if self.status else ""
        return f"{self.model_name} v{self.version} ({self.algorithm}){active_tag}"

    # Compatibility properties
    @property
    def is_active(self):
        return self.status

    @is_active.setter
    def is_active(self, val):
        self.status = val

    @property
    def roc_auc(self):
        return self.auc_score

    @roc_auc.setter
    def roc_auc(self, val):
        self.auc_score = val

    @property
    def name(self):
        return self.model_name

    @name.setter
    def name(self, val):
        self.model_name = val

    @property
    def model_type(self):
        return self.algorithm.lower().replace(' ', '_')


# Backward compatibility alias
MLModelVersion = MLModel
