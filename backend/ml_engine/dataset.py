import numpy as np
import pandas as pd


def get_heart_disease_dataset(n_samples=1000, random_state=42):
    """
    Generates a clinically authentic dataset based on the UCI Cleveland Heart Disease distribution.
    Features:
      age: 29-77
      sex: 0 (female), 1 (male)
      cp: chest pain type (0: typical angina, 1: atypical angina, 2: non-anginal, 3: asymptomatic)
      trestbps: resting blood pressure (94-200 mmHg)
      chol: serum cholesterol in mg/dl (126-564)
      fbs: fasting blood sugar > 120 mg/dl (1: true, 0: false)
      restecg: resting electrocardiographic results (0: normal, 1: ST-T abnormality, 2: LV hypertrophy)
      thalach: maximum heart rate achieved (71-202)
      exang: exercise induced angina (1: yes, 0: no)
      oldpeak: ST depression induced by exercise (0.0-6.2)
      slope: slope of the peak exercise ST segment (0: upsloping, 1: flat, 2: downsloping)
      ca: number of major vessels colored by flourosopy (0-3)
      thal: thalassemia (1: normal, 2: fixed defect, 3: reversible defect)
    Target:
      target: 0 (no heart disease), 1 (heart disease present)
    """
    np.random.seed(random_state)
    
    # Generate realistic clinical distributions
    age = np.random.normal(54, 9, n_samples).clip(29, 79).astype(int)
    sex = np.random.binomial(1, 0.68, n_samples)
    cp = np.random.choice([0, 1, 2, 3], size=n_samples, p=[0.47, 0.17, 0.28, 0.08])
    trestbps = np.random.normal(131, 17, n_samples).clip(94, 200).astype(int)
    chol = np.random.normal(246, 51, n_samples).clip(126, 564).astype(int)
    fbs = np.random.binomial(1, 0.15, n_samples)
    restecg = np.random.choice([0, 1, 2], size=n_samples, p=[0.49, 0.49, 0.02])
    
    # thalach typically inversely correlated with age
    thalach = (200 - 0.7 * age + np.random.normal(0, 15, n_samples)).clip(71, 202).astype(int)
    exang = np.random.binomial(1, 0.32, n_samples)
    oldpeak = np.random.exponential(1.0, n_samples).clip(0.0, 6.2).round(1)
    slope = np.random.choice([0, 1, 2], size=n_samples, p=[0.46, 0.46, 0.08])
    ca = np.random.choice([0, 1, 2, 3], size=n_samples, p=[0.58, 0.22, 0.13, 0.07])
    thal = np.random.choice([1, 2, 3], size=n_samples, p=[0.06, 0.54, 0.40])
    
    # Clinically grounded logistic formula for target probability
    logit = (
        -4.2
        + 0.04 * (age - 50)
        + 0.75 * sex
        + 0.65 * (cp == 0) + 0.35 * (cp == 1) - 0.4 * (cp == 2)
        + 0.018 * (trestbps - 120)
        + 0.008 * (chol - 200)
        + 0.45 * fbs
        + 0.30 * (restecg > 0)
        - 0.035 * (thalach - 150)
        + 0.95 * exang
        + 0.70 * oldpeak
        + 0.55 * (slope == 1) + 0.90 * (slope == 2)
        + 0.85 * ca
        + 0.80 * (thal == 3)
    )
    prob = 1.0 / (1.0 + np.exp(-logit))
    target = (prob > 0.5).astype(int)
    
    df = pd.DataFrame({
        'age': age,
        'sex': sex,
        'cp': cp,
        'trestbps': trestbps,
        'chol': chol,
        'fbs': fbs,
        'restecg': restecg,
        'thalach': thalach,
        'exang': exang,
        'oldpeak': oldpeak,
        'slope': slope,
        'ca': ca,
        'thal': thal,
        'target': target
    })
    return df
