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
    bg: 'bg-white/60 backdrop-blur-2xl border border-white/80',
    raised: 'shadow-neu-raised',
    pressed: 'shadow-neu-pressed',
  },
  maker: {
    bg: 'bg-gradient-to-br from-[#EBF3FF]/60 via-[#DCEBFF]/42 to-[#E8F2FF]/58 backdrop-blur-2xl border border-blue-200/60',
    raised: 'shadow-neu-maker',
    pressed: 'shadow-neu-maker-pressed',
  },
  judge: {
    bg: 'bg-gradient-to-br from-[#E6FAF2]/62 via-[#D0F5E6]/42 to-[#E0F8EE]/58 backdrop-blur-2xl border border-emerald-200/60',
    raised: 'shadow-neu-judge',
    pressed: 'shadow-neu-judge-pressed',
  },
  metrics: {
    bg: 'bg-gradient-to-br from-[#F5EEFF]/62 via-[#E6D8FF]/42 to-[#F0E4FF]/58 backdrop-blur-2xl border border-purple-200/60',
    raised: 'shadow-neu-metrics',
    pressed: 'shadow-neu-metrics-pressed',
  },
  chrome: {
    bg: 'bg-gradient-to-b from-white/60 via-[#E6ECF5]/45 to-[#D8E1ED]/55 backdrop-blur-2xl border-r border-white/65',
    raised: 'shadow-neu-raised',
    pressed: 'shadow-neu-pressed',
  },
  white: {
    bg: 'bg-white/65 backdrop-blur-2xl border border-white/80',
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
