import { useState, useEffect } from 'react';

interface LLMProviderStatus {
  name: string;
  available: boolean;
  model: string;
  status: string;
  models_available?: string[];
}

interface LLMHealthResponse {
  status: string;
  providers: Record<string, LLMProviderStatus>;
  default_provider: string;
  note: string;
}

export function useLLMHealth() {
  const [llmHealth, setLlmHealth] = useState<LLMHealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch('/api/health/llm');
        if (res.ok) {
          const data = await res.json();
          setLlmHealth(data);
        }
      } catch (err) {
        console.warn('Failed to fetch LLM health:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
    
    // Poll every 60 seconds
    const interval = setInterval(fetchHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  const getActiveProvider = (): LLMProviderStatus | null => {
    if (!llmHealth) return null;
    
    // Find first available provider
    for (const provider of Object.values(llmHealth.providers)) {
      if (provider.available) {
        return provider;
      }
    }
    
    // If none available, return the default or first one
    return Object.values(llmHealth.providers)[0] || null;
  };

  const isAnyProviderAvailable = (): boolean => {
    if (!llmHealth) return false;
    return Object.values(llmHealth.providers).some(p => p.available);
  };

  return {
    llmHealth,
    loading,
    getActiveProvider,
    isAnyProviderAvailable
  };
}