import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import RiskGauge from '../../components/RiskGauge';
import { RiskBadge } from '../../components/StatusBadge';
import {
  HeartPulse, Activity, Calendar, FileText, ArrowRight, ShieldCheck,
  TrendingUp, Download, PlusCircle, AlertCircle
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

const PatientDashboard = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/clinical/assessments/history/');
      setHistory(res.data.results || res.data || []);
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setLoading(false);
    }
  };

  const latest = history[0];
  const latestBp = Number(latest?.trestbps ?? latest?.assessment?.resting_bp) || 120;
  const latestChol = Number(latest?.chol ?? latest?.assessment?.cholesterol) || 190;
  const latestHr = Number(latest?.thalach ?? latest?.assessment?.max_heart_rate) || 155;

  // Chart data formatting
  const trendData = [...history].reverse().map((rec) => ({
    date: new Date(rec.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    riskPct: Math.round(rec.probability * 100),
    level: rec.risk_level,
  }));

  const handleDownloadPdf = async (id) => {
    try {
      const res = await api.get(`/clinical/assessments/${id}/pdf/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `HeartSense_Report_HS-${String(id).padStart(6, '0')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert('Failed to download report PDF. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-brand-800 to-brand-600 rounded-3xl p-6 sm:p-8 text-white shadow-card">
        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-white/15 text-brand-100 text-xs font-semibold uppercase tracking-wider mb-2">
            Patient Health Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.first_name || user?.username}
          </h1>
          <p className="mt-1 text-sm text-brand-100 max-w-xl">
            Track your cardiovascular metrics, review AI risk stratification, and access personalized preventive guidance.
          </p>
        </div>

        <Link
          to="/assessment/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white text-brand-800 font-bold text-sm shadow-md hover:bg-brand-50 hover:scale-[1.02] transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4 text-brand-600" />
          <span>New Risk Check</span>
        </Link>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-slate-500">Retrieving your clinical profile...</p>
        </div>
      ) : (
        <>
          {/* Top Metric Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Current Risk Gauge */}
            <div className="md:col-span-1">
              <RiskGauge
                probability={latest ? latest.probability : 0.08}
                riskLevel={latest ? latest.risk_level : 'Low'}
              />
            </div>

            {/* Biomarker Status Overview */}
            <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <span>Blood Pressure</span>
                  <Activity className="w-4 h-4 text-brand-600" />
                </div>
                <div className="my-2">
                  <div className="text-2xl font-extrabold text-slate-900">
                    {`${Math.round(latestBp)} mmHg`}
                  </div>
                  <span className={`text-xs font-semibold ${latestBp >= 135 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {latestBp >= 135 ? 'Elevated Pressure' : 'Optimal Baseline'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">Normal Range: 90 - 120 mmHg</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <span>Serum Cholesterol</span>
                  <HeartPulse className="w-4 h-4 text-cyan-600" />
                </div>
                <div className="my-2">
                  <div className="text-2xl font-extrabold text-slate-900">
                    {`${Math.round(latestChol)} mg/dL`}
                  </div>
                  <span className={`text-xs font-semibold ${latestChol >= 200 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {latestChol >= 200 ? 'Borderline High' : 'Desirable Range'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">Desirable: &lt; 200 mg/dL</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <span>Peak Heart Rate</span>
                  <Activity className="w-4 h-4 text-rose-500" />
                </div>
                <div className="my-2">
                  <div className="text-2xl font-extrabold text-slate-900">
                    {`${Math.round(latestHr)} bpm`}
                  </div>
                  <span className="text-xs font-semibold text-emerald-600">Exercise Achieved</span>
                </div>
                <div className="text-[11px] text-slate-400">Target Range: 130 - 180 bpm</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <span>Total Assessments</span>
                  <FileText className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="my-2">
                  <div className="text-2xl font-extrabold text-slate-900">
                    {history.length}
                  </div>
                  <span className="text-xs font-semibold text-indigo-600">Clinical Records</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {latest ? `Latest: ${new Date(latest.created_at).toLocaleDateString()}` : 'No checks yet'}
                </div>
              </div>
            </div>
          </div>

          {/* Risk Progression Chart */}
          {trendData.length > 1 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-brand-600" />
                  <h3 className="font-bold text-slate-900 text-base">
                    Cardiovascular Risk Progression Trend
                  </h3>
                </div>
                <span className="text-xs font-medium text-slate-500">
                  Past {trendData.length} Assessments
                </span>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                      formatter={(val) => [`${val}%`, 'Risk Probability']}
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="riskPct"
                      stroke="#026ac8"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#026ac8' }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Recent Assessments Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">
                Recent Cardiac Assessments
              </h3>
              <Link to="/assessment/history" className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                View All History <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {history.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                You haven't conducted any assessments yet.{' '}
                <Link to="/assessment/new" className="text-brand-600 font-bold underline">
                  Run your first test now
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                      <th className="py-3 px-4">Report ID</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Stratified Risk</th>
                      <th className="py-3 px-4">Vitals (BP / Chol)</th>
                      <th className="py-3 px-4">AI Model</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {history.slice(0, 5).map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          HS-{String(item.id).padStart(6, '0')}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {new Date(item.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <RiskBadge level={item.risk_level} size="sm" />
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {Math.round(Number(item.trestbps ?? item.assessment?.resting_bp) || 120)} mmHg / {Math.round(Number(item.chol ?? item.assessment?.cholesterol) || 200)} mg/dL
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-medium">
                          {item.model_detail?.name || 'Ensemble Model'}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <Link
                            to={`/assessment/${item.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700 font-semibold hover:bg-brand-100 transition-colors"
                          >
                            Details
                          </Link>
                          <button
                            onClick={() => handleDownloadPdf(item.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors"
                            title="Download PDF"
                          >
                            <Download className="w-3 h-3" />
                            PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PatientDashboard;
