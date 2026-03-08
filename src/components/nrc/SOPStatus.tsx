"use client";

import { useState } from "react";
import { GlassPanel } from "./GlassPanel";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ClipboardList, Clock, CheckCircle2, Circle, AlertTriangle,
  ChevronRight, Play, Pause, RotateCcw, Users, FileText,
  Timer, ArrowRight, Shield, Zap, Box, Layers, History,
  RefreshCw, Lock, Unlock, ExternalLink
} from "lucide-react";

type StepStatus = "completed" | "active" | "pending" | "delayed" | "skipped";

interface SOPStep {
  id: string;
  number: number;
  title: string;
  description: string;
  status: StepStatus;
  timeConstraint: string;
  actualTime?: string;
  authorityLevel: "operator" | "supervisor" | "command";
  isMandatory: boolean;
  isCheckpoint: boolean;
  assignedTo?: string;
  deviation?: {
    type: "time" | "sequence" | "skip";
    reason: string;
    approvedBy?: string;
  };
}

interface SOP {
  id: string;
  name: string;
  incidentType: string;
  severity: number;
  triggerConditions: string[];
  currentStep: number;
  totalSteps: number;
  progress: number;
  eta: string;
  status: "active" | "paused" | "completed" | "deviated";
  steps: SOPStep[];
  startTime: string;
  incidentId: string;
}

const stepStatusConfig: Record<StepStatus, { color: string; icon: typeof Circle }> = {
  completed: { color: "#51CF66", icon: CheckCircle2 },
  active: { color: "#2AFADF", icon: Play },
  pending: { color: "#6C757D", icon: Circle },
  delayed: { color: "#FA5252", icon: AlertTriangle },
  skipped: { color: "#FCC419", icon: RotateCcw },
};

const mockSOP: SOP = {
  id: "SOP-FLOOD-L4",
  name: "Urban Flood Response Protocol - Level 4",
  incidentType: "Flood",
  severity: 4,
  triggerConditions: [
    "Water level > 1.5m in urban areas",
    "Rainfall > 100mm/hr sustained",
    "Multiple zones affected",
  ],
  currentStep: 4,
  totalSteps: 8,
  progress: 48,
  eta: "45 min",
  status: "active",
  startTime: "08:45 IST",
  incidentId: "INC-2024-002",
  steps: [
    {
      id: "S1",
      number: 1,
      title: "Alert Activation",
      description: "Activate emergency response team and notify all stakeholders",
      status: "completed",
      timeConstraint: "5 min",
      actualTime: "4 min",
      authorityLevel: "operator",
      isMandatory: true,
      isCheckpoint: false,
      assignedTo: "Ops Center",
    },
    {
      id: "S2",
      number: 2,
      title: "Initial Assessment",
      description: "Deploy reconnaissance and assess affected area scope",
      status: "completed",
      timeConstraint: "15 min",
      actualTime: "18 min",
      authorityLevel: "supervisor",
      isMandatory: true,
      isCheckpoint: true,
      assignedTo: "Field Team Alpha",
      deviation: {
        type: "time",
        reason: "Adverse weather conditions delayed drone deployment",
        approvedBy: "Supervisor Patil",
      },
    },
    {
      id: "S3",
      number: 3,
      title: "Resource Mobilization",
      description: "Deploy rescue teams, boats, and medical units to staging area",
      status: "completed",
      timeConstraint: "20 min",
      actualTime: "19 min",
      authorityLevel: "command",
      isMandatory: true,
      isCheckpoint: true,
      assignedTo: "NDRF Coordinator",
    },
    {
      id: "S4",
      number: 4,
      title: "Evacuation Initiation",
      description: "Begin systematic evacuation of high-risk zones",
      status: "active",
      timeConstraint: "60 min",
      authorityLevel: "command",
      isMandatory: true,
      isCheckpoint: true,
      assignedTo: "Police + NDRF Joint Team",
    },
    {
      id: "S5",
      number: 5,
      title: "Shelter Activation",
      description: "Open and staff emergency shelters, prepare for evacuees",
      status: "pending",
      timeConstraint: "30 min",
      authorityLevel: "supervisor",
      isMandatory: true,
      isCheckpoint: false,
      assignedTo: "Municipal Corp",
    },
    {
      id: "S6",
      number: 6,
      title: "Medical Triage Setup",
      description: "Establish field medical stations and triage protocols",
      status: "pending",
      timeConstraint: "25 min",
      authorityLevel: "supervisor",
      isMandatory: true,
      isCheckpoint: true,
      assignedTo: "Medical Team",
    },
    {
      id: "S7",
      number: 7,
      title: "Infrastructure Isolation",
      description: "Coordinate utility shutoffs and secure critical infrastructure",
      status: "pending",
      timeConstraint: "45 min",
      authorityLevel: "command",
      isMandatory: false,
      isCheckpoint: false,
      assignedTo: "PWD + Utilities",
    },
    {
      id: "S8",
      number: 8,
      title: "Status Consolidation",
      description: "Complete situation report and prepare for sustained operations",
      status: "pending",
      timeConstraint: "15 min",
      authorityLevel: "command",
      isMandatory: true,
      isCheckpoint: true,
      assignedTo: "Ops Center",
    },
  ],
};

