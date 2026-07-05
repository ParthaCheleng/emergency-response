'use client';

import { useState, useEffect, useCallback } from 'react';
import { createSession, injectEvent } from '@/lib/api';
import { useRealtimeSession } from '@/hooks/useRealtimeSession';
import IncidentIntel from '@/components/IncidentIntel';
import AgentNetwork from '@/components/AgentNetwork';
import ActionPlan from '@/components/ActionPlan';
import SimulationTray from '@/components/SimulationTray';

export default function MissionControl() {
  const [sessionId, setSessionId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [initError, setInitError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  // Real-time session subscription
  const { session, loading, error: realtimeError, refetch } = useRealtimeSession(sessionId);

  // Mark client mount for hydration safety
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize a new crisis session on mount
  useEffect(() => {
    async function init() {
      try {
        const data = await createSession();
        setSessionId(data.session_id);
        console.log('[Mission Control] Session created:', data.session_id);
      } catch (err) {
        console.error('[Mission Control] Failed to create session:', err);
        setInitError(err.message);
      }
    }
    init();
  }, []);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Clear processing state when session updates to COMPLETE, ERROR, or IDLE
  useEffect(() => {
    if (session?.status === 'COMPLETE' || session?.status === 'ERROR' || session?.status === 'IDLE') {
      setIsProcessing(false);
    }
  }, [session]);

  // Polling fallback while processing (in case Supabase Realtime websocket drops packets)
  useEffect(() => {
    if (!isProcessing || !sessionId) return;
    const interval = setInterval(() => {
      refetch();
    }, 1500);
    return () => clearInterval(interval);
  }, [isProcessing, sessionId, refetch]);

  // Safety timeout: auto-reset processing state after 8 seconds so UI never gets stuck
  useEffect(() => {
    if (!isProcessing) return;
    const timer = setTimeout(() => {
      console.log('[Mission Control] Processing timeout reached, resetting UI state...');
      setIsProcessing(false);
      refetch();
    }, 8000);
    return () => clearTimeout(timer);
  }, [isProcessing, refetch]);

  // Handle event injection from simulation buttons
  const handleInjectEvent = useCallback(
    async (eventText, disasterType = null) => {
      if (!sessionId || isProcessing) return;

      setIsProcessing(true);
      try {
        await injectEvent(sessionId, eventText, disasterType);
        console.log('[Mission Control] Event injected, awaiting AI response... (type:', disasterType, ')');
        setTimeout(() => {
          refetch();
        }, 300);
      } catch (err) {
        console.error('[Mission Control] Inject event failed:', err);
        setIsProcessing(false);
      }
    },
    [sessionId, isProcessing, refetch]
  );

  // Extract session data with safe defaults
  const status = session?.status || 'IDLE';
  const emergencyLevel = session?.emergency_level || 'UNKNOWN';
  const timeline = session?.timeline || [];
  const agentChatter = session?.agent_chatter || [];
  const actionPlan = session?.action_plan || [];

  return (
    <div className="min-h-screen flex flex-col">
      {/* ═══════════════════════════════════════════════════════════
          HEADER BAR
          ═══════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 bg-[#050810]/90 backdrop-blur-xl border-b border-slate-800/60">
        <div className="max-w-[1920px] mx-auto px-6 py-3 flex items-center justify-between">
          {/* Left: Logo & Title */}
          <div className="flex items-center gap-4">
            {/* Radar indicator */}
            <div className="relative w-10 h-10 rounded-full border-2 border-slate-600 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse-dot" />
              <div className="absolute inset-0 rounded-full border border-green-500/20 animate-glow-green" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-wide gradient-text-header">
                EMERGENCY RESPONSE COMMANDER AI
              </h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium">
                Tactical Mission Control Dashboard • 8-Agent Neural Network
              </p>
            </div>
          </div>

          {/* Center: Status chip */}
          <div className="hidden md:flex items-center gap-3">
            <div
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                status === 'IDLE'
                  ? 'bg-slate-800/50 border-slate-600 text-slate-400'
                  : status === 'PROCESSING'
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 animate-pulse-processing'
                  : status === 'COMPLETE'
                  ? 'bg-green-500/10 border-green-500/40 text-green-400'
                  : 'bg-red-500/10 border-red-500/40 text-red-400'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  status === 'IDLE'
                    ? 'bg-slate-500'
                    : status === 'PROCESSING'
                    ? 'bg-amber-400 animate-pulse-dot'
                    : status === 'COMPLETE'
                    ? 'bg-green-400'
                    : 'bg-red-400'
                }`}
              />
              {status === 'IDLE' ? 'STANDBY' : status}
            </div>
          </div>

          {/* Right: Clock & Session */}
          <div className="text-right" suppressHydrationWarning>
            <div className="text-sm font-mono text-slate-300 tabular-nums" suppressHydrationWarning>
              {mounted
                ? currentTime.toLocaleTimeString('en-US', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })
                : '--:--:--'}
            </div>
            <div className="text-[10px] text-slate-600 font-mono">
              {sessionId ? `SID: ${sessionId.slice(0, 8)}...` : 'Initializing...'}
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════
          INITIALIZATION ERROR STATE
          ═══════════════════════════════════════════════════════════ */}
      {initError && (
        <div className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          <span className="font-semibold">⚠ Connection Error:</span> {initError}
          <p className="text-xs text-red-400/70 mt-1">
            Make sure the FastAPI backend is running on {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}
          </p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MAIN 3-COLUMN GRID
          ═══════════════════════════════════════════════════════════ */}
      <main className="flex-1 max-w-[1920px] mx-auto w-full px-4 md:px-6 py-4 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
          {/* ── Left Column: Incident Intelligence (3 cols) ── */}
          <div className="lg:col-span-3 flex flex-col gap-4 min-h-0">
            <IncidentIntel
              status={status}
              emergencyLevel={emergencyLevel}
              timeline={timeline}
            />
          </div>

          {/* ── Middle Column: Agent Network (5 cols) ── */}
          <div className="lg:col-span-5 flex flex-col min-h-0">
            <AgentNetwork agentChatter={agentChatter} />
          </div>

          {/* ── Right Column: Tactical Directives (4 cols) ── */}
          <div className="lg:col-span-4 flex flex-col min-h-0">
            <ActionPlan actionPlan={actionPlan} />
          </div>
        </div>
      </main>

      {/* ═══════════════════════════════════════════════════════════
          BOTTOM SIMULATION TRAY
          ═══════════════════════════════════════════════════════════ */}
      <SimulationTray
        onInjectEvent={handleInjectEvent}
        isProcessing={isProcessing}
      />
    </div>
  );
}
