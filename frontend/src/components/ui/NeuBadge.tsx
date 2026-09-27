import React from 'react';

export type BadgeType = 'Verified' | 'Unsupported' | 'Contradicted' | 'Approved' | 'Corrected' | 'Blocked';

interface NeuBadgeProps {
  type: BadgeType;
  className?: string;
  size?: 'sm' | 'md';
}

const typeConfig: Record<BadgeType, { bg: string; text: string; border: string; shadow: string; dot: string }> = {
  Verified: {
    bg: 'bg-emerald-50/90 hover:bg-emerald-100/90',
    text: 'text-positive-deep',
    border: 'border-emerald-300/60',
    shadow: 'shadow-[2px_2px_6px_rgba(16,185,129,0.18),-2px_-2px_6px_rgba(255,255,255,0.9)]',
    dot: 'bg-emerald-500',
  },
  Approved: {
    bg: 'bg-emerald-50/90 hover:bg-emerald-100/90',
    text: 'text-positive-deep',
    border: 'border-emerald-300/60',
    shadow: 'shadow-[2px_2px_6px_rgba(16,185,129,0.18),-2px_-2px_6px_rgba(255,255,255,0.9)]',
    dot: 'bg-emerald-500',
  },
  Unsupported: {
    bg: 'bg-amber-50/90 hover:bg-amber-100/90',
    text: 'text-caution-deep',
    border: 'border-amber-300/60',
    shadow: 'shadow-[2px_2px_6px_rgba(245,158,11,0.18),-2px_-2px_6px_rgba(255,255,255,0.9)]',
    dot: 'bg-amber-500',
  },
  Corrected: {
    bg: 'bg-amber-50/90 hover:bg-amber-100/90',
    text: 'text-caution-deep',
    border: 'border-amber-300/60',
    shadow: 'shadow-[2px_2px_6px_rgba(245,158,11,0.18),-2px_-2px_6px_rgba(255,255,255,0.9)]',
    dot: 'bg-amber-500',
  },
  Contradicted: {
    bg: 'bg-rose-50/90 hover:bg-rose-100/90',
    text: 'text-critical-deep',
    border: 'border-rose-300/60',
    shadow: 'shadow-[2px_2px_6px_rgba(244,63,94,0.18),-2px_-2px_6px_rgba(255,255,255,0.9)]',
    dot: 'bg-rose-500',
  },
  Blocked: {
    bg: 'bg-rose-50/90 hover:bg-rose-100/90',
    text: 'text-critical-deep',
    border: 'border-rose-300/60',
    shadow: 'shadow-[2px_2px_6px_rgba(244,63,94,0.18),-2px_-2px_6px_rgba(255,255,255,0.9)]',
    dot: 'bg-rose-500',
  }
};

export default function NeuBadge({ type, className = '', size = 'sm' }: NeuBadgeProps) {
  const config = typeConfig[type] || typeConfig.Verified;
  const padding = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-extrabold uppercase tracking-wider border transition-all ${padding} ${config.bg} ${config.text} ${config.border} ${config.shadow} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
      {type}
    </span>
  );
}
