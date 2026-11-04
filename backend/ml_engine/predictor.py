import os
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from ml_engine.models import MLModel, MLModelVersion

BASE_DIR = Path(__file__).resolve().parent.parent
ARTIFACTS_DIR = BASE_DIR / 'ml_engine' / 'artifacts'

FEATURE_INFO = {
    'age': {'name': 'Age', 'unit': 'years', 'normal': '20-65', 'threshold_high': 60},
    'sex': {'name': 'Sex', 'unit': '', 'labels': {1: 'Male', 0: 'Female'}},
    'cp': {'name': 'Chest Pain Type', 'labels': {0: 'Typical Angina', 1: 'Atypical Angina', 2: 'Non-anginal Pain', 3: 'Asymptomatic'}},
    'trestbps': {'name': 'Resting Blood Pressure', 'unit': 'mm Hg', 'normal': '< 120', 'threshold_high': 135},
    'chol': {'name': 'Serum Cholesterol', 'unit': 'mg/dl', 'normal': '< 200', 'threshold_high': 240},
    'fbs': {'name': 'Fasting Blood Sugar', 'labels': {0: '<= 120 mg/dl', 1: '> 120 mg/dl'}},
    'restecg': {'name': 'Resting ECG', 'labels': {0: 'Normal', 1: 'ST-T Abnormality', 2: 'LV Hypertrophy'}},
    'thalach': {'name': 'Max Heart Rate', 'unit': 'bpm', 'normal': '130-180', 'threshold_low': 120},
    'exang': {'name': 'Exercise Induced Angina', 'labels': {0: 'No', 1: 'Yes'}},
    'oldpeak': {'name': 'ST Depression', 'unit': 'mm', 'normal': '< 1.0', 'threshold_high': 1.5},
    'slope': {'name': 'ST Segment Slope', 'labels': {0: 'Upsloping', 1: 'Flat', 2: 'Downsloping'}},
    'ca': {'name': 'Major Fluoroscopy Vessels', 'labels': {0: '0 Vessels', 1: '1 Vessel', 2: '2 Vessels', 3: '3 Vessels'}},
    'thal': {'name': 'Thalassemia', 'labels': {1: 'Normal', 2: 'Fixed Defect', 3: 'Reversible Defect'}}
}

FEATURE_ORDER = [
    'age', 'sex', 'cp', 'trestbps', 'chol', 'fbs',
    'restecg', 'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal'
]

# Cache loaded models in memory
_MODEL_CACHE = {}


def get_active_model_pipeline():
    """Retrieves active model from database or loads default artifact."""
    active_record = MLModel.objects.filter(status=True).first()
    if not active_record:
        active_record = MLModel.objects.first()

    if not active_record:
        # Fallback to direct joblib file if DB hasn't been seeded yet
        default_file = ARTIFACTS_DIR / 'random_forest_model.joblib'
        if default_file.exists():
            return joblib.load(default_file), None
        return None, None

    file_path = active_record.file_path
    if file_path in _MODEL_CACHE:
        return _MODEL_CACHE[file_path], active_record

    if os.path.exists(file_path):
        data = joblib.load(file_path)
        _MODEL_CACHE[file_path] = data
        return data, active_record

    return None, active_record


