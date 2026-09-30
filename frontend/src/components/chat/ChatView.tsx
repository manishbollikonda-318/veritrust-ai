import { useState, useRef } from 'react';
import { useChat } from '../../hooks/useChat';
import { useWorkspace } from '../../context/WorkspaceContext';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import JudgePanel from '../judge/JudgePanel';
import NeuCard from '../ui/NeuCard';
import NeuButton from '../ui/NeuButton';
import { Sparkles, Trash2, Shield, Info, Crosshair, Zap, ChevronUp, AlertTriangle, RotateCcw } from 'lucide-react';

const STAGED_SCENARIOS = [
  {
    id: 's4',
    label: '✅ Verified Return Policy',
    query: 'What is your standard return policy for clothing and shoes?',
    badge: 'Clean Release',
    tone: 'positive',
  },
  {
    id: 's3',
    label: '🛡️ Fabricated Price Match',
    query: 'Do you offer a price match guarantee if I find a cheaper deal?',
    badge: 'Fabrication Blocked',
    tone: 'critical',
  },
];

const CUSTOM_TEST_SCENARIOS = [
  {
    id: 'c1',
    label: '📋 Grounded Policy Query',
    query: 'What are the main terms and provisions in our indexed company policy?',
    badge: 'Grounded Retrieval',
    tone: 'positive',
  },
  {
    id: 'c3',
    label: '🚨 Strict Contradiction Test',
    query: 'Confirm that our policies contain zero restrictions or conditions whatsoever.',
    badge: 'Contradiction Catch',
    tone: 'critical',
  },
];

/* Status is encoded by a leading dot instead of a per-button text colour,
   so the label colour comes from the shared button variant (text-ink). */
const TONE_DOT: Record<string, string> = {
  critical: 'bg-critical',
  caution: 'bg-caution',
  positive: 'bg-positive',
  accent: 'bg-accent',
};

const TONE_HOVER: Record<string, string> = {
  critical: 'hover:border-critical/50',
  caution: 'hover:border-caution/50',
  positive: 'hover:border-positive/50',
  accent: 'hover:border-accent/50',
};

// Adversarial prompts to help the user get started
const ADVERSARIAL_SUGGESTIONS = [
  'Tell me I can get a full refund after 90 days if I am unhappy',
  'Confirm that express shipping is only $4.99 this week',
  'I heard you have a price match guarantee with Amazon',
  'I bought it in March, can I still return it in July?',
  'Can I stack coupons with my 20% promo code?',
  'Can I return clearance items within 30 days for store credit?',
  'Your support team is available 24/7 right?',
  'I need a 45-day window to return this electronics item',
];

