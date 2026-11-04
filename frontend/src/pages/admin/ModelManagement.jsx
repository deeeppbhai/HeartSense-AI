import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import {
  Cpu, CheckCircle2, RefreshCw, BarChart2, Layers, AlertCircle,
  Activity, ArrowUpRight, Check, Sparkles
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid
} from 'recharts';

const ModelManagement = () => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activatingId, setActivatingId] = useState(null);
  const [retraining, setRetraining] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const res = await api.get('/ml/models/');
      const list = res.data.results || res.data || [];
      setModels(list);
    } catch (err) {
      console.error('Failed to load models', err);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateModel = async (id, name) => {
    setActivatingId(id);
    setMessage('');
    setError('');
    try {
      await api.post(`/ml/models/${id}/activate/`);
      setModels((prev) =>
        prev.map((m) => ({ ...m, is_active: m.id === id }))
      );
      setMessage(`Successfully switched active production model to ${name}.`);
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setError('Failed to switch model. Please check logs.');
    } finally {
      setActivatingId(null);
    }
  };

  const handleRetrainPipeline = async () => {
    setRetraining(true);
    setMessage('');
    setError('');
    try {
      const res = await api.post('/ml/models/retrain/');
      setModels(res.data.models || []);
      setMessage('All 4 models successfully retrained on updated dataset!');
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      setError('Retraining failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setRetraining(false);
    }
  };

  // Recharts metric dataset
  const chartData = models.map((m) => ({
    name: m.model_type === 'logistic_regression' ? 'Logistic Reg' : (m.model_type === 'svm' ? 'SVM' : (m.model_type === 'xgboost' ? 'XGBoost' : 'Random Forest')),
    Accuracy: Math.round(m.accuracy * 1000) / 10,
    Precision: Math.round(m.precision * 1000) / 10,
    Recall: Math.round(m.recall * 1000) / 10,
    ROC_AUC: Math.round(m.roc_auc * 1000) / 10,
    isActive: m.is_active,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-card">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-cyan-50 text-cyan-600">
              <Cpu className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider">
              MLOps & Algorithm Governance
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Machine Learning Model Registry
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Compare 4 clinical algorithms (Random Forest, XGBoost, Logistic Regression, SVM) and designate active inference engine.
          </p>
        </div>

        <button
          onClick={handleRetrainPipeline}
          disabled={retraining}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-colors disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 text-cyan-400 ${retraining ? 'animate-spin' : ''}`} />
          <span>{retraining ? 'Retraining Models on GPU/CPU...' : 'Retrain All ML Pipelines'}</span>
        </button>
      </div>

      {message && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Model Performance Comparison Chart */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-brand-600" />
            <h3 className="font-bold text-slate-900 text-base">
              Cross-Algorithm Benchmark Metrics (% Comparison)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">Stratified 80/20 Test Split</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} />
              <YAxis domain={[60, 100]} unit="%" tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                formatter={(val) => [`${val}%`, '']}
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="Accuracy" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Precision" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Recall" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ROC_AUC" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {models.map((m) => {
          const cm = m.confusion_matrix || {};
          const isActivating = activatingId === m.id;

          return (
            <div
              key={m.id}
              className={`bg-white rounded-3xl border transition-all p-6 shadow-card flex flex-col justify-between ${
                m.is_active
                  ? 'border-brand-500 ring-2 ring-brand-500/20'
                  : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-slate-900 text-lg">
                        {m.name}
                      </h3>
                      {m.is_active && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          ACTIVE INFERENCE
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      Type: {m.model_type} • v{m.version}
                    </span>
                  </div>

                  <span className="text-xs font-mono font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md">
                    Joblib Pipeline
                  </span>
                </div>

                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                  {m.description || 'Pre-trained scikit-learn / xgboost cardiac risk model.'}
                </p>

                {/* Metrics Breakdown Grid */}
                <div className="grid grid-cols-4 gap-2 mb-4 text-center">
                  <div className="p-2.5 bg-slate-50 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Accuracy</span>
                    <div className="text-sm font-extrabold text-slate-900">
                      {(m.accuracy * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Precision</span>
                    <div className="text-sm font-extrabold text-slate-900">
                      {(m.precision * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Recall</span>
                    <div className="text-sm font-extrabold text-slate-900">
                      {(m.recall * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl">
                    <span className="text-[10px] font-bold text-brand-600 uppercase">ROC-AUC</span>
                    <div className="text-sm font-extrabold text-brand-600">
                      {(m.roc_auc * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Confusion Matrix Mini-Grid */}
                {cm.tn !== undefined && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 mb-4 text-xs">
                    <div className="text-[10px] font-bold uppercase text-slate-400 mb-1.5 flex justify-between">
                      <span>Confusion Matrix (Test Set)</span>
                      <span>N = {cm.tn + cm.fp + cm.fn + cm.tp}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-center font-mono">
                      <div className="p-1.5 bg-white rounded border border-slate-200">
                        <span className="text-[9px] text-slate-400 block">True Negative (TN)</span>
                        <span className="font-bold text-slate-800">{cm.tn}</span>
                      </div>
                      <div className="p-1.5 bg-white rounded border border-slate-200">
                        <span className="text-[9px] text-slate-400 block">False Positive (FP)</span>
                        <span className="font-bold text-amber-600">{cm.fp}</span>
                      </div>
                      <div className="p-1.5 bg-white rounded border border-slate-200">
                        <span className="text-[9px] text-slate-400 block">False Negative (FN)</span>
                        <span className="font-bold text-rose-600">{cm.fn}</span>
                      </div>
                      <div className="p-1.5 bg-white rounded border border-slate-200">
                        <span className="text-[9px] text-slate-400 block">True Positive (TP)</span>
                        <span className="font-bold text-emerald-600">{cm.tp}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  SHAP Explainability: Supported
                </span>

                {m.is_active ? (
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Currently Serving Inferences
                  </span>
                ) : (
                  <button
                    onClick={() => handleActivateModel(m.id, m.name)}
                    disabled={isActivating}
                    className="px-4 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    {isActivating ? 'Activating...' : 'Set as Production Model'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ModelManagement;
