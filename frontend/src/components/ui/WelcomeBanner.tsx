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
    <NeuCard
      className="mb-6 p-4 sm:p-5 bg-gradient-to-r from-[#EEF4FE] via-[#F3F6FA] to-[#E8F5EF] border border-indigo-200/60 shadow-[6px_6px_16px_rgba(165,183,212,0.4),-6px_-6px_16px_rgba(255,255,255,0.95)] relative"
    >
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 p-1.5 text-ink-subtle hover:text-ink rounded-full hover:bg-white/70 transition-colors cursor-pointer"
        title="Dismiss welcome banner"
        aria-label="Dismiss welcome banner"
      >
        <X size={16} aria-hidden="true" />
      </button>

      <div className="flex items-start gap-4">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 text-onaccent shadow-[2px_2px_8px_rgba(79,70,229,0.3)] shrink-0" aria-hidden="true">
          <Sparkles size={22} />
        </div>

        {/* One line by default; the explanation and the 3-step diagram are
            opt-in so the first screen stays light (density heuristic). */}
        <div className="space-y-2 pr-8">
          <h3 className="text-sm font-black text-ink">
            Welcome to VeriTrust AI
          </h3>
          <p className="text-xs text-ink-muted font-medium leading-relaxed max-w-3xl">
            A real-time safety shield between your support bot and your customers: the Maker drafts,
            the Judge verifies every claim before it is sent.
          </p>

          <NeuButton
            type="button"
            variant="subtle"
            size="sm"
            onClick={() => setShowDetails((v) => !v)}
            aria-expanded={showDetails}
            aria-controls="welcome-details"
            className="!rounded-lg"
          >
            How it works
            {showDetails
              ? <ChevronUp size={12} aria-hidden="true" />
              : <ChevronDown size={12} aria-hidden="true" />}
          </NeuButton>

          {showDetails && (
            <div id="welcome-details" className="space-y-3 pt-1 animate-fade-in">
              <p className="text-xs text-ink-muted font-medium leading-relaxed max-w-3xl">
                VeriTrust AI acts as an in-line safety shield between your AI support bot and your customers.
                The <span className="font-bold text-accent-strong">Maker Agent</span> drafts responses from your manuals,
                while the <span className="font-bold text-positive-deep">Judge Agent</span> intercepts and verifies every factual claim before it is ever sent.
              </p>
              <ol className="flex flex-wrap items-center gap-4 pt-1 text-xs font-bold text-ink">
                <li className="flex items-center gap-1 text-accent-strong">
                  <CheckCircle size={13} aria-hidden="true" /> 1. Maker Drafts (Periwinkle Zone)
                </li>
                <li className="text-ink-subtle" aria-hidden="true">&rarr;</li>
                <li className="flex items-center gap-1 text-positive-deep">
                  <Shield size={13} aria-hidden="true" /> 2. Judge Audits Claims (Mint Zone)
                </li>
                <li className="text-ink-subtle" aria-hidden="true">&rarr;</li>
                <li className="flex items-center gap-1 text-positive">
                  <Bot size={13} aria-hidden="true" /> 3. Release, Correct, or Block
                </li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </NeuCard>
  );
}
