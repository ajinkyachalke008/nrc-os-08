"use client";

import { useState } from "react";
import { GlassPanel } from "./GlassPanel";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Shield, Flame, Heart, Truck, Radio, Building,
  ChevronRight, Search, AlertTriangle, Clock, MapPin,
  Activity, Link, ArrowRight, Phone, Mail, BarChart3, Zap,
  RefreshCw, Network, Box, Share2, ShieldCheck, Info
} from "lucide-react";

type AgencyStatus = "active" | "standby" | "limited" | "offline";

interface Capability {
  name: string;
  available: number;
  total: number;
}

interface Dependency {
  agencyId: string;
  agencyName: string;
  type: "upstream" | "downstream" | "lateral";
  strength: "strong" | "moderate" | "weak";
  activeHandoffs: number;
}

interface PerformanceMetric {
  label: string;
  value: number;
  trend: "up" | "down" | "stable";
  benchmark: number;
}

interface Agency {
  id: string;
  name: string;
  shortName: string;
  type: "police" | "fire" | "health" | "rescue" | "admin" | "utility";
  jurisdiction: string;
  status: AgencyStatus;
  linkedUnits: number;
  activePersonnel: number;
  activeIncidents: string[];
  sopOwnership: string[];
  capabilities: Capability[];
  dependencies: Dependency[];
  performance: PerformanceMetric[];
  contactPrimary: string;
  contactSecondary: string;
  lastSync: string;
  bottlenecks?: string[];
}

const iconMap = {
  police: Shield,
  fire: Flame,
  health: Heart,
  rescue: Users,
  admin: Building,
  utility: Zap,
};

const statusConfig: Record<AgencyStatus, { color: string; label: string }> = {
  active: { color: "#51CF66", label: "ACTIVE" },
  standby: { color: "#4DABF7", label: "STANDBY" },
  limited: { color: "#FCC419", label: "LIMITED" },
  offline: { color: "#FA5252", label: "OFFLINE" },
};

