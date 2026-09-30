import { useState } from 'react';
import { Claim } from '../../types';
import NeuBadge from '../ui/NeuBadge';
import { BookOpen, ShieldCheck, AlertTriangle, ChevronDown, ChevronUp, Cpu, Search, FileText, Zap } from 'lucide-react';

interface ClaimCardProps {
  claim: Claim;
}

const SEVERITY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  none:     { label: 'No Risk',  color: 'text-positive-deep', bg: 'bg-emerald-100/90', border: 'border-emerald-300/60' },
  medium:   { label: 'Medium',   color: 'text-caution-deep',   bg: 'bg-amber-100/90',   border: 'border-amber-300/60' },
  high:     { label: 'High',     color: 'text-caution-deep',  bg: 'bg-orange-100/90',  border: 'border-orange-300/60' },
  critical: { label: 'Critical', color: 'text-critical-deep',    bg: 'bg-rose-100/90',    border: 'border-rose-300/60' },
};

export default function ClaimCard({ claim }: ClaimCardProps) {
  const [showTrace, setShowTrace] = useState(false);
  const trace = claim.retrievalTrace;
  const sev = SEVERITY_CONFIG[claim.severity || 'none'];
  const isDeterministic = trace?.deterministic_applied;

  return (
    <div className="glass-card-emerald p-4 sm:p-5 rounded-2xl mb-4 transition-all duration-200 hover:-translate-y-0.5">
      {/* Header row */}
      <div className="flex justify-between items-start gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <span className="text-xs font-black uppercase tracking-wider text-positive-deep block mb-1">
            Claim Under Evaluation
          </span>
          <h4 className="font-extrabold text-ink text-sm sm:text-base leading-snug break-words whitespace-normal">
            {claim.text}
          </h4>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1.5">
          <NeuBadge type={claim.verdict} />
          {claim.severity && claim.severity !== 'none' && (
            <span className={`text-xs font-black px-2 py-0.5 rounded-full border ${sev.bg} ${sev.color} ${sev.border} shadow-xs`}>
              {sev.label} Severity
            </span>
          )}
        </div>
      </div>

      {/* Deterministic check badge */}
      {isDeterministic && (
        <div className="mb-3 flex items-center gap-2 p-2.5 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 shadow-xs">
          <Cpu size={13} className="text-accent shrink-0" />
          <div className="min-w-0">
            <span className="text-xs font-black uppercase text-accent-strong tracking-wider">
              Deterministic Code-Check Applied
            </span>
            <p className="text-xs text-accent-strong font-bold mt-0.5">
              {trace?.deterministic_method?.replace(/_/g, ' ')} — verified with arithmetic, not AI inference
            </p>
          </div>
        </div>
      )}

      {/* Confidence bar */}
      {claim.confidence !== undefined && (
        <div className="mb-3 flex items-center gap-2">
          <div className="text-xs font-bold text-positive-deep w-24 shrink-0">Confidence:</div>
          <div className="flex-1 bg-emerald-200/60 rounded-full h-2 overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-500 shadow-xs ${
                claim.verdict === 'Verified'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  : claim.verdict === 'Contradicted'
                  ? 'bg-gradient-to-r from-rose-500 to-red-500'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500'
              }`}
              style={{ width: `${Math.round(claim.confidence * 100)}%` }}
            />
          </div>
          <span className="text-xs font-black text-ink w-10 text-right">
            {Math.round(claim.confidence * 100)}%
          </span>
        </div>
      )}

      {/* Source document */}
      {claim.sourceSentence && (
        <div className="mb-3">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-xs font-black text-positive-deep uppercase tracking-wider flex items-center gap-1">
              <BookOpen size={11} className="text-positive" />
              Source KB Ground Truth
            </p>
            {claim.sourceDocument && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-100 text-positive-deep border border-teal-300/60 flex items-center gap-1 shadow-xs">
                <FileText size={9} />
                {claim.sourceDocument}
              </span>
            )}
          </div>
          <div className="border-l-4 border-teal-500 pl-3 py-2 text-xs sm:text-sm text-ink font-medium italic bg-white/70 backdrop-blur-md rounded-r-xl break-words leading-relaxed whitespace-normal border border-white/80 shadow-xs">
            "{claim.sourceSentence}"
          </div>
        </div>
      )}

      {/* Judge reasoning */}
      <div className="mb-3">
        <p className="text-xs font-black text-positive-deep uppercase tracking-wider mb-1 flex items-center gap-1">
          {claim.verdict === 'Verified' ? (
            <ShieldCheck size={11} className="text-positive" />
          ) : (
            <AlertTriangle size={11} className="text-caution" />
          )}
          Judge Verification Reasoning
        </p>
        <p className="text-xs sm:text-sm text-ink font-semibold bg-white/70 backdrop-blur-md p-3.5 rounded-xl break-words leading-relaxed whitespace-normal border border-emerald-200/70 shadow-xs">
          {claim.reasoning}
        </p>
      </div>

      {/* Retrieval Trace — collapsible */}
      {trace && (
        <div>
          <button
            onClick={() => setShowTrace(!showTrace)}
            className="w-full flex items-center justify-between text-xs font-black uppercase tracking-wider text-positive-deep hover:text-positive-deep transition-colors py-1 cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Search size={11} />
              Retrieval Audit Trace
            </span>
            {showTrace ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {showTrace && (
            <div className="mt-2 p-3 rounded-xl bg-slate-900 text-xs font-mono space-y-1.5 border border-slate-700 shadow-md">
              <TraceRow label="Docs searched" value={trace.documents_searched?.join(', ') || '—'} />
              <TraceRow label="Candidates retrieved" value={String(trace.candidates_retrieved)} />
              <TraceRow label="Retrieval latency" value={`${trace.retrieval_ms}ms`} />
              <TraceRow label="Verification method" value={trace.method} highlight />
              {trace.winner_score > 0 && (
                <TraceRow label="Top-ranked score" value={(trace.winner_score * 100).toFixed(1) + '%'} />
              )}
              {trace.runner_up_score > 0 && (
                <TraceRow label="Runner-up score" value={(trace.runner_up_score * 100).toFixed(1) + '%'} />
              )}
              {trace.keyword_overlap !== undefined && (
                <TraceRow label="Keyword overlap" value={(trace.keyword_overlap * 100).toFixed(1) + '%'} />
              )}
              {trace.combined_score !== undefined && (
                <TraceRow label="Combined score" value={trace.combined_score.toFixed(3)} />
              )}
              {trace.deterministic_applied && (
                <div className="mt-1.5 pt-1.5 border-t border-slate-700 flex items-center gap-2 text-accent">
                  <Zap size={10} />
                  <span>Deterministic rule fired at rank #{trace.deterministic_hit_at_rank} — overrides semantic scoring</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TraceRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-ink-subtle font-sans">{label}:</span>
      <span className={`text-right break-all ${highlight ? 'text-teal-300 font-bold' : 'text-slate-200'}`}>{value}</span>
    </div>
  );
}
