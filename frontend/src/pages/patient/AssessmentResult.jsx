import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/client';
import RiskGauge from '../../components/RiskGauge';
import { RiskBadge } from '../../components/StatusBadge';
import FeatureImportanceChart from '../../components/FeatureImportanceChart';
import {
  Download, ArrowLeft, Stethoscope, HeartPulse, CheckCircle2,
  AlertTriangle, ShieldCheck, Activity, Calendar, FileText, Printer
} from 'lucide-react';

const AssessmentResult = () => {
  const { id } = useParams();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchRecord();
  }, [id]);

  const fetchRecord = async () => {
    try {
      const res = await api.get(`/clinical/assessments/${id}/`);
      setRecord(res.data);
    } catch (err) {
      console.error('Failed to load assessment', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const res = await api.get(`/clinical/assessments/${id}/pdf/`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `HeartSense_Report_HS-${String(id).padStart(6, '0')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert('Failed to generate PDF report. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm font-medium text-slate-500">Loading comprehensive cardiac analysis...</p>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
        <p className="text-base text-slate-600">Assessment record not found.</p>
        <Link to="/assessment/new" className="mt-3 inline-block font-bold text-brand-600">
          Run a new assessment
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/assessment/history"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Assessment History</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to="/assessment/new"
            className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            New Assessment
          </Link>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-2xs"
            title="Print Summary"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl bg-brand-600 text-white shadow-sm hover:bg-brand-700 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'Compiling PDF...' : 'Download Clinical PDF'}</span>
          </button>
        </div>
      </div>

      {/* Main Result Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-md">
                HS-{String(record.id).padStart(6, '0')}
              </span>
              <span className="text-xs text-slate-400">
                {new Date(record.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Cardiac Risk Stratification Analysis
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Evaluated by AI Engine: <span className="font-semibold text-slate-700">{record.model_detail?.name || 'Multi-Model Ensemble'}</span>
            </p>
          </div>

          <RiskBadge level={record.risk_level} size="lg" />
        </div>

        {/* Risk Gauge & Summary Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
          <div className="md:col-span-1">
            <RiskGauge probability={record.probability} riskLevel={record.risk_level} />
          </div>

          <div className="md:col-span-2 flex flex-col justify-between bg-slate-50/80 p-6 rounded-2xl border border-slate-200/80">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Clinical Diagnostic Synthesis
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {record.risk_level === 'Low' && 'Low Probability of Significant Ischemia'}
                {record.risk_level === 'Moderate' && 'Moderate Coronary Risk - Clinical Monitoring Advised'}
                {record.risk_level === 'High' && 'High Probability of Coronary Artery Disease'}
                {record.risk_level === 'Severe' && 'Critical Cardiac Risk Profile - Specialist Evaluation Needed'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Based on machine learning models trained on the UCI Cleveland cardiac registry, the calculated probability of active coronary artery disease is{' '}
                <span className="font-bold text-slate-900">{(record.probability * 100).toFixed(1)}%</span>.
                Primary contributors were derived using game-theoretic SHAP attributions.
              </p>
            </div>

            {/* Doctor Note block if present */}
            {record.doctor_notes && (
              <div className="mt-4 p-4 rounded-xl bg-indigo-50/80 border border-indigo-100 text-xs text-indigo-900">
                <div className="font-bold flex items-center gap-1.5 mb-1 text-indigo-800">
                  <Stethoscope className="w-3.5 h-3.5" />
                  Attending Physician Notes
                </div>
                <p className="italic">{record.doctor_notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Explainable AI (SHAP) Chart */}
        <div className="my-6">
          <FeatureImportanceChart factors={record.top_factors} />
        </div>

        {/* Clinical Parameters Grid */}
        <div className="my-6">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-brand-600" />
            <h3 className="text-base font-bold text-slate-900">
              Recorded Clinical Biomarkers
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">Resting Blood Pressure</span>
              <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                {Math.round(Number(record.trestbps ?? record.assessment?.resting_bp) || 120)} mmHg
              </div>
              <span className="text-[10px] text-slate-500">Normal: &lt; 120</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">Serum Cholesterol</span>
              <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                {Math.round(Number(record.chol ?? record.assessment?.cholesterol) || 200)} mg/dL
              </div>
              <span className="text-[10px] text-slate-500">Desirable: &lt; 200</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">Peak Heart Rate</span>
              <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                {Math.round(Number(record.thalach ?? record.assessment?.max_heart_rate) || 150)} bpm
              </div>
              <span className="text-[10px] text-slate-500">Target: 130 - 180</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">ST Depression (oldpeak)</span>
              <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                {(Number(record.oldpeak ?? record.assessment?.oldpeak) || 0).toFixed(1)} mm
              </div>
              <span className="text-[10px] text-slate-500">Normal: &lt; 1.0</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">Exercise Angina</span>
              <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                {record.assessment?.exercise_angina || record.exang === 1 ? 'Positive (Yes)' : 'Negative (No)'}
              </div>
              <span className="text-[10px] text-slate-500">Normal: Negative</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">Chest Pain Classification</span>
              <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                {record.assessment?.chest_pain_type || (record.cp === 0 ? 'Typical Angina' : record.cp === 1 ? 'Atypical Angina' : record.cp === 2 ? 'Non-anginal Pain' : 'Asymptomatic')}
              </div>
              <span className="text-[10px] text-slate-500">Classification</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">Fluoroscopy Vessels</span>
              <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                {record.assessment?.vessels ?? record.ca ?? 0} major vessel(s)
              </div>
              <span className="text-[10px] text-slate-500">Normal: 0 vessels</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">Thalassemia Scan</span>
              <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                {record.assessment?.thalassemia || (record.thal === 1 ? 'Normal (1)' : record.thal === 2 ? 'Fixed Defect (2)' : 'Reversible Defect (3)')}
              </div>
              <span className="text-[10px] text-slate-500">Nuclear Perfusion</span>
            </div>
          </div>
        </div>

        {/* Personalized Recommendations */}
        {record.recommendations && record.recommendations.length > 0 && (
          <div className="my-6">
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Tailored Clinical Decision Support Recommendations
            </h3>
            <div className="space-y-2">
              {record.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs flex items-start gap-3"
                >
                  <span className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 shrink-0"></span>
                  <div className="text-xs">
                    <span className="font-bold text-slate-800">{rec.category}: </span>
                    <span className="text-slate-600 leading-relaxed">{rec.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mandatory Medical Safety Disclaimer & Explainability Limitation */}
        <div className="mt-8 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Mandatory Clinical Decision Support Notice</span>
          </div>
          <p className="font-semibold text-slate-800">
            "HeartSense AI provides educational decision-support estimates and is not a substitute for professional medical diagnosis or treatment."
          </p>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            <strong>Explainability Limitations:</strong> SHAP feature attributions reflect statistical weights and directional associations within the trained model distribution on the UCI Cleveland cardiac dataset. They do not constitute clinical proof of biological causation. All diagnostic procedures, medication management, and clinical decisions must be independently validated by a licensed physician.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AssessmentResult;
