'use client';

import EmergencyStatus from './EmergencyStatus';
import IncidentTimeline from './IncidentTimeline';

export default function IncidentIntel({ status, emergencyLevel, timeline, isProcessing }) {
  return (
    <section
      className="flex flex-col h-full overflow-y-auto
                 [&::-webkit-scrollbar]:w-1.5
                 [&::-webkit-scrollbar-track]:bg-transparent
                 [&::-webkit-scrollbar-thumb]:rounded-full
                 [&::-webkit-scrollbar-thumb]:bg-slate-700
                 [&::-webkit-scrollbar-thumb]:hover:bg-slate-600"
    >
      {/* ── Header ── */}
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-300">
        📡 INCIDENT INTELLIGENCE
      </h2>

      {/* ── Emergency Status ── */}
      <EmergencyStatus status={status} emergencyLevel={emergencyLevel} />

      {/* ── Decorative gradient divider ── */}
      <div className="my-4 flex items-center" aria-hidden="true">
        <div
          className="h-px w-full"
          style={{
            background:
              'linear-gradient(to right, #06b6d4, #22d3ee, transparent)',
          }}
        />
      </div>

      {/* ── Incident Timeline ── */}
      <IncidentTimeline timeline={timeline} isProcessing={isProcessing} />
    </section>
  );
}
