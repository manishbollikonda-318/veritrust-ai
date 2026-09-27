import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  Building2, FileText, KeyRound, Sparkles, X,
  CheckCircle2, ArrowRight, ShieldCheck, ChevronDown, ChevronUp, Upload
} from 'lucide-react';

const INDUSTRY_PRESETS = [
  {
    id: 'saas',
    name: 'SaaS / Cloud Software',
    title: 'Subscription, Refund & SLA Policy',
    content: `CLOUD METRICS SUBSCRIPTION & REFUND POLICY (CloudMetrics Inc.)
1. Subscription Plans: We offer Monthly ($39/mo) and Annual ($390/yr) billing. Annual plans receive 2 months free.
2. Full Refund Window: Customers are eligible for a 100% full money-back guarantee within 14 days of account creation. After 14 days, all subscription charges are strictly non-refundable.
3. Cancellation: Subscriptions can be canceled at any time from the account portal. Access remains active until the end of the current billing cycle.
4. Uptime SLA: We guarantee 99.95% monthly uptime. If downtime exceeds 0.05%, customers receive a 10% service credit.
5. Support Hours: Standard support operates Monday through Friday, 9:00 AM to 6:00 PM EST. Critical P1 incident response is monitored 24/7.`
  },
  {
    id: 'fintech',
    name: 'Fintech & Banking',
    title: 'Wire Transfers, Fees & Limits Policy',
    content: `APEX PAYMENTS & SECURITY POLICY (ApexPay Financial)
1. Daily Outbound Limits: Standard verified accounts have a daily outbound ACH transfer limit of $5,000 and instant transfer limit of $1,500.
2. Transfer Fees: Standard ACH transfers are completely free. Domestic wire transfers incur a flat $15 fee. International wire transfers incur a $35 fee.
3. Dispute Window: Transaction disputes must be filed within 60 days of the statement date.
4. FDIC Insurance: Deposit funds are held in sweep accounts at partner banks and insured up to $250,000 per depositor.
5. Two-Factor Authentication: 2FA is strictly mandatory for all withdrawals exceeding $500.`
  },
  {
    id: 'health',
    name: 'Healthcare & Telehealth',
    title: 'Telehealth Consultations & Prescription Refills',
    content: `MEDICARE PLUS TELEHEALTH & CLINICAL GUIDELINES
1. Prescription Refills: Controlled substance refills require an in-person or live video consultation every 90 days. Standard maintenance medications can be renewed asynchronously within 48 hours.
2. Appointment Cancellation: Appointments must be canceled at least 24 hours in advance to avoid a $40 late-cancellation fee.
3. Telehealth Coverage: Telehealth visits are covered by Medicare and most major commercial insurances with typical copays of $15 to $30.
4. HIPAA Privacy: All video consultations and digital chart records are encrypted in compliance with federal HIPAA privacy standards.`
  },
  {
    id: 'retail',
    name: 'Retail & Consumer Goods',
    title: 'Standard Return & Shipping Policy',
    content: `HARBOR GOODS RETURN & DELIVERY POLICY
1. Return Window: Items in new, unused condition with original tags may be returned within 45 days of purchase for a full refund.
2. Final Sale: Clearance items marked 50% off or higher are final sale and cannot be returned or exchanged.
3. Shipping Speeds: Ground shipping arrives in 3-5 business days for $4.99 (free over $60). 2-Day Air is available for $14.99.
4. Warranty: Non-electronic home goods carry a 2-year quality guarantee against manufacturing defects.`
  }
];

