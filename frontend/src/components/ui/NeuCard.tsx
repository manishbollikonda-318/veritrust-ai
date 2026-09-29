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
    bg: 'bg-gradient-to-br from-[#F6F8FC] via-[#EEF2F8] to-[#E5EBF4]',
    raised: 'shadow-neu-raised',
    pressed: 'shadow-neu-pressed',
  },
  maker: {
    bg: 'bg-gradient-to-br from-[#F2F6FE] via-[#EDF3FC] to-[#E2ECFA]',
    raised: 'shadow-neu-maker border border-blue-100/50',
    pressed: 'shadow-neu-maker-pressed border border-blue-200/40',
  },
  judge: {
    bg: 'bg-gradient-to-br from-[#F0F8F4] via-[#E8F4EE] to-[#DCEDE5]',
    raised: 'shadow-neu-judge border border-emerald-100/60',
    pressed: 'shadow-neu-judge-pressed border border-emerald-200/50',
  },
  metrics: {
    bg: 'bg-gradient-to-br from-[#F5F2FB] via-[#EFEAF7] to-[#E5DCF2]',
    raised: 'shadow-neu-metrics border border-purple-100/50',
    pressed: 'shadow-neu-metrics-pressed border border-purple-200/40',
  },
  chrome: {
    bg: 'bg-gradient-to-b from-[#E7EDF6] via-[#DFE6F1] to-[#D7E0EC]',
    raised: 'shadow-neu-raised border-r border-slate-300/60',
    pressed: 'shadow-neu-pressed',
  },
  white: {
    bg: 'bg-white/80 backdrop-blur-xs',
    raised: 'shadow-neu-raised border border-white/60',
    pressed: 'shadow-neu-pressed border border-slate-200/50',
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
