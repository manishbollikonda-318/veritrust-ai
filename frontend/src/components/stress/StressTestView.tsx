import React, { useState } from 'react';
import NeuCard from '../ui/NeuCard';
import NeuButton from '../ui/NeuButton';
import { api } from '../../services/api';
import { StressTestResponse, StressTestProbeResult } from '../../types';
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Building2,
  FileCheck2,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

export default function StressTestView() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [currentProbeIdx, setCurrentProbeIdx] = useState<number>(-1);
  const [data, setData] = useState<StressTestResponse | null>(null);
  const [expandedProbeId, setExpandedProbeId] = useState<number | null>(null);
  const [filterIndustry, setFilterIndustry] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  const handleRunTest = async () => {
    setLoading(true);
    setError(null);
    setProgress(10);
    setCurrentProbeIdx(0);

    // Simulate animated progress through probes for lively interactive feedback
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) {
          clearInterval(interval);
          return 90;
        }
        return prev + 15;
      });
      setCurrentProbeIdx((prev) => (prev < 9 ? prev + 1 : prev));
    }, 180);

    try {
      const response = await api.runStressTest();
      clearInterval(interval);
      setProgress(100);
      setData(response);
    } catch (err: any) {
      clearInterval(interval);
      setError(err?.message || 'Failed to complete automated stress test audit.');
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = data?.results.filter((r) => {
    if (filterIndustry === 'all') return true;
    return r.industry.toLowerCase() === filterIndustry.toLowerCase();
  });

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A':
        return 'from-emerald-500 to-teal-600 text-emerald-950 border-emerald-300';
      case 'B':
        return 'from-blue-500 to-indigo-600 text-indigo-950 border-indigo-300';
      case 'C':
        return 'from-amber-500 to-orange-600 text-amber-950 border-amber-300';
      default:
        return 'from-rose-500 to-red-600 text-rose-950 border-rose-300';
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto pb-12">
      {/* ── Top Hero Card ── */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-white/45 backdrop-blur-2xl border border-white/75 shadow-[0_12px_40px_rgba(15,23,42,0.06),inset_0_1px_2px_rgba(255,255,255,0.95)]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-indigo-50/80 border border-indigo-200/80 text-indigo-800 shadow-xs">
              <Sparkles size={13} className="text-indigo-600" />
              Automated Red-Teaming Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              1-Click Adversarial Stress Test Suite
            </h1>
            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              Bombards the Dual-Agent Guardrail with 10 high-consequence adversarial probes across
              Healthcare, Retail, and Fintech policies. Audits real-time claim extraction,
              entailment verification, and interception SLA.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <NeuButton
              type="button"
              variant="primary"
              size="md"
              onClick={handleRunTest}
              disabled={loading}
              className="!py-3.5 !px-6 text-sm font-black flex items-center gap-2.5 shadow-[0_10px_25px_rgba(79,70,229,0.3)] hover:scale-102 transition-transform"
            >
              {loading ? (
                <>
                  <RotateCcw size={16} className="animate-spin text-white" />
                  <span>Auditing 10 Probes...</span>
                </>
              ) : (
                <>
                  <Play size={16} className="fill-white text-white" />
                  <span>Run Stress Test</span>
                </>
              )}
            </NeuButton>
          </div>
        </div>

        {/* Live Progress Bar during execution */}
        {loading && (
          <div className="mt-6 space-y-2 animate-in fade-in duration-200">
            <div className="flex justify-between items-center text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                Firing probe #{currentProbeIdx + 1} of 10 across multi-tenant vector indexes...
              </span>
              <span className="font-mono text-indigo-700">{progress}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-200/70 rounded-full overflow-hidden p-0.5 border border-white/60">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-blue-500 to-teal-400 rounded-full transition-all duration-300 shadow-sm"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800 flex items-center gap-2">
            <AlertTriangle size={15} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* ── Scorecard & Metric Benchmarks ── */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in-50 zoom-in-98 duration-300">
          {/* Compliance Grade Card */}
          <div className="p-5 rounded-2xl bg-white/50 backdrop-blur-xl border border-white/80 shadow-[0_8px_25px_rgba(15,23,42,0.04)] flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-black text-slate-500 uppercase tracking-wider block">
                Compliance Grade
              </span>
              <div className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <span>Grade {data.compliance_grade}</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300/60">
                  {data.interception_rate >= 90 ? 'Enterprise Ready' : 'Audited'}
                </span>
              </div>
            </div>
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getGradeColor(data.compliance_grade)} flex items-center justify-center text-white text-2xl font-black shadow-lg border`}>
              {data.compliance_grade}
            </div>
          </div>

          {/* Interception Rate */}
          <div className="p-5 rounded-2xl bg-white/50 backdrop-blur-xl border border-white/80 shadow-[0_8px_25px_rgba(15,23,42,0.04)] space-y-1">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider block">
              Interception Rate
            </span>
            <div className="text-2xl font-black text-slate-900 flex items-baseline gap-1.5">
              <span>{data.interception_rate}%</span>
              <span className="text-xs font-bold text-slate-500">
                ({data.intercepted}/{data.total_probes} caught)
              </span>
            </div>
            <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden mt-2">
              <div
                className="bg-emerald-500 h-full rounded-full"
                style={{ width: `${data.interception_rate}%` }}
              />
            </div>
          </div>

          {/* Latency Benchmark */}
          <div className="p-5 rounded-2xl bg-white/50 backdrop-blur-xl border border-white/80 shadow-[0_8px_25px_rgba(15,23,42,0.04)] space-y-1">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider block">
              Avg Verification Latency
            </span>
            <div className="text-2xl font-black text-slate-900 flex items-baseline gap-1.5">
              <span>{Math.round(data.avg_latency_ms)}ms</span>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                Sub-50ms SLA
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium pt-1">
              BM25 vector search + entailment
            </p>
          </div>

          {/* Adversarial Zero Slip */}
          <div className="p-5 rounded-2xl bg-white/50 backdrop-blur-xl border border-white/80 shadow-[0_8px_25px_rgba(15,23,42,0.04)] space-y-1">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider block">
              Missed Hallucinations
            </span>
            <div className="text-2xl font-black text-slate-900 flex items-baseline gap-1.5">
              <span className={data.missed === 0 ? 'text-emerald-700' : 'text-rose-600'}>
                {data.missed}
              </span>
              <span className="text-xs font-bold text-slate-500">of {data.total_probes} probes</span>
            </div>
            <p className="text-xs text-slate-500 font-medium pt-1">
              {data.missed === 0 ? 'Zero unverified releases' : 'Requires policy refinement'}
            </p>
          </div>
        </div>
      )}

      {/* ── Probe Execution Results Feed ── */}
      {data && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <FileCheck2 size={18} className="text-indigo-600" />
              Automated Probe Inspection Breakdown
              <span className="text-xs font-extrabold text-slate-600 bg-slate-200/80 px-2.5 py-0.5 rounded-full">
                {filteredResults?.length || 0} Probes
              </span>
            </h3>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 p-1 bg-white/45 backdrop-blur-xl border border-white/75 rounded-xl text-xs font-bold shadow-xs">
              {['all', 'Healthcare', 'Retail', 'Fintech'].map((ind) => (
                <button
                  key={ind}
                  type="button"
                  onClick={() => setFilterIndustry(ind)}
                  className={`px-3 py-1 rounded-lg transition-all capitalize cursor-pointer ${
                    filterIndustry.toLowerCase() === ind.toLowerCase()
                      ? 'bg-indigo-600 text-white shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  {ind}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredResults?.map((probe) => {
              const isExpanded = expandedProbeId === probe.probe_id;
              return (
                <div
                  key={probe.probe_id}
                  className="rounded-2xl bg-white/45 backdrop-blur-xl border border-white/80 p-4 sm:p-5 shadow-[0_4px_16px_rgba(15,23,42,0.03)] hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          probe.intercepted
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300/80'
                            : 'bg-rose-100 text-rose-800 border border-rose-300/80'
                        }`}
                      >
                        #{probe.probe_id}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700">
                            {probe.industry}
                          </span>
                          <span className="text-xs font-mono text-slate-500">
                            ws: {probe.workspace_id}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mt-1 break-words">
                          {probe.probe_query}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border uppercase tracking-wider shadow-xs ${
                          probe.intercepted
                            ? 'bg-emerald-100/90 text-emerald-950 border-emerald-300/80'
                            : 'bg-rose-100/90 text-rose-950 border-rose-300/80'
                        }`}
                      >
                        {probe.intercepted ? (
                          <>
                            <ShieldCheck size={14} className="text-emerald-700" />
                            Intercepted
                          </>
                        ) : (
                          <>
                            <XCircle size={14} className="text-rose-600" />
                            Missed
                          </>
                        )}
                      </span>

                      <button
                        type="button"
                        onClick={() => setExpandedProbeId(isExpanded ? null : probe.probe_id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white/60 transition-colors"
                        aria-label="Toggle details"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Hallucinated draft comparison snippet */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                    <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200/70 space-y-1">
                      <span className="font-black text-rose-900 uppercase text-[10px] tracking-wider block">
                        Adversarial Hallucinated Draft:
                      </span>
                      <p className="text-slate-800 font-medium leading-relaxed italic">
                        "{probe.hallucinated_draft}"
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between space-y-1">
                      <div>
                        <span className="font-black text-slate-700 uppercase text-[10px] tracking-wider block">
                          Judge Verdict Summary:
                        </span>
                        <p className="text-slate-800 font-semibold leading-relaxed line-clamp-2">
                          {probe.judge_reasoning}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pt-1 border-t border-slate-200/60 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock size={11} /> {Math.round(probe.latency_ms)}ms
                        </span>
                        <span className="text-indigo-700">
                          {probe.claims_flagged} claims flagged
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded full reasoning */}
                  {isExpanded && (
                    <div className="p-4 rounded-xl bg-white/80 border border-indigo-200/70 text-xs text-slate-800 space-y-2 animate-in fade-in-50 duration-200">
                      <span className="font-black text-indigo-900 uppercase text-xs flex items-center gap-1.5">
                        <CheckCircle2 size={13} className="text-indigo-600" /> Full Ground-Truth Audit
                        Trail
                      </span>
                      <p className="font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 text-slate-800 leading-relaxed break-words whitespace-pre-wrap">
                        {probe.judge_reasoning}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Empty State before running ── */}
      {!data && !loading && (
        <div className="p-12 rounded-3xl bg-white/40 backdrop-blur-2xl border border-white/75 text-center flex flex-col items-center justify-center space-y-3 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-xs">
            <ShieldAlert size={28} />
          </div>
          <h3 className="text-lg font-black text-slate-900">
            No Stress Test Executed Yet
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md font-medium leading-relaxed">
            Click "Run Stress Test" above to execute the 10 adversarial probe suite. The Judge will audit
            each probe in real-time, generate compliance metrics, and provide a downloadable audit certificate.
          </p>
        </div>
      )}
    </div>
  );
}
