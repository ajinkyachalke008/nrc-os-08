"use client";

import { useState } from "react";
import { GlassPanel } from "./GlassPanel";
import { 
  AlertTriangle, Droplets, Building2, Mountain, Flame,
  ChevronRight, Clock, MapPin, TrendingUp, Users, Activity,
  Eye, Link2, FileText, Zap, BarChart3, ArrowUpRight, Shield
} from "lucide-react";

type IncidentPhase = "detection" | "response" | "containment" | "recovery" | "closed";
type IncidentType = "flood" | "fire" | "collapse" | "landslide" | "chemical";

interface Signal {
  id: string;
  source: string;
  confidence: number;
  timestamp: string;
}

interface Decision {
  id: string;
  action: string;
  authority: string;
  timestamp: string;
  status: "pending" | "approved" | "executed";
}

interface Incident {
  id: string;
  title: string;
  type: IncidentType;
  severity: 1 | 2 | 3 | 4 | 5;
  phase: IncidentPhase;
  escalationVelocity: number;
  confidenceScore: number;
  primaryZone: string;
  secondaryZones: string[];
  linkedSOP: string;
  assignedAgencies: string[];
  resourceFootprint: number;
  activeDecisions: number;
  signals: Signal[];
  decisions: Decision[];
  startTime: string;
  lastUpdate: string;
  casualties: { injured: number; displaced: number; rescued: number };
  infrastructureImpact: string[];
}

const typeIcons: Record<IncidentType, typeof Droplets> = {
  flood: Droplets,
  fire: Flame,
  collapse: Building2,
  landslide: Mountain,
  chemical: AlertTriangle,
};

const typeColors: Record<IncidentType, string> = {
  flood: "#4DABF7",
  fire: "#FF922B",
  collapse: "#FCC419",
  landslide: "#51CF66",
  chemical: "#FA5252",
};

const phaseConfig: Record<IncidentPhase, { color: string; label: string }> = {
  detection: { color: "#4DABF7", label: "DETECTION" },
  response: { color: "#FF922B", label: "RESPONSE" },
  containment: { color: "#FCC419", label: "CONTAINMENT" },
  recovery: { color: "#51CF66", label: "RECOVERY" },
  closed: { color: "#6C757D", label: "CLOSED" },
};

const severityColors: Record<number, string> = {
  1: "#4DABF7",
  2: "#51CF66",
  3: "#FCC419",
  4: "#FF922B",
  5: "#FA5252",
};

