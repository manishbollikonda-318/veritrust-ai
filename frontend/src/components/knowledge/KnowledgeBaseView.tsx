import React, { useState, useEffect } from 'react';
import { Document } from '../../types';
import { api } from '../../services/api';
import { useWorkspace } from '../../context/WorkspaceContext';
import DocumentCard from './DocumentCard';
import NeuInput from '../ui/NeuInput';
import NeuButton from '../ui/NeuButton';
import NeuCard from '../ui/NeuCard';
import {
  Search, Plus, RefreshCw, UploadCloud, CheckCircle2,
  AlertCircle, Sparkles, Building2, X, Info, Upload
} from 'lucide-react';
import { openDataSourceDisclosure } from '../ui/DataSourceDisclosureModal';

const POLICY_TEMPLATES = [
  {
    title: 'SaaS Software & Refund Policy',
    filename: 'saas_refund_policy.txt',
    content: `SAAS SUBSCRIPTION & REFUND POLICY (CloudMetrics Inc.)
1. Subscription Plans: We offer Monthly ($29/mo) and Annual ($290/yr) billing. Annual plans receive 2 months free.
2. Refund Window: Customers are eligible for a 100% full money-back guarantee within 14 days of initial account creation. After 14 days, all subscription charges are non-refundable.
3. Cancellation: Subscriptions can be canceled at any time from the billing portal. Access remains active until the end of the current billing cycle.
4. SLA & Uptime Guarantee: We guarantee 99.95% monthly uptime. If downtime exceeds 0.05%, customers are entitled to service credits calculated on a prorated basis.
5. Customer Support Hours: Standard support operates Monday through Friday, 9:00 AM to 6:00 PM EST. Critical P1 incident response is monitored 24/7.`
  },
  {
    title: 'Fintech Banking & Transfer Limits',
    filename: 'fintech_transfer_limits.txt',
    content: `FINTECH PAYMENTS & SECURITY POLICY (ApexPay Financial)
1. Daily Transfer Limits: Standard verified accounts have a daily outbound ACH transfer limit of $5,000 and instant transfer limit of $1,500.
2. Wire Fees: Domestic wire transfers incur a flat $15 fee. International wire transfers incur a $35 fee. Standard ACH transfers are completely free.
3. Dispute Resolution: Transaction disputes must be filed within 60 days of the statement date. Provisional credits are issued within 10 business days for eligible claims.
4. FDIC Insurance: All deposit funds are held in sweep accounts at partner banks and insured up to $250,000 per depositor.
5. Identity Verification: Two-factor authentication (2FA) is strictly mandatory for all withdrawals exceeding $500.`
  }
];

