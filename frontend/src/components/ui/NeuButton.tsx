import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

type NeuButtonVariant = 'neutral' | 'subtle' | 'ghost' | 'primary' | 'accent' | 'danger' | 'judge';
type NeuButtonSize = 'sm' | 'md';

/**
 * Single source of truth for button appearance.
 * Every interactive control in the product should pick one `variant` and one
 * `size` instead of hand-rolling gradient/border/shadow utilities.
 */
const VARIANT_STYLES: Record<NeuButtonVariant, string> = {
  neutral:
    'bg-gradient-to-br from-[#F6F8FC] to-[#E8EDF5] text-ink border border-slate-200/60 hover:text-accent',
  subtle:
    'bg-white/70 text-ink-muted border border-slate-200/70 hover:text-accent hover:border-accent/30',
  ghost:
    'bg-transparent text-ink-muted border border-transparent hover:text-accent',
  primary:
    'bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 text-onaccent border border-transparent',
  accent:
    'bg-accent text-onaccent border border-transparent hover:bg-accent-strong active:bg-accent-strong',
  danger:
    'bg-gradient-to-br from-rose-50 to-rose-100 text-critical-deep border border-rose-200/80',
  judge:
    'bg-gradient-to-br from-[#F0F8F4] to-[#E3F2EB] text-positive-deep border border-emerald-200/60',
};

const SIZE_STYLES: Record<NeuButtonSize, string> = {
  sm: 'px-3 py-1.5 rounded-xl text-xs gap-1.5',
  md: 'px-5 py-2.5 rounded-2xl text-sm gap-2',
};

interface NeuButtonProps extends HTMLMotionProps<'button'> {
  active?: boolean;
  className?: string;
  variant?: NeuButtonVariant;
  size?: NeuButtonSize;
  children: React.ReactNode;
}

export default function NeuButton({
  active = false,
  className = '',
  variant = 'neutral',
  size = 'md',
  children,
  ...props
}: NeuButtonProps) {
  return (
    <motion.button
      whileTap={props.disabled ? undefined : { scale: 0.98 }}
      className={`font-bold transition-all duration-200 outline-none flex items-center justify-center cursor-pointer disabled:cursor-not-allowed ${
        SIZE_STYLES[size]
      } ${
        active
          ? 'shadow-neu-pressed text-accent-strong'
          : 'shadow-neu-raised hover:shadow-[7px_7px_16px_rgba(175,187,204,0.5),-7px_-7px_16px_rgba(255,255,255,0.95)]'
      } ${VARIANT_STYLES[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
