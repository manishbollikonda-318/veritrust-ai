import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Database } from 'lucide-react';

const STORAGE_KEY = 'veritrust_data_source_disclosed_v1';

export default function DataSourceDisclosureModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has already acknowledged the disclosure
    const hasSeen = localStorage.getItem(STORAGE_KEY);
    if (!hasSeen) {
      setIsOpen(true);
    }

    // Allow other components (like Knowledge Base or Header) to trigger the modal
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('veritrust:open-data-disclosure', handleOpen);
    return () => window.removeEventListener('veritrust:open-data-disclosure', handleOpen);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Subtle light click-away overlay — NEVER blur or darken heavily so the colorful dashboard behind remains vibrant and directly blurred through the glass card */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-900/10 cursor-pointer"
            onClick={handleDismiss}
          />

          {/* Genuine Glassmorphism Disclosure Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="disclosure-glass-panel relative z-10 w-full max-w-lg overflow-hidden p-6 sm:p-7"
            style={{
              background: 'rgba(255, 255, 255, 0.14)',
              backdropFilter: 'blur(16px) saturate(180%)',
              WebkitBackdropFilter: 'blur(16px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '24px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            }}
          >
            {/* Top light reflection highlight */}
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none" />

            {/* Approachable pill badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/25 text-indigo-950 border border-white/40 mb-3 shadow-xs backdrop-blur-sm">
              <Sparkles size={12} className="text-indigo-600" />
              <span>About this demo</span>
            </div>

            {/* Header */}
            <h3 className="text-base sm:text-lg font-black text-slate-950 tracking-tight drop-shadow-xs">
              Data Source &amp; Synthetic Baseline Disclosure
            </h3>

            {/* Short, honest body text (2-3 sentences) */}
            <div className="mt-3 space-y-2.5 text-xs sm:text-[13px] text-slate-900 leading-relaxed font-medium">
              <p>
                VeriTrust AI is shown here protecting <strong className="font-bold text-slate-950">NovaMart</strong>, a fictional retail company created specifically for this demonstration. Its return policy, shipping tiers, pricing, warranty, and customer service documents are original sample content written for this project — not real data from an actual retailer.
              </p>
              <p>
                The dual-agent verification system, claim extraction, and guardrail logic you are seeing are <strong className="font-bold text-indigo-900">fully functional</strong> and work identically with real enterprise documents. In production, NovaMart&apos;s sample policies would simply be replaced with your business&apos;s real knowledge base.
              </p>
            </div>

            {/* Bring-your-own-data prompt with translucent glass styling */}
            <div className="mt-4 rounded-2xl bg-white/20 border border-white/35 p-3.5 flex items-start gap-3 backdrop-blur-sm shadow-xs">
              <div className="p-1.5 rounded-xl bg-indigo-600/15 text-indigo-900 shrink-0 mt-0.5 border border-white/30">
                <Database size={14} />
              </div>
              <p className="text-[11px] sm:text-xs text-slate-900 font-medium leading-normal">
                <strong className="font-bold text-slate-950">Want to test with your own company data?</strong>{' '}
                Switch to a <span className="font-bold text-indigo-900">Custom Workspace</span> in the Knowledge Base to paste or upload your own corporate policies.
              </p>
            </div>

            {/* Single primary dismiss button */}
            <div className="mt-5 flex items-center justify-end">
              <button
                type="button"
                onClick={handleDismiss}
                className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 group"
              >
                <span>Got it — Continue</span>
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Utility function to allow any button to re-trigger the disclosure modal
export function openDataSourceDisclosure() {
  window.dispatchEvent(new CustomEvent('veritrust:open-data-disclosure'));
}
