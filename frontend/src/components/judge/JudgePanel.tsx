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
      className="h-full flex flex-col p-5 sm:p-6 overflow-y-auto"
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
            <h3 className="text-base font-black text-slate-900 tracking-tight">Judge Agent Inspection</h3>
            <p className="text-xs font-bold text-teal-800">Autonomous claim-level verification</p>
          </div>
        </div>
        <NeuButton onClick={onClose} className="!p-2 !rounded-full text-slate-500 hover:text-slate-800">
          <X size={16} />
        </NeuButton>
      </div>

      {/* Latency, Cost & Audit Metadata — 4-column grid (Seafoam Pressed Cards) */}
      {message && (
        <div className="mb-5 grid grid-cols-2 gap-2.5">
          <div className="p-3 bg-gradient-to-br from-[#EDF7F2] to-[#DFEFE7] shadow-neu-judge-pressed rounded-xl border border-emerald-200/50">
            <span className="text-[10px] uppercase font-extrabold text-teal-700 flex items-center gap-1">
              <Clock size={12} /> Maker
            </span>
            <span className="text-sm font-black text-slate-800">
              {message.makerLatencyMs ? `${message.makerLatencyMs}ms` : '120ms'}
            </span>
          </div>
          <div className="p-3 bg-gradient-to-br from-[#EDF7F2] to-[#DFEFE7] shadow-neu-judge-pressed rounded-xl border border-emerald-200/50">
            <span className="text-[10px] uppercase font-extrabold text-teal-700 flex items-center gap-1">
              <ShieldCheck size={12} /> Judge overhead
            </span>
            <span className="text-sm font-black text-teal-800">
              {message.judgeLatencyMs ? `+${message.judgeLatencyMs}ms` : '+180ms'}
            </span>
          </div>
          {costStr && (
            <div className="p-3 bg-gradient-to-br from-[#EDF7F2] to-[#DFEFE7] shadow-neu-judge-pressed rounded-xl border border-emerald-200/50">
              <span className="text-[10px] uppercase font-extrabold text-teal-700 flex items-center gap-1">
                <DollarSign size={12} /> Cost of trust
              </span>
              <span className="text-sm font-black text-emerald-800">{costStr}</span>
              <p className="text-[9px] text-teal-600 font-semibold mt-0.5 leading-tight">per response verified</p>
            </div>
          )}
          <div className="p-3 bg-gradient-to-br from-[#EDF7F2] to-[#DFEFE7] shadow-neu-judge-pressed rounded-xl border border-emerald-200/50">
            <span className="text-[10px] uppercase font-extrabold text-teal-700 flex items-center gap-1">
              <Cpu size={12} /> Det. checks
            </span>
            <span className={`text-sm font-black ${detChecks > 0 ? 'text-indigo-700' : 'text-slate-600'}`}>
              {detChecks > 0 ? `${detChecks} fired` : 'None'}
            </span>
            <p className="text-[9px] text-teal-600 font-semibold mt-0.5 leading-tight">
              {detChecks > 0 ? 'arithmetic, not AI' : 'semantic-only path'}
            </p>
          </div>
        </div>
      )}

      {/* Intervention Diff: Original Draft vs Final Response */}
      {message && message.originalDraft && message.originalDraft !== message.content && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-amber-50/90 to-amber-100/70 shadow-neu-judge border border-amber-300/60">
          <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider mb-2 flex items-center gap-2">
            <ArrowRight size={14} className="text-amber-600" />
            Intervention Comparison
          </h4>
          <div className="space-y-3 text-xs">
            <div>
              <span className="font-extrabold text-rose-800 uppercase text-[10px]">Intercepted Maker Draft:</span>
              <p className="mt-1 p-2.5 bg-rose-100/80 border border-rose-300/60 text-rose-950 rounded-lg line-through font-medium leading-relaxed break-words whitespace-normal shadow-xs">
                "{message.originalDraft}"
              </p>
            </div>
            <div>
              <span className="font-extrabold text-emerald-900 uppercase text-[10px]">Customer-Delivered Resolution:</span>
              <p className="mt-1 p-2.5 bg-emerald-100/80 border border-emerald-300/60 text-emerald-950 rounded-lg leading-relaxed font-bold break-words whitespace-normal shadow-xs">
                "{message.content}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Overall Verdict & Reasoning */}
      {message?.overallReasoning && (
        <div className="mb-6">
          <h4 className="text-xs font-black text-teal-900 uppercase tracking-wider mb-2">Verdict Decision</h4>
          <div className={`p-4 rounded-2xl text-xs leading-relaxed font-bold border shadow-xs ${
            status === 'Approved' ? 'bg-emerald-50/90 text-emerald-950 border-emerald-300/70' :
            status === 'Corrected' ? 'bg-amber-50/90 text-amber-950 border-amber-300/70' :
            'bg-rose-50/90 text-rose-950 border-rose-300/70'
          }`}>
            {message.overallReasoning}
          </div>
        </div>
      )}

      {/* Claims List Tabs */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-xs font-black text-teal-900 uppercase tracking-wider">
            Extracted Claims ({claims.length})
          </h4>
          <span className="text-[11px] text-teal-700 font-bold">Click to audit</span>
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
                    ? 'shadow-neu-judge-pressed bg-gradient-to-r from-[#DFEFE7] to-[#D4E8DF] border-l-4 border-teal-600 text-slate-900 font-bold'
                    : 'shadow-neu-judge bg-gradient-to-br from-[#F2FAF6] to-[#E5F3EC] text-slate-700 hover:text-slate-950 border border-emerald-100/60'
                }`}
              >
                <div className="flex-1 truncate pr-2">
                  <span className="font-mono text-[10px] text-teal-700 mr-2 font-bold">#{index + 1}</span>
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
          <h4 className="text-xs font-black text-teal-900 uppercase tracking-wider mb-3">
            Active Claim Evidence
          </h4>
          <ClaimCard claim={activeClaim} />
        </div>
      )}

      {/* Verification Flow Timeline */}
      {activeClaim && (
        <div>
          <h4 className="text-xs font-black text-teal-900 uppercase tracking-wider mb-3">
            Verification Pipeline Flow
          </h4>
          <VerificationTimeline verdict={activeClaim.verdict} claim={activeClaim} />
        </div>
      )}
    </NeuCard>
  );
}
