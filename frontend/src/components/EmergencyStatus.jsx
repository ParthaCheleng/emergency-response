'use client';

import { useState, useEffect } from 'react';

const LEVEL_CONFIG = {
  UNKNOWN: {
    color: '#64748b',
    bg: 'bg-slate-800',
    border: 'border-slate-600',
    glow: 'none',
    animation: 'none',
    label: 'UNKNOWN',
  },
  ADVISORY: {
    color: '#3b82f6',
    bg: 'bg-blue-950/40',
    border: 'border-blue-800/50',
    glow: '0 0 20px rgba(59, 130, 246, 0.15)',
    animation: 'none',
    label: 'ADVISORY',
  },
  WATCH: {
    color: '#60a5fa',
    bg: 'bg-blue-950/50',
    border: 'border-blue-700/50',
    glow: '0 0 25px rgba(96, 165, 250, 0.2)',
    animation: 'none',
    label: 'WATCH',
  },
  WARNING: {
    color: '#f59e0b',
    bg: 'bg-amber-950/30',
    border: 'border-amber-700/50',
    glow: '0 0 30px rgba(245, 158, 11, 0.2)',
    animation: 'pulse-warning',
    label: 'WARNING',
  },
  CRITICAL: {
    color: '#ff2d55',
    bg: 'bg-red-950/40',
    border: 'border-red-700/60',
    glow: '0 0 40px rgba(255, 45, 85, 0.35), 0 0 80px rgba(255, 45, 85, 0.15)',
    animation: 'pulse-critical',
    label: 'CRITICAL',
  },
  CATASTROPHIC: {
    color: '#dc2626',
    bg: 'bg-red-950/60',
    border: 'border-red-600/70',
    glow: '0 0 50px rgba(220, 38, 38, 0.4), 0 0 100px rgba(220, 38, 38, 0.2)',
    animation: 'flash-catastrophic',
    label: '⚠ CATASTROPHIC ⚠',
  },
};

