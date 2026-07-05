'use client';

// ── Phase event payloads ──────────────────────────────────────────────
const PHASE_1_TEXT = `SEISMIC ALERT — PHASE 1: INITIAL EARTHQUAKE STRIKE

USGS Seismic Monitoring Network has detected a 7.2 magnitude earthquake at coordinates 34.0522°N, 118.2437°W, centered in the Downtown Metro District. Depth: 11.4 km.

IMPACT ASSESSMENT:
• 4th Street Bridge showing critical stress fractures across 3 load-bearing pylons — structural engineers recommend immediate closure
• Hospital Alpha primary power grid connection SEVERED at substation Delta-7. Backup generators active but fuel reserves at 31% capacity (estimated 47 minutes remaining)
• Massive gas line rupture confirmed at Main Street & 4th Avenue intersection — SoCalGas SCADA telemetry shows 340 PSI pressure loss. Active vapor cloud extending 200 meters northeast. FLIR thermal imaging confirms ignition risk at current concentrations
• 14 high-rise structures in Sector A reporting partial pancake failures between floors 8-22
• Water main pressure dropping across Grid 7 — auxiliary reservoir feed switching initiated
• Estimated 52,000 civilians within primary impact radius requiring immediate emergency coordination`;

const PHASE_2_TEXT = `HYDROLOGICAL EMERGENCY — PHASE 2: UPSTREAM DAM STRUCTURAL FAILURE

Silver Lake Dam upstream monitoring array reporting CATASTROPHIC structural compromise. Dam integrity sensors show:
• Primary spillway gate mechanism failure — hydraulic pressure readings at 847 PSI (rated maximum: 600 PSI)
• Upstream reservoir water level at 98.7% capacity — 23.4 million cubic meters of water behind compromised structure
• 3 of 7 internal stress sensors have exceeded red-line thresholds in the past 18 minutes

DOWNSTREAM FLOOD PROJECTION:
• River gauge station Alpha-12 showing water levels rising at 0.8 meters per hour — current level: 4.2m (flood stage: 5.5m)
• Estimated time to full breach: 35-50 minutes under current loading
• Flood arrival to first populated zone (Riverside Heights, pop. 12,400): approximately 47 minutes post-breach
• Total downstream flood plain population at risk: 34,000 residents across 4 districts

WEATHER COMPLICATION:
• National Weather Service heavy precipitation band approaching from southwest — 45mm rainfall expected within 6 hours
• Soil saturation index at 89% — landslide risk ELEVATED on all destabilized hillsides
• Combined earthquake damage + flood + precipitation creates compound disaster scenario`;

const PHASE_3_TEXT = `INFRASTRUCTURE COLLAPSE — PHASE 3: CASCADING GRID FAILURE & COMMUNICATIONS BLACKOUT

Regional power grid experiencing full cascading failure sequence initiated by earthquake-damaged transmission lines:

POWER GRID STATUS:
• 14 of 22 regional substations now OFFLINE — transformer overload protection triggered at substations Echo-3, Foxtrot-7, and Golf-12
• Secondary transformer banks at substations Hotel-1 and India-4 showing thermal runaway conditions — automatic shutdown imminent
• Total service area blackout affecting 240,000 residential and 18,000 commercial customers
• Hospital Alpha backup generators: fuel consumption rate 340L/hour, remaining fuel: 2,100L — ESTIMATED 6.2 HOURS TO DEPLETION
• 4 additional medical facilities on emergency battery backup — estimated 2-4 hours remaining

TELECOMMUNICATIONS BLACKOUT:
• Complete cellular network failure across East Sector — 7 cell towers offline due to power loss
• Landline switching center at Central Hub reporting UPS battery drain at 12% per hour
• Emergency 911 dispatch routing to backup PSAP center — capacity reduced to 40% of normal call volume
• Public safety radio repeater network: 3 of 8 mountain-top repeaters offline — coverage gaps in sectors D, F, and G

EMERGENCY FUEL TRACKING:
• Strategic Petroleum Reserve local cache: 45,000L diesel available at March ARB (ETA 90 min by tanker convoy)
• Municipal emergency fuel depot: 12,000L remaining — current burn rate will exhaust supply in 8.5 hours
• Priority fuel allocation required: hospitals > water treatment > traffic signals > shelter HVAC`;

const HAZMAT_TEXT = `HAZARDOUS MATERIALS EMERGENCY — PHASE 4: CHEMICAL REFINERY RUPTURE & TOXIC PLUME

Industrial telemetry at Apex Chemical Refinery reporting major containment vessel breach in Sector 4:
• Storage Tank B-12 (Anhydrous Ammonia / Chlorine Gas synthesis buffer) suffered catastrophic overpressure rupture at 14:22 UTC
• Active toxic vapor plume extending 1.4 km southwest under current 14-knot wind conditions
• FLIR thermal imaging and automated atmospheric chemical sensors confirm life-threatening concentrations (IDLH exceeded) within 800-meter radius
• Interstate 80 corridor directly in projected plume path — 12,000 commuters currently gridlocked

EMERGENCY RESPONSE REQUIRED:
• Immediate evacuation shelter-in-place order for residential sectors 9 through 14
• HAZMAT entry teams require Level A encapsulated suits with SCBA
• Deploy water curtain spray arrays to knock down water-soluble ammonia vapors
• Establish emergency decontamination triage corridors at perimeter checkpoints`;

