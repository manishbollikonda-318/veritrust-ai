import { useState, useEffect } from 'react';
import NeuCard from './NeuCard';
import { Sparkles, Shield, Bot, CheckCircle, X } from 'lucide-react';

export default function WelcomeBanner() {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem('veritrust_welcome_dismissed');
    if (isDismissed === 'true') {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('veritrust_welcome_dismissed', 'true');
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <NeuCard
      className="mb-6 p-5 bg-gradient-to-r from-[#EEF4FE] via-[#F3F6FA] to-[#E8F5EF] border border-indigo-200/60 shadow-[6px_6px_16px_rgba(165,183,212,0.4),-6px_-6px_16px_rgba(255,255,255,0.95)] relative"
    >
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-white/70 transition-colors cursor-pointer"
        title="Dismiss welcome banner"
      >
        <X size={16} />
      </button>

      <div className="flex items-start gap-4">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-[2px_2px_8px_rgba(79,70,229,0.3)] shrink-0">
          <Sparkles size={22} />
        </div>
        <div className="space-y-1.5 pr-8">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            Welcome to VeriTrust AI — Real-Time Hallucination Defense
          </h3>
          <p className="text-xs text-slate-700 font-medium leading-relaxed max-w-3xl">
            VeriTrust AI acts as an in-line safety shield between your AI support bot and your customers. 
            The <span className="font-bold text-indigo-700">Maker Agent</span> drafts responses from your manuals, 
            while the <span className="font-bold text-teal-800">Judge Agent</span> intercepts and verifies every factual claim before it is ever sent.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] font-bold text-slate-800">
            <span className="flex items-center gap-1 text-indigo-700">
              <CheckCircle size={13} /> 1. Maker Drafts (Periwinkle Zone)
            </span>
            <span className="text-slate-400">&rarr;</span>
            <span className="flex items-center gap-1 text-teal-700">
              <Shield size={13} /> 2. Judge Audits Claims (Mint Zone)
            </span>
            <span className="text-slate-400">&rarr;</span>
            <span className="flex items-center gap-1 text-emerald-800">
              <Bot size={13} /> 3. Release, Correct, or Block
            </span>
          </div>
        </div>
      </div>
    </NeuCard>
  );
}
