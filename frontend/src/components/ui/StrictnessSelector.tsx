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
      className={`flex items-center gap-1 bg-white/45 backdrop-blur-xl border border-white/75 rounded-xl p-1 shadow-[0_2px_10px_rgba(15,23,42,0.04),inset_0_1px_1px_rgba(255,255,255,0.9)] ${className}`}
    >
      <button
        type="button"
        role="radio"
        aria-checked={value === 'strict'}
        onClick={() => onChange('strict')}
        title="Strict (Zero-Tolerance): Blocks any statement not 100% corroborated"
        className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-black transition-all duration-200 flex items-center gap-1 cursor-pointer shrink-0 ${
          value === 'strict'
            ? 'text-rose-900 bg-rose-100/90 border border-rose-300/80 shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
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
        className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-black transition-all duration-200 flex items-center gap-1 cursor-pointer shrink-0 ${
          value === 'balanced'
            ? 'text-indigo-900 bg-indigo-100/90 border border-indigo-300/80 shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
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
        className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-black transition-all duration-200 flex items-center gap-1 cursor-pointer shrink-0 ${
          value === 'advisory'
            ? 'text-amber-900 bg-amber-100/90 border border-amber-300/80 shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
        }`}
      >
        <span className="text-[11px]">👁️</span>
        <span>Advisory</span>
      </button>
    </div>
  );
}
