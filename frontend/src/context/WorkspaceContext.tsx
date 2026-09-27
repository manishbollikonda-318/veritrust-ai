import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

interface WorkspaceContextType {
  currentWorkspace: string;
  setCurrentWorkspace: (id: string) => void;
  workspaces: string[];
  refreshWorkspaces: () => Promise<void>;
  isDemoWorkspace: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentWorkspace, setCurrentWorkspace] = useState<string>(() => {
    return localStorage.getItem('veritrust_workspace') || 'default';
  });
  const [workspaces, setWorkspaces] = useState<string[]>(['default', 'custom']);

  const refreshWorkspaces = async () => {
    try {
      const data = await api.getWorkspaces();
      if (data && Array.isArray(data.workspaces)) {
        setWorkspaces(data.workspaces);
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

  const isDemoWorkspace = currentWorkspace === 'default';

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspace,
        setCurrentWorkspace: handleSetWorkspace,
        workspaces,
        refreshWorkspaces,
        isDemoWorkspace
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
