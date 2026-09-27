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
  isDemoWorkspace: boolean;
  isCreateModalOpen: boolean;
  openCreateModal: () => void;
  closeCreateModal: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

const DEFAULT_WORKSPACE_FALLBACK: Workspace = {
  id: 'default',
  name: 'NovaMart Retail (Demo)',
  industry: 'Retail & E-Commerce',
  description: 'Default retail benchmark with 5 sample policies',
  is_demo: true,
  llm_provider: 'shared_default',
  has_custom_api_key: false,
  document_count: 5,
  created_at: '2026-09-27T00:00:00Z'
};

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentWorkspace, setCurrentWorkspace] = useState<string>(() => {
    return localStorage.getItem('veritrust_workspace') || 'default';
  });
  const [workspaces, setWorkspaces] = useState<Workspace[]>([DEFAULT_WORKSPACE_FALLBACK]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
    setCurrentWorkspace(id);
    localStorage.setItem('veritrust_workspace', id);
  };

  const handleCreateWorkspace = async (input: WorkspaceCreateInput): Promise<Workspace> => {
    const newWs = await api.createWorkspace(input);
    await refreshWorkspaces();
    handleSetWorkspace(newWs.id);
    setIsCreateModalOpen(false);
    return newWs;
  };

  const isDemoWorkspace = currentWorkspace === 'default' || currentWorkspace === 'acme-health';
  const activeWorkspace = workspaces.find(w => w.id === currentWorkspace) || workspaces[0];

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspace,
        setCurrentWorkspace: handleSetWorkspace,
        workspaces,
        activeWorkspace,
        refreshWorkspaces,
        createWorkspace: handleCreateWorkspace,
        isDemoWorkspace,
        isCreateModalOpen,
        openCreateModal: () => setIsCreateModalOpen(true),
        closeCreateModal: () => setIsCreateModalOpen(false)
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
