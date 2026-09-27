import { useState, useEffect } from 'react';
import { MetricData } from '../types';
import { api } from '../services/api';
import { useWorkspace } from '../context/WorkspaceContext';

export function useMetrics() {
  const { currentWorkspace } = useWorkspace();
  const [metrics, setMetrics] = useState<MetricData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    api.getMetrics(currentWorkspace).then((data) => {
      setMetrics(data);
      setLoading(false);
    });

    const interval = setInterval(() => {
      api.getMetrics(currentWorkspace).then((data) => {
        setMetrics(data);
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [currentWorkspace]);

  return { metrics, loading, currentWorkspace };
}
