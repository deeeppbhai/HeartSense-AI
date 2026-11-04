import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  HeartPulse,
  History,
  User,
  Users,
  Stethoscope,
  ShieldCheck,
  Cpu,
  FileText,
  Activity,
  Layers,
  ChevronRight
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { role } = useAuth();

  const getLinks = () => {
    if (role === 'admin') {
      return [
        { to: '/admin', label: 'Admin Overview', icon: LayoutDashboard },
        { to: '/admin/users', label: 'User & Role Control', icon: Users },
        { to: '/admin/models', label: 'ML Models & Tuning', icon: Cpu },
        { to: '/admin/audit-logs', label: 'Security Audit Trail', icon: ShieldCheck },
        { to: '/assessment/new', label: 'Test Clinical Inference', icon: HeartPulse },
      ];
    }
    if (role === 'doctor') {
      return [
        { to: '/doctor', label: 'Doctor Caseload', icon: LayoutDashboard },
        { to: '/doctor/patients', label: 'Patient Directory', icon: Users },
        { to: '/doctor/assessment', label: 'Run Patient CDS', icon: Stethoscope },
        { to: '/assessment/history', label: 'All Predictions Log', icon: History },
        { to: '/profile', label: 'Doctor Profile', icon: User },
      ];
    }
    // Patient links
    return [
      { to: '/dashboard', label: 'My Health Summary', icon: LayoutDashboard },
      { to: '/assessment/new', label: 'Check Cardiac Risk', icon: HeartPulse },
      { to: '/assessment/history', label: 'Prediction History', icon: History },
      { to: '/profile', label: 'My Medical Profile', icon: User },
    ];
  };

  const links = getLinks();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200/80 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 lg:hidden">
          <span className="font-bold text-slate-800">HeartSense Navigation</span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-sm font-semibold"
          >
            ✕
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {role === 'admin' ? 'System Management' : role === 'doctor' ? 'Clinical Workspace' : 'Patient Workspace'}
          </div>

          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/dashboard' || link.to === '/doctor' || link.to === '/admin'}
                onClick={() => onClose && onClose()}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30 font-semibold'
                      : 'text-slate-600 hover:text-brand-700 hover:bg-brand-50/70'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      <span>{link.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4 text-white/80" />}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Footer info widget */}
        <div className="p-4 m-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-1">
            <Activity className="w-3.5 h-3.5 text-brand-600" />
            <span>HeartSense Engine v2.4</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-500">
            Ensemble AI models calibrated on UCI Cleveland Cardiac Dataset.
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
