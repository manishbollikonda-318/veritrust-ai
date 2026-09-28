import { useState, useEffect } from 'react';
import { api } from '../services/api';

export function useConnectionStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    let intervalId: ReturnType<typeof setInterval>;

    const checkConnection = async () => {
      const start = performance.now();
      try {
        const data = await api.getHealth();
        const elapsed = performance.now() - start;
        if (mounted) {
          setIsConnected(data?.status === 'healthy');
          setLatency(Math.round(elapsed));
        }
      } catch {
        if (mounted) {
          setIsConnected(false);
          setLatency(null);
        }
      }
    };

    checkConnection();
    intervalId = setInterval(checkConnection, 30000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  return { isConnected, latency };
}