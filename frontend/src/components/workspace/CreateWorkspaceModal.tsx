import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  Building2, FileText, KeyRound, Sparkles, X,
  ArrowRight, ShieldCheck, ChevronDown, ChevronUp, Upload, HelpCircle
} from 'lucide-react';

export default function CreateWorkspaceModal() {
  const { isCreateModalOpen, closeCreateModal, createWorkspace } = useWorkspace();

  // All fields start clean & blank — no canned/inbuilt policies forced on the user
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('AI & Technology');
  const [customIndustry, setCustomIndustry] = useState('');
  const [description, setDescription] = useState('');
  const [policyTitle, setPolicyTitle] = useState('');
  const [policyContent, setPolicyContent] = useState('');
  
  // Optional LLM settings
  const [showLlmSettings, setShowLlmSettings] = useState(false);
  const [llmProvider, setLlmProvider] = useState<'shared_default' | 'gemini' | 'openai' | 'anthropic' | 'ollama'>('shared_default');
  const [apiKey, setApiKey] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isCreateModalOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_SIZE) {
      setErrorMessage(`File is too large (${(file.size / 1024).toFixed(1)} KB). Maximum allowed size is 2MB.`);
      e.target.value = '';
      return;
    }
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (ext !== '.txt' && ext !== '.md') {
      setErrorMessage('Invalid file format. Please upload a plain text (.txt) or markdown (.md) document.');
      e.target.value = '';
      return;
    }

    setErrorMessage('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setPolicyContent(text);
        if (!policyTitle.trim()) {
          setPolicyTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
        }
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = companyName.trim();
    if (!cleanName) {
      setErrorMessage('Please enter a company name (e.g. OpenAI, Tesla, or your custom business).');
      return;
    }
    if (!policyContent.trim()) {
      setErrorMessage('Please enter your company rules or policy text below (or upload a .txt/.md document).');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const resolvedIndustry = industry === 'Other' && customIndustry.trim() ? customIndustry.trim() : industry;

    try {
      await createWorkspace({
        name: cleanName,
        industry: resolvedIndustry,
        description: description.trim() || `Enterprise guardrail knowledge base for ${cleanName}`,
        initial_policy_title: policyTitle.trim() || `${cleanName} Operational Policy`,
        initial_policy_content: policyContent.trim(),
        llm_provider: llmProvider,
        api_key: apiKey.trim() || undefined
      });
      // Modal closes automatically on success
    } catch (err: any) {
      console.warn('Workspace creation notice:', err);
      // Fallback message if any
      setErrorMessage(err.message || 'Error initializing company workspace. Please try again.');
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
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>

          {/* Header */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 mb-2">
              <Sparkles size={12} className="text-indigo-600" />
              <span>Multi-Tenant Enterprise Platform</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Add Any Company Workspace
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium leading-relaxed">
              Define any organization, brand, or business. Provide its policies and rules below—the Judge Agent will immediately enforce them to eliminate hallucinated answers.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <span>⚠️ {errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Company Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-900">
                <Building2 size={14} className="text-indigo-600" />
                <span>1. Company Information</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Company Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. OpenAI, Tesla, BlueSky Logistics"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Industry / Category
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 cursor-pointer shadow-inner"
                  >
                    <option value="AI & Technology">AI &amp; Technology</option>
                    <option value="SaaS / Cloud Software">SaaS / Cloud Software</option>
                    <option value="Fintech & Banking">Fintech &amp; Banking</option>
                    <option value="Healthcare & Telehealth">Healthcare &amp; Telehealth</option>
                    <option value="E-Commerce & Retail">E-Commerce &amp; Retail</option>
                    <option value="Automotive & Mobility">Automotive &amp; Mobility</option>
                    <option value="Education & EdTech">Education &amp; EdTech</option>
                    <option value="Legal & Compliance">Legal &amp; Compliance</option>
                    <option value="Other">Other (Custom)</option>
                  </select>
                </div>
              </div>

              {industry === 'Other' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Specify Industry
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Aerospace, Hospitality, Real Estate"
                    value={customIndustry}
                    onChange={(e) => setCustomIndustry(e.target.value)}
                    className="w-full text-xs font-medium px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Company Overview &amp; Scope <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. AI research laboratory deploying frontier models and developer API services"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs font-medium px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
              </div>
            </div>

            {/* Step 2: Policy Details (No canned templates forced) */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-900">
                  <FileText size={14} className="text-indigo-600" />
                  <span>2. Corporate Policy &amp; Truth Manual</span>
                </div>
                <label className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-200 transition-colors">
                  <Upload size={13} />
                  <span>Upload .txt / .md file</span>
                  <input
                    type="file"
                    accept=".txt,.md"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Policy Document Title <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Customer Terms of Service, Return Window & Warranty Policy"
                  value={policyTitle}
                  onChange={(e) => setPolicyTitle(e.target.value)}
                  className="w-full text-xs font-medium px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Policy Rules &amp; Factual Guidelines <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-xs text-slate-400 font-medium">
                    {policyContent.length} characters
                  </span>
                </div>
                <textarea
                  rows={7}
                  required
                  placeholder={`Type or paste your company's actual rules, prices, terms, or guidelines here.\n\nFor example:\n1. Return & Refund Policy: Customers have 30 days from delivery for a 100% full refund.\n2. Warranty: Hardware covered for 12 months. Accessories covered for 90 days.\n3. Pricing: Standard rate is $20/month. No setup fees.\n4. Support Hours: Monday to Friday 9:00 AM to 5:00 PM EST.\n\nThe Judge Agent will cross-check all AI drafts against the exact rules you provide here.`}
                  value={policyContent}
                  onChange={(e) => setPolicyContent(e.target.value)}
                  className="w-full text-xs font-mono p-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 leading-relaxed shadow-inner"
                />
                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500 font-medium">
                  <HelpCircle size={13} className="text-indigo-500 shrink-0" />
                  <span>
                    You can type as many or as few rules as you want. The multi-agent pipeline immediately indexes them into this company's private vector collection.
                  </span>
                </div>
              </div>
            </div>

            {/* Step 3: Optional LLM Connection */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowLlmSettings(!showLlmSettings)}
                className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-indigo-600 transition-colors py-1 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <KeyRound size={14} className="text-indigo-500" />
                  <span>3. AI Generation Engine (Optional — Default Engine Pre-Configured)</span>
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
                      Select LLM Provider
                    </label>
                    <select
                      value={llmProvider}
                      onChange={(e) => setLlmProvider(e.target.value as any)}
                      className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 cursor-pointer"
                    >
                      <option value="shared_default">Default Guardrail Engine (Instant, No API Key Needed)</option>
                      <option value="gemini">Google Gemini API (Bring Your Own Key)</option>
                      <option value="openai">OpenAI API (GPT-4o / GPT-4o-mini)</option>
                      <option value="anthropic">Anthropic Claude (Claude 3.5 Sonnet)</option>
                      <option value="ollama">Local Ollama (100% Private on localhost:11434)</option>
                    </select>
                  </div>

                  {llmProvider !== 'shared_default' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {llmProvider === 'ollama' ? 'Ollama URL' : 'API Key'}
                      </label>
                      <input
                        type={llmProvider === 'ollama' ? 'text' : 'password'}
                        placeholder={
                          llmProvider === 'ollama'
                            ? 'http://localhost:11434'
                            : 'Paste your API key here'
                        }
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                      />
                    </div>
                  )}

                  <div className="flex items-start gap-2 pt-1 text-xs text-slate-600 font-medium">
                    <ShieldCheck size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      API keys are held securely in your private workspace context and never shared.
                    </span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Actions */}
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
                  <span>Initializing Company Workspace...</span>
                ) : (
                  <>
                    <span>Create Company Workspace</span>
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
