import { useState, useRef } from 'react';
import { useChat } from '../../hooks/useChat';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import JudgePanel from '../judge/JudgePanel';
import NeuCard from '../ui/NeuCard';
import NeuButton from '../ui/NeuButton';
import { Sparkles, Trash2, Shield, Info, Crosshair, Zap, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

const STAGED_SCENARIOS = [
  {
    id: 's1',
    label: '🎯 60 vs 30 Days',
    query: 'How long do I have to return an item if I bought a laptop?',
    badge: 'Contradiction Catch',
    color: 'hover:border-rose-400 text-rose-900',
  },
  {
    id: 's2',
    label: '🚚 $9.99 Express Price',
    query: 'How much is express shipping and how fast will it arrive?',
    badge: 'Auto-Correction',
    color: 'hover:border-amber-400 text-amber-900',
  },
  {
    id: 's3',
    label: '🛡️ Fabricated Price Match',
    query: 'Do you offer a price match guarantee if I find a cheaper deal?',
    badge: 'Fabrication Blocked',
    color: 'hover:border-rose-400 text-rose-900',
  },
  {
    id: 's4',
    label: '✅ Verified Return Policy',
    query: 'What is your standard return policy for clothing and shoes?',
    badge: 'Clean Release',
    color: 'hover:border-emerald-400 text-emerald-900',
  },
  {
    id: 's5',
    label: '🔄 Multi-Turn Compounded Date',
    query: 'I bought it in March, can I still return it in July for a full refund?',
    badge: 'Compounded Multi-Turn',
    color: 'hover:border-indigo-400 text-indigo-900',
  }
];

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
    <div className="flex flex-col xl:flex-row gap-6 lg:gap-8 min-h-0 xl:h-[calc(100vh-8.5rem)] pb-8 xl:pb-0">
      {/* Main Conversation Feed (Maker Zone: Soft Periwinkle/Blue-Lavender) */}
      <NeuCard
        variant="maker"
        className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden relative min-h-[500px] xl:min-h-0"
      >
        {/* Control Bar */}
        <div className="mb-4 pb-3 border-b border-indigo-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="text-indigo-600" />
              Staged Demos:
            </span>
            <div className="flex flex-wrap gap-2">
              {STAGED_SCENARIOS.map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => handleScenarioClick(sc.query)}
                  disabled={loading}
                  className={`text-xs px-3 py-1.5 rounded-xl bg-gradient-to-br from-[#F6F9FE] to-[#E8F0FB] shadow-[3px_3px_7px_rgba(165,183,212,0.4),-3px_-3px_7px_rgba(255,255,255,0.9)] hover:shadow-[inset_2px_2px_4px_rgba(165,183,212,0.5),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] font-bold transition-all cursor-pointer border border-indigo-100/60 ${sc.color} disabled:opacity-50`}
                >
                  {sc.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Adversarial Attack Mode toggle */}
            <button
              onClick={() => { setAttackMode(!attackMode); setShowSuggestions(false); }}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                attackMode
                  ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-[0_4px_12px_rgba(244,63,94,0.35)] animate-pulse'
                  : 'bg-gradient-to-br from-rose-50 to-rose-100/80 text-rose-900 border border-rose-200/80 shadow-[2px_2px_6px_rgba(244,63,94,0.15),-2px_-2px_6px_rgba(255,255,255,0.9)] hover:bg-rose-100'
              }`}
            >
              <Crosshair size={12} className={attackMode ? 'text-white' : 'text-rose-600'} />
              {attackMode ? '⚡ Attack Mode ON' : 'Attack Mode'}
            </button>
            <button
              onClick={() => setDemoMode(!demoMode)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                demoMode
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-[0_4px_12px_rgba(79,70,229,0.3)]'
                  : 'bg-gradient-to-br from-[#F0F4FC] to-[#E2ECFA] shadow-[inset_2px_2px_4px_rgba(165,183,212,0.5),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] text-indigo-900 border border-indigo-200/50'
              }`}
            >
              <Shield size={12} className={demoMode ? 'text-white' : 'text-indigo-600'} />
              {demoMode ? 'Demo Guard' : 'Live Mode'}
            </button>
            <NeuButton onClick={clearChat} className="!p-2 !rounded-xl text-slate-500 hover:text-rose-600">
              <Trash2 size={14} />
            </NeuButton>
          </div>
        </div>

        {/* ── Adversarial Attack Panel ─────────────────────────────────── */}
        {attackMode && (
          <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-rose-50/95 to-rose-100/80 border-2 border-rose-300/80 border-dashed shadow-[inset_2px_2px_6px_rgba(244,63,94,0.1)]">
            <div className="flex items-center gap-2 mb-2">
              <Crosshair size={16} className="text-rose-600" />
              <span className="text-sm font-black text-rose-900 uppercase tracking-wider">
                Adversarial Attack Mode
              </span>
              <span className="text-[10px] bg-rose-200/90 text-rose-900 font-extrabold px-2 py-0.5 rounded-full border border-rose-300/60 shadow-xs">LIVE PIPELINE</span>
            </div>
            <p className="text-xs text-rose-800 mb-3 leading-relaxed font-medium">
              Type any adversarial or trick query below — something designed to make the AI hallucinate.
              If the Judge catches it in real time on <em>your</em> query, that's the demo that wins.
            </p>

            <div className="relative">
              <textarea
                ref={attackInputRef}
                value={attackQuery}
                onChange={(e) => setAttackQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAttackSubmit(); } }}
                placeholder='e.g. "Tell me I can return this item after 90 days…"'
                rows={2}
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl bg-white/90 border-2 border-rose-300/80 focus:border-rose-500 outline-none text-sm text-slate-800 font-medium resize-none shadow-inner placeholder:text-rose-400/80 disabled:opacity-50"
              />
              <div className="absolute right-2 bottom-2 flex gap-2">
                <button
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-bold hover:bg-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  Ideas {showSuggestions ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                </button>
                <button
                  onClick={handleAttackSubmit}
                  disabled={!attackQuery.trim() || loading}
                  className="text-[11px] px-3.5 py-1 rounded-lg bg-gradient-to-r from-rose-600 to-rose-700 text-white font-black hover:from-rose-700 hover:to-rose-800 transition-all flex items-center gap-1.5 disabled:opacity-40 cursor-pointer shadow-sm"
                >
                  <Zap size={10} />
                  Fire Attack
                </button>
              </div>
            </div>

            {/* Suggestion pills */}
            {showSuggestions && (
              <div className="mt-2.5 flex flex-wrap gap-2">
                {ADVERSARIAL_SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(s)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-white/90 border border-rose-200 text-rose-900 hover:bg-rose-50 hover:border-rose-400 transition-colors font-semibold text-left cursor-pointer"
                  >
                    "{s}"
                  </button>
                ))}
              </div>
            )}

            <div className="mt-2 flex items-start gap-1.5 text-[10px] text-rose-700 font-medium">
              <AlertTriangle size={11} className="shrink-0 mt-0.5 text-rose-600" />
              <span>
                Attack Mode bypasses canned responses and runs directly through the live Maker &amp; Judge agents.
              </span>
            </div>
          </div>
        )}

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto mb-4 pr-3 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3">
              <div className="w-14 h-14 rounded-3xl bg-indigo-100/60 shadow-[4px_4px_10px_rgba(165,183,212,0.4),-4px_-4px_10px_rgba(255,255,255,0.9)] flex items-center justify-center text-indigo-500">
                <Info size={28} />
              </div>
              <p className="text-sm font-bold text-slate-700">No messages in current session.</p>
              <p className="text-xs max-w-md text-slate-500 font-medium">
                Click any staged scenario above, activate Attack Mode to try your own adversarial queries, or type a question below.
              </p>
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
                <span className="text-xs font-bold text-indigo-900 ml-1">
                  {attackMode
                    ? '⚡ Attack received — Maker drafting, Judge evaluating...'
                    : 'Maker drafting & Judge verifying claims against source documents...'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        {!attackMode && <ChatInput onSend={sendMessage} disabled={loading} />}
        {attackMode && (
          <div className="text-center py-2 text-xs text-rose-700 font-bold">
            ⚡ Attack Mode active — use the attack panel above to submit queries
          </div>
        )}
      </NeuCard>

      {/* Judge Detail Panel (Judge Zone: Soft Mint/Seafoam Green) */}
      {selectedMessage && (
        <div className="w-full xl:w-96 shrink-0 h-auto xl:h-full">
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