const mockIncidents: Incident[] = [
  {
    id: "INC-2024-001",
    title: "Kolhapur Flash Flood Emergency",
    type: "flood",
    severity: 4,
    phase: "response",
    escalationVelocity: 2.3,
    confidenceScore: 92,
    primaryZone: "Kolhapur City - Zone H",
    secondaryZones: ["Zone G", "Zone I", "Industrial Area North"],
    linkedSOP: "SOP-FLOOD-L4",
    assignedAgencies: ["NDRF", "State Police", "Fire Dept", "Health Dept"],
    resourceFootprint: 156,
    activeDecisions: 3,
    signals: [
      { id: "SIG-001", source: "River Gauge Network", confidence: 96, timestamp: "09:15" },
      { id: "SIG-002", source: "IMD Weather Alert", confidence: 94, timestamp: "09:12" },
      { id: "SIG-003", source: "Field Report - Unit A3", confidence: 88, timestamp: "09:20" },
    ],
    decisions: [
      { id: "DEC-001", action: "Evacuate Zone H Residential", authority: "Cmdr. Sharma", timestamp: "09:22", status: "executed" },
      { id: "DEC-002", action: "Deploy Additional Rescue Boats", authority: "Pending", timestamp: "09:35", status: "pending" },
    ],
    startTime: "08:45 IST",
    lastUpdate: "2 min ago",
    casualties: { injured: 12, displaced: 450, rescued: 89 },
    infrastructureImpact: ["NH-4 Blocked", "Power Grid Sector 7 Offline", "Bridge 12 Submerged"],
  },
  {
    id: "INC-2024-002",
    title: "Pune Urban Flooding",
    type: "flood",
    severity: 3,
    phase: "response",
    escalationVelocity: 1.1,
    confidenceScore: 87,
    primaryZone: "Pune - Sinhagad Road",
    secondaryZones: ["Karve Nagar", "Kothrud"],
    linkedSOP: "SOP-FLOOD-L3",
    assignedAgencies: ["NDRF", "Fire Dept", "Municipal Corp"],
    resourceFootprint: 78,
    activeDecisions: 2,
    signals: [
      { id: "SIG-004", source: "Municipal Drainage Sensors", confidence: 91, timestamp: "08:30" },
      { id: "SIG-005", source: "Citizen Reports", confidence: 72, timestamp: "08:45" },
    ],
    decisions: [
      { id: "DEC-003", action: "Close Underpass Routes", authority: "Traffic Control", timestamp: "08:50", status: "executed" },
    ],
    startTime: "08:15 IST",
    lastUpdate: "5 min ago",
    casualties: { injured: 3, displaced: 120, rescued: 45 },
    infrastructureImpact: ["3 Underpasses Flooded", "Metro Line 2 Delayed"],
  },
  {
    id: "INC-2024-003",
    title: "Nashik Building Collapse",
    type: "collapse",
    severity: 4,
    phase: "containment",
    escalationVelocity: -0.5,
    confidenceScore: 95,
    primaryZone: "Nashik - Panchavati",
    secondaryZones: [],
    linkedSOP: "SOP-COLLAPSE-L4",
    assignedAgencies: ["NDRF", "Fire Dept", "Health Dept"],
    resourceFootprint: 92,
    activeDecisions: 1,
    signals: [
      { id: "SIG-006", source: "Emergency Call Center", confidence: 100, timestamp: "07:15" },
      { id: "SIG-007", source: "Structural Assessment", confidence: 94, timestamp: "07:45" },
    ],
    decisions: [
      { id: "DEC-004", action: "Heavy Equipment Deployment", authority: "Site Commander", timestamp: "07:50", status: "executed" },
    ],
    startTime: "07:10 IST",
    lastUpdate: "8 min ago",
    casualties: { injured: 8, displaced: 45, rescued: 23 },
    infrastructureImpact: ["Adjacent Buildings Evacuated"],
  },
  {
    id: "INC-2024-004",
    title: "Lonavala Landslide Risk",
    type: "landslide",
    severity: 3,
    phase: "detection",
    escalationVelocity: 0.8,
    confidenceScore: 76,
    primaryZone: "Lonavala - Hill Section 4",
    secondaryZones: ["Khandala Approach"],
    linkedSOP: "SOP-LANDSLIDE-L3",
    assignedAgencies: ["NDRF", "PWD", "Geological Survey"],
    resourceFootprint: 34,
    activeDecisions: 2,
    signals: [
      { id: "SIG-008", source: "Seismic Sensors", confidence: 89, timestamp: "06:00" },
      { id: "SIG-009", source: "Satellite Imagery", confidence: 72, timestamp: "08:00" },
    ],
    decisions: [
      { id: "DEC-005", action: "Road Closure Advisory", authority: "Pending", timestamp: "09:00", status: "pending" },
    ],
    startTime: "06:00 IST",
    lastUpdate: "12 min ago",
    casualties: { injured: 0, displaced: 0, rescued: 0 },
    infrastructureImpact: ["Mumbai-Pune Expressway Risk Zone"],
  },
  {
    id: "INC-2024-005",
    title: "Aurangabad Industrial Fire",
    type: "fire",
    severity: 2,
    phase: "containment",
    escalationVelocity: -1.2,
    confidenceScore: 98,
    primaryZone: "Aurangabad MIDC - Sector 5",
    secondaryZones: [],
    linkedSOP: "SOP-FIRE-L2",
    assignedAgencies: ["Fire Dept", "Industrial Safety"],
    resourceFootprint: 28,
    activeDecisions: 0,
    signals: [
      { id: "SIG-010", source: "Factory Fire Alarm", confidence: 100, timestamp: "05:30" },
    ],
    decisions: [],
    startTime: "05:25 IST",
    lastUpdate: "20 min ago",
    casualties: { injured: 2, displaced: 0, rescued: 15 },
    infrastructureImpact: ["Factory Unit 7 Damaged"],
  },
];

