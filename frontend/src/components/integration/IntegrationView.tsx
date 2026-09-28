import { useState, useMemo } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { api } from '../../services/api';
import NeuCard from '../ui/NeuCard';
import NeuButton from '../ui/NeuButton';
import NeuBadge from '../ui/NeuBadge';
import {
  Code2, Play, CheckCircle2, AlertTriangle, XCircle, Copy, Check,
  ShieldCheck, Cpu, ExternalLink,
  ShoppingBag, Send, X
} from 'lucide-react';

function getApiBaseUrl(): string {
  // Match the logic in api.ts getApiBase()
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) {
    return ((import.meta as any).env.VITE_API_URL as string).replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && window.location.hostname.includes('veritrust-ai-gdgoc.onrender.com')) {
    return 'https://veritrust-ai-271n.onrender.com/api';
  }
  // For local development, use relative path (proxied by Vite) or full URL
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`;
  }
  return '/api';
}

export default function IntegrationView() {
  const { currentWorkspace } = useWorkspace();
  const [testDraft, setTestDraft] = useState(
    'Our standard return policy allows returns within 60 days of delivery. Electronics come with a 2-year warranty, and return shipping is always 100% free with no restocking fees.'
  );
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'curl' | 'js' | 'python' | 'widget'>('curl');
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  // Dynamic API base for code snippets
  const apiBase = useMemo(() => getApiBaseUrl().replace(/\/api$/, ''), []);
  const verifyEndpoint = `${apiBase}/api/verify`;
  const chatEndpoint = `${apiBase}/api/chat`;

  // Storefront Simulator Modal state
  const [showSimulator, setShowSimulator] = useState(false);
  const [simMessages, setSimMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; status?: string; rawDraft?: string }>>([
    {
      role: 'assistant',
      text: 'Hello! Welcome to NovaMart. How can I help with your order, shipping, or returns today?',
      status: 'Approved'
    }
  ]);
  const [simInput, setSimInput] = useState('');
  const [simLoading, setSimLoading] = useState(false);

  const handleRunVerify = async () => {
    if (!testDraft.trim()) return;
    setIsVerifying(true);
    try {
      const res = await api.verifyDraft(testDraft, currentWorkspace);
      setVerificationResult(res);
    } catch (err) {
      console.error('Verification failed:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSimSend = async (textToSend?: string) => {
    const q = (textToSend || simInput).trim();
    if (!q || simLoading) return;
    setSimInput('');
    setSimMessages(prev => [...prev, { role: 'user', text: q }]);
    setSimLoading(true);

    try {
      const { botMessage } = await api.sendMessage(q, true, currentWorkspace);
      setSimMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: botMessage.content,
          status: botMessage.status,
          rawDraft: botMessage.originalDraft
        }
      ]);
    } catch (err) {
      setSimMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: 'Unable to reach VeriTrust AI Gateway.',
          status: 'Blocked'
        }
      ]);
    } finally {
      setSimLoading(false);
    }
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedTab(id);
    setTimeout(() => setCopiedTab(null), 2500);
  };

  const curlCode = `curl -X POST "${verifyEndpoint}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "draft": "${testDraft.replace(/"/g, '\\"')}",
    "workspace_id": "${currentWorkspace}"
  }'`;

  const jsCode = `// VeriTrust AI JavaScript / Node.js Integration
import fetch from 'node-fetch';

async function verifyAIResponse(draftText) {
  const response = await fetch('${verifyEndpoint}', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      draft: draftText,
      workspace_id: '${currentWorkspace}'
    })
  });

  const result = await response.json();
  if (!result.is_safe) {
    console.warn('⚠️ Guardrail Blocked Response:', result.overall_reasoning);
    return result.claims.filter(c => c.verdict === 'Contradicted');
  }
  return result;
}`;

  const pythonCode = `# VeriTrust AI Python Client SDK
import requests

def verify_response(draft_text: str, workspace: str = "${currentWorkspace}"):
    url = "${verifyEndpoint}"
    payload = {
        "draft": draft_text,
        "workspace_id": workspace
    }
    response = requests.post(url, json=payload)
    response.raise_for_status()
    return response.json()

# Example usage in an existing support pipeline:
result = verify_response("""${testDraft}""")
print(f"Safety: {result['is_safe']}, Severity: {result['severity']}")
for claim in result['claims']:
    print(f"  [{claim['verdict']}] {claim['text']}")`;

  const widgetCode = `<!-- VeriTrust AI Real-Time Customer Chat Guardrail -->
<script
  src="https://cdn.veritrust.ai/widget/v1/guardrail.min.js"
  data-veritrust-workspace="${currentWorkspace}"
  data-api-endpoint="${apiBase}"
  async>
</script>`;

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              API Integration &amp; Guardrail Gateway
            </h2>
            <span className="text-xs font-black px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs">
              Plug &amp; Play
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 font-medium">
            Connect VeriTrust AI to your Zendesk, Intercom, custom LLM, or support workflow using our standalone verification API.
          </p>
        </div>

        <button
          onClick={() => setShowSimulator(true)}
          className="self-start sm:self-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 text-white font-black text-xs flex items-center gap-2 shadow-[0_4px_14px_rgba(79,70,229,0.35)] hover:from-indigo-700 hover:to-blue-700 transition-all cursor-pointer"
        >
          <ExternalLink size={15} />
          <span>Launch Storefront Simulator 🛍️</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Left Column: Live Verification Tester */}
        <div className="lg:col-span-6 space-y-6">
          <NeuCard variant="maker" className="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-indigo-600" />
                <h3 className="font-black text-slate-900 text-base">Live `POST /api/verify` Test Console</h3>
              </div>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 font-bold border border-indigo-200">
                workspace: {currentWorkspace}
              </span>
            </div>

            <p className="text-xs text-slate-700 font-medium mb-3">
              Enter any raw AI draft below. VeriTrust will extract atomic claims, retrieve source snippets from workspace vectors, and evaluate semantic entailment:
            </p>

            <textarea
              rows={4}
              value={testDraft}
              onChange={(e) => setTestDraft(e.target.value)}
              placeholder="Enter draft text to verify..."
              className="w-full text-xs sm:text-sm p-4 rounded-2xl bg-gradient-to-br from-[#EEF4FD] to-[#E2ECF8] shadow-neu-maker-pressed border border-indigo-100/80 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900 leading-relaxed mb-4"
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setTestDraft('You can return laptops and cameras within 60 days for a 100% full refund.')
                  }
                  className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  Load 60-day Hallucination
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() =>
                    setTestDraft('Most items can be returned within 30 days of delivery in original condition.')
                  }
                  className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                >
                  Load Verified Policy
                </button>
              </div>

              <NeuButton
                onClick={handleRunVerify}
                disabled={isVerifying || !testDraft.trim()}
                variant="primary"
                className="!px-5 !py-2.5 flex items-center gap-2 font-black text-xs"
              >
                <Play size={14} className={isVerifying ? 'animate-spin' : ''} />
                <span>{isVerifying ? 'Verifying Claims...' : 'Run /api/verify'}</span>
              </NeuButton>
            </div>
          </NeuCard>

          {/* Verification Results Panel */}
          {verificationResult && (
            <NeuCard variant="judge" className="p-5 sm:p-6 animate-fade-in">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-emerald-200/60">
                <div className="flex items-center gap-2">
                  {verificationResult.is_safe ? (
                    <CheckCircle2 size={20} className="text-emerald-600" />
                  ) : verificationResult.severity === 'high' ? (
                    <XCircle size={20} className="text-rose-600" />
                  ) : (
                    <AlertTriangle size={20} className="text-amber-600" />
                  )}
                  <h4 className="font-black text-slate-900 text-sm">
                    API Response:{' '}
                    {verificationResult.is_safe
                      ? 'APPROVED (Safe to deliver)'
                      : verificationResult.severity === 'high'
                      ? 'BLOCKED (High Risk Hallucination)'
                      : 'FLAGGED / CORRECTED'}
                  </h4>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-900">
                  {verificationResult.verification_time_ms}ms
                </span>
              </div>

              <p className="text-xs text-slate-800 font-semibold leading-relaxed bg-white/70 p-3 rounded-xl mb-4 border border-emerald-200 shadow-xs">
                {verificationResult.overall_reasoning}
              </p>

              {/* Claims Breakdown */}
              <div className="space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-teal-900 block">
                  Atomic Claim Entailment Results ({verificationResult.claims?.length || 0}):
                </span>
                {verificationResult.claims?.map((claim: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-gradient-to-br from-[#F5FAF7] to-[#E8F4EE] shadow-sm border border-emerald-200/80 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-slate-900 flex-1">{claim.text}</p>
                      <NeuBadge type={claim.verdict} />
                    </div>
                    {claim.source_sentence && (
                      <p className="text-xs text-teal-950 italic bg-teal-50/80 p-2 rounded border-l-2 border-teal-500 font-medium">
                        "{claim.source_sentence}"
                      </p>
                    )}
                    <p className="text-xs text-slate-600 font-medium">{claim.reasoning}</p>
                  </div>
                ))}
              </div>
            </NeuCard>
          )}
        </div>

        {/* Right Column: Code Snippets & Gateway Specs */}
        <div className="lg:col-span-6 space-y-6">
          <NeuCard className="p-5 sm:p-6 bg-gradient-to-br from-[#F6F8FD] to-[#E9EDF5]">
            <h3 className="font-black text-slate-900 text-base mb-2 flex items-center gap-2">
              <Code2 size={18} className="text-indigo-600" />
              Developer Code Snippets
            </h3>
            <p className="text-xs text-slate-700 font-medium mb-4">
              Integrate claim-level guardrail checks before returning LLM completions to end users:
            </p>

            {/* Tab Selector */}
            <div className="flex bg-[#E6EDF6] shadow-neu-pressed p-1 rounded-2xl mb-4">
              {[
                { id: 'curl', label: 'cURL' },
                { id: 'js', label: 'Node / JS' },
                { id: 'python', label: 'Python' },
                { id: 'widget', label: 'Chat Widget' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-1.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-br from-[#F6F9FE] to-[#E8EFF9] shadow-neu-maker text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Code Body */}
            <div className="relative">
              <button
                onClick={() => {
                  const code =
                    activeTab === 'curl'
                      ? curlCode
                      : activeTab === 'js'
                      ? jsCode
                      : activeTab === 'python'
                      ? pythonCode
                      : widgetCode;
                  copyCode(code, activeTab);
                }}
                className="absolute right-3 top-3 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 shadow transition-all cursor-pointer z-10"
              >
                {copiedTab === activeTab ? (
                  <>
                    <Check size={13} className="text-emerald-400" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy size={13} /> Copy
                  </>
                )}
              </button>

              <pre className="p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed max-h-96 shadow-inner">
                <code>
                  {activeTab === 'curl' && curlCode}
                  {activeTab === 'js' && jsCode}
                  {activeTab === 'python' && pythonCode}
                  {activeTab === 'widget' && widgetCode}
                </code>
              </pre>
            </div>
          </NeuCard>

          {/* Architecture Card */}
          <NeuCard className="p-5 sm:p-6 bg-gradient-to-br from-[#F6F8FD] to-[#E9EDF5]">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-2">
              <Cpu size={14} className="text-indigo-600" />
              How VeriTrust Protects External LLMs
            </h4>
            <div className="space-y-3 text-xs text-slate-700 leading-relaxed font-medium">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                  1
                </div>
                <p>
                  <strong className="text-slate-900 font-bold">Atomic Decomposition:</strong> Unpacks complex LLM paragraphs into verifiable factual statements while filtering conversational filler.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  2
                </div>
                <p>
                  <strong className="text-slate-900 font-bold">Source Entailment &amp; Deterministic Rules:</strong> Performs numerical contradiction checks, price verifications, and semantic retrieval against policy vectors.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  3
                </div>
                <p>
                  <strong className="text-slate-900 font-bold">Decision Branch &amp; Human Loop:</strong> Returns verified responses instantly (&lt;20ms overhead) or routes high-severity hallucinations to the Human Review Queue before customers ever see them.
                </p>
              </div>
            </div>
          </NeuCard>
        </div>
      </div>

      {/* ── Standalone Storefront Simulator Modal ─────────────────────────────── */}
      {showSimulator && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-100 rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-300 relative flex flex-col max-h-[92vh]">
            {/* Storefront Mock Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center text-white font-extrabold shadow-sm">
                  N
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight">NovaMart Retail Storefront (Simulated Demo Benchmark)</h3>
                  <p className="text-xs text-slate-400 font-mono">Simulated Origin: https://shop.novamart-demo.internal</p>
                </div>
              </div>

              <button
                onClick={() => setShowSimulator(false)}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Mock Storefront Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6">
              {/* Promo Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between shadow-md">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                    Protected by VeriTrust AI Guardrail
                  </span>
                  <h4 className="text-base font-black mt-1">NovaMart Online Store (Simulated Retail Environment)</h4>
                  <p className="text-xs text-blue-100 mt-0.5 font-medium">
                    Customer support chat widget in the bottom right corner is intercepted in real-time by your backend `/api/verify` gateway.
                  </p>
                </div>
                <ShoppingBag size={32} className="opacity-80 hidden sm:block" />
              </div>

              {/* Mock Products Grid */}
              <div>
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3">Featured Products</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { name: 'MacBook Pro 16" M3 Max', price: '$2,499.00', category: 'Electronics (14-day return)', tag: 'Electronics' },
                    { name: 'Sony WH-1000XM5 Headphones', price: '$399.99', category: 'Electronics (1-yr warranty)', tag: 'Electronics' },
                    { name: 'Merino Wool Pullover Sweater', price: '$89.00', category: 'Apparel (30-day return)', tag: 'Apparel' },
                  ].map((p, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
                      <div className="h-28 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs">
                        {p.tag} Image
                      </div>
                      <h5 className="font-black text-xs text-slate-900 leading-snug">{p.name}</h5>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-indigo-600">{p.price}</span>
                        <span className="text-xs text-slate-500 font-semibold">{p.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Attack Prompts inside Simulator */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/70 border border-amber-300">
                <span className="text-xs font-black uppercase text-amber-900 tracking-wider block mb-1.5">
                  Try Asking the Storefront Widget:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Can I return a laptop after 60 days?',
                    'How much is express shipping?',
                    'Do you offer a price match guarantee with Amazon?'
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSimSend(preset)}
                      className="text-xs px-3 py-1 rounded-xl bg-white border border-amber-300 text-amber-900 font-bold hover:bg-amber-100 transition-colors text-left cursor-pointer"
                    >
                      "{preset}"
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Embedded Live Widget in Bottom Right */}
            <div className="bg-white border-t border-slate-200 p-4 sm:p-6 flex flex-col h-80">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-black text-slate-900">NovaMart Live Assistant</span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                    VeriTrust Guardrail Active
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-mono font-bold">Endpoint: /api/chat</span>
              </div>

              {/* Messages container */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-2 mb-3 text-xs">
                {simMessages.map((m, i) => (
                  <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`p-3 rounded-2xl max-w-[85%] leading-relaxed font-medium ${
                        m.role === 'user'
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none shadow-sm'
                          : 'bg-slate-100 text-slate-900 border border-slate-200 rounded-bl-none font-medium'
                      }`}
                    >
                      {m.text}
                    </div>
                    {m.status && m.role === 'assistant' && (
                      <span className={`text-[9px] font-black mt-1 px-2 py-0.5 rounded-full border shadow-xs ${
                        m.status === 'Approved' ? 'text-emerald-900 bg-emerald-100 border-emerald-300/60' :
                        m.status === 'Corrected' ? 'text-amber-900 bg-amber-100 border-amber-300/60' : 'text-rose-900 bg-rose-100 border-rose-300/60'
                      }`}>
                        🛡️ Guardrail: {m.status}
                      </span>
                    )}
                  </div>
                ))}
                {simLoading && (
                  <div className="text-xs text-slate-500 italic flex items-center gap-2 font-medium">
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" />
                    Maker drafting &amp; Judge verifying...
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSimSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={simInput}
                  onChange={(e) => setSimInput(e.target.value)}
                  placeholder="Ask the NovaMart assistant anything..."
                  className="flex-1 text-xs px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-300 focus:outline-none focus:border-indigo-500 font-medium text-slate-800"
                />
                <button
                  type="submit"
                  disabled={!simInput.trim() || simLoading}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs font-black hover:from-indigo-700 hover:to-blue-700 disabled:opacity-40 flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Send size={13} />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
