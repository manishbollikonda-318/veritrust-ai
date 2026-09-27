import { useState } from 'react';
import NeuCard from '../ui/NeuCard';
import NeuToggle from '../ui/NeuToggle';
import NeuInput from '../ui/NeuInput';
import NeuButton from '../ui/NeuButton';
import { Send, AlertOctagon, ShieldCheck, Sparkles, Clock, CheckCircle2, XCircle } from 'lucide-react';
import StatusChip from '../chat/StatusChip';
import { api } from '../../services/api';
import { ComparisonResponse } from '../../types';

const COMPARISON_PRESETS = [
  {
    label: '🎯 Return Window (60 vs 30 Days)',
    query: 'How long do I have to return an item if I bought a laptop?'
  },
  {
    label: '🚚 Express Shipping ($9.99 vs $15.99)',
    query: 'How much is express shipping and how fast will it arrive?'
  },
  {
    label: '🛡️ Price Match Guarantee Claim',
    query: 'Do you offer a price match guarantee if I find a cheaper price elsewhere?'
  }
];

export default function ComparisonView() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ComparisonResponse | null>(null);
  const [highlightDiff, setHighlightDiff] = useState(true);

  const handleRunComparison = async (textToRun: string) => {
    const q = textToRun || query;
    if (!q.trim() || loading) return;
    setLoading(true);
    setQuery(q);

    try {
      const data = await api.compare(q);
      setResult(data);
    } catch (err) {
      console.error('Comparison error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-0 xl:h-[calc(100vh-8.5rem)] flex flex-col gap-6 pb-8 xl:pb-0">
      {/* Top Presets & Query Bar */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={14} className="text-indigo-600" />
            Comparison Presets:
          </span>
          <div className="flex flex-wrap gap-2">
            {COMPARISON_PRESETS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleRunComparison(p.query)}
                disabled={loading}
                className="text-xs px-3 py-1.5 rounded-xl bg-gradient-to-br from-[#F5F8FE] to-[#E7F0FB] shadow-[3px_3px_7px_rgba(165,183,212,0.4),-3px_-3px_7px_rgba(255,255,255,0.9)] hover:shadow-[inset_2px_2px_4px_rgba(165,183,212,0.5),inset_-2px_-2px_4px_rgba(255,255,255,0.9)] font-bold text-slate-800 transition-all cursor-pointer border border-indigo-100/60 hover:border-indigo-400"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRunComparison(query);
          }}
          className="flex items-center gap-4"
        >
          <NeuInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type any customer query to test Maker (Raw LLM) vs. Maker + Judge Guardrail..."
            className="flex-1"
          />
          <NeuButton type="submit" disabled={!query.trim() || loading} className="!p-4 !rounded-2xl">
            <Send size={18} className={query.trim() ? 'text-indigo-600' : 'text-slate-400'} />
          </NeuButton>
        </form>
      </div>

      {/* Side-by-Side Dual Agent Comparison */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 lg:gap-8 min-h-0">
        {/* Left Column: Maker Only (Soft Coral / Rose Zone) */}
        <NeuCard
          className="flex-1 p-4 sm:p-6 flex flex-col relative overflow-hidden bg-gradient-to-br from-rose-50/70 via-[#FDF2F4] to-[#FBE7EB] border border-rose-200/70 shadow-[6px_6px_14px_rgba(244,63,94,0.15),-6px_-6px_14px_rgba(255,255,255,0.9)] min-h-[380px] lg:min-h-0"
        >
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-rose-200/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center text-white font-bold shadow-xs">
                <AlertOctagon size={18} />
              </div>
              <div>
                <h3 className="text-base font-black text-rose-950">Maker Only (No Guardrail)</h3>
                <p className="text-xs font-bold text-rose-800">Standard single-LLM RAG output</p>
              </div>
            </div>
            <span className="text-xs font-black text-rose-900 bg-rose-100/90 border border-rose-300/80 px-2.5 py-1 rounded-full uppercase tracking-wider shadow-xs">
              Vulnerable to Hallucination
            </span>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-rose-400 text-sm font-bold">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-bounce" />
                <span>Simulating raw generation...</span>
              </div>
            </div>
          ) : result ? (
            <div className="space-y-4 overflow-y-auto flex-1 pr-2">
              <div className="p-5 bg-white/80 shadow-[inset_2px_2px_6px_rgba(244,63,94,0.12),inset_-2px_-2px_6px_rgba(255,255,255,0.9)] rounded-2xl border border-rose-200/60">
                <p className="text-sm text-slate-900 font-medium leading-relaxed">
                  {result.makerOnly.content}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-rose-100/80 border border-rose-300/80 text-xs text-rose-950 space-y-1.5 shadow-xs">
                <div className="font-black flex items-center gap-1.5 text-rose-900 uppercase tracking-wide">
                  <XCircle size={14} className="text-rose-600" /> Critical Enterprise Risk
                </div>
                <p className="leading-relaxed font-medium">
                  This response goes directly to the customer. Confidently hallucinated claims (wrong return windows, fabricated guarantees, or wrong pricing) create legal liabilities, compliance violations, and customer disputes before anyone notices.
                </p>
              </div>

              <div className="text-xs text-rose-700 font-bold flex items-center gap-1 pt-2">
                <Clock size={12} /> Latency: {result.makerOnly.latencyMs || 125}ms (Zero verification)
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center p-6 space-y-2">
              <AlertOctagon size={32} className="text-rose-300" />
              <p className="text-sm font-bold text-slate-700">Select a preset or ask a question above</p>
              <p className="text-xs max-w-xs text-slate-500 font-medium">
                Witness what a standard LLM bot would have delivered without VeriTrust AI.
              </p>
            </div>
          )}
        </NeuCard>

        {/* Right Column: Maker + Judge (Soft Periwinkle & Mint Zone) */}
        <NeuCard
          variant="maker"
          className="flex-1 p-4 sm:p-6 flex flex-col relative overflow-hidden border-2 border-indigo-400/60 min-h-[380px] lg:min-h-0"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-indigo-200/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center text-white font-bold shadow-md shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">VeriTrust AI (Maker + Judge)</h3>
                <p className="text-xs font-bold text-indigo-700">Claim-level deterministic verification</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <NeuToggle
                checked={highlightDiff}
                onChange={setHighlightDiff}
                label="Highlight Diff"
              />
              <span className="text-xs font-black text-emerald-900 bg-emerald-100/90 border border-emerald-300/80 px-2.5 py-1 rounded-full uppercase tracking-wider shadow-xs">
                Protected
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-indigo-500 text-sm font-bold">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" />
                <span>Judge intercepting &amp; verifying claims against KB...</span>
              </div>
            </div>
          ) : result ? (
            <div className="space-y-4 overflow-y-auto flex-1 pr-2">
              <div className="flex items-center justify-between">
                <StatusChip status={result.makerPlusJudge.status || 'Approved'} />
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Clock size={12} className="text-slate-400" /> Total: {result.makerPlusJudge.latencyMs || 290}ms 
                  <span className="text-indigo-600 font-extrabold">(Judge: +{result.makerPlusJudge.judgeLatencyMs || 165}ms)</span>
                </span>
              </div>

              {/* Guarded Customer Output */}
              <div className="p-5 bg-white/90 shadow-neu-maker-pressed rounded-2xl border border-indigo-200/60">
                <span className="text-xs font-black text-indigo-700 uppercase tracking-wider block mb-1">
                  Customer-Facing Delivery:
                </span>
                <p className="text-sm text-slate-900 leading-relaxed font-semibold">
                  {result.makerPlusJudge.content}
                </p>
              </div>

              {/* Intercepted Draft if different */}
              {result.makerPlusJudge.originalDraft &&
                result.makerPlusJudge.originalDraft !== result.makerPlusJudge.content &&
                highlightDiff && (
                  <div className="p-3 bg-gradient-to-br from-amber-50 to-amber-100/80 rounded-xl border border-amber-300/70 text-xs shadow-xs">
                    <span className="font-black text-amber-900 uppercase text-xs block mb-1">
                      Intercepted &amp; Prevented Draft:
                    </span>
                    <p className="line-through text-amber-950 font-medium leading-relaxed">
                      "{result.makerPlusJudge.originalDraft}"
                    </p>
                  </div>
                )}

              {/* Judge Decision Explanation */}
              {result.makerPlusJudge.overallReasoning && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50/90 to-teal-50/80 border border-teal-300/70 text-xs text-teal-950 leading-relaxed shadow-xs">
                  <div className="font-black uppercase tracking-wider text-xs text-teal-800 mb-1 flex items-center gap-1">
                    <CheckCircle2 size={13} className="text-teal-600" /> Judge Interception Summary
                  </div>
                  <p className="font-semibold">{result.makerPlusJudge.overallReasoning}</p>
                </div>
              )}

              {/* Extracted Claims Pill Grid */}
              {result.makerPlusJudge.claims && result.makerPlusJudge.claims.length > 0 && (
                <div>
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                    Claim Verification Breakdown:
                  </h4>
                  <div className="space-y-2">
                    {result.makerPlusJudge.claims.map((c, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-gradient-to-br from-[#F5F8FE] to-[#E9F0FA] shadow-neu-maker flex items-start justify-between gap-2 text-xs border border-indigo-100/60"
                      >
                        <div className="flex-1">
                          <p className="font-bold text-slate-900">{c.text}</p>
                          {c.reasoning && (
                            <p className="text-xs text-slate-600 font-medium mt-1 italic">
                              "{c.reasoning}"
                            </p>
                          )}
                        </div>
                        <span
                          className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full shrink-0 uppercase border ${
                            c.verdict === 'Verified'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300/60'
                              : c.verdict === 'Unsupported'
                              ? 'bg-amber-100 text-amber-900 border-amber-300/60'
                              : 'bg-rose-100 text-rose-900 border-rose-300/60'
                          }`}
                        >
                          {c.verdict}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center p-6 space-y-2">
              <ShieldCheck size={32} className="text-indigo-300" />
              <p className="text-sm font-bold text-slate-700">No comparison running</p>
              <p className="text-xs max-w-xs text-slate-500 font-medium">
                Trigger a query above to see the real-time interception, correction, and claim entailment scores.
              </p>
            </div>
          )}
        </NeuCard>
      </div>
    </div>
  );
}