const mockAgencies: Agency[] = [
  {
    id: "AG-001",
    name: "National Disaster Response Force",
    shortName: "NDRF",
    type: "rescue",
    jurisdiction: "National",
    status: "active",
    linkedUnits: 24,
    activePersonnel: 186,
    activeIncidents: ["INC-001", "INC-002", "INC-004"],
    sopOwnership: ["SOP-FLOOD-L4", "SOP-FLOOD-L5", "SOP-LANDSLIDE-L3"],
    capabilities: [
      { name: "Search & Rescue Teams", available: 16, total: 24 },
      { name: "Diving Units", available: 4, total: 6 },
      { name: "K9 Units", available: 3, total: 4 },
    ],
    dependencies: [
      { agencyId: "AG-002", agencyName: "State Police", type: "lateral", strength: "strong", activeHandoffs: 8 },
      { agencyId: "AG-003", agencyName: "Fire Department", type: "lateral", strength: "strong", activeHandoffs: 5 },
      { agencyId: "AG-004", agencyName: "Health Dept", type: "downstream", strength: "moderate", activeHandoffs: 12 },
    ],
    performance: [
      { label: "Response Time", value: 18, trend: "down", benchmark: 20 },
      { label: "Success Rate", value: 94, trend: "up", benchmark: 90 },
      { label: "Coordination Score", value: 87, trend: "stable", benchmark: 85 },
    ],
    contactPrimary: "Cmdr. R. Sharma",
    contactSecondary: "+91 22 2620 1234",
    lastSync: "30s ago",
  },
  {
    id: "AG-002",
    name: "Maharashtra State Police",
    shortName: "State Police",
    type: "police",
    jurisdiction: "State",
    status: "active",
    linkedUnits: 45,
    activePersonnel: 312,
    activeIncidents: ["INC-001", "INC-002", "INC-003"],
    sopOwnership: ["SOP-EVAC-L3", "SOP-TRAFFIC-L2"],
    capabilities: [
      { name: "Traffic Units", available: 28, total: 35 },
      { name: "Quick Response Teams", available: 12, total: 18 },
      { name: "Checkpoints", available: 15, total: 20 },
    ],
    dependencies: [
      { agencyId: "AG-001", agencyName: "NDRF", type: "lateral", strength: "strong", activeHandoffs: 8 },
      { agencyId: "AG-005", agencyName: "PWD", type: "upstream", strength: "moderate", activeHandoffs: 3 },
    ],
    performance: [
      { label: "Response Time", value: 12, trend: "stable", benchmark: 15 },
      { label: "Coverage", value: 91, trend: "up", benchmark: 88 },
      { label: "Coordination Score", value: 82, trend: "up", benchmark: 80 },
    ],
    contactPrimary: "DIG K. Patil",
    contactSecondary: "+91 22 2621 5678",
    lastSync: "15s ago",
    bottlenecks: ["Checkpoint 7 understaffed", "Radio channel 4 congested"],
  },
  {
    id: "AG-003",
    name: "Fire & Emergency Services",
    shortName: "Fire Dept",
    type: "fire",
    jurisdiction: "State",
    status: "active",
    linkedUnits: 28,
    activePersonnel: 156,
    activeIncidents: ["INC-001", "INC-002", "INC-005"],
    sopOwnership: ["SOP-FIRE-L2", "SOP-FIRE-L3", "SOP-HAZMAT-L2"],
    capabilities: [
      { name: "Fire Tenders", available: 14, total: 28 },
      { name: "Rescue Ladders", available: 6, total: 8 },
      { name: "Hazmat Units", available: 2, total: 3 },
    ],
    dependencies: [
      { agencyId: "AG-001", agencyName: "NDRF", type: "lateral", strength: "strong", activeHandoffs: 5 },
      { agencyId: "AG-004", agencyName: "Health Dept", type: "downstream", strength: "strong", activeHandoffs: 7 },
    ],
    performance: [
      { label: "Response Time", value: 8, trend: "down", benchmark: 10 },
      { label: "Containment Rate", value: 96, trend: "stable", benchmark: 95 },
      { label: "Coordination Score", value: 89, trend: "up", benchmark: 85 },
    ],
    contactPrimary: "Chief M. Deshmukh",
    contactSecondary: "+91 22 2622 9012",
    lastSync: "45s ago",
  },
  {
    id: "AG-004",
    name: "Public Health Department",
    shortName: "Health Dept",
    type: "health",
    jurisdiction: "State",
    status: "active",
    linkedUnits: 32,
    activePersonnel: 224,
    activeIncidents: ["INC-001", "INC-003", "INC-004"],
    sopOwnership: ["SOP-MEDICAL-L3", "SOP-TRIAGE-L2"],
    capabilities: [
      { name: "Ambulances", available: 18, total: 32 },
      { name: "Medical Teams", available: 22, total: 28 },
      { name: "Field Hospitals", available: 2, total: 3 },
    ],
    dependencies: [
      { agencyId: "AG-001", agencyName: "NDRF", type: "upstream", strength: "moderate", activeHandoffs: 12 },
      { agencyId: "AG-003", agencyName: "Fire Dept", type: "upstream", strength: "strong", activeHandoffs: 7 },
    ],
    performance: [
      { label: "Response Time", value: 10, trend: "stable", benchmark: 12 },
      { label: "Patient Throughput", value: 88, trend: "up", benchmark: 85 },
      { label: "Coordination Score", value: 84, trend: "stable", benchmark: 82 },
    ],
    contactPrimary: "Dr. S. Kulkarni",
    contactSecondary: "+91 22 2623 3456",
    lastSync: "1m ago",
  },
  {
    id: "AG-005",
    name: "Public Works Department",
    shortName: "PWD",
    type: "utility",
    jurisdiction: "State",
    status: "limited",
    linkedUnits: 15,
    activePersonnel: 67,
    activeIncidents: ["INC-002", "INC-004"],
    sopOwnership: ["SOP-INFRA-L2"],
    capabilities: [
      { name: "Road Crews", available: 8, total: 15 },
      { name: "Heavy Equipment", available: 4, total: 8 },
      { name: "Assessment Teams", available: 3, total: 5 },
    ],
    dependencies: [
      { agencyId: "AG-002", agencyName: "State Police", type: "downstream", strength: "moderate", activeHandoffs: 3 },
    ],
    performance: [
      { label: "Response Time", value: 35, trend: "down", benchmark: 30 },
      { label: "Clearance Rate", value: 72, trend: "up", benchmark: 75 },
      { label: "Coordination Score", value: 68, trend: "stable", benchmark: 70 },
    ],
    contactPrimary: "Eng. V. Joshi",
    contactSecondary: "+91 22 2624 7890",
    lastSync: "3m ago",
    bottlenecks: ["Equipment shortage in eastern sector", "Delayed material delivery"],
  },
];

