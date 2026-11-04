import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import {
  ShieldCheck, Search, Filter, Terminal, User, Clock,
  FileText, Cpu, LogIn, Lock
} from 'lucide-react';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const res = await api.get('/clinical/admin/audit-logs/');
      const list = res.data.results || res.data || [];
      setLogs(list);
      setFiltered(list);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = [...logs];

    if (actionFilter !== 'ALL') {
      result = result.filter((l) => l.action === actionFilter);
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (l) =>
          l.action.toLowerCase().includes(q) ||
          l.details?.toLowerCase().includes(q) ||
          l.user_detail?.username?.toLowerCase().includes(q) ||
          l.user_detail?.email?.toLowerCase().includes(q)
      );
    }

    setFiltered(result);
  }, [actionFilter, searchTerm, logs]);

  const uniqueActions = ['ALL', ...new Set(logs.map((l) => l.action))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">
              Compliance & Security Logs
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            System Activity Audit Trail
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Immutable log of user authentication, model interventions, diagnostic predictions, and PDF downloads.
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {uniqueActions.slice(0, 6).map((act) => (
            <button
              key={act}
              onClick={() => setActionFilter(act)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                actionFilter === act
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {act === 'ALL' ? 'All Activities' : act}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search details, actor, IP address..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 bg-slate-50/50"
          />
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-slate-500">Retrieving audit event stream...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No audit records match your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="py-3.5 px-5">Timestamp (UTC)</th>
                  <th className="py-3.5 px-5">Action Event</th>
                  <th className="py-3.5 px-5">Initiating User</th>
                  <th className="py-3.5 px-5">Event Description</th>
                  <th className="py-3.5 px-5 text-right">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-mono text-slate-600 whitespace-nowrap">
                      {new Date(item.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>

                    <td className="py-3.5 px-5">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                        {item.action}
                      </span>
                    </td>

                    <td className="py-3.5 px-5">
                      {item.user_detail ? (
                        <div>
                          <div className="font-bold text-slate-900">
                            {item.user_detail.full_name || item.user_detail.username}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {item.user_detail.role} • {item.user_detail.email}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono">System / Anonymous</span>
                      )}
                    </td>

                    <td className="py-3.5 px-5 text-slate-700 leading-relaxed max-w-md">
                      {item.details}
                    </td>

                    <td className="py-3.5 px-5 text-right font-mono text-[11px] text-slate-400">
                      {item.ip_address || '127.0.0.1'}
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

export default AuditLogs;
