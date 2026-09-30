import { useState, useEffect } from 'react';
import { Message, Claim } from '../types';
import { api } from '../services/api';
import { useWorkspace } from '../context/WorkspaceContext';
import { useToast } from '../context/ToastContext';
import { useAudit } from '../context/AuditContext';

export function useChat() {
  const { currentWorkspace, workspaceVersion } = useWorkspace();
  const { showToast } = useToast();
  const { addPendingAudit } = useAudit();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [demoMode, setDemoMode] = useState<boolean>(true);

  // Reset and clear chat state whenever workspace changes so user starts fresh each time in all companies
  useEffect(() => {
    setMessages([]);
    setSelectedMessage(null);
    setSelectedClaim(null);
  }, [currentWorkspace, workspaceVersion]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return;
    setLoading(true);

    try {
      const { userMessage, botMessage } = await api.sendMessage(content, demoMode, currentWorkspace);
      setMessages(prev => [...prev, userMessage, botMessage]);
      setSelectedMessage(botMessage);
      if (botMessage.claims && botMessage.claims.length > 0) {
        const flagged = botMessage.claims.find(c => c.verdict !== 'Verified') || botMessage.claims[0];
        setSelectedClaim(flagged);
      }

      // If hallucinated, append to pendingAudits in central state
      if (botMessage.isHallucinated || botMessage.status === 'Corrected' || botMessage.status === 'Blocked') {
        addPendingAudit({
          id: botMessage.id,
          originalQuery: botMessage.originalQuery || content,
          makerDraft: botMessage.makerDraft || botMessage.originalDraft || '',
          judgeCorrectedOutput: botMessage.judgeCorrectedOutput || botMessage.finalResponse || '',
          reasoning: botMessage.reasoning || botMessage.overallReasoning || 'Factual discrepancy intercepted by Judge Guardrail',
          isHallucinated: true,
          status: 'pending',
          created_at: botMessage.timestamp || new Date().toISOString(),
          claims: botMessage.claims || []
        });
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      showToast('error', 'Pipeline Error', err?.message || 'Failed to complete Dual-Agent verification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMessage = (msg: Message | null) => {
    setSelectedMessage(msg);
    if (msg && msg.claims && msg.claims.length > 0) {
      const flagged = msg.claims.find(c => c.verdict !== 'Verified') || msg.claims[0];
      setSelectedClaim(flagged);
    } else {
      setSelectedClaim(null);
    }
  };

  const handleSelectClaim = (claim: Claim, msg?: Message) => {
    setSelectedClaim(claim);
    if (msg) setSelectedMessage(msg);
  };

  const clearChat = async () => {
    setMessages([]);
    setSelectedMessage(null);
    setSelectedClaim(null);
    try {
      await api.clearChat(currentWorkspace);
    } catch (e) {
      console.warn('Error clearing backend session:', e);
    }
    showToast('info', 'Chat Cleared', 'Conversation session reset. Ready for a new query.');
  };

  return {
    messages,
    loading,
    sendMessage,
    selectedMessage,
    setSelectedMessage: handleSelectMessage,
    selectedClaim,
    setSelectedClaim: handleSelectClaim,
    demoMode,
    setDemoMode,
    clearChat
  };
}