export function SOPStatus() {
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const activeStep = mockSOP.steps.find(s => s.status === "active");
  const completedSteps = mockSOP.steps.filter(s => s.status === "completed").length;
  const deviations = mockSOP.steps.filter(s => s.deviation).length;

  return (
    <div className="grid grid-cols-12 gap-4 h-full">
      <div className="col-span-5">
        <GlassPanel
          title="Active SOP"
          icon={<ClipboardList size={16} />}
          className="h-full"
          headerAction={
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-mono ${
                mockSOP.status === "active" ? "bg-nrc-aurora-cyan/20 text-nrc-aurora-cyan" :
                mockSOP.status === "paused" ? "bg-nrc-severity-l3/20 text-nrc-severity-l3" :
                "bg-nrc-severity-l2/20 text-nrc-severity-l2"
              }`}>
                {mockSOP.status.toUpperCase()}
              </span>
            </div>
          }
        >
          <div className="p-3 space-y-4">
            <div className="p-3 rounded-xl bg-white/5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-sm font-semibold text-nrc-text-primary">{mockSOP.name}</h3>
                  <p className="text-xs text-nrc-text-muted font-mono">{mockSOP.id}</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-nrc-severity-l4/20 text-nrc-severity-l4 text-xs font-bold">
                  L{mockSOP.severity}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-nrc-text-muted">
                <span className="flex items-center gap-1">
                  <Clock size={10} />
                  Started: {mockSOP.startTime}
                </span>
                <span className="flex items-center gap-1">
                  <FileText size={10} />
                  {mockSOP.incidentId}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-lg bg-white/5 text-center">
                <p className="text-lg font-bold text-nrc-aurora-cyan">{completedSteps}/{mockSOP.totalSteps}</p>
                <p className="text-xs text-nrc-text-muted">Steps</p>
              </div>
              <div className="p-2 rounded-lg bg-white/5 text-center">
                <p className="text-lg font-bold text-nrc-text-primary">{mockSOP.progress}%</p>
                <p className="text-xs text-nrc-text-muted">Progress</p>
              </div>
              <div className="p-2 rounded-lg bg-white/5 text-center">
                <p className="text-lg font-bold text-nrc-severity-l3">{mockSOP.eta}</p>
                <p className="text-xs text-nrc-text-muted">ETA</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-nrc-text-muted">Overall Progress</span>
                <span className="text-nrc-text-secondary font-mono">{mockSOP.progress}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${mockSOP.progress}%`,
                    background: "linear-gradient(90deg, #2AFADF, #4C6EF5)",
                  }}
                />
              </div>
            </div>

            <div className="space-y-1 max-h-[calc(100vh-520px)] overflow-y-auto pr-1">
              {mockSOP.steps.map((step) => {
                const config = stepStatusConfig[step.status];
                const Icon = config.icon;
                const isSelected = selectedStep === step.id;

                return (
                  <div
                    key={step.id}
                    onClick={() => setSelectedStep(isSelected ? null : step.id)}
                    className={`relative flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                      isSelected ? 'bg-white/10' : 'hover:bg-white/5'
                    } ${step.status === "active" ? 'border border-nrc-aurora-cyan/30' : ''}`}
                  >
                    <div className="flex items-center gap-2 w-8">
                      <Icon size={16} style={{ color: config.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${step.status === "active" ? 'text-nrc-text-primary font-medium' : 'text-nrc-text-secondary'}`}>
                        {step.number}. {step.title}
                      </p>
                    </div>
                    {step.isCheckpoint && (
                      <Shield size={12} className="text-nrc-aurora-purple" />
                    )}
                    {step.deviation && (
                      <AlertTriangle size={12} className="text-nrc-severity-l4" />
                    )}
                    <ChevronRight size={14} className={`text-nrc-text-muted transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                  </div>
                );
              })}
            </div>

            {deviations > 0 && (
              <div className="p-3 rounded-lg bg-nrc-severity-l4/10 border border-nrc-severity-l4/20">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className="text-nrc-severity-l4" />
                  <span className="text-xs text-nrc-severity-l4 font-medium">
                    {deviations} deviation(s) logged
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button 
                onClick={() => setIsPaused(!isPaused)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${
                  isPaused 
                    ? 'bg-nrc-aurora-cyan text-nrc-base' 
                    : 'bg-nrc-severity-l3/20 text-nrc-severity-l3'
                }`}
              >
                {isPaused ? <Play size={14} /> : <Pause size={14} />}
                {isPaused ? "Resume" : "Pause"}
              </button>
              <button className="px-3 py-2 rounded-lg bg-white/10 text-nrc-text-muted text-sm font-medium hover:bg-white/20">
                <RotateCcw size={14} />
              </button>
            </div>
          </div>
        </GlassPanel>
      </div>

      <div className="col-span-7">
        {selectedStep ? (
          (() => {
            const step = mockSOP.steps.find(s => s.id === selectedStep);
            if (!step) return null;
            const config = stepStatusConfig[step.status];

            return (
              <GlassPanel
                title={`Step ${step.number}: ${step.title}`}
                icon={<FileText size={16} />}
                className="h-full"
                headerAction={
                  <span 
                    className="px-2 py-0.5 rounded text-xs font-bold"
                    style={{ backgroundColor: `${config.color}20`, color: config.color }}
                  >
                    {step.status.toUpperCase()}
                  </span>
                }
              >
                <div className="p-4 space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto">
                  <div className="p-4 rounded-xl bg-white/5">
                    <p className="text-sm text-nrc-text-secondary leading-relaxed">{step.description}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-white/5">
                      <p className="text-xs text-nrc-text-muted mb-1">Time Constraint</p>
                      <div className="flex items-center gap-2">
                        <Timer size={16} className="text-nrc-text-muted" />
                        <p className="text-lg font-bold text-nrc-text-primary">{step.timeConstraint}</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5">
                      <p className="text-xs text-nrc-text-muted mb-1">Actual Time</p>
                      <p className={`text-lg font-bold ${
                        step.actualTime && parseInt(step.actualTime) > parseInt(step.timeConstraint) 
                          ? 'text-nrc-severity-l4' 
                          : 'text-nrc-severity-l2'
                      }`}>
                        {step.actualTime || "—"}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5">
                      <p className="text-xs text-nrc-text-muted mb-1">Authority Level</p>
                      <p className={`text-lg font-bold capitalize ${
                        step.authorityLevel === "command" ? 'text-nrc-aurora-purple' :
                        step.authorityLevel === "supervisor" ? 'text-nrc-aurora-blue' :
                        'text-nrc-text-primary'
                      }`}>
                        {step.authorityLevel}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-white/5">
                      <p className="text-xs text-nrc-text-muted mb-2">Assigned To</p>
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-nrc-aurora-cyan" />
                        <span className="text-sm text-nrc-text-primary">{step.assignedTo || "Unassigned"}</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5">
                      <p className="text-xs text-nrc-text-muted mb-2">Spatial Awareness</p>
                      <div className="flex items-center gap-2">
                        <Shield size={14} className="text-nrc-aurora-cyan" />
                        <span className="text-[10px] font-bold text-nrc-aurora-cyan uppercase">OSM Route Verified</span>
                      </div>
                    </div>
                  </div>

                  {step.deviation && (
                    <div className="p-4 rounded-xl bg-nrc-severity-l4/10 border border-nrc-severity-l4/20">
                      <div className="flex items-start gap-3">
                        <AlertTriangle size={18} className="text-nrc-severity-l4 flex-shrink-0" />
                        <div>
                          <h4 className="text-sm font-medium text-nrc-text-primary mb-1">
                            Deviation Logged: {step.deviation.type.charAt(0).toUpperCase() + step.deviation.type.slice(1)}
                          </h4>
                          <p className="text-sm text-nrc-text-secondary mb-2">{step.deviation.reason}</p>
                          {step.deviation.approvedBy && (
                            <p className="text-xs text-nrc-text-muted">
                              Approved by: <span className="text-nrc-aurora-cyan">{step.deviation.approvedBy}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {step.status === "active" && (
                    <div className="flex gap-3">
                      <button className="flex-1 px-4 py-2.5 rounded-lg bg-nrc-severity-l2 text-nrc-base text-sm font-medium hover:opacity-90 flex items-center justify-center gap-2">
                        <CheckCircle2 size={16} />
                        Mark Complete
                      </button>
                      <button className="flex-1 px-4 py-2.5 rounded-lg bg-nrc-severity-l4/20 text-nrc-severity-l4 text-sm font-medium hover:bg-nrc-severity-l4/30 flex items-center justify-center gap-2">
                        <AlertTriangle size={16} />
                        Log Deviation
                      </button>
                    </div>
                  )}

                  {step.status === "pending" && (
                    <div className="flex gap-3">
                      <button className="flex-1 px-4 py-2.5 rounded-lg bg-nrc-aurora-cyan text-nrc-base text-sm font-medium hover:opacity-90 flex items-center justify-center gap-2">
                        <Zap size={16} />
                        Start Step
                      </button>
                      <button className="px-4 py-2.5 rounded-lg bg-white/10 text-nrc-text-muted text-sm font-medium hover:bg-white/20">
                        Skip
                      </button>
                    </div>
                  )}
                </div>
              </GlassPanel>
            );
          })()
        ) : activeStep ? (
          <GlassPanel
            title="Current Step"
            icon={<Play size={16} />}
            className="h-full"
          >
            <div className="p-4 space-y-4">
              <div className="p-6 rounded-xl bg-nrc-aurora-cyan/10 border border-nrc-aurora-cyan/20">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs text-nrc-aurora-cyan font-mono mb-1">STEP {activeStep.number} OF {mockSOP.totalSteps}</p>
                    <h3 className="text-xl font-semibold text-nrc-text-primary">{activeStep.title}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-nrc-text-muted">Time Constraint</p>
                    <p className="text-lg font-bold text-nrc-aurora-cyan">{activeStep.timeConstraint}</p>
                  </div>
                </div>
                <p className="text-sm text-nrc-text-secondary mb-4">{activeStep.description}</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-nrc-text-muted" />
                    <span className="text-sm text-nrc-text-secondary">{activeStep.assignedTo}</span>
                  </div>
                  {activeStep.isCheckpoint && (
                    <span className="px-2 py-0.5 rounded bg-nrc-aurora-purple/20 text-nrc-aurora-purple text-xs">
                      AUTHORITY CHECKPOINT
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-medium text-nrc-text-secondary uppercase tracking-wide mb-3">Trigger Conditions</h4>
                <div className="space-y-2">
                  {mockSOP.triggerConditions.map((condition, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                      <CheckCircle2 size={14} className="text-nrc-severity-l2" />
                      <span className="text-sm text-nrc-text-secondary">{condition}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 px-4 py-2.5 rounded-lg bg-nrc-severity-l2 text-nrc-base text-sm font-medium hover:opacity-90 flex items-center justify-center gap-2">
                  <CheckCircle2 size={16} />
                  Complete & Advance
                </button>
                <button className="flex-1 px-4 py-2.5 rounded-lg bg-white/10 text-nrc-text-primary text-sm font-medium hover:bg-white/20">
                  View Full SOP
                </button>
              </div>
            </div>
          </GlassPanel>
        ) : (
          <GlassPanel className="h-full">
            <div className="h-full flex items-center justify-center">
              <div className="text-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <ClipboardList size={24} className="text-nrc-text-muted" />
                </div>
                <h3 className="text-lg font-medium text-nrc-text-secondary mb-2">Select a Step</h3>
                <p className="text-sm text-nrc-text-muted max-w-xs">
                  Click on any SOP step to view details, track progress, and manage execution.
                </p>
              </div>
            </div>
          </GlassPanel>
        )}
      </div>
    </div>
  );
}
