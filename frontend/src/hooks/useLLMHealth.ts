import { useState, useEffect } from 'react';
import { api } from '../services/api';

export interface LLMProviderStatus {
  name: string;
  available: boolean;
  model: string;
  status: string;
}

export function useLLMHealth() {
  const [providers, setProviders] = useState<LLMProviderStatus[]>([]);
  const [overallStatus, setOverallStatus] = useState<'healthy' | 'degraded' | 'offline' | 'loading'>('loading');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let intervalId: ReturnType<typeof setInterval>;

    const checkLLMHealth = async () => {
      try {
        const res = await fetch('/api/health/llm', { 
          method: 'GET', 
          cache: 'no-cache' 
        });
        if (!res.ok) throw new Error('Failed to fetch LLM health');
        
        const data = await res.json();
        
        if (!mounted) return;
        
        const providerList: LLMProviderStatus[] = Object.entries(data.providers || {}).map(([name, info]: [string, any]) => ({
          name,
          available: info.available,
          model: info.model,
          status: info.status
        }));
        
        setProviders(providerList);
        setOverallStatus(data.status === 'healthy' ? 'healthy' : data.status === 'degraded' ? 'degraded' : 'offline');
      } catch {
        if (mounted) {
          setOverallStatus('offline');
          setProviders([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkLLMHealth();
    intervalId = setInterval(checkLLMHealth, 30000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const getActiveProvider = () => {
    return providers.find(p => p.available) || providers[0] || null;
  };

  const isAnyProviderAvailable = () => providers.some(p => p.available);

  return { 
    providers, 
    overallStatus, 
    loading, 
    getActiveProvider, 
    isAnyProviderAvailable: isAnyProviderAvailable() 
  };
}