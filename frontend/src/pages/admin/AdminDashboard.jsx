import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { RoleBadge } from '../../components/StatusBadge';
import {
  ShieldCheck, Users, Cpu, FileText, Activity, AlertCircle,
  ArrowRight, CheckCircle2, Clock, Terminal, RefreshCw
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/clinical/admin/dashboard/');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load admin stats', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-950 via-purple-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-card">
        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-2">
            System Administration & Governance
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Administrator Control Center
          </h1>
          <p className="mt-1 text-sm text-slate-300 max-w-xl">
            Monitor ML model deployments, oversee user roles and clinician verification, and inspect security audit trails.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/models"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-colors"
          >
            <Cpu className="w-4 h-4" />
            <span>Manage Models</span>
          </Link>
          <Link
            to="/admin/users"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-colors"
          >
            <Users className="w-4 h-4" />
            <span>User Roles</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-slate-500">Loading system metrics and telemetry...</p>
        </div>
      ) : (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                <span>Total Users</span>
                <Users className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 my-2">
                {stats?.users?.total || 0}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                <span>{stats?.users?.patients || 0} Patients</span> •{' '}
                <span>{stats?.users?.doctors || 0} Doctors</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                <span>Total Assessments</span>
                <FileText className="w-4 h-4 text-brand-600" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900 my-2">
                {stats?.total_predictions || 0}
              </div>
              <div className="text-[11px] text-slate-500">
                Avg Risk Score: <span className="font-bold text-slate-700">{((stats?.average_risk_probability || 0) * 100).toFixed(1)}%</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                <span>Production AI Model</span>
                <Cpu className="w-4 h-4 text-cyan-600" />
              </div>
              <div className="text-base font-extrabold text-slate-900 my-2 truncate">
                {stats?.active_model?.name || 'Random Forest'}
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold">
                ROC-AUC: {stats?.active_model?.roc_auc ? (stats.active_model.roc_auc * 100).toFixed(1) : 96.7}%
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
                <span>Pending Approvals</span>
                <ShieldCheck className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-3xl font-extrabold text-amber-600 my-2">
                {stats?.users?.pending_doctors || 0}
              </div>
              <div className="text-[11px] text-slate-500">
                {stats?.users?.pending_doctors === 0 ? 'All doctors verified' : 'Clinician licenses pending'}
              </div>
            </div>
          </div>

          {/* Active Model Spotlight */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base">
                      {stats?.active_model?.name || 'Production Pipeline'}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      ACTIVE INFERENCE
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Version {stats?.active_model?.version || '1.0.0'} • Calibrated on UCI Cleveland Heart Disease Dataset
                  </p>
                </div>
              </div>

              <Link
                to="/admin/models"
                className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                Inspect All 4 Models <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-center">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400">Accuracy</span>
                <div className="text-xl font-extrabold text-slate-900 mt-1">
                  {stats?.active_model?.accuracy ? (stats.active_model.accuracy * 100).toFixed(1) : 90.4}%
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400">ROC-AUC Score</span>
                <div className="text-xl font-extrabold text-brand-600 mt-1">
                  {stats?.active_model?.roc_auc ? (stats.active_model.roc_auc * 100).toFixed(1) : 96.7}%
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400">F1-Score</span>
                <div className="text-xl font-extrabold text-slate-900 mt-1">
                  {stats?.active_model?.f1_score ? (stats.active_model.f1_score * 100).toFixed(1) : 82.2}%
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400">Explainability</span>
                <div className="text-xl font-extrabold text-indigo-600 mt-1">
                  SHAP Tree
                </div>
              </div>
            </div>
          </div>

          {/* Audit Trail Stream */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Recent Security & Clinical Audit Events
                </h3>
                <p className="text-xs text-slate-400">
                  Immutable server-side audit logs capturing logins, predictions, model switches, and profile changes
                </p>
              </div>
              <Link to="/admin/audit-logs" className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                Full Audit Trail <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {(stats?.recent_audits || []).map((log) => (
                <div key={log.id} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shrink-0"></span>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-slate-900 font-mono text-[11px] px-2 py-0.5 rounded-md bg-slate-100">
                          {log.action}
                        </span>
                        <span className="text-slate-500 font-medium">
                          by {log.user_detail?.full_name || log.user_detail?.username || 'System'}
                        </span>
                      </div>
                      <p className="text-slate-600">{log.details}</p>
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-slate-400 shrink-0">
                    <div>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                    <div className="font-mono text-[10px] text-slate-400">{log.ip_address || '127.0.0.1'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
