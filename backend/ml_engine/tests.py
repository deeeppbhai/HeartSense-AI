from django.test import TestCase
from ml_engine.models import MLModel
from ml_engine.predictor import predict_heart_disease


class MLModelDataDictionaryTestCase(TestCase):
    def setUp(self):
        # Table 9: ML Model Table record
        self.rf_model = MLModel.objects.create(
            model_name='Random Forest Classifier',
            algorithm='Random Forest',
            accuracy=0.904,
            precision=0.930,
            recall=0.736,
            f1_score=0.822,
            auc_score=0.967,
            version='1.0.0',
            status=True,
            file_path='ml_engine/artifacts/random_forest_model.joblib'
        )

    def test_table9_mlmodel_fields(self):
        """Verify Table 9 MLModel fields and properties."""
        self.assertEqual(self.rf_model.algorithm, 'Random Forest')
        self.assertTrue(self.rf_model.status)
        self.assertEqual(self.rf_model.model_id, self.rf_model.pk)
        self.assertAlmostEqual(self.rf_model.accuracy, 0.904)
        self.assertAlmostEqual(self.rf_model.auc_score, 0.967)

    def test_prediction_output_schema(self):
        """Verify predict_heart_disease returns structured schema matching Data Dictionary."""
        features = {
            'age': 58, 'sex': 1, 'cp': 1, 'trestbps': 142.0, 'chol': 255.0,
            'fbs': 0, 'restecg': 1, 'thalach': 138.0, 'exang': 1, 'oldpeak': 1.6,
            'slope': 1, 'ca': 1, 'thal': 2
        }
        result = predict_heart_disease(features)
        self.assertIn('prediction', result)
        self.assertIn('risk_score', result)
        self.assertIn('risk_level', result)
        self.assertIn('confidence_score', result)
        self.assertIn('explanations', result)
        self.assertIn('recommendations_data', result)
        
        # Verify explanations contain SHAP data
        self.assertTrue(len(result['explanations']) > 0)
        first_exp = result['explanations'][0]
        self.assertIn('feature_name', first_exp)
        self.assertIn('contribution', first_exp)
        self.assertIn('explanation_text', first_exp)

        # Verify recommendations data contains 4 advice domains
        recs = result['recommendations_data']
        self.assertIn('diet_advice', recs)
        self.assertIn('exercise_advice', recs)
        self.assertIn('lifestyle_advice', recs)
        self.assertIn('medical_advice', recs)
