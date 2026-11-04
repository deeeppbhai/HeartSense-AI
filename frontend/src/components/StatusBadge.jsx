import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

export const RiskBadge = ({ level, size = 'md' }) => {
  const configs = {
    Low: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle2,
      label: 'Low Risk (<25%)',
    },
    Moderate: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: AlertCircle,
      label: 'Moderate Risk (25-50%)',
    },
    High: {
      bg: 'bg-orange-50 text-orange-700 border-orange-200',
      icon: AlertTriangle,
      label: 'High Risk (50-75%)',
    },
    Severe: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: ShieldAlert,
      label: 'Severe Risk (>75%)',
    },
  };

  const config = configs[level] || configs.Low;
  const Icon = config.icon;

  const sizeClass = size === 'lg' 
    ? 'px-3 py-1.5 text-sm font-semibold' 
    : size === 'sm' 
    ? 'px-2 py-0.5 text-xs font-medium' 
    : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border shadow-sm ${config.bg} ${sizeClass}`}>
      <Icon className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
      {config.label}
    </span>
  );
};

export const RoleBadge = ({ role }) => {
  const map = {
    patient: { label: 'Patient', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
    doctor: { label: 'Physician / Doctor', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    admin: { label: 'Administrator', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
  };
  const key = (role || '').toLowerCase();
  const c = map[key] || map.patient;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${c.bg}`}>
      {c.label}
    </span>
  );
};
