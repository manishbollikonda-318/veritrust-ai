import { useState } from 'react';
import { X, ShieldAlert, ShieldCheck, AlertTriangle, Clock, ArrowRight, Cpu, DollarSign } from 'lucide-react';
import { Message, Claim } from '../../types';
import NeuCard from '../ui/NeuCard';
import NeuButton from '../ui/NeuButton';
import NeuBadge from '../ui/NeuBadge';
import ClaimCard from './ClaimCard';
import VerificationTimeline from './VerificationTimeline';

interface JudgePanelProps {
  message?: Message | null;
  claim?: Claim | null;
  onSelectClaim?: (claim: Claim) => void;
  onClose: () => void;
}

export default function JudgePanel({ message, claim: initialClaim, onSelectClaim, onClose }: JudgePanelProps) {
  const claims = message?.claims || (initialClaim ? [initialClaim] : []);
  const [activeClaimId, setActiveClaimId] = useState<string>(
    initialClaim?.id || (claims.length > 0 ? claims[0].id : '')
  );

  const activeClaim = claims.find(c => c.id === activeClaimId) || claims[0];

  const handleClaimClick = (c: Claim) => {
    setActiveClaimId(c.id);
    onSelectClaim?.(c);
  };

  const status = message?.status || (activeClaim ? (activeClaim.verdict === 'Contradicted' ? 'Blocked' : activeClaim.verdict === 'Unsupported' ? 'Corrected' : 'Approved') : 'Approved');

  // Compute cost string
  const costUsd = message?.estimatedCostUsd;
  const costStr = costUsd != null
    ? costUsd < 0.001
      ? `$${(costUsd * 1000).toFixed(4)}m` // millicents
      : `$${costUsd.toFixed(6)}`
    : null;
  const detChecks = message?.deterministicChecksRun ?? 0;

  return (
    <NeuCard
      variant="judge"
      className="h-full flex flex-col p-4 sm:p-5 overflow-y-auto overflow-x-hidden min-w-0 max-h-[85vh] xl:max-h-full"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-5 pb-4 border-b border-emerald-200/60">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl text-white shadow-[2px_2px_8px_rgba(0,0,0,0.15)] ${
            status === 'Approved' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
            status === 'Corrected' ? 'bg-gradient-to-br from-amber-500 to-orange-500' :
            'bg-gradient-to-br from-rose-500 to-red-600'
          }`}>
            {status === 'Approved' ? <ShieldCheck size={20} /> :
             status === 'Corrected' ? <AlertTriangle size={20} /> :
             <ShieldAlert size={20} />}
          </div>
          <div>
            <h3 className="text-base font-black text-ink tracking-tight">Judge Agent Inspection</h3>
            <p className="text-xs font-bold text-positive-deep">Autonomous claim-level verification</p>
          </div>
        </div>
        <NeuButton onClick={onClose} className="!p-2 !rounded-full text-ink-subtle hover:text-ink">
          <X size={16} />
        </NeuButton>
      </div>

      {/* Latency, Cost & Audit Metadata — 4-column grid (Seafoam Pressed Cards) */}
      {message && (
        <div className="mb-5 grid grid-cols-2 gap-2.5">
          <div className="p-3 bg-gradient-to-br from-[#EDF7F2] to-[#DFEFE7] shadow-neu-judge-pressed rounded-xl border border-emerald-200/50">
            <span className="text-xs uppercase font-extrabold text-positive flex items-center gap-1">
              <Clock size={12} /> Maker
            </span>
            <span className="text-sm font-black text-ink">
              {message.makerLatencyMs ? `${message.makerLatencyMs}ms` : '120ms'}
            </span>
          </div>
          <div className="p-3 bg-gradient-to-br from-[#EDF7F2] to-[#DFEFE7] shadow-neu-judge-pressed rounded-xl border border-emerald-200/50">
            <span className="text-xs uppercase font-extrabold text-positive flex items-center gap-1">
              <ShieldCheck size={12} /> Judge overhead
            </span>
            <span className="text-sm font-black text-positive-deep">
              {message.judgeLatencyMs ? `+${message.judgeLatencyMs}ms` : '+180ms'}
            </span>
          </div>
          {costStr && (
            <div className="p-3 bg-gradient-to-br from-[#EDF7F2] to-[#DFEFE7] shadow-neu-judge-pressed rounded-xl border border-emerald-200/50">
              <span className="text-xs uppercase font-extrabold text-positive flex items-center gap-1">
                <DollarSign size={12} /> Cost of trust
              </span>
              <span className="text-sm font-black text-positive-deep">{costStr}</span>
              <p className="text-xs text-positive font-semibold mt-0.5 leading-tight">per response verified</p>
            </div>
          )}
          <div className="p-3 bg-gradient-to-br from-[#EDF7F2] to-[#DFEFE7] shadow-neu-judge-pressed rounded-xl border border-emerald-200/50">
            <span className="text-xs uppercase font-extrabold text-positive flex items-center gap-1">
              <Cpu size={12} /> Det. checks
            </span>
            <span className={`text-sm font-black ${detChecks > 0 ? 'text-accent' : 'text-ink-muted'}`}>
              {detChecks > 0 ? `${detChecks} fired` : 'None'}
            </span>
            <p className="text-xs text-positive font-semibold mt-0.5 leading-tight">
              {detChecks > 0 ? 'arithmetic, not AI' : 'semantic-only path'}
            </p>
          </div>
        </div>
      )}

      {/* Intervention Diff: Original Draft vs Final Response */}
      {message && message.originalDraft && message.originalDraft !== message.content && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-amber-50/90 to-amber-100/70 shadow-neu-judge border border-amber-300/60">
          <h4 className="text-xs font-black text-caution-deep uppercase tracking-wider mb-2 flex items-center gap-2">
            <ArrowRight size={14} className="text-caution" />
            Intervention Comparison
          </h4>
          <div className="space-y-3 text-xs">
            <div>
              <span className="font-extrabold text-critical-deep uppercase text-xs">Intercepted Maker Draft:</span>
              <p className="mt-1 p-2.5 bg-rose-100/80 border border-rose-300/60 text-critical-deep rounded-lg line-through font-medium leading-relaxed break-words whitespace-normal shadow-xs">
                "{message.originalDraft}"
              </p>
            </div>
            <div>
              <span className="font-extrabold text-positive-deep uppercase text-xs">Customer-Delivered Resolution:</span>
              <p className="mt-1 p-2.5 bg-emerald-100/80 border border-emerald-300/60 text-positive-deep rounded-lg leading-relaxed font-bold break-words whitespace-normal shadow-xs">
                "{message.content}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Overall Verdict & Reasoning */}
      {message?.overallReasoning && (
        <div className="mb-6">
          <h4 className="text-xs font-black text-positive-deep uppercase tracking-wider mb-2">Verdict Decision</h4>
          <div className={`p-4 rounded-2xl text-xs leading-relaxed font-bold border shadow-xs ${
            status === 'Approved' ? 'bg-emerald-50/90 text-positive-deep border-emerald-300/70' :
            status === 'Corrected' ? 'bg-amber-50/90 text-caution-deep border-amber-300/70' :
            'bg-rose-50/90 text-critical-deep border-rose-300/70'
          }`}>
            {message.overallReasoning}
          </div>
        </div>
      )}

      {/* LangGraph Multi-Agent Feedback Loop Trace */}
      {message?.loopHistory && message.loopHistory.length > 1 && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-indigo-50/90 to-indigo-100/70 shadow-neu-judge border border-indigo-200/80">
          <h4 className="text-xs font-black text-accent-strong uppercase tracking-wider mb-2.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              LangGraph Multi-Agent Loop Trace
            </span>
            <span className="text-xs bg-indigo-200/80 text-accent-strong px-2 py-0.5 rounded-full font-bold">
              {message.loopHistory.length} Steps
            </span>
          </h4>
          <div className="space-y-2">
            {message.loopHistory.map((step: any, sIdx: number) => (
              <div key={sIdx} className="p-2.5 rounded-xl bg-white/80 border border-indigo-100 text-xs shadow-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-ink flex items-center gap-1.5">
                    <span className="text-xs text-accent font-extrabold">#{sIdx + 1}</span>
                    {step.agent || step.step}
                  </span>
                  {step.latency_ms && (
                    <span className="text-xs text-ink-subtle font-mono font-bold">
                      {step.latency_ms}ms
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-muted font-medium">
                  {step.action || (step.is_safe ? 'Verified safe' : 'Flagged discrepancy')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Claims List Tabs */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-xs font-black text-positive-deep uppercase tracking-wider">
            Extracted Claims ({claims.length})
          </h4>
          <span className="text-xs text-positive font-bold">Click to audit</span>
        </div>
        <div className="space-y-2">
          {claims.map((c, index) => {
            const isSelected = c.id === activeClaim?.id;
            return (
              <button
                key={c.id || index}
                onClick={() => handleClaimClick(c)}
                className={`w-full text-left p-3 rounded-xl transition-all duration-150 flex items-start justify-between gap-3 text-xs cursor-pointer ${
                  isSelected
                    ? 'shadow-neu-judge-pressed bg-gradient-to-r from-[#DFEFE7] to-[#D4E8DF] border-l-4 border-teal-600 text-ink font-bold'
                    : 'shadow-neu-judge bg-gradient-to-br from-[#F2FAF6] to-[#E5F3EC] text-ink-muted hover:text-ink border border-emerald-100/60'
                }`}
              >
                <div className="flex-1 truncate pr-2">
                  <span className="font-mono text-xs text-positive mr-2 font-bold">#{index + 1}</span>
                  <span>{c.text}</span>
                </div>
                <div className="shrink-0">
                  <NeuBadge type={c.verdict} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Claim Deep Dive */}
      {activeClaim && (
        <div className="mb-6">
          <h4 className="text-xs font-black text-positive-deep uppercase tracking-wider mb-3">
            Active Claim Evidence
          </h4>
          <ClaimCard claim={activeClaim} />
        </div>
      )}

      {/* Verification Flow Timeline */}
      {activeClaim && (
        <div>
          <h4 className="text-xs font-black text-positive-deep uppercase tracking-wider mb-3">
            Verification Pipeline Flow
          </h4>
          <VerificationTimeline verdict={activeClaim.verdict} claim={activeClaim} />
        </div>
      )}
    </NeuCard>
  );
}
