import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export type NeuCardVariant = 'neutral' | 'maker' | 'judge' | 'metrics' | 'chrome' | 'white' | 'glass' | 'glass-accent' | 'glass-emerald' | 'glass-amber' | 'glass-rose';

interface NeuCardProps extends HTMLMotionProps<"div"> {
  pressed?: boolean;
  variant?: NeuCardVariant;
  className?: string;
  children: React.ReactNode;
}

const variantStyles: Record<NeuCardVariant, { raised: string; pressed: string; bg: string }> = {
  neutral: {
    bg: 'bg-white/70 backdrop-blur-3xl border border-white/90',
    raised: 'shadow-neu-raised hover:shadow-[0_16px_36px_-6px_rgba(15,23,42,0.1),inset_0_2px_2px_rgba(255,255,255,0.95)]',
    pressed: 'shadow-neu-pressed',
  },
  maker: {
    bg: 'bg-gradient-to-br from-[#EBF4FF]/72 via-[#DCEBFF]/52 to-[#E8F2FF]/65 backdrop-blur-3xl border border-blue-200/80',
    raised: 'shadow-neu-maker hover:shadow-[0_18px_40px_-6px_rgba(37,99,235,0.16),inset_0_2px_2px_rgba(255,255,255,0.98)]',
    pressed: 'shadow-neu-maker-pressed',
  },
  judge: {
    bg: 'bg-gradient-to-br from-[#E8FAF3]/72 via-[#D2F6E8]/52 to-[#E2F9F0]/65 backdrop-blur-3xl border border-emerald-200/80',
    raised: 'shadow-neu-judge hover:shadow-[0_18px_40px_-6px_rgba(16,185,129,0.16),inset_0_2px_2px_rgba(255,255,255,0.98)]',
    pressed: 'shadow-neu-judge-pressed',
  },
  metrics: {
    bg: 'bg-gradient-to-br from-[#F6F0FF]/72 via-[#E8DCFF]/52 to-[#F2E6FF]/65 backdrop-blur-3xl border border-purple-200/80',
    raised: 'shadow-neu-metrics hover:shadow-[0_18px_40px_-6px_rgba(139,92,246,0.16),inset_0_2px_2px_rgba(255,255,255,0.98)]',
    pressed: 'shadow-neu-metrics-pressed',
  },
  chrome: {
    bg: 'bg-gradient-to-b from-white/70 via-[#E8F0FA]/50 to-[#DCE7F5]/60 backdrop-blur-3xl border-r border-white/80',
    raised: 'shadow-neu-raised',
    pressed: 'shadow-neu-pressed',
  },
  white: {
    bg: 'bg-white/75 backdrop-blur-3xl border border-white/90',
    raised: 'shadow-neu-raised hover:shadow-[0_16px_36px_-6px_rgba(15,23,42,0.1),inset_0_2px_2px_rgba(255,255,255,0.95)]',
    pressed: 'shadow-neu-pressed',
  },
  // ── Liquid Glass variants ─────────────────────────────────────────
  glass: {
    bg: 'glass-card',
    raised: '',
    pressed: '',
  },
  'glass-accent': {
    bg: 'glass-card-accent',
    raised: '',
    pressed: '',
  },
  'glass-emerald': {
    bg: 'glass-card-emerald',
    raised: '',
    pressed: '',
  },
  'glass-amber': {
    bg: 'glass-card-amber',
    raised: '',
    pressed: '',
  },
  'glass-rose': {
    bg: 'glass-card-rose',
    raised: '',
    pressed: '',
  },
};

export default function NeuCard({
  pressed = false,
  variant = 'neutral',
  className = '',
  children,
  ...props
}: NeuCardProps) {
  const v = variantStyles[variant] || variantStyles.neutral;
  const shadowClass = pressed ? v.pressed : v.raised;

  return (
    <motion.div
      className={`rounded-2xl transition-all duration-300 ${v.bg} ${shadowClass} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}