export function AgencyCoordination() {
  const [selectedAgency, setSelectedAgency] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const selected = mockAgencies.find(a => a.id === selectedAgency);
  const activeAgencies = mockAgencies.filter(a => a.status === "active").length;

  const filteredAgencies = mockAgencies.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.shortName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="grid grid-cols-12 gap-4 h-full">
      <div className="col-span-4">
        <GlassPanel
          title="Agency Network"
          icon={<Users size={16} />}
          className="h-full"
          headerAction={
            <span className="text-xs font-mono text-nrc-aurora-cyan">
              {activeAgencies}/{mockAgencies.length} ACTIVE
            </span>
          }
        >
          <div className="p-3">
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-nrc-text-muted" />
              <input
                type="text"
                placeholder="Search agencies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-nrc-text-primary placeholder:text-nrc-text-muted focus:outline-none focus:border-nrc-aurora-cyan/50"
              />
            </div>

            <div className="space-y-2 max-h-[calc(100vh-340px)] overflow-y-auto pr-1">
              {filteredAgencies.map((agency) => {
                const Icon = iconMap[agency.type];
                const isSelected = selectedAgency === agency.id;
                const statusConf = statusConfig[agency.status];

                return (
                  <div
                    key={agency.id}
                    onClick={() => setSelectedAgency(isSelected ? null : agency.id)}
                    className={`relative p-3 rounded-xl cursor-pointer transition-all ${
                      isSelected ? 'bg-white/10 border border-white/20' : 'bg-white/5 border border-transparent hover:bg-white/8'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-nrc-aurora-cyan/20 flex items-center justify-center flex-shrink-0">
                        <Icon size={18} className="text-nrc-aurora-cyan" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-nrc-text-primary truncate">
                            {agency.shortName}
                          </span>
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                            style={{ backgroundColor: `${statusConf.color}20`, color: statusConf.color }}
                          >
                            {statusConf.label}
                          </span>
                        </div>
                        <p className="text-xs text-nrc-text-muted mb-2">{agency.jurisdiction}</p>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="flex items-center gap-1 text-nrc-text-secondary">
                            <Users size={10} />
                            {agency.activePersonnel}
                          </span>
                          <span className="flex items-center gap-1 text-nrc-text-muted">
                            <Link size={10} />
                            {agency.linkedUnits} units
                          </span>
                          <span className="flex items-center gap-1 text-nrc-text-muted">
                            <AlertTriangle size={10} />
                            {agency.activeIncidents.length}
                          </span>
                        </div>
                      </div>

                      <ChevronRight size={16} className={`text-nrc-text-muted transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                    </div>

                    {agency.bottlenecks && agency.bottlenecks.length > 0 && (
                      <div className="absolute top-2 right-8 w-2 h-2 rounded-full bg-nrc-severity-l4" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </GlassPanel>
      </div>

      <div className="col-span-8">
        {selected ? (
          <GlassPanel
            title={selected.name}
            icon={(() => { const Icon = iconMap[selected.type]; return <Icon size={16} />; })()}
            className="h-full"
            headerAction={
              <div className="flex items-center gap-2">
                <span className="text-xs text-nrc-text-muted font-mono">{selected.id}</span>
                <span
                  className="px-2 py-0.5 rounded text-xs font-bold"
                  style={{ 
                    backgroundColor: `${statusConfig[selected.status].color}20`, 
                    color: statusConfig[selected.status].color 
                  }}
                >
                  {statusConfig[selected.status].label}
                </span>
              </div>
            }
          >
            <div className="p-4 space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto">
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-xs text-nrc-text-muted mb-1">Active Personnel</p>
                  <p className="text-2xl font-bold text-nrc-aurora-cyan">{selected.activePersonnel}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-xs text-nrc-text-muted mb-1">Linked Units</p>
                  <p className="text-2xl font-bold text-nrc-text-primary">{selected.linkedUnits}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-xs text-nrc-text-muted mb-1">Active Incidents</p>
                  <p className="text-2xl font-bold text-nrc-severity-l4">{selected.activeIncidents.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-xs text-nrc-text-muted mb-1">Last Sync</p>
                  <p className="text-lg font-semibold text-nrc-severity-l2">{selected.lastSync}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-medium text-nrc-text-secondary uppercase tracking-wide mb-3">Capabilities</h4>
                  <div className="space-y-2">
                    {selected.capabilities.map((cap, index) => (
                      <div key={index} className="p-3 rounded-lg bg-white/5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-nrc-text-primary">{cap.name}</span>
                          <span className="text-sm font-mono text-nrc-aurora-cyan">
                            {cap.available}/{cap.total}
                          </span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(cap.available / cap.total) * 100}%`,
                              background: cap.available / cap.total < 0.3 ? "#FA5252" : 
                                         cap.available / cap.total < 0.5 ? "#FF922B" : 
                                         "linear-gradient(90deg, #2AFADF, #4C6EF5)",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-medium text-nrc-text-secondary uppercase tracking-wide mb-3">Performance</h4>
                  <div className="space-y-2">
                    {selected.performance.map((metric, index) => (
                      <div key={index} className="p-3 rounded-lg bg-white/5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-nrc-text-primary">{metric.label}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${
                              metric.value >= metric.benchmark ? 'text-nrc-severity-l2' : 'text-nrc-severity-l4'
                            }`}>
                              {metric.value}{metric.label.includes("Time") ? "m" : "%"}
                            </span>
                            <span className={`text-xs ${
                              metric.trend === "up" ? "text-nrc-severity-l2" :
                              metric.trend === "down" ? "text-nrc-severity-l5" :
                              "text-nrc-text-muted"
                            }`}>
                              {metric.trend === "up" ? "↑" : metric.trend === "down" ? "↓" : "—"}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-nrc-text-muted">Benchmark: {metric.benchmark}{metric.label.includes("Time") ? "m" : "%"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-medium text-nrc-text-secondary uppercase tracking-wide mb-3">Dependencies & Handoffs</h4>
                <div className="space-y-2">
                  {selected.dependencies.map((dep, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                      <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${
                        dep.type === "upstream" ? "bg-nrc-aurora-purple/20 text-nrc-aurora-purple" :
                        dep.type === "downstream" ? "bg-nrc-aurora-blue/20 text-nrc-aurora-blue" :
                        "bg-nrc-aurora-cyan/20 text-nrc-aurora-cyan"
                      }`}>
                        {dep.type === "upstream" ? "↑" : dep.type === "downstream" ? "↓" : "↔"}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-nrc-text-primary">{dep.agencyName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            dep.strength === "strong" ? "bg-nrc-severity-l2/20 text-nrc-severity-l2" :
                            dep.strength === "moderate" ? "bg-nrc-severity-l3/20 text-nrc-severity-l3" :
                            "bg-nrc-text-muted/20 text-nrc-text-muted"
                          }`}>
                            {dep.strength.toUpperCase()}
                          </span>
                          <span className="text-[10px] text-nrc-text-muted capitalize">{dep.type}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-nrc-aurora-cyan">{dep.activeHandoffs}</p>
                        <p className="text-xs text-nrc-text-muted">handoffs</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selected.bottlenecks && selected.bottlenecks.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-nrc-text-secondary uppercase tracking-wide mb-3">Active Bottlenecks</h4>
                  <div className="p-3 rounded-xl bg-nrc-severity-l4/10 border border-nrc-severity-l4/20 space-y-2">
                    {selected.bottlenecks.map((bottleneck, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <AlertTriangle size={14} className="text-nrc-severity-l4 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-nrc-text-secondary">{bottleneck}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-xs text-nrc-text-muted mb-2">Primary Contact</p>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-nrc-aurora-cyan" />
                    <span className="text-sm text-nrc-text-primary">{selected.contactPrimary}</span>
                  </div>
                  <p className="text-xs text-nrc-text-muted mt-1">{selected.contactSecondary}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-xs text-nrc-text-muted mb-2">SOP Ownership</p>
                  <div className="flex flex-wrap gap-1">
                    {selected.sopOwnership.map((sop, index) => (
                      <span key={index} className="px-2 py-0.5 rounded bg-white/10 text-xs font-mono text-nrc-text-secondary">
                        {sop}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button className="flex-1 px-4 py-2.5 rounded-lg bg-nrc-aurora-cyan text-nrc-base text-sm font-medium hover:opacity-90">
                  Open Channel
                </button>
                <button className="flex-1 px-4 py-2.5 rounded-lg bg-white/10 text-nrc-text-primary text-sm font-medium hover:bg-white/20">
                  View Resources
                </button>
                <button className="px-4 py-2.5 rounded-lg bg-white/10 text-nrc-text-muted text-sm font-medium hover:bg-white/20">
                  <BarChart3 size={16} />
                </button>
              </div>
            </div>
          </GlassPanel>
        ) : (
          <GlassPanel className="h-full">
            <div className="h-full flex items-center justify-center">
              <div className="text-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <Users size={24} className="text-nrc-text-muted" />
                </div>
                <h3 className="text-lg font-medium text-nrc-text-secondary mb-2">Select an Agency</h3>
                <p className="text-sm text-nrc-text-muted max-w-xs">
                  Click on any agency to view capabilities, dependencies, performance metrics, and coordination status.
                </p>
              </div>
            </div>
          </GlassPanel>
        )}
      </div>
    </div>
  );
}
