'use client';

import { useState, useEffect, useRef } from 'react';

const SEVERITY_CONFIG = {
  CRITICAL: {
    dot: 'bg-red-500',
    glow: 'shadow-[0_0_8px_rgba(239,68,68,0.6)]',
    badge: 'bg-red-500/20 text-red-400 border-red-500/30',
    line: 'bg-red-500/40',
  },
  CATASTROPHIC: {
    dot: 'bg-red-600',
    glow: 'shadow-[0_0_12px_rgba(220,38,38,0.8)]',
    badge: 'bg-red-600/30 text-red-300 border-red-500/50 animate-pulse',
    line: 'bg-red-600/50',
  },
  WARNING: {
    dot: 'bg-amber-500',
    glow: 'shadow-[0_0_8px_rgba(245,158,11,0.5)]',
    badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    line: 'bg-amber-500/30',
  },
  INFO: {
    dot: 'bg-blue-500',
    glow: 'shadow-[0_0_6px_rgba(59,130,246,0.4)]',
    badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    line: 'bg-blue-500/20',
  },
};

/**
 * Typewriter effect component that animates text when a new simulation run loads.
 */
function TypewriterText({ text = '', speed = 10, isScenario = false }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    setDisplayedText('');
    setIsTyping(true);
    if (!text) {
      setIsTyping(false);
      return;
    }

    let currentIndex = 0;
    // Calculate step increment so even long scenario texts finish in under 1.2 seconds
    const step = Math.max(1, Math.floor(text.length / 60));
    
    const interval = setInterval(() => {
      currentIndex += step;
      if (currentIndex >= text.length) {
        setDisplayedText(text);
        setIsTyping(false);
        clearInterval(interval);
      } else {
        setDisplayedText(text.slice(0, currentIndex));
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span className="inline leading-relaxed" suppressHydrationWarning>
      {displayedText}
      {isTyping && (
        <span
          className={`inline-block ml-1 w-1.5 h-3.5 align-middle ${
            isScenario ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'bg-slate-400'
          } animate-pulse`}
        />
      )}
    </span>
  );
}

export default function IncidentTimeline({ timeline = [], isProcessing = false }) {
  const scrollRef = useRef(null);
  const [visibleCount, setVisibleCount] = useState(0);

  // Trigger animation re-run whenever timeline content changes
  useEffect(() => {
    setVisibleCount(timeline.length);
  }, [timeline]);

  const formatTimestamp = (ts) => {
    if (!ts) return '--:--:--';
    try {
      const date = new Date(ts);
      return date.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return String(ts);
    }
  };

  // ── PROCESSING STATE: Show animated loading wheel while DB updates ──
  if (isProcessing) {
    return (
      <div className="flex h-full flex-col rounded-2xl border border-amber-500/40 bg-slate-900/90 p-4 shadow-[0_0_20px_rgba(245,158,11,0.15)] transition-all duration-300">
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm">🔄</span>
          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-amber-400 animate-pulse">
            Acquiring Active Scenario Intel...
          </h3>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center py-14 gap-4">
          {/* Animated loading wheel */}
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-2 border-amber-500/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-amber-400 animate-spin" />
            <div className="absolute inset-2 rounded-full border border-transparent border-b-amber-300/60 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-mono font-bold tracking-wider text-amber-300 animate-pulse">
              FETCHING FROM SUPABASE REALTIME...
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Mapping 48-Scenario CRISIS_MATRIX Payload
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-700/50 bg-slate-900/80 p-4 transition-all duration-300">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <span className="text-sm">📊</span>
        <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-300">
          Incident Timeline
        </h3>
        {timeline.length > 0 && (
          <span className="ml-auto rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400 border border-slate-700/50">
            {timeline.length} events
          </span>
        )}
      </div>

      {/* Scrollable timeline container */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto pr-1"
        style={{ maxHeight: '400px' }}
      >
        {timeline.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="relative pl-6">
            {/* Main vertical line */}
            <div className="absolute bottom-0 left-[9px] top-0 w-px bg-slate-700/60" />

            {timeline.map((entry, index) => {
              const severity = SEVERITY_CONFIG[entry.severity] || SEVERITY_CONFIG.INFO;
              const isScenarioEngine = entry.source && entry.source.toLowerCase().includes('scenario engine');

              return (
                <div
                  key={`${entry.timestamp}-${entry.event ? entry.event.slice(0, 15) : index}-${index}`}
                  className="relative mb-4 last:mb-0"
                  style={{
                    animation: 'timeline-fade-in 0.3s ease-out both',
                    animationDelay: `${index * 0.05}s`,
                  }}
                >
                  {/* Dot on the timeline */}
                  <div
                    className={`absolute -left-6 top-1.5 h-[10px] w-[10px] rounded-full border-2 border-slate-900 ${
                      isScenarioEngine ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]' : severity.dot
                    } ${severity.glow}`}
                  />

                  {/* Entry content card */}
                  <div
                    className={`rounded-xl border p-3.5 transition-all duration-300 ${
                      isScenarioEngine
                        ? 'border-cyan-500/50 bg-gradient-to-br from-slate-800/95 via-slate-800/90 to-cyan-950/40 shadow-[0_4px_20px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/20'
                        : 'border-slate-700/40 bg-slate-800/50 hover:border-slate-600/60 hover:bg-slate-800/70'
                    }`}
                  >
                    {/* Top row: time + severity badge */}
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] text-slate-400 font-medium" suppressHydrationWarning>
                        {formatTimestamp(entry.timestamp)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {isScenarioEngine && (
                          <span className="rounded-full bg-cyan-500/20 border border-cyan-500/40 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                            ⚡ ACTIVE SCENARIO INTEL
                          </span>
                        )}
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${severity.badge}`}
                        >
                          {entry.severity || 'INFO'}
                        </span>
                      </div>
                    </div>

                    {/* Event text with dynamic Typewriter animation */}
                    <div className={`text-xs leading-relaxed ${isScenarioEngine ? 'text-cyan-100 font-medium text-[13px]' : 'text-slate-300'}`}>
                      <TypewriterText text={entry.event || ''} isScenario={isScenarioEngine} />
                    </div>

                    {/* Source badge */}
                    {entry.source && (
                      <div className="mt-2.5 flex items-center gap-1.5 border-t border-slate-700/40 pt-2">
                        <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">
                          Source:
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-medium ${
                            isScenarioEngine
                              ? 'bg-cyan-950/60 border border-cyan-800/50 text-cyan-300'
                              : 'bg-slate-700/60 text-slate-400'
                          }`}
                        >
                          {entry.source}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/** Empty state shown when no timeline data exists */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-800/80">
        <span className="text-lg text-slate-600">⏳</span>
      </div>
      <span className="text-xs text-slate-500">
        Awaiting incident data
        <span
          className="ml-0.5 inline-block animate-pulse text-cyan-400"
        >
          ▌
        </span>
      </span>
    </div>
  );
}
