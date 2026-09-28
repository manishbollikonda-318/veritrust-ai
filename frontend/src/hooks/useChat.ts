import { useState, useEffect } from 'react';
import { Message, Claim } from '../types';
import { api } from '../services/api';
import { useWorkspace } from '../context/WorkspaceContext';

export function useChat() {
  const { currentWorkspace, workspaceVersion } = useWorkspace();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [demoMode, setDemoMode] = useState<boolean>(true);

  // Reset all chat state when workspace changes (via version increment)
  useEffect(() => {
    setMessages([]);
    setSelectedMessage(null);
    setSelectedClaim(null);

    api.getMessages(currentWorkspace).then((msgs) => {
      setMessages(msgs);
      const firstWithClaims = msgs.find(m => m.claims && m.claims.length > 0);
      if (firstWithClaims) {
        setSelectedMessage(firstWithClaims);
        if (firstWithClaims.claims && firstWithClaims.claims.length > 0) {
          const flagged = firstWithClaims.claims.find(c => c.verdict !== 'Verified') || firstWithClaims.claims[0];
          setSelectedClaim(flagged);
        }
      } else {
        setSelectedMessage(null);
        setSelectedClaim(null);
      }
    });
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
    } catch (err) {
      console.error('Error sending message:', err);
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

  const clearChat = () => {
    setMessages([]);
    setSelectedMessage(null);
    setSelectedClaim(null);
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
