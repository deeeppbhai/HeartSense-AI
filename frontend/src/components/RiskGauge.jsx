import React from 'react';
import { HeartPulse, Activity } from 'lucide-react';

const RiskGauge = ({ probability = 0, riskLevel = 'Low' }) => {
  const pct = Math.min(Math.max(Math.round(probability * 100), 0), 100);

  // Determine color and styling
  let color = '#10b981'; // green
  let glowColor = 'rgba(16, 185, 129, 0.2)';
  let labelColor = 'text-emerald-700';
  let bgColor = 'bg-emerald-50';

  if (pct >= 75) {
    color = '#f43f5e'; // red
    glowColor = 'rgba(244, 63, 94, 0.2)';
    labelColor = 'text-rose-700';
    bgColor = 'bg-rose-50';
  } else if (pct >= 50) {
    color = '#f97316'; // orange
    glowColor = 'rgba(249, 115, 22, 0.2)';
    labelColor = 'text-orange-700';
    bgColor = 'bg-orange-50';
  } else if (pct >= 25) {
    color = '#f59e0b'; // amber
    glowColor = 'rgba(245, 158, 11, 0.2)';
    labelColor = 'text-amber-700';
    bgColor = 'bg-amber-50';
  }

  // Semi-circle SVG arc parameters
  const radius = 80;
  const strokeWidth = 14;
  const circumference = Math.PI * radius; // Half circle
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-slate-200/80 shadow-card">
      <div className="flex items-center gap-2 mb-2">
        <HeartPulse className="w-5 h-5 text-brand-600 animate-pulse" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Cardiovascular Risk Meter
        </span>
      </div>

      <div className="relative flex items-center justify-center my-2">
        <svg width="200" height="115" viewBox="0 0 200 115" className="overflow-visible">
          {/* Background Arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Gradient Active Arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: 'stroke-dashoffset 1s ease-in-out, stroke 0.5s ease',
              filter: `drop-shadow(0 0 6px ${glowColor})`
            }}
          />
        </svg>

        {/* Center Readout */}
        <div className="absolute bottom-1 flex flex-col items-center">
          <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
            {pct}%
          </span>
          <span className="text-xs font-medium text-slate-500">Risk Probability</span>
        </div>
      </div>

      {/* Scale Markers */}
      <div className="w-full max-w-[210px] flex justify-between text-[10px] font-semibold text-slate-400 px-1 mb-4">
        <span>0% (Low)</span>
        <span>50%</span>
        <span>100% (High)</span>
      </div>

      {/* Risk Category Tag */}
      <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 ${bgColor}`}>
        <Activity className={`w-4 h-4 ${labelColor}`} />
        <span className={`text-sm font-bold ${labelColor}`}>
          {riskLevel.toUpperCase()} RISK PROFILE
        </span>
      </div>
    </div>
  );
};

export default RiskGauge;
