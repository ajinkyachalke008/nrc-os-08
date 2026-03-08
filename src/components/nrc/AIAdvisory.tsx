"use client";

import { useState } from "react";
import { GlassPanel } from "./GlassPanel";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, TrendingUp, MapPin, Check, ArrowUpRight, X,
  AlertTriangle, Shield, Clock, ChevronRight, Info, 
  ThumbsUp, ThumbsDown, Eye, FileText, Zap, BarChart3,
  RefreshCw, Lock, Unlock, Database, History
} from "lucide-react";

type AdvisoryType = "predictive" | "comparative" | "preventive" | "anomaly";
type AdvisoryStatus = "pending" | "approved" | "dismissed" | "escalated";

interface DataSource {
  name: string;
  confidence: number;
  lastUpdate: string;
}

interface Advisory {
  id: string;
  type: AdvisoryType;
  title: string;
  description: string;
  confidence: number;
  riskProbability: number;
  dataSources: DataSource[];
  knownUnknowns: string[];
  alternativeRejectionReason?: string;
  actions: AdvisoryAction[];
  status: AdvisoryStatus;
  incidentId?: string;
  timestamp: string;
}

interface AdvisoryAction {
  id: string;
  label: string;
  impact: "high" | "medium" | "low";
  requiresApproval: boolean;
}

const typeConfig: Record<AdvisoryType, { label: string; color: string; icon: typeof Brain }> = {
  predictive: { label: "PREDICTIVE", color: "#9C36B5", icon: TrendingUp },
  comparative: { label: "COMPARATIVE", color: "#4C6EF5", icon: BarChart3 },
  preventive: { label: "PREVENTIVE", color: "#51CF66", icon: Shield },
  anomaly: { label: "ANOMALY", color: "#FA5252", icon: AlertTriangle },
};

const mockAdvisories: Advisory[] = [
  {
    id: "ADV-001",
    type: "predictive",
    title: "Escalation Risk: Kolhapur Flood Zone",
    description: "Based on current rainfall patterns and river gauge readings, flood waters in Kolhapur are projected to rise 2.3m within the next 6 hours. Recommend preemptive evacuation of Zone H residential areas.",
    confidence: 87,
    riskProbability: 78,
    dataSources: [
      { name: "IMD Weather Model", confidence: 92, lastUpdate: "2m ago" },
      { name: "River Gauge Network", confidence: 96, lastUpdate: "30s ago" },
      { name: "Historical Pattern Analysis", confidence: 78, lastUpdate: "5m ago" },
    ],
    knownUnknowns: [
      "Upstream dam release schedule not confirmed",
      "Soil saturation levels incomplete for western sectors",
    ],
    actions: [
      { id: "ACT-1", label: "Issue Evacuation Alert - Zone H", impact: "high", requiresApproval: true },
      { id: "ACT-2", label: "Pre-position rescue boats", impact: "medium", requiresApproval: false },
      { id: "ACT-3", label: "Alert medical facilities", impact: "medium", requiresApproval: false },
    ],
    status: "pending",
    incidentId: "INC-001",
    timestamp: "3 min ago",
  },
  {
    id: "ADV-002",
    type: "anomaly",
    title: "Unusual Seismic Activity Detected",
    description: "Micro-seismic activity detected in Lonavala region shows patterns inconsistent with typical geological baseline. Possible correlation with ongoing landslide conditions.",
    confidence: 64,
    riskProbability: 45,
    dataSources: [
      { name: "Seismic Sensor Array", confidence: 89, lastUpdate: "1m ago" },
      { name: "Geological Survey Data", confidence: 72, lastUpdate: "12h ago" },
    ],
    knownUnknowns: [
      "Limited sensor coverage in affected area",
      "No recent geological survey for comparison",
    ],
    alternativeRejectionReason: "Could be related to ongoing construction activity in adjacent zone",
    actions: [
      { id: "ACT-4", label: "Deploy additional sensors", impact: "low", requiresApproval: false },
      { id: "ACT-5", label: "Request geological assessment", impact: "medium", requiresApproval: true },
    ],
    status: "pending",
    incidentId: "INC-004",
    timestamp: "8 min ago",
  },
  {
    id: "ADV-003",
    type: "comparative",
    title: "Route Optimization: Nashik Response",
    description: "Analysis of traffic patterns and road conditions suggests Route B (via NH60) would reduce response time by 12 minutes compared to current Route A assignment.",
    confidence: 91,
    riskProbability: 15,
    dataSources: [
      { name: "Traffic Management System", confidence: 94, lastUpdate: "1m ago" },
      { name: "Road Condition Reports", confidence: 88, lastUpdate: "15m ago" },
      { name: "Weather Impact Model", confidence: 85, lastUpdate: "5m ago" },
    ],
    knownUnknowns: [],
    actions: [
      { id: "ACT-6", label: "Reroute Units 3, 7, 12 to Route B", impact: "medium", requiresApproval: true },
    ],
    status: "approved",
    incidentId: "INC-003",
    timestamp: "15 min ago",
  },
  {
    id: "ADV-004",
    type: "preventive",
    title: "Resource Fatigue Warning",
    description: "NDRF Team Alpha has been operating for 10.5 hours. Recommend rotation within next 90 minutes to maintain operational effectiveness and personnel safety.",
    confidence: 98,
    riskProbability: 32,
    dataSources: [
      { name: "Personnel Tracking System", confidence: 100, lastUpdate: "Real-time" },
      { name: "Fatigue Model Analysis", confidence: 94, lastUpdate: "5m ago" },
    ],
    knownUnknowns: [],
    actions: [
      { id: "ACT-7", label: "Initiate Team Alpha rotation", impact: "high", requiresApproval: true },
      { id: "ACT-8", label: "Alert replacement team", impact: "low", requiresApproval: false },
    ],
    status: "pending",
    timestamp: "5 min ago",
  },
];