export default function CreateWorkspaceModal() {
  const { isCreateModalOpen, closeCreateModal, createWorkspace } = useWorkspace();

  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('SaaS / Cloud Software');
  const [policyTitle, setPolicyTitle] = useState(INDUSTRY_PRESETS[0].title);
  const [policyContent, setPolicyContent] = useState(INDUSTRY_PRESETS[0].content);
  
  // LLM settings
  const [showLlmSettings, setShowLlmSettings] = useState(false);
  const [llmProvider, setLlmProvider] = useState<'shared_default' | 'gemini' | 'openai' | 'anthropic'>('shared_default');
  const [apiKey, setApiKey] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isCreateModalOpen) return null;

  const handleSelectPreset = (preset: typeof INDUSTRY_PRESETS[0]) => {
    setIndustry(preset.name);
    setPolicyTitle(preset.title);
    setPolicyContent(preset.content);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict client-side file upload safety
    const MAX_SIZE = 1024 * 1024; // 1MB
    if (file.size > MAX_SIZE) {
      setErrorMessage(`File is too large (${(file.size / 1024).toFixed(1)} KB). Maximum allowed size is 1MB.`);
      e.target.value = '';
      return;
    }
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (ext !== '.txt' && ext !== '.md') {
      setErrorMessage('Invalid file format. Only plain text (.txt) and markdown (.md) documents are allowed.');
      e.target.value = '';
      return;
    }

    setErrorMessage('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setPolicyContent(text);
        setPolicyTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setErrorMessage('Please enter a company or business name.');
      return;
    }
    if (!policyContent.trim()) {
      setErrorMessage('Please provide at least one initial policy document to seed the knowledge base.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await createWorkspace({
        name: companyName.trim(),
        industry,
        description: `Dedicated compliance guardrail for ${companyName.trim()}`,
        initial_policy_title: policyTitle.trim() || `${companyName.trim()} Corporate Policy`,
        initial_policy_content: policyContent.trim(),
        llm_provider: llmProvider,
        api_key: apiKey.trim() || undefined
      });
      // Modal will be closed automatically by createWorkspace context method
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create company workspace.');
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-md"
          onClick={closeCreateModal}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-2xl bg-white/95 backdrop-blur-2xl rounded-3xl border border-white/70 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
        >
          {/* Close button */}
          <button
            onClick={closeCreateModal}
            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            title="Cancel"
          >
            <X size={20} />
          </button>

          {/* Header */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 mb-2">
              <Sparkles size={12} className="text-indigo-600" />
              <span>Multi-Tenant Enterprise Platform</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Onboard a New Company Workspace
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium leading-relaxed">
              Create an isolated ground-truth workspace. Queries will be verified at the atomic claim level against this company&apos;s own policy documents.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <span>⚠️ {errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Company Identity */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-900">
                <Building2 size={14} className="text-indigo-600" />
                <span>1. Company Profile</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Company / Organization Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Starlight Cloud, Apex Health"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Industry Sector
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 cursor-pointer"
                  >
                    <option value="SaaS / Cloud Software">SaaS / Cloud Software</option>
                    <option value="Fintech & Banking">Fintech &amp; Banking</option>
                    <option value="Healthcare & Telehealth">Healthcare &amp; Telehealth</option>
                    <option value="Retail & Consumer Goods">Retail &amp; Consumer Goods</option>
                    <option value="Logistics & Supply Chain">Logistics &amp; Supply Chain</option>
                    <option value="General Enterprise">General Enterprise</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Step 2: Seed Knowledge Base */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-900">
                  <FileText size={14} className="text-indigo-600" />
                  <span>2. Seed Ground-Truth Policy</span>
                </div>
                <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer">
                  <Upload size={13} />
                  <span>Upload .txt/.md file</span>
                  <input
                    type="file"
                    accept=".txt,.md"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Quick Template Fill Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-slate-500 mr-1">Quick Templates:</span>
                {INDUSTRY_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      policyTitle === preset.title
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                  >
                    {preset.name.split('/')[0]}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Policy Document Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Return Policy & SLA"
                  value={policyTitle}
                  onChange={(e) => setPolicyTitle(e.target.value)}
                  className="w-full text-xs font-medium px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Policy Content (Paste your corporate rules) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Paste return periods, wire fees, SLA numbers, or warranty terms..."
                  value={policyContent}
                  onChange={(e) => setPolicyContent(e.target.value)}
                  className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 leading-relaxed"
                />
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  💡 Even a single paragraph with specific numbers or terms is immediately verified by the Judge Agent.
                </p>
              </div>
            </div>

            {/* Step 3: Optional LLM Connection Accordion */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowLlmSettings(!showLlmSettings)}
                className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-indigo-600 transition-colors py-1 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <KeyRound size={14} className="text-indigo-500" />
                  <span>3. LLM Connection (Optional — Shared Demo AI Active by Default)</span>
                </div>
                {showLlmSettings ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showLlmSettings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      AI Generation Provider
                    </label>
                    <select
                      value={llmProvider}
                      onChange={(e) => setLlmProvider(e.target.value as any)}
                      className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 cursor-pointer"
                    >
                      <option value="shared_default">Shared Demo AI (Instant, No API Key Required)</option>
                      <option value="gemini">Google Gemini (Bring Your Own Key)</option>
                      <option value="openai">OpenAI GPT-4o (Bring Your Own Key)</option>
                      <option value="anthropic">Anthropic Claude (Bring Your Own Key)</option>
                    </select>
                  </div>

                  {llmProvider !== 'shared_default' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Workspace API Key
                      </label>
                      <input
                        type="password"
                        placeholder="Paste your API key (sk-... or AIza...)"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                      />
                    </div>
                  )}

                  <div className="flex items-start gap-2 pt-1 text-[11px] text-slate-600 font-medium">
                    <ShieldCheck size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      Keys are stored server-side in your isolated workspace configuration and are never exposed in browser responses.
                    </span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Submit / Cancel Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeCreateModal}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs shadow-md shadow-indigo-600/25 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Initializing Workspace...</span>
                ) : (
                  <>
                    <span>Create Company Workspace &amp; Initialize</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
