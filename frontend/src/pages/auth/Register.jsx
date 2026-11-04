import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Heart, User, Lock, Mail, Phone, Stethoscope, Building, ShieldAlert,
  Calendar, Droplets, CheckCircle, ArrowRight, AlertCircle
} from 'lucide-react';

const Register = () => {
  const [role, setRole] = useState('patient'); // 'patient' or 'doctor'
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    // Doctor
    medical_license: '',
    specialization: 'Cardiology',
    hospital_affiliation: '',
    // Patient
    date_of_birth: '',
    gender: 'male',
    blood_group: 'O+',
    emergency_contact: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.password_confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (role === 'doctor' && !formData.medical_license) {
      setError('A valid medical license number is required for doctor accounts.');
      return;
    }

    setError('');
    setSubmitting(true);

    const payload = { ...formData, role };
    const res = await register(payload);
    setSubmitting(false);

    if (res.success) {
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-brand-900 via-brand-800 to-slate-900 text-slate-800">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-xl mb-3">
          <Heart className="w-8 h-8 text-rose-400 fill-rose-400 animate-pulse" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Join HeartSense AI Portal
        </h1>
        <p className="mt-1 text-sm text-brand-100">
          Advanced Cardiac Risk Stratification & Clinical Decision Support
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-3xl sm:px-10 border border-slate-100">
          
          {/* Role Selection Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => setRole('patient')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                role === 'patient'
                  ? 'bg-white text-brand-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-4 h-4" />
              Patient Registration
            </button>
            <button
              type="button"
              onClick={() => setRole('doctor')}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                role === 'doctor'
                  ? 'bg-white text-brand-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              Doctor / Clinician
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Account Credentials */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="e.g. sarah_j"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="First name"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Last name"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="password_confirm"
                  value={formData.password_confirm}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="+1-555-019-2830"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
              />
            </div>

            {/* Doctor Specific Details */}
            {role === 'doctor' && (
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-3">
                <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-indigo-600" />
                  Medical Credentials
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                      Medical License # *
                    </label>
                    <input
                      type="text"
                      name="medical_license"
                      value={formData.medical_license}
                      onChange={handleChange}
                      placeholder="e.g. MD-CAR-84920"
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                      Specialization
                    </label>
                    <select
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 bg-white"
                    >
                      <option>Cardiology</option>
                      <option>Interventional Cardiology</option>
                      <option>Electrophysiology</option>
                      <option>Internal Medicine</option>
                      <option>Cardiovascular Surgery</option>
                      <option>Preventive Medicine</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                    Hospital / Clinic Affiliation
                  </label>
                  <input
                    type="text"
                    name="hospital_affiliation"
                    value={formData.hospital_affiliation}
                    onChange={handleChange}
                    placeholder="e.g. Memorial Cardiac Center"
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>
            )}

            {/* Patient Specific Details */}
            {role === 'patient' && (
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-3">
                <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-600" />
                  Patient Demographics
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleChange}
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                      Biological Sex
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                      Blood Group
                    </label>
                    <select
                      name="blood_group"
                      value={formData.blood_group}
                      onChange={handleChange}
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 bg-white"
                    >
                      <option>O+</option>
                      <option>O-</option>
                      <option>A+</option>
                      <option>A-</option>
                      <option>B+</option>
                      <option>B-</option>
                      <option>AB+</option>
                      <option>AB-</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                    Emergency Contact Name & Phone
                  </label>
                  <input
                    type="text"
                    name="emergency_contact"
                    value={formData.emergency_contact}
                    onChange={handleChange}
                    placeholder="e.g. Mary Doe (+1-555-014-9988)"
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-3 flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Complete {role === 'doctor' ? 'Doctor' : 'Patient'} Registration</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-500">
            Already registered?{' '}
            <Link to="/login" className="font-bold text-brand-600 hover:text-brand-700">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
