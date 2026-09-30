import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Database } from 'lucide-react';

const SESSION_SEEN_KEY = 'veritrust_disclosure_seen_in_session';

export default function DataSourceDisclosureModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 1. Detect if the current page load is a browser refresh / reload
    const isReload = (() => {
      try {
        const navEntries = performance.getEntriesByType('navigation');
        if (navEntries.length > 0) {
          return (navEntries[0] as PerformanceNavigationTiming).type === 'reload';
        }
        return (performance as any).navigation?.type === 1;
      } catch {
        return false;
      }
    })();

    // 2. Check if already acknowledged in this browsing session/tab
    const seenInSession = sessionStorage.getItem(SESSION_SEEN_KEY);

    // If page was refreshed (F5 / Cmd+R / reload), DO NOT ask
    if (isReload) {
      setIsOpen(false);
    } else if (!seenInSession) {
      // Fresh navigation via link (new tab / new session) -> Prompt every time!
      setIsOpen(true);
    }

    // Mark as visited for this session so subsequent in-tab reloads or route changes won't re-prompt
    sessionStorage.setItem(SESSION_SEEN_KEY, 'true');

    // Clean up old permanent localStorage key so future link visits aren't blocked
    localStorage.removeItem('veritrust_data_source_disclosed_v1');

    // Allow other components (like Header "Demo Info" button) to manually open modal
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('veritrust:open-data-disclosure', handleOpen);
    return () => window.removeEventListener('veritrust:open-data-disclosure', handleOpen);
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem(SESSION_SEEN_KEY, 'true');
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          onClick={handleDismiss}
        >
          {/* Real Glassmorphism Disclosure Panel — Directly atop dashboard with NO intermediate scrim */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="disclosure-glass-panel relative z-10 w-full max-w-lg overflow-hidden p-6 sm:p-7"
            style={{
              background: 'rgba(255, 255, 255, 0.52)',
              backdropFilter: 'blur(8px) saturate(160%)',
              WebkitBackdropFilter: 'blur(8px) saturate(160%)',
              border: '1px solid rgba(255, 255, 255, 0.65)',
              borderRadius: '24px',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.12), inset 0 1px 1px rgba(255, 255, 255, 0.7)',
            }}
          >
            {/* Top light reflection highlight */}
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none" />

            {/* Approachable pill badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-accent-strong border border-white/30 mb-3 shadow-xs">
              <Sparkles size={12} className="text-accent" />
              <span>About this demo</span>
            </div>

            {/* Header */}
            <h3 className="text-base sm:text-lg font-black text-ink tracking-tight drop-shadow-xs">
              Data Source &amp; Synthetic Baseline Disclosure
            </h3>

            {/* Short, honest body text (2-3 sentences) */}
            <div className="mt-3 space-y-2.5 text-xs sm:text-[13px] text-ink leading-relaxed font-medium">
              <p>
                VeriTrust AI is shown here protecting <strong className="font-bold text-ink">Acme Health</strong>, a fictional healthcare company created specifically for this demonstration. Its return policy, shipping tiers, pricing, warranty, and customer service documents are original sample content written for this project — not real data from an actual healthcare provider.
              </p>
              <p>
                The dual-agent verification system, claim extraction, and guardrail logic you are seeing are <strong className="font-bold text-accent-strong">fully functional</strong> and work identically with real enterprise documents. In production, Acme Health&apos;s sample policies would simply be replaced with your business&apos;s real knowledge base.
              </p>
              <p>
                The <strong className="font-bold text-ink">Review Queue</strong> tab shows <strong className="font-bold text-amber-strong">seeded sample escalations</strong> for Acme Health only — these represent realistic blocked/corrected interactions so you can immediately explore the human-in-the-loop workflow. Custom workspaces start with an empty review queue and populate only from real guardrail interceptions.
              </p>
            </div>

            {/* Bring-your-own-data prompt with translucent glass styling */}
            <div className="mt-4 rounded-2xl bg-white/10 border border-white/25 p-3.5 flex items-start gap-3 shadow-xs">
              <div className="p-1.5 rounded-xl bg-indigo-600/15 text-accent-strong shrink-0 mt-0.5 border border-white/25">
                <Database size={14} />
              </div>
              <p className="text-xs sm:text-xs text-ink font-medium leading-normal">
                <strong className="font-bold text-ink">Want to test with your own company data?</strong>{' '}
                Switch to a <span className="font-bold text-accent-strong">Custom Workspace</span> in the Knowledge Base to paste or upload your own corporate policies.
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
