'use client';

import { useState, useEffect, useRef } from 'react';

const SEVERITY_CONFIG = {
  CRITICAL: {
    dot: 'bg-red-500',
    glow: 'shadow-[0_0_8px_rgba(239,68,68,0.6)]',
    badge: 'bg-red-500/20 text-red-400 border-red-500/30',
    line: 'bg-red-500/40',
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

export default function IncidentTimeline({ timeline = [] }) {
  const scrollRef = useRef(null);
  const [visibleCount, setVisibleCount] = useState(0);

  // Animate entries appearing
  useEffect(() => {
    if (timeline.length > visibleCount) {
      const timer = setTimeout(() => {
        setVisibleCount(timeline.length);
      }, 100);
      return () => clearTimeout(timer);
    }
    setVisibleCount(timeline.length);
  }, [timeline.length]);

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

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-700/50 bg-slate-900/80 p-4">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <span className="text-sm">📊</span>
        <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-300">
          Incident Timeline
        </h3>
        {timeline.length > 0 && (
          <span className="ml-auto rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400">
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
              const isNew = index < timeline.length - visibleCount + timeline.length;

              return (
                <div
                  key={`${entry.timestamp}-${index}`}
                  className="relative mb-4 last:mb-0"
                  style={{
                    animation: 'timeline-fade-in 0.4s ease-out both',
                    animationDelay: `${index * 0.08}s`,
                  }}
                >
                  {/* Dot on the timeline */}
                  <div
                    className={`absolute -left-6 top-1 h-[10px] w-[10px] rounded-full border-2 border-slate-900 ${severity.dot} ${severity.glow}`}
                  />

                  {/* Entry content */}
                  <div className="rounded-lg border border-slate-700/30 bg-slate-800/50 p-3 transition-all duration-200 hover:border-slate-600/50 hover:bg-slate-800/70">
                    {/* Top row: time + severity badge */}
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="font-mono text-[11px] text-slate-500" suppressHydrationWarning>
                        {formatTimestamp(entry.timestamp)}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${severity.badge}`}
                      >
                        {entry.severity || 'INFO'}
                      </span>
                    </div>

                    {/* Event text */}
                    <p className="text-xs leading-relaxed text-slate-300">
                      {entry.event}
                    </p>

                    {/* Source badge */}
                    {entry.source && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className="text-[9px] uppercase tracking-wider text-slate-600">
                          Source:
                        </span>
                        <span className="rounded bg-slate-700/60 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
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
          className="ml-0.5 inline-block"
          style={{ animation: 'blink-cursor 1s step-end infinite' }}
        >
          ▌
        </span>
      </span>
    </div>
  );
}
