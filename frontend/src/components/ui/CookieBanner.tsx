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
          <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
            <ShieldCheck size={18} className="text-blue-600" />
            <span>Compliance & Telemetry Consent</span>
          </div>
          <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed mb-4">
          VeriTrust AI collects anonymous session telemetry to track accuracy drift and guardrail pass rates. No prompt PII is stored. Read our{' '}
          <Link to="/privacy" className="text-blue-600 underline font-medium">Privacy Policy</Link>.
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={handleDismiss}
            className="text-xs font-semibold text-gray-500 hover:text-gray-700 px-3 py-1.5"
          >
            Essential Only
          </button>
          <NeuButton
            onClick={handleAccept}
            className="!px-4 !py-1.5 text-xs font-bold text-blue-600 !rounded-xl"
          >
            Accept All
          </NeuButton>
        </div>
      </NeuCard>
    </div>
  );
}
