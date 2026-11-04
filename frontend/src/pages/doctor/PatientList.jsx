import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { RiskBadge } from '../../components/StatusBadge';
import {
  Users, Search, Filter, Stethoscope, ArrowRight, Phone, Mail,
  Calendar, Droplets, AlertCircle
} from 'lucide-react';

const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await api.get('/clinical/patients/');
      const list = res.data.results || res.data || [];
      setPatients(list);
      setFiltered(list);
    } catch (err) {
      console.error('Failed to load patients', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!searchTerm) {
      setFiltered(patients);
      return;
    }
    const q = searchTerm.toLowerCase();
    const result = patients.filter((p) => {
      const name = `${p.first_name} ${p.last_name}`.toLowerCase();
      const email = p.email.toLowerCase();
      const phone = p.phone_number?.toLowerCase() || '';
      return name.includes(q) || email.includes(q) || phone.includes(q);
    });
    setFiltered(result);
  }, [searchTerm, patients]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Users className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
              Clinical Directory
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Authorized Patient Records
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Cardiology caseload directory with baseline clinical profiles and assessment history.
          </p>
        </div>

        <Link
          to="/doctor/assessment"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs shadow-sm hover:bg-brand-700 transition-colors shrink-0"
        >
          <Stethoscope className="w-4 h-4" />
          <span>New Patient Assessment</span>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by patient name, email, or contact phone..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
          />
        </div>

        <div className="text-xs font-semibold text-slate-500">
          Showing <span className="font-bold text-slate-800">{filtered.length}</span> patient(s)
        </div>
      </div>

      {/* Patient Cards / Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-slate-500">Loading patient roster...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No patient records found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="py-3.5 px-5">Patient Name & ID</th>
                  <th className="py-3.5 px-5">Contact Details</th>
                  <th className="py-3.5 px-5">Demographics</th>
                  <th className="py-3.5 px-5">Latest Cardiac Risk</th>
                  <th className="py-3.5 px-5">Evaluations Run</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.map((p) => {
                  const initial = p.first_name ? p.first_name[0] : (p.username ? p.username[0].toUpperCase() : (p.full_name ? p.full_name[0].toUpperCase() : 'P'));
                  const patientName = p.full_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.username || 'Patient';
                  const pid = p.id || p.patient_id;
                  const emailStr = p.email || p.user_details?.email || 'N/A';
                  const phoneStr = p.phone || p.phone_number || p.user_details?.phone || 'No phone';
                  return (
                    <tr key={pid} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-xs">
                            {initial}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">
                              {patientName}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400">
                              PID-{String(pid).padStart(5, '0')}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-5 text-slate-600">
                        <div>{emailStr}</div>
                        <div className="text-[10px] text-slate-400">{phoneStr}</div>
                      </td>

                      <td className="py-3.5 px-5 text-slate-600">
                        <div>
                          {p.gender || 'Unknown'} {p.age ? `• ${p.age} yrs` : ''}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          BP: {p.blood_pressure || '120/80'} • Chol: {p.cholesterol || '200'}
                        </div>
                      </td>

                    <td className="py-3.5 px-5">
                      {p.latest_assessment ? (
                        <div className="space-y-1">
                          <RiskBadge level={p.latest_assessment.risk_level} size="sm" />
                          <div className="text-[10px] text-slate-400">
                            {(p.latest_assessment.probability * 100).toFixed(1)}% prob
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400">Unassessed</span>
                      )}
                    </td>

                    <td className="py-3.5 px-5 font-bold text-slate-700">
                      {p.assessment_count} record(s)
                    </td>

                    <td className="py-3.5 px-5 text-right space-x-2">
                      <Link
                        to={`/doctor/assessment?patient_id=${p.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 transition-colors"
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>Assess</span>
                      </Link>
                      <Link
                        to={`/assessment/history?patient_id=${p.id}`}
                        className="inline-flex items-center px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                      >
                        History
                      </Link>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientList;
