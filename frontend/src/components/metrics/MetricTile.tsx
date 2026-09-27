import React from 'react';
import NeuCard from '../ui/NeuCard';

interface MetricTileProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  category?: 'rate' | 'latency' | 'claims' | 'drift' | 'general';
}

export default function MetricTile({ title, value, subtitle, trend, icon, category = 'general' }: MetricTileProps) {
  const getTrendColor = () => {
    if (trend === 'up') return 'text-emerald-900 bg-emerald-100/90 border-emerald-300/70';
    if (trend === 'down') return 'text-rose-900 bg-rose-100/90 border-rose-300/70';
    return 'text-indigo-900 bg-indigo-100/90 border-indigo-300/70';
  };

  return (
    <NeuCard
      variant="metrics"
      className="p-5 flex flex-col justify-between min-h-[140px] w-full relative overflow-hidden transition-all duration-200 hover:shadow-[8px_8px_18px_rgba(178,172,208,0.5),-8px_-8px_18px_rgba(255,255,255,0.95)]"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className="text-xs font-black text-purple-900 uppercase tracking-wider truncate">{title}</h3>
        {icon && <div className="text-purple-600 shrink-0">{icon}</div>}
      </div>
      
      <div className="my-1">
        <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">{value}</div>
      </div>

      {subtitle && (
        <div className="mt-2 pt-2 border-t border-purple-200/50">
          <div className={`text-[11px] sm:text-xs font-extrabold px-2.5 py-1 rounded-xl border ${getTrendColor()} leading-snug break-words shadow-xs`}>
            {subtitle}
          </div>
        </div>
      )}
    </NeuCard>
  );
}
