import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  HeartPulse, Activity, Zap, CheckCircle2, AlertCircle, ArrowRight,
  Info, Sparkles, HelpCircle, User, FileText
} from 'lucide-react';

const PRESETS = {
  athletic: {
    label: 'Healthy Baseline (Low Risk)',
    data: {
      age: 38, sex: 0, cp: 2, trestbps: 114, chol: 175, fbs: 0,
      restecg: 0, thalach: 175, exang: 0, oldpeak: 0.1, slope: 0, ca: 0, thal: 1
    }
  },
  moderate: {
    label: 'Hypertensive & Elevated (Moderate)',
    data: {
      age: 56, sex: 1, cp: 1, trestbps: 138, chol: 242, fbs: 0,
      restecg: 1, thalach: 140, exang: 1, oldpeak: 1.4, slope: 1, ca: 1, thal: 2
    }
  },
  severe: {
    label: 'Critical Multi-Vessel CAD (Severe)',
    data: {
      age: 67, sex: 1, cp: 0, trestbps: 168, chol: 285, fbs: 1,
      restecg: 1, thalach: 108, exang: 1, oldpeak: 2.8, slope: 2, ca: 2, thal: 3
    }
  }
};

const NewAssessment = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [followUpRecommended, setFollowUpRecommended] = useState(false);

  // Initialize form
  const [formData, setFormData] = useState({
    age: 52,
    sex: 1,
    cp: 1,
    trestbps: 130,
    chol: 220,
    fbs: 0,
    restecg: 0,
    thalach: 145,
    exang: 0,
    oldpeak: 1.0,
    slope: 1,
    ca: 0,
    thal: 2,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // If doctor, load patient list
  useEffect(() => {
    if (role === 'doctor' || role === 'admin') {
      api.get('/clinical/patients/')
        .then((res) => {
          const list = res.data.results || res.data || [];
          setPatients(list);
          // Check query params if pre-selected
          const params = new URLSearchParams(location.search);
          const pid = params.get('patient_id');
          if (pid) setSelectedPatientId(pid);
          else if (list.length > 0) setSelectedPatientId(list[0].id);
        })
        .catch((err) => console.error('Failed to load patients', err));
    }
  }, [role, location]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : parseInt(value, 10)
    }));
  };

  const applyPreset = (key) => {
    const preset = PRESETS[key];
    if (preset) {
      setFormData(preset.data);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const payload = {
      ...formData,
      doctor_notes: doctorNotes,
      follow_up_recommended: followUpRecommended,
    };

    if ((role === 'doctor' || role === 'admin') && selectedPatientId) {
      payload.patient_id = parseInt(selectedPatientId, 10);
    }

    try {
      const res = await api.post('/clinical/assessments/', payload);
      setSubmitting(false);
      navigate(`/assessment/${res.data.id}`);
    } catch (err) {
      setSubmitting(false);
      const msg = err.response?.data?.error || 'Failed to compute cardiac risk assessment. Please check inputs.';
      setError(msg);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-card">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 rounded-lg bg-brand-50 text-brand-600">
              <HeartPulse className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">
              Clinical Assessment Protocol
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Comprehensive Cardiac Risk Assessment
          </h1>
          <p className="mt-1 text-sm text-slate-500 max-w-xl">
            Input standardized clinical parameters to calculate multi-algorithm cardiovascular disease probability and SHAP explainability.
          </p>
        </div>

        {/* Quick Test Presets */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            1-Click Test Data
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => applyPreset('athletic')}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
            >
              Healthy
            </button>
            <button
              type="button"
              onClick={() => applyPreset('moderate')}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
            >
              Moderate
            </button>
            <button
              type="button"
              onClick={() => applyPreset('severe')}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
            >
              Severe
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* If Doctor/Admin: Patient Selector & Clinical Context */}
        {(role === 'doctor' || role === 'admin') && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <User className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">Patient Clinical Dossier</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Assign to Patient Profile
                </label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 bg-slate-50"
                  required
                >
                  <option value="">-- Select Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name} ({p.email}) - PID-{String(p.id).padStart(5, '0')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Specialist Referral Flag
                </label>
                <div className="flex items-center h-10 mt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={followUpRecommended}
                      onChange={(e) => setFollowUpRecommended(e.target.checked)}
                      className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-xs font-semibold text-slate-700">
                      Flag for urgent cardiology consultation
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Attending Physician Notes & Observations
              </label>
              <textarea
                rows={2}
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                placeholder="Document relevant patient history, symptoms, or medication notes..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        )}

        {/* Section 1: Demographics & Hemodynamics */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-brand-600" />
              <h2 className="text-base font-bold text-slate-900">
                1. Demographics & Hemodynamics
              </h2>
            </div>
            <span className="text-xs text-slate-400">Baseline Vitals</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Age (years)
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                min={18}
                max={100}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
                required
              />
              <span className="text-[10px] text-slate-400">Adult: 18 - 100</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Biological Sex
              </label>
              <select
                name="sex"
                value={formData.sex}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value={1}>Male (1)</option>
                <option value={0}>Female (0)</option>
              </select>
              <span className="text-[10px] text-slate-400">Clinical stratification</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Resting Blood Pressure
              </label>
              <input
                type="number"
                name="trestbps"
                value={formData.trestbps}
                onChange={handleChange}
                min={70}
                max={250}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
                required
              />
              <span className="text-[10px] text-slate-400">Optimal: &lt; 120 mmHg</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Max Achieved Heart Rate
              </label>
              <input
                type="number"
                name="thalach"
                value={formData.thalach}
                onChange={handleChange}
                min={60}
                max={220}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
                required
              />
              <span className="text-[10px] text-slate-400">Exercise bpm (thalach)</span>
            </div>
          </div>
        </div>

        {/* Section 2: Cardiac Symptoms & Electrocardiography */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-rose-500" />
              <h2 className="text-base font-bold text-slate-900">
                2. Cardiac Symptoms & Electrocardiography (ECG)
              </h2>
            </div>
            <span className="text-xs text-slate-400">Ischemic Indicators</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Chest Pain Type (cp)
              </label>
              <select
                name="cp"
                value={formData.cp}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value={0}>0: Typical Angina</option>
                <option value={1}>1: Atypical Angina</option>
                <option value={2}>2: Non-anginal Pain</option>
                <option value={3}>3: Asymptomatic</option>
              </select>
              <span className="text-[10px] text-slate-400">Anginal characterization</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Resting ECG Results
              </label>
              <select
                name="restecg"
                value={formData.restecg}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value={0}>0: Normal</option>
                <option value={1}>1: ST-T Wave Abnormality</option>
                <option value={2}>2: Left Ventricular Hypertrophy</option>
              </select>
              <span className="text-[10px] text-slate-400">Resting electrical trace</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Exercise-Induced Angina
              </label>
              <select
                name="exang"
                value={formData.exang}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value={0}>No (0)</option>
                <option value={1}>Yes (1)</option>
              </select>
              <span className="text-[10px] text-slate-400">Exertional discomfort</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ST Depression (oldpeak)
              </label>
              <input
                type="number"
                step="0.1"
                name="oldpeak"
                value={formData.oldpeak}
                onChange={handleChange}
                min={0}
                max={8}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
                required
              />
              <span className="text-[10px] text-slate-400">Exertional depression in mm</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Peak Exercise ST Slope
              </label>
              <select
                name="slope"
                value={formData.slope}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value={0}>0: Upsloping</option>
                <option value={1}>1: Flat</option>
                <option value={2}>2: Downsloping</option>
              </select>
              <span className="text-[10px] text-slate-400">Ischemic ST trajectory</span>
            </div>
          </div>
        </div>

        {/* Section 3: Biochemical & Angiographic Markers */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-slate-900">
                3. Biochemical & Fluoroscopic Markers
              </h2>
            </div>
            <span className="text-xs text-slate-400">Laboratory & Imaging</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Serum Cholesterol (mg/dL)
              </label>
              <input
                type="number"
                name="chol"
                value={formData.chol}
                onChange={handleChange}
                min={100}
                max={600}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500"
                required
              />
              <span className="text-[10px] text-slate-400">Normal: &lt; 200 mg/dL</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Fasting Blood Sugar &gt; 120
              </label>
              <select
                name="fbs"
                value={formData.fbs}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value={0}>False: &lt;= 120 mg/dL (0)</option>
                <option value={1}>True: &gt; 120 mg/dL (1)</option>
              </select>
              <span className="text-[10px] text-slate-400">Diabetic threshold</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Major Fluoroscopy Vessels (ca)
              </label>
              <select
                name="ca"
                value={formData.ca}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value={0}>0 Major Vessels</option>
                <option value={1}>1 Major Vessel</option>
                <option value={2}>2 Major Vessels</option>
                <option value={3}>3 Major Vessels</option>
              </select>
              <span className="text-[10px] text-slate-400">Coronary calcification</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Thalassemia Perfusion (thal)
              </label>
              <select
                name="thal"
                value={formData.thal}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value={1}>1: Normal</option>
                <option value={2}>2: Fixed Defect</option>
                <option value={3}>3: Reversible Defect</option>
              </select>
              <span className="text-[10px] text-slate-400">Nuclear scan status</span>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <p className="text-xs text-slate-400 text-center sm:text-left">
            Inference executes with calibrated Ensemble Model & SHAP explainability.
          </p>

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Running Machine Learning Pipeline...</span>
              </>
            ) : (
              <>
                <span>Execute Heart Disease Risk Assessment</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewAssessment;
