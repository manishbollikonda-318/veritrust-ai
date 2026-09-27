import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface NeuButtonProps extends HTMLMotionProps<"button"> {
  active?: boolean;
  className?: string;
  variant?: 'neutral' | 'primary' | 'maker' | 'judge';
  children: React.ReactNode;
}

export default function NeuButton({
  active,
  className = '',
  variant = 'neutral',
  children,
  ...props
}: NeuButtonProps) {
  const baseColors =
    variant === 'primary'
      ? 'bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 text-white shadow-[3px_3px_10px_rgba(79,70,229,0.35)]'
      : variant === 'judge'
      ? 'bg-gradient-to-br from-[#F0F8F4] to-[#E3F2EB] text-teal-900 border border-emerald-200/60'
      : 'bg-gradient-to-br from-[#F6F8FC] to-[#E8EDF5] text-slate-800 border border-slate-200/50 hover:text-indigo-600';

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={`px-5 py-2.5 rounded-2xl font-bold transition-all duration-200 outline-none flex items-center justify-center gap-2 cursor-pointer ${
        active
          ? 'shadow-neu-pressed text-indigo-700 bg-[#E0E7F3]'
          : 'shadow-neu-raised hover:shadow-[7px_7px_16px_rgba(175,187,204,0.5),-7px_-7px_16px_rgba(255,255,255,0.95)]'
      } ${baseColors} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
