import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { RiskBadge } from '../../components/StatusBadge';
import {
  History, Download, Filter, Search, ArrowRight, FileText,
  Calendar, Activity, Stethoscope
} from 'lucide-react';

const AssessmentHistory = () => {
  const { role } = useAuth();
  const [history, setHistory] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/clinical/assessments/history/');
      const list = res.data.results || res.data || [];
      setHistory(list);
      setFiltered(list);
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = [...history];

    if (filterRisk !== 'ALL') {
      result = result.filter(
        (item) => item.risk_level.toLowerCase() === filterRisk.toLowerCase()
      );
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter((item) => {
        const idMatch = `hs-${item.id}`.includes(q);
        const patName = item.patient_detail?.full_name?.toLowerCase().includes(q) || false;
        const patEmail = item.patient_detail?.email?.toLowerCase().includes(q) || false;
        return idMatch || patName || patEmail;
      });
    }

    setFiltered(result);
  }, [filterRisk, searchTerm, history]);

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
      alert('Failed to download report PDF. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-brand-50 text-brand-600">
              <History className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold text-brand-700 uppercase tracking-wider">
              Clinical Assessment Archive
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {role === 'patient' ? 'My Cardiac Risk History' : 'All Clinical Assessment Records'}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Historical diagnostic assessments, AI probability scores, and downloadable PDF reports.
          </p>
        </div>

        <Link
          to="/assessment/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs shadow-sm hover:bg-brand-700 transition-colors shrink-0"
        >
          <span>Run New Assessment</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Risk Level Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {['ALL', 'Low', 'Moderate', 'High', 'Severe'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterRisk(lvl)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                filterRisk === lvl
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {lvl === 'ALL' ? 'All Risk Levels' : lvl}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search report ID, patient name..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
          />
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-slate-500">Loading historical records...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No assessment records match your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="py-3.5 px-5">Report ID</th>
                  <th className="py-3.5 px-5">Date & Time</th>
                  {role !== 'patient' && <th className="py-3.5 px-5">Patient</th>}
                  <th className="py-3.5 px-5">Risk Level</th>
                  <th className="py-3.5 px-5">Calculated Prob</th>
                  <th className="py-3.5 px-5">Blood Pressure / Chol</th>
                  <th className="py-3.5 px-5">Assessing Physician</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-800">
                      HS-{String(item.id).padStart(6, '0')}
                    </td>
                    <td className="py-3.5 px-5 text-slate-600">
                      {new Date(item.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    {role !== 'patient' && (
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900">
                          {item.patient_detail?.full_name || item.patient_detail?.username}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {item.patient_detail?.email}
                        </div>
                      </td>
                    )}
                    <td className="py-3.5 px-5">
                      <RiskBadge level={item.risk_level} size="sm" />
                    </td>
                    <td className="py-3.5 px-5 font-bold text-slate-800">
                      {(item.probability * 100).toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-5 text-slate-600">
                      {Math.round(Number(item.trestbps ?? item.assessment?.resting_bp) || 120)} mmHg / {Math.round(Number(item.chol ?? item.assessment?.cholesterol) || 200)} mg/dL
                    </td>
                    <td className="py-3.5 px-5 text-slate-600">
                      {item.assessed_by_detail?.full_name || 'Self-Assessment'}
                    </td>
                    <td className="py-3.5 px-5 text-right space-x-2">
                      <Link
                        to={`/assessment/${item.id}`}
                        className="inline-flex items-center px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700 font-bold hover:bg-brand-100 transition-colors"
                      >
                        Review
                      </Link>
                      <button
                        onClick={() => handleDownloadPdf(item.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                        title="Download PDF Report"
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
    </div>
  );
};

export default AssessmentHistory;
