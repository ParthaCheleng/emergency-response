'use client';

import AgentCard from './AgentCard';

const DEFAULT_AGENTS = [
  { agent: 'Incident Commander', emoji: '🧑‍✈️', status: 'IDLE', message: '', tools_used: [], last_action: null },
  { agent: 'Medical Coordinator', emoji: '🚑', status: 'IDLE', message: '', tools_used: [], last_action: null },
  { agent: 'Fire Chief', emoji: '🚒', status: 'IDLE', message: '', tools_used: [], last_action: null },
  { agent: 'Traffic Planner', emoji: '🚦', status: 'IDLE', message: '', tools_used: [], last_action: null },
  { agent: 'Tactical Weather Analyst', emoji: '🌦️', status: 'IDLE', message: '', tools_used: [], last_action: null },
  { agent: 'Strategic Logistics Officer', emoji: '📦', status: 'IDLE', message: '', tools_used: [], last_action: null },
  { agent: 'Public Information Officer', emoji: '📢', status: 'IDLE', message: '', tools_used: [], last_action: null },
  { agent: 'HAZMAT Specialist', emoji: '☢️', status: 'IDLE', message: '', tools_used: [], last_action: null },
];

export default function AgentNetwork({ agentChatter }) {
  // Use live agent data if available, otherwise show default placeholders
  const agents =
    agentChatter && agentChatter.length > 0 ? agentChatter : DEFAULT_AGENTS;

  // Pad to 8 cards if fewer agents are provided
  const displayAgents = [...agents];
  while (displayAgents.length < 8) {
    displayAgents.push(DEFAULT_AGENTS[displayAgents.length] || null);
  }

  const hasLiveData = agentChatter && agentChatter.length > 0;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <span className="text-sm">🛰️</span>
        <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-300">
          Live Agent Network
        </h2>

        {/* Network active indicator */}
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-[9px] uppercase tracking-wider text-slate-500">
            {hasLiveData ? 'NETWORK ACTIVE' : 'STANDBY'}
          </span>
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              hasLiveData ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]' : 'bg-slate-600'
            }`}
            style={
              hasLiveData
                ? { animation: 'network-pulse 2s ease-in-out infinite' }
                : {}
            }
          />
        </div>
      </div>

      {/* 2-column grid of agent cards */}
      <div className="grid flex-1 grid-cols-2 gap-3 content-start">
        {displayAgents.slice(0, 8).map((agent, index) => (
          <AgentCard key={agent?.agent || `placeholder-${index}`} agent={agent} />
        ))}
      </div>

      <style jsx>{`
        @keyframes network-pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.4;
            transform: scale(1.4);
          }
        }
      `}</style>
    </div>
  );
}
