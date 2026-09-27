import React from 'react';
import { ClaimStatus } from '../../types';

interface StatusChipProps {
  status: ClaimStatus;
  onClick?: () => void;
}

const statusConfig: Record<ClaimStatus, { bg: string; text: string; border: string; dot: string; shadow: string }> = {
  Approved: {
    bg: 'bg-emerald-500/15 hover:bg-emerald-500/25',
    text: 'text-emerald-900',
    border: 'border-emerald-400/50',
    dot: 'bg-emerald-600',
    shadow: 'shadow-[3px_3px_8px_rgba(16,185,129,0.2),-3px_-3px_8px_rgba(255,255,255,0.9)]',
  },
  Corrected: {
    bg: 'bg-amber-500/15 hover:bg-amber-500/25',
    text: 'text-amber-900',
    border: 'border-amber-400/50',
    dot: 'bg-amber-600',
    shadow: 'shadow-[3px_3px_8px_rgba(245,158,11,0.2),-3px_-3px_8px_rgba(255,255,255,0.9)]',
  },
  Blocked: {
    bg: 'bg-rose-500/15 hover:bg-rose-500/25',
    text: 'text-rose-900',
    border: 'border-rose-400/50',
    dot: 'bg-rose-600',
    shadow: 'shadow-[3px_3px_8px_rgba(244,63,94,0.2),-3px_-3px_8px_rgba(255,255,255,0.9)]',
  }
};

export default function StatusChip({ status, onClick }: StatusChipProps) {
  const conf = statusConfig[status] || statusConfig.Approved;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border transition-all ${conf.bg} ${conf.text} ${conf.border} ${conf.shadow} ${
        onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'
      }`}
    >
      <span className={`w-2 h-2 rounded-full ${conf.dot} animate-pulse`} />
      <span>{status}</span>
    </button>
  );
}
