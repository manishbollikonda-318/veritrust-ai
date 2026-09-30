import { useState, useEffect } from 'react';
import NeuCard from './NeuCard';
import NeuButton from './NeuButton';
import { Sparkles, Shield, Bot, CheckCircle, X, ChevronDown, ChevronUp } from 'lucide-react';

export default function WelcomeBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

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
    <div
      className="mb-6 p-4 sm:p-5 rounded-3xl bg-white/40 hover:bg-white/45 backdrop-blur-2xl border border-white/75 shadow-[0_16px_40px_-8px_rgba(15,23,42,0.07),inset_0_1.5px_2px_rgba(255,255,255,0.95),inset_0_-1.5px_2px_rgba(255,255,255,0.3)] relative transition-all duration-300"
    >
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 p-1.5 text-slate-500 hover:text-slate-800 rounded-full hover:bg-white/50 backdrop-blur-sm border border-transparent hover:border-white/60 transition-all cursor-pointer"
        title="Dismiss welcome banner"
        aria-label="Dismiss welcome banner"
      >
        <X size={16} aria-hidden="true" />
      </button>

      <div className="flex items-start gap-4">
        <div 
          className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-blue-500/15 to-purple-500/20 backdrop-blur-md text-indigo-700 border border-white/80 shadow-[0_4px_16px_rgba(99,102,241,0.18),inset_0_1px_1px_rgba(255,255,255,0.95)] shrink-0" 
          aria-hidden="true"
        >
          <Sparkles size={22} className="text-indigo-600" />
        </div>

        {/* One line by default; the explanation and the 3-step diagram are
            opt-in so the first screen stays light (density heuristic). */}
        <div className="space-y-2 pr-8">
          <h3 className="text-sm sm:text-base font-black text-ink tracking-tight">
            Welcome to VeriTrust AI
          </h3>
          <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed max-w-3xl">
            A real-time safety shield between your support bot and your customers: the Maker drafts,
            the Judge verifies every claim before it is sent.
          </p>

          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            aria-expanded={showDetails}
            aria-controls="welcome-details"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/45 hover:bg-white/65 backdrop-blur-md border border-white/75 text-xs font-bold text-ink shadow-[0_2px_8px_rgba(15,23,42,0.04),inset_0_1px_1px_rgba(255,255,255,0.9)] transition-all cursor-pointer hover:-translate-y-0.5"
          >
            <span>How it works</span>
            {showDetails
              ? <ChevronUp size={12} aria-hidden="true" />
              : <ChevronDown size={12} aria-hidden="true" />}
          </button>

          {showDetails && (
            <div id="welcome-details" className="space-y-3 pt-2 animate-in fade-in-0 duration-200">
              <p className="text-xs text-slate-700 font-medium leading-relaxed max-w-3xl">
                VeriTrust AI acts as an in-line safety shield between your AI support bot and your customers.
                The <span className="font-bold text-accent-strong">Maker Agent</span> drafts responses from your manuals,
                while the <span className="font-bold text-emerald-700">Judge Agent</span> intercepts and verifies every factual claim before it is ever sent.
              </p>
              <ol className="flex flex-wrap items-center gap-2 sm:gap-4 pt-1 text-xs font-bold text-ink">
                <li className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 backdrop-blur-sm border border-blue-200/60 text-blue-700">
                  <CheckCircle size={13} aria-hidden="true" /> 1. Maker Drafts (Periwinkle Zone)
                </li>
                <li className="text-slate-400" aria-hidden="true">&rarr;</li>
                <li className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 backdrop-blur-sm border border-emerald-200/60 text-emerald-700">
                  <Shield size={13} aria-hidden="true" /> 2. Judge Audits Claims (Mint Zone)
                </li>
                <li className="text-slate-400" aria-hidden="true">&rarr;</li>
                <li className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 backdrop-blur-sm border border-indigo-200/60 text-indigo-700">
                  <Bot size={13} aria-hidden="true" /> 3. Release, Correct, or Block
                </li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
