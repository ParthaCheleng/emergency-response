'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Custom hook for real-time Supabase session subscription.
 * Listens for PostgreSQL changes on the crisis_sessions table
 * and automatically updates local state when the backend modifies the row.
 *
 * @param {string|null} sessionId - The UUID of the active crisis session
 * @returns {{ session: Object|null, loading: boolean, error: string|null, refetch: Function }}
 */
export function useRealtimeSession(sessionId) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch current session state
  const fetchSession = useCallback(async () => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('crisis_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (fetchError) {
        console.error('Supabase fetch error:', fetchError);
        setError(fetchError.message);
      } else {
        setSession(data);
        setError(null);
      }
    } catch (err) {
      console.error('Session fetch failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Initial fetch
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Real-time subscription
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`session-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'crisis_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('[Realtime] Session updated:', payload.new?.status);
          setSession(payload.new);
          setLoading(false);
          setError(null);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'crisis_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('[Realtime] Session created:', payload.new?.id);
          setSession(payload.new);
          setLoading(false);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] Connected to session ${sessionId}`);
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('[Realtime] Channel error');
          setError('Realtime connection failed');
        }
      });

    return () => {
      console.log(`[Realtime] Disconnecting from session ${sessionId}`);
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return { session, loading, error, refetch: fetchSession };
}
