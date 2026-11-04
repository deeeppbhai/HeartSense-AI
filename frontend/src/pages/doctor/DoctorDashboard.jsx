import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { RiskBadge } from '../../components/StatusBadge';
import {
  Users, Activity, HeartPulse, AlertTriangle, ShieldCheck,
  Stethoscope, ArrowRight, Download, PlusCircle, Search, Calendar
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis
} from 'recharts';

const RISK_COLORS = {
  Low: '#10b981',
  Moderate: '#f59e0b',
  High: '#f97316',
  Severe: '#f43f5e',
};

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, patientsRes] = await Promise.all([
        api.get('/clinical/doctor/dashboard/'),
        api.get('/clinical/patients/'),
      ]);
      setStats(statsRes.data);
      setPatients(patientsRes.data.results || patientsRes.data || []);
    } catch (err) {
      console.error('Failed to load doctor dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (id) => {
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
      alert('Failed to download report PDF.');
    }
  };

  const pieData = stats && stats.risk_distribution
    ? Object.entries(stats.risk_distribution).map(([level, count]) => ({
        name: level,
        value: count,
        color: RISK_COLORS[level] || '#64748b',
      }))
    : [
        { name: 'Low', value: 0, color: RISK_COLORS.Low },
        { name: 'Moderate', value: 0, color: RISK_COLORS.Moderate },
        { name: 'High', value: 0, color: RISK_COLORS.High },
        { name: 'Severe', value: 0, color: RISK_COLORS.Severe },
      ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-brand-900 to-brand-800 rounded-3xl p-6 sm:p-8 text-white shadow-card">
        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-2">
            Cardiology Clinical Decision Support
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {user?.full_name ? `Welcome, ${user.full_name}` : `Welcome, Dr. ${user?.username}`}
          </h1>
          <p className="mt-1 text-sm text-slate-300 max-w-xl">
            {user?.specialization || 'Cardiology Specialist'} • {user?.hospital_affiliation || 'Heart & Vascular Center'}
          </p>
        </div>

        <Link
          to="/doctor/assessment"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-cyan-500 text-slate-950 font-extrabold text-sm shadow-md hover:bg-cyan-400 hover:scale-[1.02] transition-all shrink-0"
        >
          <Stethoscope className="w-4 h-4 text-slate-900" />
          <span>New Patient CDS Assessment</span>
        </Link>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-slate-500">Compiling patient caseload metrics...</p>
        </div>
      ) : (
        <>
          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                <span>Authorized Patients</span>
                <Users className="w-4 h-4 text-brand-600" />
              </div>
              <div className="my-2">
                <div className="text-3xl font-extrabold text-slate-900">
                  {stats?.total_patients || 0}
                </div>
                <span className="text-xs font-semibold text-brand-600">Active Rosters</span>
              </div>
              <div className="text-[11px] text-slate-400">Assigned under clinical care</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                <span>Total Assessments</span>
                <HeartPulse className="w-4 h-4 text-cyan-600" />
              </div>
              <div className="my-2">
                <div className="text-3xl font-extrabold text-slate-900">
                  {stats?.total_predictions || 0}
                </div>
                <span className="text-xs font-semibold text-cyan-600">AI Analyses Run</span>
              </div>
              <div className="text-[11px] text-slate-400">Complete clinical evaluations</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                <span>High / Severe Risk</span>
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="my-2">
                <div className="text-3xl font-extrabold text-rose-600">
                  {(stats?.risk_distribution?.High || 0) + (stats?.risk_distribution?.Severe || 0)}
                </div>
                <span className="text-xs font-semibold text-rose-600">Requiring Interventions</span>
              </div>
              <div className="text-[11px] text-slate-400">Cadence: Urgent & Priority</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                <span>Follow-ups Flagged</span>
                <ShieldCheck className="w-4 h-4 text-amber-500" />
              </div>
              <div className="my-2">
                <div className="text-3xl font-extrabold text-amber-600">
                  {stats?.pending_followups || 0}
                </div>
                <span className="text-xs font-semibold text-amber-600">Pending Clinical Action</span>
              </div>
              <div className="text-[11px] text-slate-400">Physician review requested</div>
            </div>
          </div>

          {/* Charts & Caseload Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Risk Distribution Donut Chart */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-slate-900 text-sm">
                  Caseload Risk Stratification
                </h3>
                <span className="text-xs text-slate-400">Overall</span>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 text-xs">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between px-2 py-1 bg-slate-50 rounded-lg">
                    <span className="text-slate-600 font-medium">{d.name}:</span>
                    <span className="font-bold text-slate-900">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Patient Directory */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Authorized Patient Directory
                    </h3>
                    <p className="text-xs text-slate-400">
                      Select patient to review clinical history or run new AI assessment
                    </p>
                  </div>
                  <Link to="/doctor/patients" className="text-xs font-bold text-brand-600 hover:text-brand-700">
                    View All &rarr;
                  </Link>
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  {patients.slice(0, 4).map((p) => {
                    const patientName = p.full_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.username || 'Patient';
                    const initial = p.first_name ? p.first_name[0] : (p.username ? p.username[0].toUpperCase() : (p.full_name ? p.full_name[0].toUpperCase() : 'P'));
                    const pid = p.id || p.patient_id;
                    return (
                      <div key={pid} className="py-3 flex items-center justify-between hover:bg-slate-50/70 px-2 rounded-xl transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-xs">
                            {initial}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">
                              {patientName}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {p.gender || 'Unknown'} • {p.age ? `${p.age} yrs` : ''} • {p.phone || p.phone_number || p.email || 'Registered'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {p.latest_assessment ? (
                            <RiskBadge level={p.latest_assessment.risk_level} size="sm" />
                          ) : (
                            <span className="text-[10px] text-slate-400">No checks yet</span>
                          )}

                          <Link
                            to={`/doctor/assessment?patient_id=${pid}`}
                            className="px-2.5 py-1 rounded-lg bg-cyan-50 text-cyan-800 font-bold hover:bg-cyan-100 transition-colors text-[11px]"
                          >
                            Run CDS
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-right">
                <Link
                  to="/doctor/patients"
                  className="text-xs font-bold text-brand-600 hover:underline"
                >
                  Manage all {patients.length} patient records
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Physician Assessments Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">
                Recent Clinical Evaluations
              </h3>
              <Link to="/assessment/history" className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                Full Assessment History <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <th className="py-3 px-4">Report ID</th>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Stratified Risk</th>
                    <th className="py-3 px-4">Probability</th>
                    <th className="py-3 px-4">Vitals (BP / Chol)</th>
                    <th className="py-3 px-4">Physician Notes</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {(stats?.recent_assessments || []).map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        HS-{String(item.id).padStart(6, '0')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {item.patient_detail?.full_name || item.patient_detail?.username}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          PID-{String(item.patient).padStart(5, '0')}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <RiskBadge level={item.risk_level} size="sm" />
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {(item.probability * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {Math.round(Number(item.trestbps ?? item.assessment?.resting_bp) || 120)} mmHg / {Math.round(Number(item.chol ?? item.assessment?.cholesterol) || 200)} mg/dL
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                        {item.doctor_notes || 'Automated baseline'}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <Link
                          to={`/assessment/${item.id}`}
                          className="inline-flex items-center px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700 font-bold hover:bg-brand-100 transition-colors"
                        >
                          Review
                        </Link>
                        <button
                          onClick={() => handleDownloadPdf(item.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
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
          </div>
        </>
      )}
    </div>
  );
};

export default DoctorDashboard;
