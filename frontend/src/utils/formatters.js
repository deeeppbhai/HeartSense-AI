/**
 * Utility functions for HeartSense AI: formatting, normalization, and clinical bounds.
 */

export const formatDate = (dateString, options = {}) => {
  if (!dateString) return 'N/A';
  const defaultOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  };
  return new Date(dateString).toLocaleDateString('en-US', defaultOptions);
};

export const formatProbability = (prob) => {
  if (prob === undefined || prob === null) return '0.0%';
  return `${(prob * 100).toFixed(1)}%`;
};

export const getRiskColor = (level) => {
  switch (level?.toLowerCase()) {
    case 'low':
      return { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', hex: '#10b981' };
    case 'moderate':
      return { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', hex: '#f59e0b' };
    case 'high':
      return { text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', hex: '#f97316' };
    case 'severe':
      return { text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', hex: '#f43f5e' };
    default:
      return { text: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200', hex: '#64748b' };
  }
};

export const BIOMARKER_METADATA = {
  age: { name: 'Age', unit: 'years', normal: '18-65' },
  sex: { name: 'Sex', labels: { 1: 'Male', 0: 'Female' } },
  cp: { name: 'Chest Pain Type', labels: { 0: 'Typical Angina', 1: 'Atypical Angina', 2: 'Non-anginal', 3: 'Asymptomatic' } },
  trestbps: { name: 'Resting Blood Pressure', unit: 'mm Hg', normal: '< 120' },
  chol: { name: 'Serum Cholesterol', unit: 'mg/dL', normal: '< 200' },
  fbs: { name: 'Fasting Blood Sugar > 120', labels: { 0: '<= 120 mg/dL', 1: '> 120 mg/dL' } },
  restecg: { name: 'Resting ECG', labels: { 0: 'Normal', 1: 'ST-T Abnormality', 2: 'LV Hypertrophy' } },
  thalach: { name: 'Max Heart Rate', unit: 'bpm', normal: '130-180' },
  exang: { name: 'Exercise Angina', labels: { 0: 'No', 1: 'Yes' } },
  oldpeak: { name: 'ST Depression', unit: 'mm', normal: '< 1.0' },
  slope: { name: 'ST Slope', labels: { 0: 'Upsloping', 1: 'Flat', 2: 'Downsloping' } },
  ca: { name: 'Fluoroscopy Vessels', normal: '0' },
  thal: { name: 'Thalassemia Scan', labels: { 1: 'Normal', 2: 'Fixed Defect', 3: 'Reversible Defect' } }
};
