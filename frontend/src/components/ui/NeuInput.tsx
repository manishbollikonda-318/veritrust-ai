import { InputHTMLAttributes } from 'react';

interface NeuInputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export default function NeuInput({ className = '', ...props }: NeuInputProps) {
  return (
    <input
      className={`w-full px-4 py-3 rounded-2xl bg-white/70 backdrop-blur-md shadow-[inset_1.5px_1.5px_4px_rgba(15,23,42,0.06),inset_-1.5px_-1.5px_4px_rgba(255,255,255,0.9)] text-ink font-semibold outline-none placeholder-ink-subtle focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-60 border border-white/80 transition-all ${className}`}
      {...props}
    />
  );
}
