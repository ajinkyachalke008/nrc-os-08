"use client";

import { useState } from "react";
import { GlassPanel } from "./GlassPanel";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Truck, Flame, Plane, Users, AlertTriangle, Clock, MapPin,
  Battery, Activity, ChevronRight, Search, Filter, Plus,
  ArrowRight, Zap, RefreshCw, CheckCircle2, XCircle, Info,
  TrendingUp, BarChart3
} from "lucide-react";

type ResourceType = "human" | "vehicle" | "equipment" | "infrastructure";
type ResourceStatus = "available" | "deployed" | "returning" | "maintenance";

interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  category: string;
  icon: "ambulance" | "fire" | "drone" | "rescue" | "medical" | "police";
  total: number;
  deployed: number;
  available: number;
  maintenance: number;
  fatigueIndex: number;
  readinessScore: number;
  avgResponseTime: string;
  currentAssignments: Assignment[];
  conflicts: Conflict[];
}

interface Assignment {
  id: string;
  incidentId: string;
  incidentName: string;
  units: number;
  eta: string;
  etaConfidence: number;
}

interface Conflict {
  id: string;
  type: "overlap" | "fatigue" | "distance";
  description: string;
  severity: "low" | "medium" | "high";
}

const iconMap = {
  ambulance: Truck,
  fire: Flame,
  drone: Plane,
  rescue: Users,
  medical: Activity,
  police: Users,
};

const mockResources: Resource[] = [
  {
    id: "RES-001",
    name: "NDRF Teams",
    type: "human",
    category: "Search & Rescue",
    icon: "rescue",
    total: 24,
    deployed: 16,
    available: 6,
    maintenance: 2,
    fatigueIndex: 67,
    readinessScore: 82,
    avgResponseTime: "18 min",
    currentAssignments: [
      { id: "A1", incidentId: "INC-001", incidentName: "Kolhapur Flash Flood", units: 8, eta: "12 min", etaConfidence: 85 },
      { id: "A2", incidentId: "INC-002", incidentName: "Pune Urban Flooding", units: 6, eta: "Active", etaConfidence: 100 },
      { id: "A3", incidentId: "INC-004", incidentName: "Lonavala Landslide", units: 2, eta: "Active", etaConfidence: 100 },
    ],
    conflicts: [
      { id: "C1", type: "fatigue", description: "Team Alpha approaching 12hr shift limit", severity: "medium" },
    ],
  },
  {
    id: "RES-002",
    name: "Ambulance Fleet",
    type: "vehicle",
    category: "Medical Transport",
    icon: "ambulance",
    total: 32,
    deployed: 18,
    available: 12,
    maintenance: 2,
    fatigueIndex: 45,
    readinessScore: 91,
    avgResponseTime: "8 min",
    currentAssignments: [
      { id: "A4", incidentId: "INC-001", incidentName: "Kolhapur Flash Flood", units: 10, eta: "Active", etaConfidence: 100 },
      { id: "A5", incidentId: "INC-002", incidentName: "Pune Urban Flooding", units: 6, eta: "Active", etaConfidence: 100 },
      { id: "A6", incidentId: "INC-003", incidentName: "Nashik Collapse", units: 2, eta: "Active", etaConfidence: 100 },
    ],
    conflicts: [],
  },
  {
    id: "RES-003",
    name: "Fire Tender Units",
    type: "vehicle",
    category: "Fire Response",
    icon: "fire",
    total: 28,
    deployed: 14,
    available: 11,
    maintenance: 3,
    fatigueIndex: 52,
    readinessScore: 88,
    avgResponseTime: "12 min",
    currentAssignments: [
      { id: "A7", incidentId: "INC-005", incidentName: "Aurangabad Fire", units: 4, eta: "Active", etaConfidence: 100 },
      { id: "A8", incidentId: "INC-001", incidentName: "Kolhapur Flash Flood", units: 6, eta: "22 min", etaConfidence: 72 },
      { id: "A9", incidentId: "INC-002", incidentName: "Pune Urban Flooding", units: 4, eta: "Active", etaConfidence: 100 },
    ],
    conflicts: [
      { id: "C2", type: "distance", description: "Unit 7-B reassignment would exceed optimal range", severity: "low" },
    ],
  },
  {
    id: "RES-004",
    name: "Drone Reconnaissance",
    type: "equipment",
    category: "Aerial Survey",
    icon: "drone",
    total: 18,
    deployed: 12,
    available: 5,
    maintenance: 1,
    fatigueIndex: 0,
    readinessScore: 95,
    avgResponseTime: "5 min",
    currentAssignments: [
      { id: "A10", incidentId: "INC-001", incidentName: "Kolhapur Flash Flood", units: 4, eta: "Active", etaConfidence: 100 },
      { id: "A11", incidentId: "INC-002", incidentName: "Pune Urban Flooding", units: 3, eta: "Active", etaConfidence: 100 },
      { id: "A12", incidentId: "INC-004", incidentName: "Lonavala Landslide", units: 3, eta: "Active", etaConfidence: 100 },
      { id: "A13", incidentId: "INC-005", incidentName: "Aurangabad Fire", units: 2, eta: "Active", etaConfidence: 100 },
    ],
    conflicts: [],
  },
  {
    id: "RES-005",
    name: "Medical Teams",
    type: "human",
    category: "Emergency Medical",
    icon: "medical",
    total: 40,
    deployed: 22,
    available: 16,
    maintenance: 2,
    fatigueIndex: 58,
    readinessScore: 86,
    avgResponseTime: "10 min",
    currentAssignments: [
      { id: "A14", incidentId: "INC-001", incidentName: "Kolhapur Flash Flood", units: 12, eta: "Active", etaConfidence: 100 },
      { id: "A15", incidentId: "INC-003", incidentName: "Nashik Collapse", units: 6, eta: "Active", etaConfidence: 100 },
      { id: "A16", incidentId: "INC-004", incidentName: "Lonavala Landslide", units: 4, eta: "Active", etaConfidence: 100 },
    ],
    conflicts: [
      { id: "C3", type: "overlap", description: "Dr. Patil assigned to multiple incidents", severity: "high" },
    ],
  },
];

