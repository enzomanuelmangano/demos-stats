import { useState, useEffect } from 'react';
import type { AggregateStats, AnimationMetadata } from '../types/metadata';

export function useAggregateStats() {
  const [stats, setStats] = useState<AggregateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/data/stats.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch stats');
        return res.json();
      })
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { stats, loading, error };
}

export function useAnimationMetadata(slug: string) {
  const [metadata, setMetadata] = useState<AnimationMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/data/meta/${slug}.json`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch metadata');
        return res.json();
      })
      .then((data) => {
        setMetadata(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [slug]);

  return { metadata, loading, error };
}

export function useAllAnimations() {
  const { stats } = useAggregateStats();
  return stats?.animations || [];
}
