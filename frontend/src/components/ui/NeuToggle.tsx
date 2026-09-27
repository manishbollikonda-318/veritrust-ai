import React from 'react';
import { motion } from 'framer-motion';

interface NeuToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export default function NeuToggle({ checked, onChange, label }: NeuToggleProps) {
  return (
    <div className="flex items-center gap-3 cursor-pointer" onClick={() => onChange(!checked)}>
      {label && <span className="text-sm font-semibold text-ink-muted">{label}</span>}
      <div className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${checked ? 'bg-blue-500 shadow-neu-pressed' : 'bg-[#E8ECF1] shadow-neu-pressed'}`}>
        <motion.div
          className="w-6 h-6 rounded-full bg-[#E8ECF1] shadow-md"
          animate={{ x: checked ? 24 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </div>
    </div>
  );
}