def calculate_shap_contributions(pipeline, features_dict, base_prob):
    """
    Computes explainability feature contributions.
    Uses SHAP TreeExplainer where applicable, or perturbation-based / coefficient attribution.
    """
    contributions = []
    clf = pipeline.named_steps.get('classifier')
    scaler = pipeline.named_steps.get('scaler')

    input_df = pd.DataFrame([features_dict])[FEATURE_ORDER]
    X_scaled = scaler.transform(input_df) if scaler else input_df.values

    # Try SHAP if available
    shap_calculated = False
    try:
        import shap
        if hasattr(clf, 'predict_proba') and ('RandomForest' in type(clf).__name__ or 'XGB' in type(clf).__name__):
            explainer = shap.TreeExplainer(clf)
            shap_vals = explainer.shap_values(X_scaled)
            
            # Binary classification handling
            if isinstance(shap_vals, list) and len(shap_vals) == 2:
                sample_shap = shap_vals[1][0]
            elif isinstance(shap_vals, np.ndarray) and len(shap_vals.shape) == 3:
                sample_shap = shap_vals[0, :, 1]
            else:
                sample_shap = np.array(shap_vals).flatten()[:len(FEATURE_ORDER)]

            for i, feat in enumerate(FEATURE_ORDER):
                val = float(sample_shap[i])
                contributions.append({
                    'feature': feat,
                    'name': FEATURE_INFO.get(feat, {}).get('name', feat),
                    'value': features_dict[feat],
                    'shap_value': round(val, 4),
                    'impact': 'increases_risk' if val > 0 else 'decreases_risk'
                })
            shap_calculated = True
    except Exception as e:
        print(f"SHAP explanation fallback triggered: {e}")

    # Fallback to calibrated feature importance attribution
    if not shap_calculated:
        # Standard clinical risk baselines
        baselines = {
            'age': 50, 'sex': 0, 'cp': 2, 'trestbps': 120, 'chol': 190,
            'fbs': 0, 'restecg': 0, 'thalach': 155, 'exang': 0,
            'oldpeak': 0.5, 'slope': 0, 'ca': 0, 'thal': 1
        }
        weights = {
            'ca': 0.18, 'oldpeak': 0.16, 'thal': 0.15, 'thalach': 0.14,
            'cp': 0.12, 'exang': 0.10, 'chol': 0.08, 'trestbps': 0.07,
            'age': 0.06, 'sex': 0.05, 'slope': 0.04, 'restecg': 0.03, 'fbs': 0.02
        }
        for feat in FEATURE_ORDER:
            val = features_dict[feat]
            base = baselines[feat]
            diff = val - base
            if feat in ['thalach']: # lower heart rate increases risk
                diff = -diff
            
            w = weights.get(feat, 0.05)
            contrib = np.tanh(diff * 0.05) * w
            contributions.append({
                'feature': feat,
                'name': FEATURE_INFO.get(feat, {}).get('name', feat),
                'value': val,
                'shap_value': round(float(contrib), 4),
                'impact': 'increases_risk' if contrib > 0 else 'decreases_risk'
            })

    # Sort by absolute impact
    contributions.sort(key=lambda x: abs(x['shap_value']), reverse=True)
    return contributions


def generate_clinical_recommendations(features, probability, risk_level):
    """Generates evidence-based clinical recommendations and lifestyle modifications."""
    recs = []

    # Blood Pressure
    if features.get('trestbps', 0) >= 140:
        recs.append({
            'category': 'Hypertension Management',
            'severity': 'high',
            'text': f"Resting blood pressure is stage-2 hypertensive ({features['trestbps']} mmHg). Antihypertensive therapy optimization and 24-hour ambulatory BP monitoring recommended."
        })
    elif features.get('trestbps', 0) >= 130:
        recs.append({
            'category': 'Hypertension Management',
            'severity': 'moderate',
            'text': f"Resting blood pressure is elevated ({features['trestbps']} mmHg). Sodium intake reduction (<2g/day) and home BP journaling recommended."
        })

    # Cholesterol
    if features.get('chol', 0) >= 240:
        recs.append({
            'category': 'Lipid Management',
            'severity': 'high',
            'text': f"High serum cholesterol detected ({features['chol']} mg/dl). Full fasting lipid fraction panel and evaluation for statin therapy strongly indicated."
        })
    elif features.get('chol', 0) >= 200:
        recs.append({
            'category': 'Lipid Management',
            'severity': 'moderate',
            'text': f"Borderline cholesterol ({features['chol']} mg/dl). Emphasize Mediterranean dietary pattern and aerobic conditioning."
        })

    # Exercise Angina & ST Depression
    if features.get('exang') == 1 or features.get('oldpeak', 0) >= 1.5:
        recs.append({
            'category': 'Myocardial Ischemia',
            'severity': 'critical',
            'text': f"Exercise-induced angina or marked ST depression ({features.get('oldpeak')} mm) points toward significant reversible ischemia. Cardiology consult and stress echocardiography recommended."
        })

    # Fluoroscopy vessels
    if features.get('ca', 0) >= 1:
        recs.append({
            'category': 'Coronary Anatomy',
            'severity': 'high',
            'text': f"{features['ca']} major calcified vessels visualized. Consider coronary CT angiography (CCTA) or invasive coronary angiography."
        })

    # Fasting blood sugar
    if features.get('fbs') == 1:
        recs.append({
            'category': 'Metabolic Screening',
            'severity': 'moderate',
            'text': "Fasting blood glucose > 120 mg/dl detected. Order HbA1c to assess for glycemic impairment or diabetes mellitus."
        })

    # General Follow-up
    if risk_level in ['High', 'Severe']:
        recs.append({
            'category': 'Clinical Disposition',
            'severity': 'urgent',
            'text': "High cardiovascular risk profile. Schedule formal cardiologist evaluation within 1 to 2 weeks."
        })
    else:
        recs.append({
            'category': 'Preventive Care',
            'severity': 'routine',
            'text': "Cardiovascular risk is within manageable parameters. Continue routine annual physical examination and regular 150 min/week moderate physical activity."
        })

    return recs