export function AIAdvisory() {
  const [selectedAdvisory, setSelectedAdvisory] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<AdvisoryType | "all">("all");
  const [dismissReason, setDismissReason] = useState("");
  const [showDismissModal, setShowDismissModal] = useState(false);

  const filteredAdvisories = mockAdvisories.filter(adv => 
    filterType === "all" || adv.type === filterType
  );

  const selected = mockAdvisories.find(a => a.id === selectedAdvisory);
  const pendingCount = mockAdvisories.filter(a => a.status === "pending").length;

  const getConfidenceColor = (conf: number) => {
    if (conf >= 85) return "#51CF66";
    if (conf >= 70) return "#FCC419";
    if (conf >= 50) return "#FF922B";
    return "#FA5252";
  };

  return (
    <div className="grid grid-cols-12 gap-4 h-full">
      <div className="col-span-5">
        <GlassPanel
          title="AI Advisory Queue"
          icon={<Brain size={16} />}
          className="h-full"
          headerAction={
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-nrc-aurora-purple/20 text-nrc-aurora-purple border border-nrc-aurora-purple/30 text-xs">
                AI ADVISORY
              </span>
              {pendingCount > 0 && (
                <span className="px-2 py-0.5 rounded bg-nrc-severity-l4/20 text-nrc-severity-l4 text-xs font-mono">
                  {pendingCount} PENDING
                </span>
              )}
            </div>
          }
        >
          <div className="p-3">
            <div className="flex items-center gap-1 mb-3 p-1 rounded-lg bg-white/5">
              {(["all", "predictive", "anomaly", "preventive", "comparative"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                    filterType === type 
                      ? 'bg-white/10 text-nrc-text-primary' 
                      : 'text-nrc-text-muted hover:text-nrc-text-secondary'
                  }`}
                >
                  {type === "all" ? "All" : type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>

            <div className="space-y-2 max-h-[calc(100vh-340px)] overflow-y-auto pr-1">
              {filteredAdvisories.map((advisory) => {
                const config = typeConfig[advisory.type];
                const Icon = config.icon;
                const isSelected = selectedAdvisory === advisory.id;

                return (
                  <div
                    key={advisory.id}
                    onClick={() => setSelectedAdvisory(isSelected ? null : advisory.id)}
                    className={`relative p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? 'bg-white/10 border border-white/20' 
                        : 'bg-white/5 border border-transparent hover:bg-white/8'
                    } ${advisory.status === "pending" ? 'border-l-2' : ''}`}
                    style={{ 
                      borderLeftColor: advisory.status === "pending" ? config.color : undefined 
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${config.color}20` }}
                      >
                        <Icon size={18} style={{ color: config.color }} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-nrc-text-primary truncate">
                            {advisory.title}
                          </span>
                        </div>
                        
                        <p className="text-xs text-nrc-text-muted line-clamp-2 mb-2">
                          {advisory.description}
                        </p>

                        <div className="flex items-center gap-2">
                          <span 
                            className="px-2 py-0.5 rounded text-[10px] font-bold"
                            style={{ backgroundColor: `${config.color}20`, color: config.color }}
                          >
                            {config.label}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-nrc-text-muted">
                            <Clock size={10} />
                            {advisory.timestamp}
                          </span>
                          <span 
                            className="ml-auto text-[10px] font-mono"
                            style={{ color: getConfidenceColor(advisory.confidence) }}
                          >
                            {advisory.confidence}% conf
                          </span>
                        </div>
                      </div>

                      <ChevronRight size={16} className={`text-nrc-text-muted transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                    </div>

                    {advisory.status === "approved" && (
                      <div className="absolute top-2 right-2">
                        <Check size={14} className="text-nrc-severity-l2" />
                      </div>
                    )}
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
            title="Advisory Details"
            icon={<Eye size={16} />}
            className="h-full"
            headerAction={
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-nrc-text-muted">{selected.id}</span>
                {selected.incidentId && (
                  <span className="px-2 py-0.5 rounded bg-white/10 text-xs font-mono text-nrc-aurora-cyan">
                    {selected.incidentId}
                  </span>
                )}
              </div>
            }
          >
            <div className="p-4 space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto">
              <div className="p-4 rounded-xl bg-white/5">
                <h3 className="text-lg font-semibold text-nrc-text-primary mb-2">{selected.title}</h3>
                <p className="text-sm text-nrc-text-secondary leading-relaxed">{selected.description}</p>
              </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-white/5">
                    <p className="text-xs text-nrc-text-muted mb-1">Confidence Level</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold" style={{ color: getConfidenceColor(selected.confidence) }}>
                        {selected.confidence}%
                      </p>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-2">
                      <div 
                        className="h-full rounded-full transition-all duration-700"
                        style={{ 
                          width: `${selected.confidence}%`,
                          backgroundColor: getConfidenceColor(selected.confidence)
                        }}
                      />
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5">
                    <p className="text-xs text-nrc-text-muted mb-1">Spatial Risk</p>
                    <p className="text-2xl font-bold text-nrc-aurora-cyan">
                      {selected.type === "predictive" ? "High" : "Moderate"}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <Shield size={10} className="text-nrc-aurora-cyan" />
                      <span className="text-[10px] text-nrc-text-muted">OSM Verified</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5">
                    <p className="text-xs text-nrc-text-muted mb-1">Data Sources</p>
                    <p className="text-2xl font-bold text-nrc-aurora-cyan">{selected.dataSources.length + 1}</p>
                    <p className="text-xs text-nrc-text-muted mt-1">+ OSM Intelligence</p>
                  </div>
                </div>

                {selected.type === "predictive" && (
                  <div className="p-4 rounded-xl bg-nrc-aurora-cyan/5 border border-nrc-aurora-cyan/20">
                    <h4 className="text-xs font-bold text-nrc-aurora-cyan uppercase tracking-widest mb-3 flex items-center gap-2">
                      <MapPin size={14} />
                      Spatial Intelligence Context (OSM)
                    </h4>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="space-y-1">
                        <p className="text-[10px] text-nrc-text-muted uppercase">Isolation Risk</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-white/10 rounded-full">
                            <div className="h-full bg-nrc-severity-l4 rounded-full" style={{ width: '78%' }} />
                          </div>
                          <span className="text-xs font-mono text-nrc-severity-l4">78%</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-nrc-text-muted uppercase">Bridge Dependency</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-white/10 rounded-full">
                            <div className="h-full bg-nrc-severity-l5 rounded-full" style={{ width: '92%' }} />
                          </div>
                          <span className="text-xs font-mono text-nrc-severity-l5">92%</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-nrc-text-secondary italic">
                      "OSM road network analysis indicates a single primary access bridge for Zone H. Isolation risk is critical if water levels exceed 2.1m. Evacuation must be completed within 120 minutes."
                    </p>
                  </div>
                )}


              <div>
                <h4 className="text-xs font-medium text-nrc-text-secondary uppercase tracking-wide mb-3 flex items-center gap-2">
                  <FileText size={12} />
                  Data Sources & Confidence
                </h4>
                <div className="space-y-2">
                  {selected.dataSources.map((source, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                      <div className="flex-1">
                        <p className="text-sm text-nrc-text-primary">{source.name}</p>
                        <p className="text-xs text-nrc-text-muted">Updated: {source.lastUpdate}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div 
                            className="h-full rounded-full"
                            style={{ 
                              width: `${source.confidence}%`,
                              backgroundColor: getConfidenceColor(source.confidence)
                            }}
                          />
                        </div>
                        <span className="text-xs font-mono text-nrc-text-secondary w-10 text-right">
                          {source.confidence}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selected.knownUnknowns.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-nrc-text-secondary uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Info size={12} />
                    Known Unknowns
                  </h4>
                  <div className="p-3 rounded-xl bg-nrc-severity-l3/10 border border-nrc-severity-l3/20 space-y-2">
                    {selected.knownUnknowns.map((unknown, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <AlertTriangle size={12} className="text-nrc-severity-l3 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-nrc-text-secondary">{unknown}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selected.alternativeRejectionReason && (
                <div>
                  <h4 className="text-xs font-medium text-nrc-text-secondary uppercase tracking-wide mb-3">Alternative Explanation</h4>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm text-nrc-text-muted italic">{selected.alternativeRejectionReason}</p>
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-xs font-medium text-nrc-text-secondary uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Zap size={12} />
                  Recommended Actions
                </h4>
                <div className="space-y-2">
                  {selected.actions.map((action) => (
                    <div key={action.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                      <div className="flex-1">
                        <p className="text-sm text-nrc-text-primary">{action.label}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            action.impact === "high" ? "bg-nrc-severity-l5/20 text-nrc-severity-l5" :
                            action.impact === "medium" ? "bg-nrc-severity-l4/20 text-nrc-severity-l4" :
                            "bg-nrc-severity-l3/20 text-nrc-severity-l3"
                          }`}>
                            {action.impact.toUpperCase()} IMPACT
                          </span>
                          {action.requiresApproval && (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-nrc-aurora-purple/20 text-nrc-aurora-purple">
                              REQUIRES APPROVAL
                            </span>
                          )}
                        </div>
                      </div>
                      {action.requiresApproval ? (
                        <div className="flex gap-2">
                          <button className="px-3 py-1.5 rounded-lg bg-nrc-severity-l2 text-nrc-base text-xs font-medium hover:opacity-90">
                            Approve
                          </button>
                          <button className="px-3 py-1.5 rounded-lg bg-white/10 text-nrc-text-muted text-xs font-medium hover:bg-white/20">
                            Reject
                          </button>
                        </div>
                      ) : (
                        <button className="px-3 py-1.5 rounded-lg bg-nrc-aurora-cyan/20 text-nrc-aurora-cyan text-xs font-medium hover:bg-nrc-aurora-cyan/30">
                          Execute
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-nrc-aurora-purple/10 border border-nrc-aurora-purple/20">
                <div className="flex items-start gap-3">
                  <Shield size={20} className="text-nrc-aurora-purple flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-nrc-text-primary mb-1">Governance Notice</h4>
                    <p className="text-xs text-nrc-text-muted">
                      AI recommendations are advisory only. All actions require human authorization. 
                      Dismissals will be logged with reason for audit trail.
                    </p>
                  </div>
                </div>
              </div>

              {selected.status === "pending" && (
                <div className="flex gap-3 pt-2">
                  <button className="flex-1 px-4 py-2.5 rounded-lg bg-nrc-severity-l2 text-nrc-base text-sm font-medium hover:opacity-90 flex items-center justify-center gap-2">
                    <ThumbsUp size={16} />
                    Approve All Actions
                  </button>
                  <button 
                    onClick={() => setShowDismissModal(true)}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-white/10 text-nrc-text-primary text-sm font-medium hover:bg-white/20 flex items-center justify-center gap-2"
                  >
                    <ThumbsDown size={16} />
                    Dismiss with Reason
                  </button>
                </div>
              )}
            </div>
          </GlassPanel>
        ) : (
          <GlassPanel className="h-full">
            <div className="h-full flex items-center justify-center">
              <div className="text-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-nrc-aurora-purple/20 flex items-center justify-center mx-auto mb-4">
                  <Brain size={24} className="text-nrc-aurora-purple" />
                </div>
                <h3 className="text-lg font-medium text-nrc-text-secondary mb-2">Select an Advisory</h3>
                <p className="text-sm text-nrc-text-muted max-w-xs">
                  AI advisories provide predictive insights and recommendations. Select one to review details and take action.
                </p>
              </div>
            </div>
          </GlassPanel>
        )}
      </div>
    </div>
  );
}
