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
    bg: 'bg-white/75 backdrop-blur-xl border border-white/80',
    raised: 'shadow-neu-raised',
    pressed: 'shadow-neu-pressed',
  },
  maker: {
    bg: 'bg-gradient-to-br from-[#F2F6FE]/85 via-[#EDF3FC]/75 to-[#E2ECFA]/85 backdrop-blur-xl border border-blue-200/60',
    raised: 'shadow-neu-maker',
    pressed: 'shadow-neu-maker-pressed',
  },
  judge: {
    bg: 'bg-gradient-to-br from-[#F0F8F4]/85 via-[#E8F4EE]/75 to-[#DCEDE5]/85 backdrop-blur-xl border border-emerald-200/70',
    raised: 'shadow-neu-judge',
    pressed: 'shadow-neu-judge-pressed',
  },
  metrics: {
    bg: 'bg-gradient-to-br from-[#F5F2FB]/85 via-[#EFEAF7]/75 to-[#E5DCF2]/85 backdrop-blur-xl border border-purple-200/60',
    raised: 'shadow-neu-metrics',
    pressed: 'shadow-neu-metrics-pressed',
  },
  chrome: {
    bg: 'bg-gradient-to-b from-[#E7EDF6]/85 via-[#DFE6F1]/75 to-[#D7E0EC]/85 backdrop-blur-2xl border-r border-white/60',
    raised: 'shadow-neu-raised',
    pressed: 'shadow-neu-pressed',
  },
  white: {
    bg: 'bg-white/80 backdrop-blur-xl border border-white/85',
    raised: 'shadow-neu-raised',
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
