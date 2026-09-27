import { InputHTMLAttributes } from 'react';

interface NeuInputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export default function NeuInput({ className = '', ...props }: NeuInputProps) {
  return (
    <input
      className={`w-full px-4 py-3 rounded-2xl bg-gradient-to-br from-[#EEF3FA] to-[#E3EBF6] shadow-[inset_2px_2px_5px_rgba(165,180,205,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.9)] text-ink font-semibold outline-none placeholder-ink-subtle focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-60 border border-slate-200/60 transition-all ${className}`}
      {...props}
    />
  );
}
