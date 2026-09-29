import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useWorkspace } from './WorkspaceContext';
import { api } from '../services/api';

export interface PendingAudit {
  id: string;
  originalQuery: string;
  makerDraft: string;
  judgeCorrectedOutput: string;
  reasoning: string;
  isHallucinated: boolean;
  status: 'pending' | 'resolved' | 'approved' | 'overridden';
  created_at: string;
  workspace_id?: string;
  claims?: any[];
}

interface AuditContextType {
  pendingAudits: PendingAudit[];
  addPendingAudit: (audit: Partial<PendingAudit>) => void;
  resolveAudit: (id: string, action?: string, customResponse?: string, notes?: string) => Promise<void>;
  refreshAudits: () => Promise<void>;
  loading: boolean;
}

const AuditContext = createContext<AuditContextType | undefined>(undefined);

export function AuditProvider({ children }: { children: ReactNode }) {
  const { currentWorkspace } = useWorkspace();
  const [pendingAudits, setPendingAudits] = useState<PendingAudit[]>([]);
  const [loading, setLoading] = useState(false);

  // Sync with backend review queue on mount and workspace change
  const refreshAudits = useCallback(async () => {
    setLoading(true);
    try {
      const queueData = await api.getReviewQueue(currentWorkspace);
      if (Array.isArray(queueData)) {
        // Map backend items to PendingAudit format and filter strictly pending
        const pending = queueData
          .filter(it => (it.review_status || '').trim().toLowerCase() === 'pending')
          .map(it => ({
            id: it.id,
            originalQuery: it.query,
            makerDraft: it.original_draft,
            judgeCorrectedOutput: it.final_response,
            reasoning: it.overall_reasoning || 'Flagged for human verification',
            isHallucinated: true,
            status: 'pending' as const,
            created_at: it.timestamp || new Date().toISOString(),
            workspace_id: it.workspace_id,
            claims: it.claims
          }));
        setPendingAudits(pending);
      }
    } catch (err) {
      console.warn('Failed to load pending audits:', err);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    refreshAudits();
  }, [refreshAudits]);

  const addPendingAudit = useCallback((audit: Partial<PendingAudit>) => {
    const newAudit: PendingAudit = {
      id: audit.id || 'audit-' + Date.now(),
      originalQuery: audit.originalQuery || '',
      makerDraft: audit.makerDraft || '',
      judgeCorrectedOutput: audit.judgeCorrectedOutput || '',
      reasoning: audit.reasoning || 'Factual discrepancy detected by Judge Guardrail',
      isHallucinated: true,
      status: 'pending',
      created_at: audit.created_at || new Date().toISOString(),
      workspace_id: currentWorkspace,
      claims: audit.claims || []
    };
    setPendingAudits(prev => {
      // Prevent duplicates by ID
      if (prev.some(a => a.id === newAudit.id)) {
        return prev;
      }
      return [newAudit, ...prev];
    });
  }, [currentWorkspace]);

  const resolveAudit = useCallback(async (
    id: string,
    action: string = 'approve_correction',
    customResponse?: string,
    notes?: string
  ) => {
    try {
      await api.resolveReviewItem(
        id,
        {
          action: action as any,
          corrected_response: customResponse,
          human_notes: notes,
          add_to_knowledge_base: true
        },
        currentWorkspace
      );
    } catch (e) {
      console.warn('Could not resolve on backend, updating local state:', e);
    }
    setPendingAudits(prev => prev.filter(a => a.id !== id));
  }, [currentWorkspace]);

  return (
    <AuditContext.Provider value={{ pendingAudits, addPendingAudit, resolveAudit, refreshAudits, loading }}>
      {children}
    </AuditContext.Provider>
  );
}

export function useAudit() {
  const context = useContext(AuditContext);
  if (!context) {
    throw new Error('useAudit must be used within an AuditProvider');
  }
  return context;
}