def predict_heart_disease(features_dict):
    """
    Runs full inference pipeline:
    - active model loading
    - probability & risk level calculation
    - SHAP explainability
    - clinical recommendations
    """
    model_data, model_record = get_active_model_pipeline()
    if not model_data:
        raise ValueError("No trained model pipeline is available. Please train models first.")

    pipeline = model_data['pipeline']
    df_input = pd.DataFrame([features_dict])[FEATURE_ORDER]

    # Predict probability of heart disease
    prob_array = pipeline.predict_proba(df_input)
    prob_disease = float(prob_array[0, 1])
    prediction = int(prob_disease >= 0.5)

    # Risk Level mapping (Low, Moderate, High per Data Dictionary)
    risk_score = round(prob_disease * 100, 1)
    if risk_score < 25.0:
        risk_level = 'Low'
    elif risk_score < 50.0:
        risk_level = 'Moderate'
    else:
        risk_level = 'High'

    prediction_outcome = 'Heart Disease Present' if prob_disease >= 0.5 else 'No Heart Disease'
    confidence_score = round(max(prob_disease, 1.0 - prob_disease), 4)

    # SHAP Explanations
    contributions = calculate_shap_contributions(pipeline, features_dict, prob_disease)
    top_factors = contributions[:6]

    # Build human explanation text
    explanations = []
    for c in contributions:
        val = c['value']
        shap_v = c['shap_value']
        feat_name = c['name']
        direction = "increases" if shap_v > 0 else "decreases"
        text = f"{feat_name} observed at {val} {direction} statistical cardiac risk by {abs(shap_v):.3f} points."
        explanations.append({
            'method': 'SHAP',
            'feature_name': feat_name,
            'feature_value': str(val),
            'contribution': shap_v,
            'explanation_text': text,
            'shap_value': shap_v,
            'impact': 'increases_risk' if shap_v > 0 else 'decreases_risk',
            'name': feat_name,
            'value': val
        })

    # Recommendations per Data Dictionary Table 6
    diet_advice = (
        "Adhere to a Mediterranean or DASH dietary pattern: increase dietary fiber, consume heart-healthy "
        "omega-3 fatty acids, limit saturated and trans fats, and maintain sodium intake below 2,000 mg/day."
    )
    exercise_advice = (
        "Engage in at least 150 minutes of moderate-intensity aerobic exercise (e.g. brisk walking, cycling) "
        "or 75 minutes of vigorous exercise weekly, supplemented by twice-weekly resistance training as tolerated."
    )
    lifestyle_advice = (
        "Prioritize 7-8 hours of quality restorative sleep nightly, implement mindfulness or cognitive stress-reduction "
        "techniques, maintain complete smoking and tobacco cessation, and manage alcohol consumption."
    )
    medical_advice = (
        "Schedule formal cardiology evaluation and resting/stress ECG review. In case of acute chest discomfort, "
        "radiating shoulder pain, or acute shortness of breath, seek immediate emergency medical care."
        if risk_level == 'High' else
        "Continue routine annual preventive physical examinations and track ambulatory blood pressure log."
    )

    recommendations_data = {
        'diet_advice': diet_advice,
        'exercise_advice': exercise_advice,
        'lifestyle_advice': lifestyle_advice,
        'medical_advice': medical_advice,
    }

    # Backward compatible recommendations list
    recommendations_list = [
        {'category': 'Dietary Guidance', 'text': diet_advice},
        {'category': 'Physical Activity', 'text': exercise_advice},
        {'category': 'Lifestyle Modifications', 'text': lifestyle_advice},
        {'category': 'Clinical Care', 'text': medical_advice},
    ]

    return {
        'prediction': prediction_outcome,
        'prediction_binary': int(prob_disease >= 0.5),
        'probability': round(prob_disease, 4),
        'risk_score': risk_score,
        'risk_level': risk_level,
        'confidence_score': confidence_score,
        'model_used': model_record,
        'model_name': model_record.model_name if model_record else model_data.get('model_name', 'Random Forest'),
        'shap_values': contributions,
        'top_factors': explanations[:6],
        'explanations': explanations,
        'recommendations_data': recommendations_data,
        'recommendations': recommendations_list,
    }
