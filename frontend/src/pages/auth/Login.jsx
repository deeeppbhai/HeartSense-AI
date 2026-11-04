import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Heart, Lock, User, AlertCircle, ArrowRight, ShieldCheck, Stethoscope, UserCheck } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please provide your username or email and password.');
      return;
    }
    setError('');
    setSubmitting(true);

    const res = await login(username, password);
    setSubmitting(false);

    if (res.success) {
      const userRole = (res.user.role || '').toLowerCase();
      if (userRole === 'admin') navigate('/admin');
      else if (userRole === 'doctor') navigate('/doctor');
      else navigate('/dashboard');
    } else {
      setError(res.error);
    }
  };

  // Quick Demo Login helper
  const handleDemoLogin = async (userCredential, pass) => {
    setUsername(userCredential);
    setPassword(pass);
    setError('');
    setSubmitting(true);
    const res = await login(userCredential, pass);
    setSubmitting(false);
    if (res.success) {
      const userRole = (res.user.role || '').toLowerCase();
      if (userRole === 'admin') navigate('/admin');
      else if (userRole === 'doctor') navigate('/doctor');
      else navigate('/dashboard');
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-brand-900 via-brand-800 to-slate-900 text-slate-800">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-xl mb-4">
          <Heart className="w-9 h-9 text-rose-400 fill-rose-400 animate-pulse" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          HeartSense <span className="text-cyan-400">AI</span>
        </h1>
        <p className="mt-2 text-sm text-brand-100 max-w-sm mx-auto">
          Clinical Decision Support & Explainable Heart Disease Prediction
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-3xl sm:px-10 border border-slate-100">
          
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Username or Medical Email
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. doctor@heartsense.ai"
                  className="block w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-slate-50/50"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Password
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-slate-50/50"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Clinical Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Buttons */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-3">
              Fast Demo Accounts (1-Click)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('patient@heartsense.ai', 'PatientPass123!')}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/80 transition-colors text-center group"
              >
                <UserCheck className="w-4 h-4 text-blue-600 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-blue-900 leading-tight">Patient</span>
                <span className="text-[9px] text-blue-600">Johnathan</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('doctor@heartsense.ai', 'DoctorPass123!')}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/80 transition-colors text-center group"
              >
                <Stethoscope className="w-4 h-4 text-indigo-600 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-indigo-900 leading-tight">Doctor</span>
                <span className="text-[9px] text-indigo-600">Dr. Sarah</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('admin@heartsense.ai', 'AdminPass123!')}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100/80 transition-colors text-center group"
              >
                <ShieldCheck className="w-4 h-4 text-purple-600 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-purple-900 leading-tight">Admin</span>
                <span className="text-[9px] text-purple-600">System</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-brand-600 hover:text-brand-700">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
