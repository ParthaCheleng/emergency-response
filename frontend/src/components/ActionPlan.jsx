'use client';

import { useState, useEffect } from 'react';

// ── Priority colour mappings ──────────────────────────────────────────
const PRIORITY_STYLES = {
  IMMEDIATE: {
    gradient: 'from-red-600 to-amber-500',
    badge: 'bg-red-500/20 text-red-400 ring-red-500/30',
    glow: 'shadow-red-500/20',
  },
  HIGH: {
    gradient: 'from-amber-500 to-yellow-400',
    badge: 'bg-amber-500/20 text-amber-400 ring-amber-500/30',
    glow: 'shadow-amber-500/20',
  },
  SUSTAINED: {
    gradient: 'from-blue-500 to-cyan-400',
    badge: 'bg-blue-500/20 text-blue-400 ring-blue-500/30',
    glow: 'shadow-blue-500/20',
  },
};

const fallbackStyle = PRIORITY_STYLES.SUSTAINED;

// ── Placeholder (no data) ─────────────────────────────────────────────
function AwaitingPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="relative flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="inline-block h-2 w-2 rounded-full bg-cyan-400"
            style={{
              animation: 'pulse-dot 1.4s ease-in-out infinite',
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
      <p className="text-sm text-slate-500 tracking-wide">
        Awaiting AI agent analysis...
      </p>


    </div>
  );
}

// ── Single step card ──────────────────────────────────────────────────
function StepCard({ item, index }) {
  const [visible, setVisible] = useState(false);
  const pStyle = PRIORITY_STYLES[item.priority] || fallbackStyle;

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), index * 150);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div
      className={`
        relative flex gap-4 rounded-xl border border-slate-700/50
        bg-slate-800/60 p-4 backdrop-blur-md
        transition-all duration-500 ease-out
        ${visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
        hover:border-slate-600/70 hover:bg-slate-800/80
      `}
    >
      {/* ── Step number circle ── */}
      <div
        className={`
          flex h-10 w-10 shrink-0 items-center justify-center rounded-full
          bg-gradient-to-br ${pStyle.gradient}
          text-sm font-bold text-white shadow-lg ${pStyle.glow}
        `}
      >
        {item.step}
      </div>

      {/* ── Content ── */}
      <div className="flex flex-1 flex-col gap-2 min-w-0">
        {/* Priority badge */}
        <span
          className={`
            inline-flex w-fit items-center rounded-full px-2.5 py-0.5
            text-[10px] font-semibold uppercase tracking-wider ring-1
            ${pStyle.badge}
          `}
        >
          {item.priority}
        </span>

        {/* Directive */}
        <p className="text-sm leading-relaxed text-slate-200">
          {item.directive}
        </p>

        {/* Agents + ETA row */}
        <div className="flex flex-wrap items-center gap-2 mt-1">
          {/* Assigned agents */}
          {item.assigned_agents?.map((agent, aIdx) => (
            <span
              key={aIdx}
              className="inline-flex items-center gap-1 rounded-full
                         bg-slate-700/60 px-2.5 py-0.5 text-[11px]
                         text-slate-300 ring-1 ring-slate-600/50"
            >
              {agent}
            </span>
          ))}

          {/* ETA */}
          {item.eta && (
            <span
              className="ml-auto inline-flex items-center gap-1 rounded-full
                         bg-slate-700/40 px-2.5 py-0.5 text-[11px]
                         text-slate-400 ring-1 ring-slate-600/40"
            >
              ⏱ ETA: {item.eta}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────
export default function ActionPlan({ actionPlan }) {
  const totalSteps = 5;
  const completedSteps = actionPlan?.length ?? 0;
  const progressPercent = Math.min((completedSteps / totalSteps) * 100, 100);

  return (
    <section className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
          🎯 TACTICAL DIRECTIVES
        </h2>
      </div>

      {/* ── Progress bar ── */}
      <div className="relative h-1 w-full rounded-full bg-slate-700/50 mb-4 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r
                     from-cyan-500 to-emerald-400 transition-all duration-700 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
        {/* Animated shimmer */}
        {completedSteps > 0 && completedSteps < totalSteps && (
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r
                       from-transparent via-white/20 to-transparent"
            style={{
              width: `${progressPercent}%`,
              animation: 'shimmer 2s infinite',
            }}
          />
        )}
      </div>

      {/* ── Scrollable step list ── */}
      <div
        className="flex-1 overflow-y-auto pr-1 space-y-3
                   [&::-webkit-scrollbar]:w-1.5
                   [&::-webkit-scrollbar-track]:bg-transparent
                   [&::-webkit-scrollbar-thumb]:rounded-full
                   [&::-webkit-scrollbar-thumb]:bg-slate-700"
      >
        {!actionPlan || actionPlan.length === 0 ? (
          <AwaitingPlaceholder />
        ) : (
          actionPlan.map((item, idx) => (
            <StepCard key={item.step ?? idx} item={item} index={idx} />
          ))
        )}
      </div>


    </section>
  );
}
