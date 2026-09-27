import React from 'react';
import { CheckCircle, AlertCircle, XCircle, Database, ScanSearch, Calculator, BrainCircuit } from 'lucide-react';
import { ClaimVerdict, Claim } from '../../types';

interface VerificationTimelineProps {
  verdict: ClaimVerdict;
  claim?: Claim;
}

interface Step {
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  status: 'done' | 'active' | 'skipped';
  color: string;
}

export default function VerificationTimeline({ verdict, claim }: VerificationTimelineProps) {
  const isDeterministic = claim?.retrievalTrace?.deterministic_applied;

  const steps: Step[] = [
    {
      label: 'Claim Extracted',
      sublabel: 'Sentence boundary detection',
      icon: <ScanSearch size={12} />,
      status: 'done',
      color: 'bg-teal-600',
    },
    {
      label: 'KB Vector Retrieval',
      sublabel: claim?.retrievalTrace
        ? `${claim.retrievalTrace.candidates_retrieved} candidates from ${claim.retrievalTrace.documents_searched?.length ?? '?'} docs (${claim.retrievalTrace.retrieval_ms}ms)`
        : 'Top-k chunks from vector store',
      icon: <Database size={12} />,
      status: 'done',
      color: 'bg-teal-600',
    },
    {
      label: isDeterministic ? 'Deterministic Rule Check ⚡' : 'Semantic Entailment',
      sublabel: isDeterministic
        ? `${(claim?.retrievalTrace?.deterministic_method ?? 'rule').replace(/_/g, ' ')} — arithmetic, not AI`
        : claim?.retrievalTrace
          ? `Entailment score: ${((claim.retrievalTrace.winner_score ?? 0) * 100).toFixed(1)}%`
          : 'SequenceMatcher + Jaccard overlap',
      icon: isDeterministic ? <Calculator size={12} /> : <BrainCircuit size={12} />,
      status: 'done',
      color: isDeterministic ? 'bg-purple-600' : 'bg-teal-600',
    },
    {
      label: 'Policy Negation Check',
      sublabel: 'Explicit policy denials & contradictions',
      icon: <ScanSearch size={12} />,
      status: isDeterministic ? 'skipped' : 'done',
      color: isDeterministic ? 'bg-slate-400' : 'bg-teal-600',
    },
    {
      label: `Verdict: ${verdict}`,
      sublabel: claim?.severity && claim.severity !== 'none'
        ? `Severity: ${claim.severity}`
        : 'Decision recorded',
      icon: verdict === 'Verified'
        ? <CheckCircle size={12} />
        : verdict === 'Unsupported'
        ? <AlertCircle size={12} />
        : <XCircle size={12} />,
      status: 'active',
      color: verdict === 'Verified' ? 'bg-emerald-600' : verdict === 'Unsupported' ? 'bg-amber-600' : 'bg-rose-600',
    },
  ];

  return (
    <div className="relative">
      {/* vertical connector line */}
      <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-emerald-200/80" />

      <div className="space-y-3">
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-3 relative">
            {/* dot */}
            <div
              className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white z-10 shadow-sm
                ${step.status === 'skipped' ? 'bg-slate-300' : step.color}`}
            >
              {step.icon}
            </div>
            {/* label */}
            <div className={`flex-1 p-2.5 rounded-xl bg-gradient-to-br from-[#F4FAF6] to-[#E6F3EC] shadow-[3px_3px_7px_rgba(158,192,180,0.35),-3px_-3px_7px_rgba(255,255,255,0.9)] border border-emerald-100/70 min-w-0 ${
              step.status === 'skipped' ? 'opacity-50' : ''
            }`}>
              <p className={`text-xs font-black leading-tight ${
                step.status === 'active' ? 'text-ink' : 'text-ink'
              }`}>
                {step.label}
              </p>
              <p className="text-xs text-positive font-bold mt-0.5 break-words leading-snug">
                {step.sublabel}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
