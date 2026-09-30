import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { Workspace, WorkspaceCreateInput } from '../types';

interface WorkspaceContextType {
  currentWorkspace: string;
  setCurrentWorkspace: (id: string) => void;
  workspaces: Workspace[];
  activeWorkspace?: Workspace;
  refreshWorkspaces: () => Promise<void>;
  createWorkspace: (input: WorkspaceCreateInput) => Promise<Workspace>;
  deleteWorkspace: (workspaceId: string, confirmationName: string) => Promise<void>;
  isDemoWorkspace: boolean;
  isCreateModalOpen: boolean;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  resetWorkspaceData: () => void;
  workspaceVersion: number;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

const DEFAULT_WORKSPACE_FALLBACK: Workspace = {
  id: 'default',
  name: 'Acme Health & Pharma (Demo)',
  industry: 'Healthcare & Telehealth',
  description: 'Clinical and pharmaceutical benchmark with prescription refills, lab orders, and HIPAA compliance policies',
  is_demo: true,
  llm_provider: 'shared_default',
  has_custom_api_key: false,
  document_count: 3,
  created_at: '2026-09-27T00:00:00Z'
};

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentWorkspace, setCurrentWorkspace] = useState<string>(() => {
    const saved = localStorage.getItem('veritrust_workspace') || 'default';
    return saved === 'acme-health' ? 'default' : saved;
  });
  const [workspaces, setWorkspaces] = useState<Workspace[]>([DEFAULT_WORKSPACE_FALLBACK]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [workspaceVersion, setWorkspaceVersion] = useState(0);

  const refreshWorkspaces = async () => {
    try {
      const data = await api.getWorkspaces();
      if (Array.isArray(data) && data.length > 0) {
        setWorkspaces(data);
      }
    } catch (err) {
      console.warn('Failed to fetch workspaces:', err);
    }
  };

  useEffect(() => {
    refreshWorkspaces();
  }, []);

  const handleSetWorkspace = (id: string) => {
    const targetId = id === 'acme-health' ? 'default' : id;
    setCurrentWorkspace(targetId);
    localStorage.setItem('veritrust_workspace', targetId);
    // Increment version to trigger reset in dependent components
    setWorkspaceVersion(v => v + 1);
  };

  const handleCreateWorkspace = async (input: WorkspaceCreateInput): Promise<Workspace> => {
    const newWs = await api.createWorkspace(input);
    await refreshWorkspaces();
    handleSetWorkspace(newWs.id);
    setIsCreateModalOpen(false);
    return newWs;
  };

  const handleDeleteWorkspace = async (workspaceId: string, confirmationName: string): Promise<void> => {
    const workspace = workspaces.find(w => w.id === workspaceId);
    if (!workspace) {
      throw new Error('Workspace not found');
    }
    if (workspace.name !== confirmationName) {
      throw new Error('Company name does not match');
    }
    if (workspace.is_demo) {
      throw new Error('Cannot delete demo workspaces');
    }

    // Call backend API
    await api.deleteWorkspace(workspaceId);

    // Remove from localStorage
    try {
      const storedStr = localStorage.getItem('veritrust_custom_workspaces');
      if (storedStr) {
        const list: Workspace[] = JSON.parse(storedStr);
        const updated = list.filter(w => w.id !== workspaceId);
        localStorage.setItem('veritrust_custom_workspaces', JSON.stringify(updated));
      }
      // Also remove documents
      localStorage.removeItem(`veritrust_docs_${workspaceId}`);
    } catch (e) {
      console.warn('Could not clean up localStorage:', e);
    }

    // Refresh workspaces from backend
    await refreshWorkspaces();

    // If we deleted the current workspace, switch to default
    if (currentWorkspace === workspaceId) {
      handleSetWorkspace('default');
    }
  };

  const resetWorkspaceData = () => {
    // This function can be called by components to reset their local state
    // The workspaceVersion increment already triggers useEffect dependencies
    setWorkspaceVersion(v => v + 1);
  };

  const activeWorkspace = workspaces.find(w => w.id === currentWorkspace) || workspaces[0];
  const isDemoWorkspace = Boolean(activeWorkspace?.is_demo || currentWorkspace === 'default' || currentWorkspace === 'novamart' || currentWorkspace === 'apex-financial');

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspace,
        setCurrentWorkspace: handleSetWorkspace,
        workspaces,
        activeWorkspace,
        refreshWorkspaces,
        createWorkspace: handleCreateWorkspace,
        deleteWorkspace: handleDeleteWorkspace,
        isDemoWorkspace,
        isCreateModalOpen,
        openCreateModal: () => setIsCreateModalOpen(true),
        closeCreateModal: () => setIsCreateModalOpen(false),
        resetWorkspaceData,
        workspaceVersion
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