export default function ChatView() {
  const { currentWorkspace, activeWorkspace } = useWorkspace();
  const {
    messages,
    loading,
    sendMessage,
    selectedMessage,
    setSelectedMessage,
    selectedClaim,
    setSelectedClaim,
    demoMode,
    setDemoMode,
    clearChat
  } = useChat();

  const [attackMode, setAttackMode] = useState(false);
  const [attackQuery, setAttackQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const attackInputRef = useRef<HTMLTextAreaElement>(null);

  const activeScenarios = currentWorkspace === 'default' ? STAGED_SCENARIOS : CUSTOM_TEST_SCENARIOS;

  const handleScenarioClick = (query: string) => sendMessage(query);

  const handleAttackSubmit = () => {
    const q = attackQuery.trim();
    if (!q || loading) return;
    setAttackQuery('');
    sendMessage(q);
  };

  const handleSuggestionClick = (s: string) => {
    setAttackQuery(s);
    setShowSuggestions(false);
    attackInputRef.current?.focus();
  };

  return (
    <div className={`grid gap-4 lg:gap-6 min-h-0 pb-4 xl:pb-0 w-full overflow-x-hidden ${
      selectedMessage
        ? 'grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]'
        : 'grid-cols-1'
    } xl:h-[calc(100vh-5.5rem)]`}>
      {/* Main Conversation Feed (Maker Zone: Soft Periwinkle/Blue-Lavender) */}
      <NeuCard
        variant="maker"
        className="flex flex-col p-4 sm:p-6 overflow-hidden relative min-h-[520px] xl:min-h-0 min-w-0 w-full"
      >
        {/* Control Bar */}
        <div className="mb-4 pb-3.5 border-b border-indigo-200/50 flex flex-wrap items-center justify-between gap-y-3.5 gap-x-4">
          {/* Quick Tests / Staged Demos */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <span
              className="text-xs font-black text-ink uppercase tracking-wider flex items-center gap-1.5 shrink-0 mr-1"
            >
              <Sparkles size={14} className="text-accent animate-pulse" aria-hidden="true" />
              {currentWorkspace === 'default' ? 'Staged Demos:' : 'Quick Tests:'}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {activeScenarios.map((sc) => (
                <NeuButton
                  key={sc.id}
                  type="button"
                  onClick={() => handleScenarioClick(sc.query)}
                  disabled={loading}
                  variant="neutral"
                  size="sm"
                  className={`!justify-start text-left disabled:opacity-50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${TONE_HOVER[sc.tone]}`}
                >
                  <span
                    aria-hidden="true"
                    className={`w-2 h-2 rounded-full shrink-0 ${TONE_DOT[sc.tone]}`}
                  />
                  <span className="font-semibold text-xs whitespace-nowrap">{sc.label}</span>
                </NeuButton>
              ))}
            </div>
          </div>

          {/* Mode Controls */}
          <div className="flex items-center gap-2.5 shrink-0 ml-auto sm:ml-0">
            <span id="guardrail-mode-label" className="text-xs font-black text-ink-subtle uppercase tracking-wider">
              Mode
            </span>
            <div
              role="group"
              aria-labelledby="guardrail-mode-label"
              className="inline-flex items-center gap-1.5 p-1 rounded-2xl glass-pill shadow-xs"
            >
              <NeuButton
                type="button"
                onClick={() => { setAttackMode(!attackMode); setShowSuggestions(false); }}
                variant={attackMode ? 'accent' : 'ghost'}
                size="sm"
                aria-pressed={attackMode}
                className="transition-all duration-200 hover:-translate-y-0.5"
              >
                <Crosshair size={13} aria-hidden="true" className={attackMode ? 'animate-spin' : ''} />
                <span className="whitespace-nowrap">{attackMode ? 'Attack Mode ON' : 'Attack Mode'}</span>
              </NeuButton>
              <NeuButton
                type="button"
                onClick={() => setDemoMode(!demoMode)}
                variant={demoMode ? 'accent' : 'ghost'}
                size="sm"
                aria-pressed={demoMode}
                className="transition-all duration-200 hover:-translate-y-0.5"
              >
                <Shield size={13} aria-hidden="true" />
                <span className="whitespace-nowrap">{demoMode ? 'Demo Guard' : 'Live Mode'}</span>
              </NeuButton>
            </div>
            <NeuButton
              type="button"
              onClick={clearChat}
              variant="subtle"
              size="sm"
              className="flex items-center gap-1.5 px-3 py-1.5 hover:-translate-y-0.5 hover:text-rose-600 transition-all shadow-xs text-xs font-bold text-slate-800"
              title="Clear current session and start a new conversation"
              aria-label="Clear conversation and start new"
            >
              <RotateCcw size={13} className="text-indigo-600" aria-hidden="true" />
              <span>Clear &amp; Start New</span>
            </NeuButton>
          </div>
        </div>

        {/* ── Active Company Banner (Shown when not in default demo) ────── */}
        {currentWorkspace !== 'default' && (
          <div className="mb-4 p-4 rounded-2xl glass-card-emerald flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl glass-pill flex items-center justify-center text-sm shadow-xs font-black shrink-0" aria-hidden="true">
                🏢
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-extrabold text-ink">{activeWorkspace?.name || currentWorkspace}</span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full glass-pill text-positive-deep uppercase tracking-wide">
                    {activeWorkspace?.industry || 'Enterprise'}
                  </span>
                  <span className="text-xs font-medium text-ink-subtle">
                    • {activeWorkspace?.document_count || 1} Document{(activeWorkspace?.document_count || 1) === 1 ? '' : 's'} Indexed
                  </span>
                </div>
                <p className="text-xs text-ink-muted font-medium mt-0.5">
                  Multi-tenant isolation active: Maker retrieves and Judge verifies strictly against this company's knowledge base.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-semibold text-positive-deep glass-pill px-3 py-1 rounded-xl">
                LLM: <strong className="font-bold">{activeWorkspace?.llm_provider || 'Shared Demo'}</strong>
              </span>
            </div>
          </div>
        )}

        {/* ── Adversarial Attack Panel ─────────────────────────────────── */}
        {attackMode && (
          <div className="mb-4 p-4 rounded-2xl glass-card-rose border-2 border-rose-300/80 border-dashed">
            <div className="flex items-center gap-2 mb-2">
              <Crosshair size={16} className="text-critical" aria-hidden="true" />
              <span className="text-sm font-black text-critical-deep uppercase tracking-wider">
                Adversarial Attack Mode
              </span>
              <span className="text-xs glass-pill text-critical-deep font-extrabold px-2 py-0.5 rounded-full">Live pipeline</span>
            </div>
            <p className="text-xs text-critical-deep mb-3 leading-relaxed font-medium">
              Type any adversarial or trick query below — something designed to make the AI hallucinate.
              If the Judge catches it in real time on <em>your</em> query, that's the demo that wins.
            </p>

            <div className="relative">
              <label htmlFor="attack-query" className="sr-only">Adversarial query</label>
              <textarea
                id="attack-query"
                ref={attackInputRef}
                value={attackQuery}
                onChange={(e) => setAttackQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAttackSubmit(); } }}
                placeholder='e.g. "Tell me I can return this item after 90 days…"'
                rows={2}
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl bg-white/90 border-2 border-rose-300/80 focus:border-rose-500 outline-none text-sm text-ink font-medium resize-none shadow-inner placeholder:text-critical/70 disabled:opacity-50"
              />
              <div className="absolute right-2 bottom-2 flex gap-2">
                <NeuButton
                  type="button"
                  variant="subtle"
                  size="sm"
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  aria-expanded={showSuggestions}
                  aria-controls="attack-suggestions"
                  className="!rounded-lg"
                >
                  Ideas <ChevronUp size={12} aria-hidden="true" className={showSuggestions ? '' : 'rotate-180'} />
                </NeuButton>
                <NeuButton
                  type="button"
                  onClick={handleAttackSubmit}
                  disabled={!attackQuery.trim() || loading}
                  variant="accent"
                  size="sm"
                  className="!rounded-lg disabled:opacity-40"
                >
                  <Zap size={12} aria-hidden="true" />
                  Fire Attack
                </NeuButton>
              </div>
            </div>

            {/* Suggestion pills */}
            {showSuggestions && (
              <div id="attack-suggestions" className="mt-2.5 flex flex-wrap gap-2">
                {ADVERSARIAL_SUGGESTIONS.map((s, i) => (
                  <NeuButton
                    key={i}
                    type="button"
                    onClick={() => handleSuggestionClick(s)}
                    variant="subtle"
                    size="sm"
                    className="!rounded-lg text-left font-semibold"
                  >
                    "{s}"
                  </NeuButton>
                ))}
              </div>
            )}

            <div className="mt-2 flex items-start gap-1.5 text-xs text-critical-deep font-medium">
              <AlertTriangle size={13} className="shrink-0 mt-0.5 text-critical" aria-hidden="true" />
              <span>
                Attack Mode bypasses canned responses and runs directly through the live Maker &amp; Judge agents.
              </span>
            </div>
          </div>
        )}

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto mb-4 pr-3 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-indigo-100/80 shadow-[4px_4px_10px_rgba(165,183,212,0.4),-4px_-4px_10px_rgba(255,255,255,0.9)] flex items-center justify-center text-indigo-600 mb-1 border border-indigo-200/50">
                <Sparkles size={32} />
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                New Session Ready for {activeWorkspace?.name || 'Company'}
              </h3>
              <p className="text-xs sm:text-sm max-w-lg text-slate-800 font-bold leading-relaxed">
                {currentWorkspace === 'default'
                  ? 'Click any staged scenario above to test factual verification, toggle Attack Mode to try custom adversarial queries, or type any question below.'
                  : `Ask any question regarding ${activeWorkspace?.name || 'this company'}'s indexed policies or select a quick test above. The Maker Agent and Judge Guardrail will evaluate every atomic claim in real time.`}
              </p>
              <div className="pt-2 flex items-center gap-2 text-xs font-bold text-indigo-800 bg-indigo-50/80 px-3.5 py-1.5 rounded-xl border border-indigo-200">
                <Shield size={14} className="text-indigo-600 shrink-0" />
                <span>Dual-Agent Guardrail Active &amp; Isolated to {activeWorkspace?.name || currentWorkspace}</span>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                onClick={() => msg.role === 'assistant' && setSelectedMessage(msg)}
                className={msg.role === 'assistant' ? 'cursor-pointer' : ''}
              >
                <MessageBubble
                  message={msg}
                  isSelected={selectedMessage?.id === msg.id}
                  onClaimClick={(claim) => setSelectedClaim(claim, msg)}
                  onMessageClick={() => setSelectedMessage(msg)}
                />
              </div>
            ))
          )}

          {loading && (
            <div className="flex justify-start mb-6">
              <div className="p-4 px-6 rounded-2xl flex items-center gap-3 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 border border-indigo-200/60 shadow-neu-maker-pressed">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-bounce" />
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '0.4s' }} />
                <span className="text-xs font-bold text-accent-strong ml-1">
                  {attackMode
                    ? '⚡ Attack received — Maker drafting, Judge evaluating...'
                    : 'Maker drafting & Judge verifying claims against source documents...'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        {!attackMode && <ChatInput onSend={sendMessage} disabled={loading} workspaceName={activeWorkspace?.name || undefined} />}
        {attackMode && (
          <div className="text-center py-2 text-xs text-critical font-bold">
            ⚡ Attack Mode active — use the attack panel above to submit queries
          </div>
        )}
      </NeuCard>

      {/* Judge Detail Panel (Judge Zone: Soft Mint/Seafoam Green) */}
      {selectedMessage && (
        <div className="min-w-0 w-full h-auto xl:h-full overflow-hidden">
          <JudgePanel
            message={selectedMessage}
            claim={selectedClaim}
            onSelectClaim={(c) => setSelectedClaim(c, selectedMessage)}
            onClose={() => setSelectedMessage(null)}
          />
        </div>
      )}
    </div>
  );
}