export default function EmergencyStatus({ status = 'IDLE', emergencyLevel = 'UNKNOWN' }) {
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    setLastUpdated(new Date());
  }, [status, emergencyLevel]);

  const formatTime = (date) => {
    if (!date) return '--:--:--';
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const levelConfig = LEVEL_CONFIG[emergencyLevel] || LEVEL_CONFIG.UNKNOWN;

  // --- IDLE STATE ---
  if (status === 'IDLE') {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900 p-6">
        <ScanLineOverlay />
        <StatusLabel />
        <div className="mt-4 flex items-center justify-center py-8">
          <span className="text-4xl font-bold tracking-widest text-slate-500">
            STANDBY
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-slate-600" />
          <span className="text-[10px] uppercase tracking-wider text-slate-600">
            System nominal — awaiting input
          </span>
        </div>
        <Timestamp time={formatTime(lastUpdated)} />
      </div>
    );
  }

  // --- PROCESSING STATE ---
  if (status === 'PROCESSING') {
    return (
      <div
        className="relative overflow-hidden rounded-2xl border border-amber-700/50 bg-slate-900 p-6"
        style={{
          boxShadow: '0 0 30px rgba(245, 158, 11, 0.15)',
          animation: 'pulse-processing 2s ease-in-out infinite',
        }}
      >
        <ScanLineOverlay />
        <StatusLabel />
        <div className="mt-4 flex flex-col items-center justify-center gap-3 py-6">
          {/* Animated spinner */}
          <div className="relative h-10 w-10">
            <div
              className="absolute inset-0 rounded-full border-2 border-amber-500/30"
            />
            <div
              className="absolute inset-0 rounded-full border-2 border-transparent border-t-amber-400"
              style={{ animation: 'spin 1s linear infinite' }}
            />
          </div>
          <span
            className="text-2xl font-bold tracking-widest text-amber-400"
            style={{ animation: 'text-flicker 3s ease-in-out infinite' }}
          >
            PROCESSING INTEL
          </span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="inline-block h-1 w-6 rounded-full bg-amber-500/60"
                style={{
                  animation: 'bar-pulse 1.5s ease-in-out infinite',
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
        </div>
        <Timestamp time={formatTime(lastUpdated)} />
      </div>
    );
  }

  // --- ERROR STATE ---
  if (status === 'ERROR') {
    return (
      <div
        className="relative overflow-hidden rounded-2xl border border-red-700/60 bg-slate-900 p-6"
        style={{ boxShadow: '0 0 30px rgba(239, 68, 68, 0.2)' }}
      >
        <ScanLineOverlay />
        <StatusLabel />
        <div className="mt-4 flex flex-col items-center justify-center gap-2 py-6">
          <span className="text-4xl">⚠</span>
          <span className="text-3xl font-bold tracking-widest text-red-500">
            SYSTEM ERROR
          </span>
          <span className="text-xs text-red-400/70">
            Analysis pipeline failure — check logs
          </span>
        </div>
        <Timestamp time={formatTime(lastUpdated)} />
      </div>
    );
  }

  // --- COMPLETE STATE — show emergency level ---
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${levelConfig.border} bg-slate-900 p-6`}
      style={{ boxShadow: levelConfig.glow }}
    >
      <ScanLineOverlay />
      <StatusLabel />

      <div
        className="mt-4 flex flex-col items-center justify-center gap-2 py-6"
        style={{
          animation:
            levelConfig.animation !== 'none'
              ? `${levelConfig.animation} ${emergencyLevel === 'CATASTROPHIC' ? '0.6s' : '2s'} ease-in-out infinite`
              : 'none',
        }}
      >
        {/* Level indicator bar */}
        <div className="mb-2 flex gap-1">
          {Object.keys(LEVEL_CONFIG)
            .filter((k) => k !== 'UNKNOWN')
            .map((lvl) => (
              <div
                key={lvl}
                className="h-1 w-8 rounded-full transition-all duration-500"
                style={{
                  backgroundColor:
                    Object.keys(LEVEL_CONFIG).indexOf(lvl) <=
                    Object.keys(LEVEL_CONFIG).indexOf(emergencyLevel)
                      ? levelConfig.color
                      : '#334155',
                  opacity:
                    Object.keys(LEVEL_CONFIG).indexOf(lvl) <=
                    Object.keys(LEVEL_CONFIG).indexOf(emergencyLevel)
                      ? 1
                      : 0.3,
                }}
              />
            ))}
        </div>

        <span className="text-xs font-medium uppercase tracking-widest text-slate-400">
          Emergency Level
        </span>
        <span
          className="text-5xl font-black tracking-wider"
          style={{ color: levelConfig.color }}
        >
          {levelConfig.label}
        </span>
      </div>

      <Timestamp time={formatTime(lastUpdated)} />


    </div>
  );
}

/** Small 'SYSTEM STATUS' label at the top of the card */
function StatusLabel() {
  return (
    <div className="flex items-center gap-2">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" style={{ animation: 'pulse-critical 2s ease-in-out infinite' }} />
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
        System Status
      </span>
    </div>
  );
}

/** Subtle scan-line animation overlay for tactical feel */
function ScanLineOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-10"
      style={{
        background:
          'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)',
      }}
    >
      <div
        className="absolute inset-x-0 h-[30%] bg-gradient-to-b from-transparent via-white/[0.03] to-transparent"
        style={{ animation: 'scanline 6s linear infinite' }}
      />
    </div>
  );
}

/** Small 'LAST UPDATED' timestamp at the bottom */
function Timestamp({ time }) {
  return (
    <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3">
      <span className="text-[10px] uppercase tracking-wider text-slate-600">
        Last Updated
      </span>
      <span className="font-mono text-[10px] text-slate-500" suppressHydrationWarning>{time}</span>
    </div>
  );
}
