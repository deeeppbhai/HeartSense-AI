import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { RoleBadge } from '../../components/StatusBadge';
import {
  Users, Search, Filter, ShieldCheck, CheckCircle2, XCircle,
  AlertCircle, Edit2, Check, X, ShieldAlert, Stethoscope
} from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/admin/users/');
      const list = res.data.results || res.data || [];
      setUsers(list);
      setFiltered(list);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = [...users];

    if (roleFilter !== 'ALL') {
      result = result.filter((u) => u.role === roleFilter);
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          `${u.first_name} ${u.last_name}`.toLowerCase().includes(q)
      );
    }

    setFiltered(result);
  }, [roleFilter, searchTerm, users]);

  const handleToggleActive = async (user) => {
    try {
      const newActive = !user.is_active;
      await api.patch(`/auth/admin/users/${user.id}/`, { is_active: newActive });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: newActive } : u))
      );
      setMessage(`Updated account active state for ${user.username}.`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert('Failed to update user status.');
    }
  };

  const handleToggleDoctorApproval = async (user) => {
    try {
      const newApproval = !user.is_approved;
      await api.patch(`/auth/admin/users/${user.id}/`, { is_approved: newApproval });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_approved: newApproval } : u))
      );
      setMessage(`Updated doctor verification state for Dr. ${user.last_name || user.username}.`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert('Failed to update doctor verification.');
    }
  };

  const handleStartEdit = (user) => {
    setEditingUserId(user.id);
    setEditForm({
      role: user.role,
      specialization: user.specialization || '',
      medical_license: user.medical_license || '',
    });
  };

  const handleSaveEdit = async (userId) => {
    try {
      await api.patch(`/auth/admin/users/${userId}/`, editForm);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ...editForm } : u))
      );
      setEditingUserId(null);
      setMessage('User attributes successfully updated.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert('Failed to update user details.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Users className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">
              Access Governance
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            User Accounts & Role Permissions
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Control registered clinical users, authorize doctor licenses, and enforce RBAC permissions.
          </p>
        </div>
      </div>

      {message && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Role Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {[
            { id: 'ALL', label: 'All Users' },
            { id: 'patient', label: 'Patients' },
            { id: 'doctor', label: 'Doctors' },
            { id: 'admin', label: 'Admins' },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setRoleFilter(r.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                roleFilter === r.id
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search username, email, full name..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 bg-slate-50/50"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-slate-500">Retrieving system accounts...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No user accounts found matching your query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="py-3.5 px-5">User</th>
                  <th className="py-3.5 px-5">Email & Phone</th>
                  <th className="py-3.5 px-5">System Role</th>
                  <th className="py-3.5 px-5">Verification / License</th>
                  <th className="py-3.5 px-5">Active Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.map((u) => {
                  const isEditing = editingUserId === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                            {u.first_name ? u.first_name[0] : u.username[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">
                              {u.first_name} {u.last_name || `(@${u.username})`}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              UID-{String(u.id).padStart(5, '0')}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-5 text-slate-600">
                        <div>{u.email}</div>
                        <div className="text-[10px] text-slate-400">{u.phone_number || 'No phone'}</div>
                      </td>

                      <td className="py-3.5 px-5">
                        {isEditing ? (
                          <select
                            value={editForm.role}
                            onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                            className="px-2 py-1 rounded-lg border border-slate-300 text-xs font-semibold"
                          >
                            <option value="patient">Patient</option>
                            <option value="doctor">Doctor</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <RoleBadge role={u.role} />
                        )}
                      </td>

                      <td className="py-3.5 px-5">
                        {u.role === 'doctor' ? (
                          <div className="space-y-1">
                            <button
                              onClick={() => handleToggleDoctorApproval(u)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                                u.is_approved
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800 animate-pulse'
                              }`}
                              title="Click to toggle doctor license verification"
                            >
                              {u.is_approved ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                              <span>{u.is_approved ? 'Verified License' : 'Pending Approval'}</span>
                            </button>
                            <div className="text-[10px] text-slate-400">
                              {u.medical_license || 'No License provided'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">Standard Access</span>
                        )}
                      </td>

                      <td className="py-3.5 px-5">
                        <button
                          onClick={() => handleToggleActive(u)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                            u.is_active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {u.is_active ? 'Active' : 'Disabled'}
                        </button>
                      </td>

                      <td className="py-3.5 px-5 text-right space-x-1.5">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => handleSaveEdit(u.id)}
                              className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                              title="Save"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingUserId(null)}
                              className="p-1.5 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(u)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                            title="Edit Role or Credentials"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
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

export default UserManagement;
