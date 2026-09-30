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
    'bg-white/65 hover:bg-white/85 text-ink border border-white/80 hover:border-white shadow-sm backdrop-blur-md hover:text-accent',
  subtle:
    'bg-white/50 hover:bg-white/75 text-ink-muted border border-white/60 hover:text-accent hover:border-accent/30 backdrop-blur-md',
  ghost:
    'bg-transparent text-ink-muted border border-transparent hover:bg-white/40 hover:text-accent backdrop-blur-xs',
  primary:
    'bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 text-onaccent border border-indigo-400/40 shadow-md backdrop-blur-md',
  accent:
    'bg-accent text-onaccent border border-indigo-300/30 hover:bg-accent-strong active:bg-accent-strong shadow-md backdrop-blur-md',
  danger:
    'bg-gradient-to-br from-rose-50/80 to-rose-100/80 text-critical-deep border border-rose-200/80 backdrop-blur-md',
  judge:
    'bg-gradient-to-br from-[#F0F8F4]/80 to-[#E3F2EB]/80 text-positive-deep border border-emerald-200/70 backdrop-blur-md',
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
          ? 'shadow-neu-pressed text-accent-strong bg-white/80'
          : 'shadow-neu-raised hover:shadow-[0_8px_20px_rgba(15,23,42,0.1),inset_0_1px_1px_rgba(255,255,255,0.95)]'
      } ${VARIANT_STYLES[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
