import React, { useState, useRef, useEffect } from 'react';
import { Cpu, Building2, Menu, PanelLeftClose, PanelLeftOpen, Sparkles, Plus, Wifi, WifiOff, Activity, Zap, Server, Trash2, AlertTriangle, X, ChevronDown } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useSidebar } from '../../context/SidebarContext';
import { openDataSourceDisclosure } from '../ui/DataSourceDisclosureModal';
import NeuButton from '../ui/NeuButton';
import { useConnectionStatus } from '../../hooks/useConnectionStatus';
import { useLLMHealth } from '../../hooks/useLLMHealth';

export default function Header() {
  const { currentWorkspace, setCurrentWorkspace, workspaces, openCreateModal, activeWorkspace, deleteWorkspace } = useWorkspace();
  const { isCollapsed, toggleSidebar, toggleMobile } = useSidebar();
  const { isConnected, latency } = useConnectionStatus();
  const { getActiveProvider, isAnyProviderAvailable, loading: llmLoading } = useLLMHealth();
  const activeProvider = getActiveProvider();
  
  // Workspace dropdown state
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Delete workspace modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmationName, setConfirmationName] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<string | null>(null);

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
    <header className="h-16 sm:h-20 w-full flex items-center justify-between gap-2 px-3 sm:px-6 lg:px-8 bg-[#EEF2F8]/80 sticky top-0 z-30 backdrop-blur-md border-b border-slate-200/70">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          onClick={toggleMobile}
          className="p-2 -ml-1 text-ink-muted hover:text-accent hover:bg-white/70 rounded-xl transition-colors md:hidden shrink-0"
          title="Open Navigation"
          aria-label="Open Navigation Menu"
        >
          <Menu size={22} />
        </button>

        {/* The single sidebar toggle for every breakpoint.
            The duplicate toggle that used to live inside Sidebar.tsx was removed,
            so this is now the only "Collapse/Expand Sidebar" control. */}
        <button
          onClick={toggleSidebar}
          className="hidden md:flex p-2 text-ink-muted hover:text-accent hover:bg-white/70 rounded-xl transition-colors shrink-0"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-expanded={!isCollapsed}
          aria-controls="app-sidebar"
        >
          {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>

        {/* Title without clipping or overlap */}
        <h2 className="text-base sm:text-xl lg:text-2xl font-black text-ink tracking-tight leading-none whitespace-nowrap shrink-0">
          VeriTrust Guardrail
        </h2>

        <span className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-gradient-to-r from-blue-50 to-indigo-50 text-accent-strong border border-indigo-200/80 shadow-[2px_2px_6px_rgba(99,102,241,0.15),-2px_-2px_6px_rgba(255,255,255,0.9)] shrink-0">
          <Cpu size={12} className="text-accent" aria-hidden="true" />
          Maker &amp; Judge Engine
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Connection Status Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-gradient-to-br from-[#F4F7FC] to-[#E6EDF7] shadow-[inset_2px_2px_5px_rgba(165,180,205,0.45),inset_-2px_-2px_5px_rgba(255,255,255,0.9)] border border-slate-200/60">
          {isConnected === null ? (
            <>
              <Activity size={12} className="text-amber-500 animate-pulse" />
              <span className="text-xs font-bold text-amber-700">Connecting...</span>
            </>
          ) : isConnected ? (
            <>
              <Wifi size={12} className="text-emerald-500" />
              <span className="text-xs font-bold text-emerald-700">API</span>
              <span className="text-[10px] font-mono text-emerald-600">{latency}ms</span>
            </>
          ) : (
            <>
              <WifiOff size={12} className="text-rose-500" />
              <span className="text-xs font-bold text-rose-700">Disconnected</span>
            </>
          )}
        </div>

        {/* LLM Provider Chip */}
        {!llmLoading && activeProvider && (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-gradient-to-br from-[#F4F7FC] to-[#E6EDF7] shadow-[inset_2px_2px_5px_rgba(165,180,205,0.45),inset_-2px_-2px_5px_rgba(255,255,255,0.9)] border border-slate-200/60">
            {activeProvider.available ? (
              <>
                <Zap size={12} className="text-emerald-500" />
                <span className="text-xs font-bold text-emerald-700">{activeProvider.name.charAt(0).toUpperCase() + activeProvider.name.slice(1)}</span>
                <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 rounded">{activeProvider.model}</span>
              </>
            ) : (
              <>
                <Server size={12} className="text-amber-500" />
                <span className="text-xs font-bold text-amber-700">{activeProvider.name.charAt(0).toUpperCase() + activeProvider.name.slice(1)}</span>
                <span className="text-[10px] font-mono text-amber-600 bg-amber-50 px-1.5 rounded">Unavailable</span>
              </>
            )}
          </div>
        )}

        {/* Demo Disclosure Quick Button */}
        <NeuButton
          type="button"
          variant="neutral"
          size="sm"
          onClick={() => openDataSourceDisclosure()}
          className="hidden md:flex"
          title="Read Data Source & Synthetic Baseline Disclosure"
        >
          <Sparkles size={12} className="text-accent" aria-hidden="true" />
          <span>Demo Info</span>
        </NeuButton>

        {/* Workspace Quick Switcher */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
            className="bg-gradient-to-br from-[#F4F7FC] to-[#E6EDF7] shadow-[inset_2px_2px_5px_rgba(165,180,205,0.45),inset_-2px_-2px_5px_rgba(255,255,255,0.9)] border border-slate-200/60 px-2.5 sm:px-3 py-1.5 rounded-2xl flex items-center gap-1.5 sm:gap-2"
            aria-label="Active Enterprise Workspace"
            aria-expanded={showWorkspaceDropdown}
            aria-haspopup="listbox"
          >
            <Building2 size={13} className="text-accent shrink-0" aria-hidden="true" />
            <span className="text-xs font-bold text-ink truncate max-w-[130px] sm:max-w-none">
              {currentWs?.name || 'Select Workspace'}
            </span>
            <ChevronDown size={12} className={`text-slate-500 transition-transform ${showWorkspaceDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {showWorkspaceDropdown && (
            <div className="absolute right-0 top-full mt-1.5 w-56 sm:w-64 bg-white rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] border border-slate-200 py-1.5 z-40 animate-in fade-in-0 zoom-in-95 duration-150">
              {workspaces.map((w) => (
                <div key={w.id} className="flex items-center gap-2 px-3 py-2">
                  <button
                    onClick={() => {
                      setCurrentWorkspace(w.id);
                      setShowWorkspaceDropdown(false);
                    }}
                    className={`flex-1 flex items-center gap-2 text-left px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      currentWorkspace === w.id 
                        ? 'bg-indigo-50 text-indigo-700' 
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{w.name}</span>
                    {w.is_demo && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-semibold">
                        Demo
                      </span>
                    )}
                  </button>
                  {!w.is_demo && (
                    <button
                      onClick={() => handleOpenDeleteModal(w.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete workspace"
                      aria-label={`Delete ${w.name}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
              <hr className="my-1.5 border-slate-200" />
              <button
                onClick={() => {
                  openCreateModal();
                  setShowWorkspaceDropdown(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs font-medium text-accent-strong hover:bg-slate-50 rounded-lg transition-colors"
              >
                <Plus size={13} className="shrink-0" />
                <span>Add New Company...</span>
              </button>
            </div>
          )}
        </div>

        {/* Secondary action: onboarding a company */}
        <NeuButton
          type="button"
          variant="subtle"
          size="sm"
          onClick={openCreateModal}
          className="text-accent-strong"
          title="Onboard a new company workspace"
        >
          <Plus size={13} aria-hidden="true" />
          <span className="hidden md:inline">New Company</span>
          <span className="sr-only md:hidden">New Company</span>
        </NeuButton>
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
                onChange={(e) => {
                  setConfirmationName(e.target.value);
                  setDeleteError('');
                }}
                placeholder={workspaces.find(w => w.id === workspaceToDelete)?.name}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-shadow"
                disabled={isDeleting}
              />
              {deleteError && (
                <p className="mt-1.5 text-xs text-rose-500">{deleteError}</p>
              )}
            </div>
            
            <div className="flex gap-2">
              <NeuButton
                type="button"
                variant="neutral"
                size="md"
                onClick={() => { setShowDeleteModal(false); setWorkspaceToDelete(null); }}
                disabled={isDeleting}
                className="flex-1"
              >
                Cancel
              </NeuButton>
              <NeuButton
                type="button"
                variant="danger"
                size="md"
                onClick={handleDeleteWorkspace}
                disabled={isDeleting}
                className="flex-1"
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </NeuButton>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