const HURRICANE_TEXT = `METEOROLOGICAL DISASTER — PHASE 5: CATEGORY 5 HURRICANE LANDFALL

National Hurricane Center confirms Hurricane 'Viper' making direct landfall across Metro coastal sector:
• Sustained eyewall winds recorded at 285 km/h (175 mph) with peak gusts exceeding 320 km/h
• Storm surge sensors at harbor seawall reporting 5.4-meter (18 ft) inundation — primary flood gates overtopped
• Widespread structural unroofing confirmed across coastal residential zones
• 3 major bridge spans closed due to extreme wind shear and structural vibration exceedance
• Over 450,000 residents without power as high-voltage transmission towers collapse

EMERGENCY RESPONSE REQUIRED:
• Coordinate swift-water rescue boat teams across flooded coastal basins
• Deploy heavy urban search and rescue (USAR) task forces to collapsed structures
• Route emergency medical medevac helicopters as soon as wind speeds drop below 45 knots
• Establish mass care shelter logistics for 65,000 displaced coastal evacuees`;

const CYBER_TEXT = `CRITICAL INFRASTRUCTURE ATTACK — PHASE 6: MUNICIPAL SCADA RANSOMWARE TAKEOVER

Cybersecurity Operations Center (CSOC) reports synchronized state-sponsored cyber offensive against municipal control systems:
• Water Treatment Plant Alpha SCADA controllers compromised — automated chemical dosing valves overridden, chlorine injection rates spiking to hazardous levels
• Municipal Power Grid automated dispatch servers locked by military-grade AES-256 ransomware payload
• Emergency 911 Computer-Aided Dispatch (CAD) database corrupted — dispatchers forced to manual paper routing
• Traffic management system reporting all downtown intersection signals locked in flashing red/all-green collision states

EMERGENCY RESPONSE REQUIRED:
• Execute immediate physical air-gap disconnection of all SCADA PLC networks
• Dispatch manual engineering override teams to water treatment dosing valves
• Reroute emergency communications to backup tactical analog RF repeater frequencies
• Deploy cyber forensic teams to isolate compromised Active Directory domain controllers`;

// ── Button configurations ─────────────────────────────────────────────
const BUTTONS = [
  {
    id: 'phase-1',
    icon: '🌍',
    label: '1. Seismic Strike',
    disaster_type: 'earthquake',
    gradient: 'from-red-600 to-orange-600',
    glowColor: 'shadow-red-600/30',
    hoverGlow: 'hover:shadow-red-500/50',
    payload: PHASE_1_TEXT,
  },
  {
    id: 'phase-2',
    icon: '🌊',
    label: '2. Dam Failure',
    disaster_type: 'flood',
    gradient: 'from-blue-600 to-cyan-600',
    glowColor: 'shadow-blue-600/30',
    hoverGlow: 'hover:shadow-blue-500/50',
    payload: PHASE_2_TEXT,
  },
  {
    id: 'phase-3',
    icon: '⚡',
    label: '3. Grid Blackout',
    disaster_type: 'grid',
    gradient: 'from-purple-600 to-pink-600',
    glowColor: 'shadow-purple-600/30',
    hoverGlow: 'hover:shadow-purple-500/50',
    payload: PHASE_3_TEXT,
  },
  {
    id: 'phase-4',
    icon: '☢️',
    label: '4. Chemical Leak',
    disaster_type: 'hazmat',
    gradient: 'from-amber-600 to-yellow-600',
    glowColor: 'shadow-amber-600/30',
    hoverGlow: 'hover:shadow-amber-500/50',
    payload: HAZMAT_TEXT,
  },
  {
    id: 'phase-5',
    icon: '🌀',
    label: '5. Cat 5 Hurricane',
    disaster_type: 'hurricane',
    gradient: 'from-teal-600 to-emerald-600',
    glowColor: 'shadow-teal-600/30',
    hoverGlow: 'hover:shadow-teal-500/50',
    payload: HURRICANE_TEXT,
  },
  {
    id: 'phase-6',
    icon: '💻',
    label: '6. SCADA Hack',
    disaster_type: 'cyber',
    gradient: 'from-indigo-600 to-violet-600',
    glowColor: 'shadow-indigo-600/30',
    hoverGlow: 'hover:shadow-indigo-500/50',
    payload: CYBER_TEXT,
  },
];

// ── Spinner SVG ───────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin text-white/80 shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────
export default function SimulationTray({ onInjectEvent, isProcessing }) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50
                 border-t border-slate-700/50
                 bg-slate-900/90 backdrop-blur-xl
                 px-4 py-3 md:px-6 md:py-3.5"
    >
      {/* Title row */}
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          ⚡ DYNAMIC SCENARIO CONTROL TRAY (48 STOCHASTIC SUB-SCENARIOS)
        </p>
        <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
          CLICK TO INJECT EVENT INTO SUPABASE REALTIME PIPELINE
        </span>
      </div>

      {/* Button grid (6 buttons) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 md:gap-3">
        {BUTTONS.map((btn) => (
          <button
            key={btn.id}
            disabled={isProcessing}
            onClick={() => onInjectEvent?.(btn.payload, btn.disaster_type)}
            className={`
              group relative flex items-center justify-center gap-2
              rounded-xl px-3 py-3 md:px-4 md:py-3
              bg-gradient-to-r ${btn.gradient}
              text-white font-semibold text-xs md:text-sm
              shadow-md ${btn.glowColor} ${btn.hoverGlow}
              transition-all duration-200 ease-out
              hover:scale-[1.03] active:scale-[0.97]
              disabled:opacity-40 disabled:pointer-events-none
              cursor-pointer border border-white/10
            `}
          >
            {isProcessing ? (
              <Spinner />
            ) : (
              <span className="text-base md:text-lg shrink-0">{btn.icon}</span>
            )}
            <span className="truncate tracking-tight">{btn.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