export function ResourcesDeployed() {
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const selected = mockResources.find(r => r.id === selectedResource);
  const totalConflicts = mockResources.reduce((sum, r) => sum + r.conflicts.length, 0);

  const getUtilization = (r: Resource) => Math.round((r.deployed / r.total) * 100);
  const getFatigueColor = (index: number) => {
    if (index >= 80) return "#FA5252";
    if (index >= 60) return "#FF922B";
    if (index >= 40) return "#FCC419";
    return "#51CF66";
  };

  return (
    <div className="grid grid-cols-12 gap-4 h-full">
      <div className="col-span-5">
        <GlassPanel
          title="Resource Pool"
          icon={<Truck size={16} />}
          className="h-full"
          headerAction={
            <div className="flex items-center gap-2">
              {totalConflicts > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-nrc-severity-l4/20 text-nrc-severity-l4 text-xs">
                  <AlertTriangle size={10} />
                  {totalConflicts} conflicts
                </span>
              )}
              <div className="w-1.5 h-1.5 rounded-full bg-nrc-severity-l2" />
              <span className="text-xs text-nrc-text-muted">LIVE</span>
            </div>
          }
        >
            <div className="p-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-nrc-text-muted" />
                  <input
                    type="text"
                    placeholder="Search resources..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-nrc-text-primary placeholder:text-nrc-text-muted focus:outline-none focus:border-nrc-aurora-cyan/50"
                  />
                </div>
                <button className="p-2 rounded-lg bg-white/5 border border-white/10 text-nrc-text-muted hover:text-nrc-text-primary">
                  <Filter size={14} />
                </button>
              </div>

              <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
                <AnimatePresence>
                  {mockResources.filter(r => 
                    r.name.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map((resource, index) => {
                    const Icon = iconMap[resource.icon];
                    const isSelected = selectedResource === resource.id;
                    const utilization = getUtilization(resource);
                    const hasConflicts = resource.conflicts.length > 0;

                    return (
                      <motion.div
                        key={resource.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, ease: [0.23, 1, 0.32, 1] }}
                        onClick={() => setSelectedResource(isSelected ? null : resource.id)}
                        className={`relative p-3 rounded-xl cursor-pointer transition-all duration-300 transform-gpu ${isSelected ? 'bg-white/10 border border-white/20 -translate-y-1 shadow-2xl z-10' : 'bg-white/5 border border-transparent hover:bg-white/8 hover:border-white/10'}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-nrc-aurora-cyan/20 flex items-center justify-center flex-shrink-0">
                            <Icon size={18} className="text-nrc-aurora-cyan" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-nrc-text-primary">{resource.name}</span>
                              {hasConflicts && (
                                <AlertTriangle size={12} className="text-nrc-severity-l4 animate-pulse" />
                              )}
                            </div>
                            <p className="text-xs text-nrc-text-muted mb-2">{resource.category}</p>

                            <div className="flex items-center gap-3 mb-2">
                              <div className="flex items-center gap-1">
                                <span className="text-lg font-bold text-nrc-aurora-cyan">{resource.deployed}</span>
                                <span className="text-xs text-nrc-text-muted">/ {resource.total}</span>
                              </div>
                              <span className="text-xs text-nrc-text-muted">deployed</span>
                            </div>

                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
                              <motion.div
                                className="h-full rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${utilization}%` }}
                                transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
                                style={{
                                  background: utilization > 85 ? "#FA5252" : utilization > 70 ? "#FF922B" : "linear-gradient(90deg, #2AFADF, #4C6EF5)",
                                }}
                              />
                            </div>

                            <div className="flex items-center gap-4 text-xs">
                              <div className="flex items-center gap-1">
                                <Battery size={10} className="text-nrc-text-muted" />
                                <span style={{ color: getFatigueColor(resource.fatigueIndex) }}>
                                  {resource.fatigueIndex}% fatigue
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock size={10} className="text-nrc-text-muted" />
                                <span className="text-nrc-text-secondary">{resource.avgResponseTime}</span>
                              </div>
                            </div>
                          </div>

                          <ChevronRight size={16} className={`text-nrc-text-muted transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
        </GlassPanel>
      </div>

      <div className="col-span-7">
        {selected ? (
          <GlassPanel
            title={selected.name}
            icon={<Activity size={16} />}
            className="h-full"
            headerAction={
              <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-nrc-aurora-cyan/20 text-nrc-aurora-cyan text-xs font-medium hover:bg-nrc-aurora-cyan/30">
                <Plus size={12} />
                Allocate
              </button>
            }
          >
            <div className="p-4 space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto">
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-xs text-nrc-text-muted mb-1">Total Units</p>
                  <p className="text-2xl font-bold text-nrc-text-primary">{selected.total}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-xs text-nrc-text-muted mb-1">Deployed</p>
                  <p className="text-2xl font-bold text-nrc-aurora-cyan">{selected.deployed}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-xs text-nrc-text-muted mb-1">Available</p>
                  <p className="text-2xl font-bold text-nrc-severity-l2">{selected.available}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5">
                  <p className="text-xs text-nrc-text-muted mb-1">Maintenance</p>
                  <p className="text-2xl font-bold text-nrc-text-muted">{selected.maintenance}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-nrc-text-secondary uppercase tracking-wide">Fatigue Index</p>
                    <span className="text-xs font-mono" style={{ color: getFatigueColor(selected.fatigueIndex) }}>
                      {selected.fatigueIndex}%
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${selected.fatigueIndex}%`,
                        backgroundColor: getFatigueColor(selected.fatigueIndex),
                      }}
                    />
                  </div>
                  <p className="text-xs text-nrc-text-muted mt-2">
                    {selected.fatigueIndex >= 70 ? "Consider rotation" : "Within normal range"}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-nrc-text-secondary uppercase tracking-wide">Readiness Score</p>
                    <span className="text-xs font-mono text-nrc-aurora-cyan">{selected.readinessScore}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-nrc-aurora-cyan transition-all duration-500"
                      style={{ width: `${selected.readinessScore}%` }}
                    />
                  </div>
                  <p className="text-xs text-nrc-text-muted mt-2">
                    Avg response: {selected.avgResponseTime}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-medium text-nrc-text-secondary uppercase tracking-wide mb-3">Current Assignments</h4>
                <div className="space-y-2">
                  {selected.currentAssignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                      <div className="flex-1">
                        <p className="text-sm text-nrc-text-primary">{assignment.incidentName}</p>
                        <p className="text-xs text-nrc-text-muted font-mono">{assignment.incidentId}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-nrc-aurora-cyan">{assignment.units} units</p>
                        <div className="flex items-center gap-1 text-xs text-nrc-text-muted">
                          <Clock size={10} />
                          <span>{assignment.eta}</span>
                          {assignment.eta !== "Active" && (
                            <span className="ml-1 text-nrc-text-muted">({assignment.etaConfidence}% conf)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selected.conflicts.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-nrc-text-secondary uppercase tracking-wide mb-3">Active Conflicts</h4>
                  <div className="space-y-2">
                    {selected.conflicts.map((conflict) => (
                      <div 
                        key={conflict.id} 
                        className={`flex items-start gap-3 p-3 rounded-lg ${
                          conflict.severity === "high" ? "bg-nrc-severity-l5/10 border border-nrc-severity-l5/20" :
                          conflict.severity === "medium" ? "bg-nrc-severity-l4/10 border border-nrc-severity-l4/20" :
                          "bg-nrc-severity-l3/10 border border-nrc-severity-l3/20"
                        }`}
                      >
                        <AlertTriangle 
                          size={16} 
                          className={
                            conflict.severity === "high" ? "text-nrc-severity-l5" :
                            conflict.severity === "medium" ? "text-nrc-severity-l4" :
                            "text-nrc-severity-l3"
                          }
                        />
                        <div className="flex-1">
                          <p className="text-sm text-nrc-text-primary">{conflict.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              conflict.severity === "high" ? "bg-nrc-severity-l5/20 text-nrc-severity-l5" :
                              conflict.severity === "medium" ? "bg-nrc-severity-l4/20 text-nrc-severity-l4" :
                              "bg-nrc-severity-l3/20 text-nrc-severity-l3"
                            }`}>
                              {conflict.severity.toUpperCase()}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-white/10 text-xs text-nrc-text-muted">
                              {conflict.type}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button className="p-1.5 rounded bg-nrc-severity-l2/20 text-nrc-severity-l2 hover:bg-nrc-severity-l2/30">
                            <CheckCircle2 size={14} />
                          </button>
                          <button className="p-1.5 rounded bg-white/10 text-nrc-text-muted hover:bg-white/20">
                            <XCircle size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button className="flex-1 px-4 py-2.5 rounded-lg bg-nrc-aurora-cyan text-nrc-base text-sm font-medium hover:opacity-90">
                  Reallocate Units
                </button>
                <button className="flex-1 px-4 py-2.5 rounded-lg bg-white/10 text-nrc-text-primary text-sm font-medium hover:bg-white/20">
                  View on Map
                </button>
                <button className="px-4 py-2.5 rounded-lg bg-white/10 text-nrc-text-muted text-sm font-medium hover:bg-white/20">
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>
          </GlassPanel>
        ) : (
          <GlassPanel className="h-full">
            <div className="h-full flex items-center justify-center">
              <div className="text-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <Truck size={24} className="text-nrc-text-muted" />
                </div>
                <h3 className="text-lg font-medium text-nrc-text-secondary mb-2">Select a Resource</h3>
                <p className="text-sm text-nrc-text-muted max-w-xs">
                  Click on any resource category to view deployment status, assignments, and manage allocation.
                </p>
              </div>
            </div>
          </GlassPanel>
        )}
      </div>
    </div>
  );
}
