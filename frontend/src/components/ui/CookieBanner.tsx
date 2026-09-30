import { useState, useEffect } from 'react';
import NeuCard from './NeuCard';
import NeuButton from './NeuButton';
import { ShieldCheck, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('veritrust_consent');
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('veritrust_consent', 'accepted');
    setVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('veritrust_consent', 'dismissed');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md animate-fade-in">
      <NeuCard className="p-5 bg-[#E8ECF1] border-2 border-blue-400/40 shadow-2xl">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 text-sm font-bold text-ink">
            <ShieldCheck size={18} className="text-accent" />
            <span>Compliance & Telemetry Consent</span>
          </div>
          <button onClick={handleDismiss} className="text-ink-subtle hover:text-ink-muted" aria-label="Dismiss banner">
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <p className="text-xs text-ink-muted leading-relaxed mb-4">
          VeriTrust AI collects anonymous session telemetry to track accuracy drift and guardrail pass rates. No prompt PII is stored. Read our{' '}
          <Link to="/privacy" className="text-accent underline font-medium">Privacy Policy</Link>.
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={handleDismiss}
            className="text-xs font-semibold text-ink-subtle hover:text-ink-muted px-3 py-1.5"
          >
            Essential Only
          </button>
          <NeuButton
            onClick={handleAccept}
            className="!px-4 !py-1.5 text-xs font-bold text-accent !rounded-xl"
          >
            Accept All
          </NeuButton>
        </div>
      </NeuCard>
    </div>
  );
}