export default function KnowledgeBaseView() {
  const { currentWorkspace, setCurrentWorkspace, workspaces, refreshWorkspaces, isDemoWorkspace, openCreateModal } = useWorkspace();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isReindexing, setIsReindexing] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [docFilename, setDocFilename] = useState('');
  const [docContent, setDocContent] = useState('');
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [showWorkspaceCreator, setShowWorkspaceCreator] = useState(false);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const docs = await api.getDocuments(currentWorkspace);
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [currentWorkspace]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4500);
  };

  const handleOpenCreateModal = () => {
    setEditingDoc(null);
    setDocTitle('');
    setDocFilename('');
    setDocContent('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (doc: Document) => {
    setEditingDoc(doc);
    setDocTitle(doc.title);
    setDocFilename(doc.filename || '');
    setDocContent(doc.content || doc.snippet || '');
    setIsModalOpen(true);
  };

  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() || !docContent.trim()) {
      showToast('error', 'Title and policy content are required.');
      return;
    }

    let filename = docFilename.trim();
    if (!filename) {
      filename = docTitle.toLowerCase().replace(/[^a-z0-9]/g, '_') + '.txt';
    } else if (!filename.endsWith('.txt') && !filename.endsWith('.md')) {
      filename += '.txt';
    }

    setIsLoading(true);
    try {
      if (editingDoc) {
        await api.updateDocument(editingDoc.filename || filename, docContent, docTitle, currentWorkspace);
        showToast('success', `Updated "${docTitle}" and re-indexed into guardrail vectors.`);
      } else {
        await api.uploadDocument(filename, docContent, docTitle, currentWorkspace);
        showToast('success', `Indexed "${docTitle}" successfully into workspace "${currentWorkspace}".`);
      }
      setIsModalOpen(false);
      await fetchDocuments();
      await refreshWorkspaces();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to save document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict client-side file upload safety
    const MAX_SIZE = 1024 * 1024; // 1MB
    if (file.size > MAX_SIZE) {
      showToast('error', `File exceeds 1MB limit (${(file.size / 1024).toFixed(1)} KB). Please choose a smaller file.`);
      e.target.value = '';
      return;
    }

    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (ext !== '.txt' && ext !== '.md') {
      showToast('error', 'Only plain text (.txt) and markdown (.md) documents are allowed.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setDocContent(text);
        if (!docTitle) {
          setDocTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
        }
        if (!docFilename) {
          setDocFilename(file.name);
        }
        showToast('success', `Loaded "${file.name}" into editor.`);
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteDocument = async (doc: Document) => {
    if (!window.confirm(`Are you sure you want to delete "${doc.title}"? This will remove its vectors from the guardrail.`)) {
      return;
    }
    setIsLoading(true);
    try {
      await api.deleteDocument(doc.filename || '', currentWorkspace);
      showToast('success', `Deleted "${doc.title}" and updated active knowledge base.`);
      await fetchDocuments();
    } catch (err) {
      showToast('error', 'Failed to delete document.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReindex = async () => {
    setIsReindexing(true);
    try {
      const res = await api.reindexWorkspace(currentWorkspace);
      showToast('success', `Successfully re-indexed ${res.documents_indexed || documents.length} documents for "${currentWorkspace}".`);
      await fetchDocuments();
    } catch (err) {
      showToast('error', 'Re-indexing failed.');
    } finally {
      setIsReindexing(false);
    }
  };

  const handleLoadTemplate = (template: typeof POLICY_TEMPLATES[0]) => {
    setDocTitle(template.title);
    setDocFilename(template.filename);
    setDocContent(template.content);
  };

  const handleCreateWorkspace = () => {
    const trimmed = newWorkspaceName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    if (!trimmed) return;
    setCurrentWorkspace(trimmed);
    setNewWorkspaceName('');
    setShowWorkspaceCreator(false);
    showToast('success', `Switched to new workspace "${trimmed}". Upload your policies below!`);
  };

  const filtered = documents.filter(doc =>
    doc.title.toLowerCase().includes(search.toLowerCase()) ||
    (doc.snippet && doc.snippet.toLowerCase().includes(search.toLowerCase())) ||
    (doc.content && doc.content.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 transition-all transform animate-bounce-short text-sm font-bold ${
            notification.type === 'success'
              ? 'bg-emerald-600 text-white shadow-emerald-600/30'
              : 'bg-rose-600 text-white shadow-rose-600/30'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header & Workspace Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Enterprise Knowledge Base</h2>
            <span className="text-xs font-black px-3 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 shadow-xs">
              Ground Truth
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 font-medium">
            All customer replies are verified at the atomic claim level against documents indexed here.
          </p>
        </div>

        {/* Workspace Pill Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-gradient-to-br from-[#F5F8FD] to-[#E5EDF7] shadow-neu-maker-pressed border border-indigo-100/60 p-1.5 rounded-2xl flex items-center gap-1">
            <Building2 size={14} className="text-indigo-600 ml-2 mr-1" />
            <span className="text-xs font-extrabold text-slate-600 mr-1">Workspace:</span>
            <select
              value={currentWorkspace}
              onChange={(e) => {
                if (e.target.value === '__add_new__') {
                  openCreateModal();
                } else {
                  setCurrentWorkspace(e.target.value);
                }
              }}
              className="bg-transparent text-xs font-black text-slate-800 focus:outline-none cursor-pointer py-1 pr-2"
            >
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} {w.is_demo ? '(Demo)' : `(${w.industry || 'Custom'})`}
                </option>
              ))}
              <option value="__add_new__">+ Onboard New Company...</option>
            </select>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="text-xs font-black px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-1.5"
            title="Onboard a new company workspace"
          >
            <Plus size={14} />
            <span>Onboard Company</span>
          </button>
        </div>
      </div>

      {/* Demo Data Source Transparency Banner */}
      {(currentWorkspace === 'default' || isDemoWorkspace) && (
        <div className="rounded-2xl p-4 bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-slate-50/90 border border-blue-200/80 shadow-[2px_2px_8px_rgba(165,183,212,0.3)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0 shadow-xs">
              <Info size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-bold text-slate-900">Demo Knowledge Base:</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-blue-100 text-blue-800 border border-blue-200">
                  Synthetic Sample Data
                </span>
              </div>
              <p className="text-slate-600 font-medium leading-relaxed">
                "NovaMart" is a fictional retail company created specifically for this demonstration. The return, shipping, and warranty policies below are original synthetic samples — not real retailer data.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={() => openDataSourceDisclosure()}
              className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 underline cursor-pointer"
            >
              View Disclosure
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="text-[11px] font-bold text-slate-700 hover:text-indigo-600 cursor-pointer"
            >
              + Upload Custom Policy
            </button>
          </div>
        </div>
      )}

      {/* New Workspace Sub-bar */}
      {showWorkspaceCreator && (
        <NeuCard variant="maker" className="p-4 flex items-center gap-3 flex-wrap">
          <span className="text-xs font-black text-indigo-900">Create New Business Workspace:</span>
          <input
            type="text"
            placeholder="e.g. acme_corp, health_plus"
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-xl bg-white border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
          />
          <NeuButton className="px-3.5 py-1.5 text-xs font-black" onClick={handleCreateWorkspace}>
            Create &amp; Switch
          </NeuButton>
          <button
            type="button"
            onClick={() => setShowWorkspaceCreator(false)}
            className="text-xs text-slate-600 hover:text-slate-900 ml-auto cursor-pointer font-bold"
          >
            Cancel
          </button>
        </NeuCard>
      )}

      {/* Actions & Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={18} />
          <NeuInput
            className="pl-12 w-full"
            placeholder="Search policies or terms (e.g. 30 days, refund, warranty)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <NeuButton
            onClick={handleReindex}
            disabled={isReindexing}
            className="flex items-center gap-2 text-xs font-black px-4 py-2.5"
          >
            <RefreshCw size={14} className={isReindexing ? 'animate-spin text-indigo-600' : ''} />
            {isReindexing ? 'Re-indexing...' : 'Re-index Knowledge'}
          </NeuButton>

          <NeuButton
            onClick={handleOpenCreateModal}
            variant="primary"
            className="flex items-center gap-2 text-xs font-black px-4 py-2.5"
          >
            <Plus size={16} />
            Add Policy Document
          </NeuButton>
        </div>
      </div>

      {/* Document Grid */}
      {isLoading ? (
        <div className="text-center py-20">
          <RefreshCw className="animate-spin mx-auto text-indigo-600 mb-3" size={32} />
          <p className="text-sm font-bold text-slate-700">Loading ground-truth policy documents...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(doc => (
            <DocumentCard
              key={doc.id || doc.filename}
              document={doc}
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteDocument}
              isReadOnly={isDemoWorkspace && (doc.filename?.startsWith('0') ?? false)}
              isDemoDoc={isDemoWorkspace || currentWorkspace === 'default'}
            />
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-16 bg-gradient-to-br from-[#F5F8FD] to-[#E6EEF8] shadow-neu-maker-pressed rounded-3xl p-8 max-w-xl mx-auto border border-indigo-100/60">
          <UploadCloud size={48} className="mx-auto text-indigo-400 mb-4" />
          <h3 className="text-base font-black text-slate-900 mb-1">No Documents in This Workspace</h3>
          <p className="text-xs sm:text-sm text-slate-700 font-medium mb-6">
            Upload your company's custom return policy, pricing sheet, or terms to test hallucination interception on your real business data.
          </p>
          <div className="flex justify-center gap-3">
            <NeuButton onClick={handleOpenCreateModal} variant="primary" className="text-xs font-bold">
              Upload Your First Policy
            </NeuButton>
          </div>
        </div>
      )}

      {/* Upload/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-gradient-to-br from-[#F6F8FD] to-[#EAF0F9] shadow-2xl rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white">
            <div className="flex items-center justify-between pb-4 border-b border-indigo-200/60 mb-6">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  {editingDoc ? 'Edit Ground-Truth Policy' : 'Add Policy Document'}
                </h3>
                <p className="text-xs text-slate-600 font-bold">
                  Workspace: <span className="font-extrabold text-indigo-700">{currentWorkspace}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-500 hover:text-slate-800 rounded-xl cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Template Presets Bar */}
            {!editingDoc && (
              <div className="mb-6 p-4 bg-white/70 shadow-neu-maker-pressed rounded-2xl border border-indigo-100">
                <p className="text-[11px] font-black uppercase tracking-wider text-indigo-800 mb-2 flex items-center gap-1">
                  <Sparkles size={12} className="text-amber-500" />
                  Or Quick-Load a Sample Enterprise Policy Template
                </p>
                <div className="flex flex-wrap gap-2">
                  {POLICY_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleLoadTemplate(tmpl)}
                      className="text-xs px-3 py-1.5 rounded-xl bg-gradient-to-br from-[#F5F8FD] to-[#E7EFF9] shadow-neu-maker hover:shadow-neu-maker-pressed font-bold text-indigo-900 transition-all cursor-pointer border border-indigo-100"
                    >
                      {tmpl.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSaveDocument} className="space-y-5">
              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Return Policy 2026, Warranty Terms, SLA Standards"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full text-sm px-4 py-3 rounded-xl bg-gradient-to-br from-[#EEF4FD] to-[#E2ECF8] shadow-neu-maker-pressed border border-indigo-100/80 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                  Filename (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. return_policy.txt"
                  value={docFilename}
                  onChange={(e) => setDocFilename(e.target.value)}
                  className="w-full text-xs px-4 py-2.5 rounded-xl bg-gradient-to-br from-[#EEF4FD] to-[#E2ECF8] shadow-neu-maker-pressed border border-indigo-100/80 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-800 font-bold"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                    Verified Policy Content / Clauses
                  </label>
                  <label className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer">
                    <Upload size={12} />
                    <span>Upload .txt/.md file</span>
                    <input
                      type="file"
                      accept=".txt,.md"
                      onChange={handleModalFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <textarea
                  required
                  rows={8}
                  placeholder="Paste complete verified policy text, return windows (e.g. 30 days), fee structures ($15), exceptions, or SLAs..."
                  value={docContent}
                  onChange={(e) => setDocContent(e.target.value)}
                  className="w-full text-xs sm:text-sm p-4 rounded-xl bg-gradient-to-br from-[#EEF4FD] to-[#E2ECF8] shadow-neu-maker-pressed border border-indigo-100/80 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900 leading-relaxed font-semibold"
                />
              </div>

              <div className="pt-4 border-t border-indigo-200/60 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <NeuButton
                  type="submit"
                  disabled={isLoading}
                  variant="primary"
                  className="text-xs font-black"
                >
                  {isLoading ? 'Indexing...' : editingDoc ? 'Save & Re-index' : 'Chunk & Index into Vectors'}
                </NeuButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
