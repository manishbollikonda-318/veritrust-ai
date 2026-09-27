import { useState, useEffect } from 'react';
import { MetricData } from '../types';
import { api } from '../services/api';

export function useMetrics() {
  const [metrics, setMetrics] = useState<MetricData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    api.getMetrics().then((data) => {
      setMetrics(data);
      setLoading(false);
    });

    const interval = setInterval(() => {
      api.getMetrics().then((data) => {
        setMetrics(data);
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return { metrics, loading };
}
