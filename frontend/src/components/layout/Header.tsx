import React, { useState, useRef, useEffect } from 'react';
import { Cpu, Building2, Menu, PanelLeftClose, PanelLeftOpen, Sparkles, Plus, Wifi, WifiOff, Activity, Zap, Server, Trash2, AlertTriangle, X, ChevronDown } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useSidebar } from '../../context/SidebarContext';
import { openDataSourceDisclosure } from '../ui/DataSourceDisclosureModal';
import NeuButton from '../ui/NeuButton';
import StrictnessSelector from '../ui/StrictnessSelector';
import { useConnectionStatus } from '../../hooks/useConnectionStatus';
import { useLLMHealth } from '../../hooks/useLLMHealth';

export default function Header() {
  const { currentWorkspace, setCurrentWorkspace, workspaces, openCreateModal, activeWorkspace, deleteWorkspace } = useWorkspace();
  const { isCollapsed, toggleSidebar, toggleMobile } = useSidebar();
  const { isConnected, latency } = useConnectionStatus();
  const { getActiveProvider, isAnyProviderAvailable, loading: llmLoading } = useLLMHealth();
  const activeProvider = getActiveProvider();

  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmationName, setConfirmationName] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<string | null>(null);

  const [strictnessMode, setStrictnessMode] = useState<'strict' | 'balanced' | 'advisory'>(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('veritrust_strictness_mode');
      if (saved === 'strict' || saved === 'balanced' || saved === 'advisory') return saved;
    }
    return 'balanced';
  });

  const handleStrictnessChange = (mode: 'strict' | 'balanced' | 'advisory') => {
    setStrictnessMode(mode);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('veritrust_strictness_mode', mode);
      window.dispatchEvent(new Event('strictness_mode_changed'));
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowWorkspaceDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenDeleteModal = (wsId: string) => {
    const ws = workspaces.find(w => w.id === wsId);
    if (ws && !ws.is_demo) {
      setWorkspaceToDelete(wsId);
      setShowDeleteModal(true);
      setConfirmationName('');
      setDeleteError('');
    }
    setShowWorkspaceDropdown(false);
  };

  const handleDeleteWorkspace = async () => {
    if (!workspaceToDelete) return;
    const ws = workspaces.find(w => w.id === workspaceToDelete);
    if (!ws) return;
    if (confirmationName !== ws.name) {
      setDeleteError('Company name must match exactly');
      return;
    }
    setIsDeleting(true);
    setDeleteError('');
    try {
      await deleteWorkspace(workspaceToDelete, confirmationName);
      setShowDeleteModal(false);
      setWorkspaceToDelete(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete workspace');
    } finally {
      setIsDeleting(false);
    }
  };

  const currentWs = workspaces.find(w => w.id === currentWorkspace);

  return (
    <header className="w-full sticky top-0 z-30 bg-white/50 backdrop-blur-2xl border-b border-white/70 shadow-[0_4px_24px_rgba(15,23,42,0.05)]">
      {/* ── Row 1: Brand + Primary Workspace Controls ──────────────── */}
      <div className="flex items-center justify-between gap-3 px-3 sm:px-5 h-13 sm:h-14">
        {/* Left: sidebar toggles + title */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          {/* Mobile hamburger */}
          <button
            onClick={toggleMobile}
            className="p-1.5 -ml-1 text-ink-muted hover:text-accent hover:bg-white/70 rounded-xl transition-colors md:hidden shrink-0"
            title="Open Navigation"
            aria-label="Open Navigation Menu"
          >
            <Menu size={20} />
          </button>

          {/* Desktop collapse toggle */}
          <button
            onClick={toggleSidebar}
            className="hidden md:flex p-1.5 text-ink-muted hover:text-accent hover:bg-white/70 rounded-xl transition-colors shrink-0"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-expanded={!isCollapsed}
            aria-controls="app-sidebar"
          >
            {isCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
          </button>

          {/* Title */}
          <h2 className="text-base sm:text-lg lg:text-xl font-black text-ink tracking-tight leading-none shrink-0">
            VeriTrust Guardrail
          </h2>

          {/* Engine badge */}
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-white/60 backdrop-blur-xl text-accent-strong border border-indigo-200/80 shadow-xs shrink-0">
            <Cpu size={11} className="text-accent" aria-hidden="true" />
            Maker &amp; Judge Engine
          </span>
        </div>

        {/* Right: Workspace Switcher + New Company */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Workspace switcher */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
              className="bg-white/60 hover:bg-white/80 backdrop-blur-xl shadow-[0_2px_10px_rgba(15,23,42,0.04),inset_0_1px_1px_rgba(255,255,255,0.9)] border border-white/80 px-2.5 sm:px-3 py-1.5 rounded-xl flex items-center gap-1.5 max-w-[170px] sm:max-w-[220px] transition-all cursor-pointer"
              aria-label="Active Enterprise Workspace"
              aria-expanded={showWorkspaceDropdown}
              aria-haspopup="listbox"
            >
              <Building2 size={13} className="text-accent shrink-0" aria-hidden="true" />
              <span className="text-xs font-bold text-ink truncate flex-1">
                {currentWs?.name || 'Select Workspace'}
              </span>
              <ChevronDown size={12} className={`text-slate-500 shrink-0 transition-transform ${showWorkspaceDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showWorkspaceDropdown && (
              <div className="absolute right-0 top-full mt-1.5 w-64 bg-white/95 backdrop-blur-2xl rounded-xl shadow-[0_20px_40px_-10px_rgba(15,23,42,0.18)] border border-white/90 py-1.5 z-40 animate-in fade-in-0 zoom-in-95 duration-150">
                {workspaces
                  .filter((w, idx, self) => w.id !== 'acme-health' && idx === self.findIndex(t => t.name === w.name || t.id === w.id))
                  .map((w) => (
                  <div key={w.id} className="flex items-center gap-2 px-3 py-1.5">
                    <button
                      onClick={() => { setCurrentWorkspace(w.id); setShowWorkspaceDropdown(false); }}
                      className={`flex-1 flex items-center gap-2 text-left px-2 py-1.5 rounded-lg text-xs font-bold transition-colors ${currentWorkspace === w.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-800 hover:bg-slate-50'}`}
                    >
                      <span className="truncate">{w.name}</span>
                      {w.is_demo && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-semibold shrink-0">Demo</span>
                      )}
                    </button>
                    {!w.is_demo && (
                      <button
                        onClick={() => handleOpenDeleteModal(w.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors shrink-0 cursor-pointer"
                        title="Delete workspace"
                        aria-label={`Delete ${w.name}`}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
                <hr className="my-1.5 border-slate-200" />
                <button
                  onClick={() => { openCreateModal(); setShowWorkspaceDropdown(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs font-bold text-accent-strong hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus size={13} className="shrink-0" />
                  <span>Add New Company...</span>
                </button>
              </div>
            )}
          </div>

          {/* New Company button */}
          <NeuButton
            type="button"
            variant="subtle"
            size="sm"
            onClick={openCreateModal}
            className="text-accent-strong shrink-0"
            title="Onboard a new company workspace"
            aria-label="New company workspace"
          >
            <Plus size={13} aria-hidden="true" />
            <span className="hidden sm:inline text-xs font-bold">New</span>
          </NeuButton>
        </div>
      </div>

      {/* ── Row 2: Secondary Toolbar (Strictness Mode & Telemetry Status) ── */}
      <div className="flex items-center justify-between gap-3 px-3 sm:px-5 py-1.5 border-t border-slate-200/50 bg-white/25 backdrop-blur-md overflow-x-auto scrollbar-none">
        {/* Left: Guardrail Strictness Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 hidden md:inline">
            Guardrail Strictness:
          </span>
          <StrictnessSelector
            value={strictnessMode}
            onChange={handleStrictnessChange}
            className="shrink-0"
          />
        </div>

        {/* Right: Telemetry & Demo Info Chips */}
        <div className="flex items-center gap-2 shrink-0">
          {/* API status chip */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/60 border border-white/80 text-[11px] font-bold shadow-xs shrink-0">
            {isConnected === null ? (
              <><Activity size={10} className="text-amber-500 animate-pulse" /><span className="text-amber-700">Connecting</span></>
            ) : isConnected ? (
              <><Wifi size={10} className="text-emerald-500" /><span className="text-emerald-700">API</span><span className="text-[10px] font-mono text-emerald-600">{latency}ms</span></>
            ) : (
              <><WifiOff size={10} className="text-rose-500" /><span className="text-rose-700">Offline</span></>
            )}
          </div>

          {/* LLM Pipeline chip */}
          {!llmLoading && activeProvider && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/60 border border-white/80 text-[11px] font-bold shadow-xs shrink-0 max-w-[190px]">
              {activeProvider.available ? (
                <><Zap size={10} className="text-emerald-500 shrink-0" /><span className="text-emerald-700 truncate">{activeProvider.name}</span><span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1 rounded truncate max-w-[80px]">{activeProvider.model}</span></>
              ) : (
                <><Server size={10} className="text-amber-500 shrink-0" /><span className="text-amber-700 truncate">{activeProvider.name}</span><span className="text-[10px] font-mono text-amber-600 bg-amber-50 px-1 rounded">Offline</span></>
              )}
            </div>
          )}

          {/* Demo Info modal toggle */}
          <button
            type="button"
            onClick={() => openDataSourceDisclosure()}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/60 hover:bg-white/80 border border-white/80 text-[11px] font-bold text-accent shadow-xs transition-colors shrink-0 cursor-pointer"
            title="Read Data Source & Synthetic Baseline Disclosure"
            aria-label="Demo Information"
          >
            <Sparkles size={11} />
            <span>Demo Info</span>
          </button>
        </div>
      </div>

      {/* Delete Workspace Modal */}
      {showDeleteModal && workspaceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-rose-500" />
              </div>
              <h3 className="text-lg font-bold text-ink">Delete Workspace</h3>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              You are about to permanently delete <strong className="text-ink">{workspaces.find(w => w.id === workspaceToDelete)?.name}</strong>.
              This will remove all documents, review items, metrics, and the workspace token.
              This action cannot be undone.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Type the company name to confirm:
              </label>
              <input
                type="text"
                value={confirmationName}
                onChange={(e) => { setConfirmationName(e.target.value); setDeleteError(''); }}
                placeholder={workspaces.find(w => w.id === workspaceToDelete)?.name}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-shadow"
                disabled={isDeleting}
              />
              {deleteError && <p className="mt-1.5 text-xs text-rose-500">{deleteError}</p>}
            </div>
            <div className="flex gap-2">
              <NeuButton type="button" variant="neutral" size="md" onClick={() => { setShowDeleteModal(false); setWorkspaceToDelete(null); }} disabled={isDeleting} className="flex-1">
                Cancel
              </NeuButton>
              <NeuButton type="button" variant="danger" size="md" onClick={handleDeleteWorkspace} disabled={isDeleting} className="flex-1">
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </NeuButton>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
