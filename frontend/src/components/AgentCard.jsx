'use client';

import { useState } from 'react';

const STATUS_DOT = {
  ACTIVE: {
    color: 'bg-emerald-500',
    glow: 'shadow-[0_0_6px_rgba(16,185,129,0.6)]',
    pulse: true,
    label: 'ACTIVE',
  },
  PROCESSING: {
    color: 'bg-amber-500',
    glow: 'shadow-[0_0_6px_rgba(245,158,11,0.5)]',
    pulse: false,
    label: 'PROCESSING',
  },
  IDLE: {
    color: 'bg-slate-500',
    glow: '',
    pulse: false,
    label: 'IDLE',
  },
};

export default function AgentCard({ agent }) {
  const [expanded, setExpanded] = useState(false);

  // Handle empty/null agent — show dimmed placeholder
  if (!agent || !agent.agent) {
    return (
      <div className="rounded-xl border border-slate-700/30 bg-slate-800/40 p-3 opacity-50">
        <div className="flex items-center gap-2">
          <span className="text-sm">🔲</span>
          <span className="text-xs font-medium italic text-slate-500">
            Awaiting activation...
          </span>
        </div>
      </div>
    );
  }

  const statusConfig =
    STATUS_DOT[agent.status?.toUpperCase()] || STATUS_DOT.IDLE;
  const isIdle = !agent.status || agent.status.toUpperCase() === 'IDLE';

  const message = agent.message || '';
  const truncatedMessage =
    message.length > 120 ? message.slice(0, 120) + '...' : message;
  const showToggle = message.length > 120;

  const tools = agent.tools_used || [];

  return (
    <div
      className={`group relative rounded-xl border bg-slate-800/80 p-3 transition-all duration-300 ${
        isIdle
          ? 'border-slate-700/30 opacity-60 hover:opacity-80'
          : 'border-slate-700/50 hover:border-slate-500/60'
      }`}
      style={{
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Top row: emoji + name + status dot */}
      <div className="flex items-center gap-2">
        <span className="text-sm">{agent.emoji || '🤖'}</span>
        <span className="flex-1 truncate text-xs font-bold text-slate-200">
          {agent.agent}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] uppercase tracking-wider text-slate-500">
            {statusConfig.label}
          </span>
          <span
            className={`inline-block h-2 w-2 rounded-full ${statusConfig.color} ${statusConfig.glow}`}
            style={
              statusConfig.pulse
                ? { animation: 'agent-pulse 2s ease-in-out infinite' }
                : {}
            }
          />
        </div>
      </div>

      {/* Message */}
      {isIdle && !message ? (
        <p className="mt-2 text-[11px] italic text-slate-600">
          Awaiting activation...
        </p>
      ) : (
        <div className="mt-2">
          <p className="text-[11px] leading-relaxed text-slate-300">
            {expanded ? message : truncatedMessage}
          </p>
          {showToggle && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1 text-[10px] font-medium text-blue-400/80 transition-colors hover:text-blue-300"
            >
              {expanded ? '▲ Show less' : '▼ Show more'}
            </button>
          )}
        </div>
      )}

      {/* Tools row */}
      {tools.length > 0 && (
        <div className="mt-2.5">
          <span className="text-[9px] uppercase tracking-wider text-slate-600">
            Tools:
          </span>
          <div className="mt-1 flex flex-wrap gap-1">
            {tools.map((tool, i) => (
              <span
                key={`${tool}-${i}`}
                className="rounded-full bg-slate-700/70 px-2 py-0.5 text-[10px] text-slate-400"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Last action */}
      {agent.last_action && (
        <div className="mt-2.5 border-t border-slate-700/30 pt-2">
          <span className="text-[9px] uppercase tracking-wider text-slate-600">
            Last Action:
          </span>
          <p className="mt-0.5 text-[10px] leading-snug text-slate-500">
            {agent.last_action}
          </p>
        </div>
      )}

      {/* Hover accent bar */}
      <div className="absolute bottom-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-slate-600/0 to-transparent transition-all duration-300 group-hover:via-blue-500/30" />


    </div>
  );
}
