import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts';
import { BrainCircuit, Info } from 'lucide-react';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isIncreasing = data.shap_value > 0;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-elevated text-xs max-w-xs border border-slate-700">
        <div className="font-semibold text-slate-100 text-sm mb-1">{data.name}</div>
        <div className="text-slate-300 mb-1">
          Patient Value: <span className="text-white font-medium">{data.value}</span>
        </div>
        <div className="flex items-center gap-1.5 font-semibold">
          <span className={isIncreasing ? 'text-rose-400' : 'text-emerald-400'}>
            {isIncreasing ? '▲ Increases Risk' : '▼ Lowers Risk'}
          </span>
          <span className="text-slate-400">({data.shap_value > 0 ? '+' : ''}{data.shap_value.toFixed(3)})</span>
        </div>
      </div>
    );
  }
  return null;
};

const FeatureImportanceChart = ({ factors = [] }) => {
  // Format for Recharts
  const chartData = (factors || []).slice(0, 7).map((item) => ({
    ...item,
    abs_val: Math.abs(item.shap_value || 0),
    fill: (item.shap_value || 0) > 0 ? '#ef4444' : '#10b981',
  }));

  if (!chartData.length) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
        No feature explainability factors available.
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-brand-600" />
          <h3 className="font-bold text-slate-900 text-base">
            Explainable AI: Key Clinical Drivers (SHAP)
          </h3>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
            Elevates Risk
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            Lowers Risk
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-500 mb-4">
        Derived using SHAP (SHapley Additive exPlanations) values quantifying each biomarker's directional contribution to this patient's cardiac risk prediction.
      </p>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 90, bottom: 5 }}
          >
            <XAxis
              type="number"
              domain={['auto', 'auto']}
              tick={{ fontSize: 11, fill: '#64748b' }}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: '#334155', fontWeight: 500 }}
              width={90}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine x={0} stroke="#cbd5e1" strokeDasharray="3 3" />
            <Bar dataKey="shap_value" radius={[4, 4, 4, 4]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FeatureImportanceChart;