export function IncidentBriefing() {
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "graph">("list");
  const [severityFilter, setSeverityFilter] = useState<number | "all">("all");
  const [phaseFilter, setPhaseFilter] = useState<IncidentPhase | "all">("all");

  const selected = mockIncidents.find(i => i.id === selectedIncident);
  
  const filteredIncidents = mockIncidents.filter(inc => {
    if (severityFilter !== "all" && inc.severity !== severityFilter) return false;
    if (phaseFilter !== "all" && inc.phase !== phaseFilter) return false;
    return true;
  });

  const activeCount = mockIncidents.filter(i => i.phase !== "closed").length;
  const criticalCount = mockIncidents.filter(i => i.severity >= 4).length;

  return (
    <div className="grid grid-cols-12 gap-4 h-full">
      <div className="col-span-5">
        <GlassPanel
          title="Incident Command"
          icon={<AlertTriangle size={16} />}
          className="h-full"
          headerAction={
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-nrc-severity-l5/20 text-nrc-severity-l5 text-xs font-mono">
                {criticalCount} CRITICAL
              </span>
              <span className="px-2 py-0.5 rounded bg-nrc-aurora-cyan/20 text-nrc-aurora-cyan text-xs font-mono">
                {activeCount} ACTIVE
              </span>
            </div>
          }
        >
          <div className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center p-1 rounded-lg bg-white/5 flex-1">
                {([1, 2, 3, 4, 5, "all"] as const).map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setSeverityFilter(sev)}
                    className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                      severityFilter === sev
                        ? "bg-white/10 text-nrc-text-primary"
                        : "text-nrc-text-muted hover:text-nrc-text-secondary"
                    }`}
                  >
                    {sev === "all" ? "All" : `L${sev}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 max-h-[calc(100vh-340px)] overflow-y-auto pr-1">
              {filteredIncidents.map((incident) => {
                const Icon = typeIcons[incident.type];
                const isSelected = selectedIncident === incident.id;
                const isEscalating = incident.escalationVelocity > 0;

                return (
                  <div
                    key={incident.id}
                    onClick={() => setSelectedIncident(isSelected ? null : incident.id)}
                    className={`relative p-3 rounded-xl cursor-pointer transition-all duration-300 ${
                      isSelected
                        ? "bg-white/10 border border-white/20 shadow-lg"
                        : "bg-white/5 border border-transparent hover:bg-white/8 hover:border-white/10"
                    } ${incident.severity >= 4 ? "border-l-2" : ""}`}
                    style={{
                      borderLeftColor: incident.severity >= 4 ? severityColors[incident.severity] : undefined,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 relative"
                        style={{ backgroundColor: `${typeColors[incident.type]}20` }}
                      >
                        <Icon size={18} style={{ color: typeColors[incident.type] }} />
                        {isEscalating && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-nrc-severity-l5 flex items-center justify-center">
                            <TrendingUp size={8} className="text-white" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-nrc-text-primary truncate">
                            {incident.title}
                          </span>
                        </div>
                        <p className="text-xs text-nrc-text-muted mb-2 flex items-center gap-1">
                          <MapPin size={10} />
                          {incident.primaryZone}
                        </p>

                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold"
                            style={{
                              backgroundColor: `${severityColors[incident.severity]}20`,
                              color: severityColors[incident.severity],
                            }}
                          >
                            L{incident.severity}
                          </span>
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-medium"
                            style={{
                              backgroundColor: `${phaseConfig[incident.phase].color}20`,
                              color: phaseConfig[incident.phase].color,
                            }}
                          >
                            {phaseConfig[incident.phase].label}
                          </span>
                          {isEscalating && (
                            <span className="px-2 py-0.5 rounded bg-nrc-severity-l5/20 text-nrc-severity-l5 text-[10px] flex items-center gap-0.5">
                              <TrendingUp size={8} />
                              +{incident.escalationVelocity.toFixed(1)}
                            </span>
                          )}
                          <span className="text-[10px] text-nrc-text-muted ml-auto">
                            {incident.lastUpdate}
                          </span>
                        </div>
                      </div>

                      <ChevronRight
                        size={16}
                        className={`text-nrc-text-muted transition-transform ${isSelected ? "rotate-90" : ""}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </GlassPanel>
      </div>

      <div className="col-span-7">
        {selected ? (
          <GlassPanel
            title={selected.title}
            icon={(() => {
              const Icon = typeIcons[selected.type];
              return <Icon size={16} />;
            })()}
            className="h-full"
            headerAction={
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-nrc-text-muted">{selected.id}</span>
                <span
                  className="px-2 py-0.5 rounded text-xs font-bold"
                  style={{
                    backgroundColor: `${severityColors[selected.severity]}20`,
                    color: severityColors[selected.severity],
                  }}
                >
                  SEVERITY L{selected.severity}
                </span>
              </div>
            }
          >
            <div className="p-4 space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto">
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-xs text-nrc-text-muted mb-1">Confidence</p>
                  <p className="text-2xl font-bold text-nrc-aurora-cyan">{selected.confidenceScore}%</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-xs text-nrc-text-muted mb-1">Escalation</p>
                  <p className={`text-2xl font-bold ${selected.escalationVelocity > 0 ? "text-nrc-severity-l5" : "text-nrc-severity-l2"}`}>
                    {selected.escalationVelocity > 0 ? "+" : ""}{selected.escalationVelocity.toFixed(1)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-xs text-nrc-text-muted mb-1">Resources</p>
                  <p className="text-2xl font-bold text-nrc-text-primary">{selected.resourceFootprint}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-xs text-nrc-text-muted mb-1">Decisions</p>
                  <p className="text-2xl font-bold text-nrc-aurora-purple">{selected.activeDecisions}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-nrc-severity-l4/10 border border-nrc-severity-l4/20">
                  <p className="text-xs text-nrc-text-muted mb-1">Injured</p>
                  <p className="text-xl font-bold text-nrc-severity-l4">{selected.casualties.injured}</p>
                </div>
                <div className="p-3 rounded-xl bg-nrc-severity-l3/10 border border-nrc-severity-l3/20">
                  <p className="text-xs text-nrc-text-muted mb-1">Displaced</p>
                  <p className="text-xl font-bold text-nrc-severity-l3">{selected.casualties.displaced}</p>
                </div>
                <div className="p-3 rounded-xl bg-nrc-severity-l2/10 border border-nrc-severity-l2/20">
                  <p className="text-xs text-nrc-text-muted mb-1">Rescued</p>
                  <p className="text-xl font-bold text-nrc-severity-l2">{selected.casualties.rescued}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-medium text-nrc-text-secondary uppercase tracking-wide flex items-center gap-2">
                    <MapPin size={12} />
                    Spatial Impact
                  </h4>
                  <span
                    className="px-2 py-0.5 rounded text-[10px]"
                    style={{
                      backgroundColor: `${phaseConfig[selected.phase].color}20`,
                      color: phaseConfig[selected.phase].color,
                    }}
                  >
                    {phaseConfig[selected.phase].label}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: severityColors[selected.severity] }} />
                    <span className="text-sm text-nrc-text-primary font-medium">Primary: {selected.primaryZone}</span>
                  </div>
                  {selected.secondaryZones.length > 0 && (
                    <div className="flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-nrc-text-muted mt-1.5" />
                      <div>
                        <span className="text-xs text-nrc-text-muted">Secondary Zones:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selected.secondaryZones.map((zone, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-white/10 text-xs text-nrc-text-secondary">
                              {zone}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-medium text-nrc-text-secondary uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Activity size={12} />
                  Origin Signals ({selected.signals.length})
                </h4>
                <div className="space-y-2">
                  {selected.signals.map((signal) => (
                    <div key={signal.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                      <div className="flex-1">
                        <p className="text-sm text-nrc-text-primary">{signal.source}</p>
                        <p className="text-xs text-nrc-text-muted">{signal.timestamp}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-nrc-aurora-cyan"
                            style={{ width: `${signal.confidence}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-nrc-text-secondary">{signal.confidence}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selected.decisions.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-nrc-text-secondary uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Shield size={12} />
                    Active Decisions
                  </h4>
                  <div className="space-y-2">
                    {selected.decisions.map((decision) => (
                      <div
                        key={decision.id}
                        className={`flex items-center gap-3 p-3 rounded-lg ${
                          decision.status === "pending"
                            ? "bg-nrc-severity-l4/10 border border-nrc-severity-l4/20"
                            : "bg-white/5"
                        }`}
                      >
                        <div className="flex-1">
                          <p className="text-sm text-nrc-text-primary">{decision.action}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-nrc-text-muted">{decision.authority}</span>
                            <span className="text-xs text-nrc-text-muted">•</span>
                            <span className="text-xs text-nrc-text-muted">{decision.timestamp}</span>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            decision.status === "executed"
                              ? "bg-nrc-severity-l2/20 text-nrc-severity-l2"
                              : decision.status === "approved"
                              ? "bg-nrc-aurora-cyan/20 text-nrc-aurora-cyan"
                              : "bg-nrc-severity-l4/20 text-nrc-severity-l4"
                          }`}
                        >
                          {decision.status.toUpperCase()}
                        </span>
                        {decision.status === "pending" && (
                          <button className="px-3 py-1.5 rounded-lg bg-nrc-severity-l2 text-nrc-base text-xs font-medium hover:opacity-90">
                            Approve
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 rounded-xl bg-white/5">
                <h4 className="text-xs font-medium text-nrc-text-secondary uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Zap size={12} />
                  Infrastructure Impact
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selected.infrastructureImpact.map((impact, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded-lg bg-nrc-severity-l5/10 border border-nrc-severity-l5/20 text-xs text-nrc-severity-l5"
                    >
                      {impact}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-xs text-nrc-text-muted mb-2">Linked SOP</p>
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-nrc-aurora-purple" />
                    <span className="text-sm text-nrc-text-primary font-mono">{selected.linkedSOP}</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-xs text-nrc-text-muted mb-2">Assigned Agencies</p>
                  <div className="flex flex-wrap gap-1">
                    {selected.assignedAgencies.map((agency, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-nrc-aurora-cyan/20 text-xs text-nrc-aurora-cyan">
                        {agency}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button className="flex-1 px-4 py-2.5 rounded-lg bg-nrc-aurora-cyan text-nrc-base text-sm font-medium hover:opacity-90">
                  Open Command Center
                </button>
                <button className="flex-1 px-4 py-2.5 rounded-lg bg-white/10 text-nrc-text-primary text-sm font-medium hover:bg-white/20">
                  View on Map
                </button>
                <button className="px-4 py-2.5 rounded-lg bg-white/10 text-nrc-text-muted hover:bg-white/20">
                  <BarChart3 size={16} />
                </button>
              </div>
            </div>
          </GlassPanel>
        ) : (
          <GlassPanel className="h-full">
            <div className="h-full flex items-center justify-center">
              <div className="text-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-nrc-severity-l4/20 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={24} className="text-nrc-severity-l4" />
                </div>
                <h3 className="text-lg font-medium text-nrc-text-secondary mb-2">Select an Incident</h3>
                <p className="text-sm text-nrc-text-muted max-w-xs">
                  Click on any incident to view detailed status, signals, decisions, and operational context.
                </p>
              </div>
            </div>
          </GlassPanel>
        )}
      </div>
    </div>
  );
}
