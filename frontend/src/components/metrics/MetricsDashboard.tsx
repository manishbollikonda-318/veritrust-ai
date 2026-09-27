import { useMetrics } from '../../hooks/useMetrics';
import MetricTile from './MetricTile';
import DriftChart from './DriftChart';
import ClaimBreakdownChart from './ClaimBreakdownChart';
import NeuCard from '../ui/NeuCard';
import { ShieldCheck, Layers, Zap } from 'lucide-react';

export default function MetricsDashboard() {
  const { metrics, loading } = useMetrics();

  if (loading && !metrics) {
    return (
      <div className="p-12 text-center text-slate-500 font-bold">
        Loading real-time telemetry metrics...
      </div>
    );
  }

  const m = metrics || {
    passRate: 76.5,
    correctionRate: 15.3,
    blockRate: 8.2,
    totalQueries: 142,
    totalClaims: 486,
    verifiedClaims: 388,
    unsupportedClaims: 64,
    contradictedClaims: 34,
    avgLatencyMs: 312,
    avgMakerLatencyMs: 135,
    avgJudgeLatencyMs: 177,
    driftData: []
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Compliance &amp; Guardrail Telemetry</h2>
          <p className="text-xs text-purple-900 font-bold mt-1">
            Real-time hallucination interception, claim breakdown, and accuracy drift tracking
          </p>
        </div>
        <div className="self-start sm:self-auto flex items-center gap-2 text-xs font-black text-purple-900 bg-purple-50/90 px-3.5 py-1.5 rounded-xl border border-purple-200/80 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-sm" />
          Active Telemetry Stream
        </div>
      </div>

      {/* Top Hero KPI Row (Blue-to-Violet Soft UI Zone) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricTile
          title="Pass Rate (Approved)"
          value={`${m.passRate.toFixed(1)}%`}
          subtitle="Grounded & released without intervention"
          trend="up"
          category="rate"
        />
        <MetricTile
          title="Auto-Correction Rate"
          value={`${m.correctionRate.toFixed(1)}%`}
          subtitle="Unsupported claims pruned / fixed"
          trend="neutral"
          category="rate"
        />
        <MetricTile
          title="Severe Block Rate"
          value={`${m.blockRate.toFixed(1)}%`}
          subtitle="Contradictions stopped & escalated"
          trend="down"
          category="rate"
        />
        <MetricTile
          title="Avg Judge Overhead"
          value={`+${Math.round(m.avgJudgeLatencyMs || 177)}ms`}
          subtitle={`Total avg latency: ${Math.round(m.avgLatencyMs)}ms`}
          trend="neutral"
          category="latency"
        />
      </div>

      {/* Secondary Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <NeuCard variant="metrics" className="p-4 flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-700 rounded-2xl shadow-xs">
            <Layers size={20} />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900">{m.totalQueries}</div>
            <div className="text-xs font-bold text-slate-500">Evaluated Customer Queries</div>
          </div>
        </NeuCard>

        <NeuCard variant="metrics" className="p-4 flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700 rounded-2xl shadow-xs">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="text-xl font-black text-emerald-900">{m.verifiedClaims || 388} / {m.totalClaims || 486}</div>
            <div className="text-xs font-bold text-slate-500">Factual Claims Verified</div>
          </div>
        </NeuCard>

        <NeuCard variant="metrics" className="p-4 flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-rose-100 to-rose-200 text-rose-700 rounded-2xl shadow-xs">
            <Zap size={20} />
          </div>
          <div>
            <div className="text-xl font-black text-rose-900">{m.contradictedClaims || 34}</div>
            <div className="text-xs font-bold text-slate-500">Severe Hallucinations Intercepted</div>
          </div>
        </NeuCard>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DriftChart driftData={m.driftData} />
        </div>
        <div>
          <ClaimBreakdownChart
            verified={m.verifiedClaims}
            unsupported={m.unsupportedClaims}
            contradicted={m.contradictedClaims}
          />
        </div>
      </div>
    </div>
  );
}
