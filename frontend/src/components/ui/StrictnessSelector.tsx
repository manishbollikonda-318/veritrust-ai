import React from 'react';

export interface StrictnessSelectorProps {
  value: 'strict' | 'balanced' | 'advisory';
  onChange: (mode: 'strict' | 'balanced' | 'advisory') => void;
  className?: string;
}

export default function StrictnessSelector({ value, onChange, className = '' }: StrictnessSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Guardrail Strictness Mode"
      className={`flex items-center gap-1 bg-white/60 backdrop-blur-2xl border border-white/85 rounded-full p-0.5 shadow-[0_2px_12px_rgba(15,23,42,0.04),inset_0_1px_2px_rgba(255,255,255,0.95)] ${className}`}
    >
      <button
        type="button"
        role="radio"
        aria-checked={value === 'strict'}
        onClick={() => onChange('strict')}
        title="Strict (Zero-Tolerance): Blocks any statement not 100% corroborated"
        className={`px-3 py-1 rounded-full text-xs font-black transition-all duration-200 flex items-center gap-1.5 cursor-pointer shrink-0 ${
          value === 'strict'
            ? 'text-rose-950 bg-rose-100/95 border border-rose-300/90 shadow-[0_2px_8px_rgba(244,63,94,0.18)] scale-[1.02]'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
        }`}
      >
        <span className="text-[11px]">🔒</span>
        <span>Strict</span>
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={value === 'balanced'}
        onClick={() => onChange('balanced')}
        title="Balanced (Default): Rewrites minor inaccuracies, blocks direct contradictions"
        className={`px-3 py-1 rounded-full text-xs font-black transition-all duration-200 flex items-center gap-1.5 cursor-pointer shrink-0 ${
          value === 'balanced'
            ? 'text-indigo-950 bg-indigo-100/95 border border-indigo-300/90 shadow-[0_2px_8px_rgba(99,102,241,0.18)] scale-[1.02]'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
        }`}
      >
        <span className="text-[11px]">⚖️</span>
        <span>Balanced</span>
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={value === 'advisory'}
        onClick={() => onChange('advisory')}
        title="Advisory (Monitor): Flags discrepancies in audit telemetry without blocking output"
        className={`px-3 py-1 rounded-full text-xs font-black transition-all duration-200 flex items-center gap-1.5 cursor-pointer shrink-0 ${
          value === 'advisory'
            ? 'text-amber-950 bg-amber-100/95 border border-amber-300/90 shadow-[0_2px_8px_rgba(245,158,11,0.18)] scale-[1.02]'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
        }`}
      >
        <span className="text-[11px]">👁️</span>
        <span>Advisory</span>
      </button>
    </div>
  );
}
