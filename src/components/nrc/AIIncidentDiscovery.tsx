"use client";

import { useState, useEffect, useCallback } from "react";
import { GlassPanel } from "./GlassPanel";
import {
  Brain, AlertTriangle, CheckCircle2, XCircle, Clock, 
  RefreshCw, Eye, Shield, Zap, MapPin, Activity, ChevronDown,
  ChevronUp, MessageSquare, Target
} from "lucide-react";

interface CandidateIncident {
  id: string;
  incidentType: string;
  locationZone: string;
  coordinates?: { lat: number; lng: number };
  spatialScores?: {
    roadAccessScore: number;
    isolationRiskScore: number;
    buildingDensityScore: number;
    bridgeRiskScore: number;
    poiCriticalityScore: number;
    overallSpatialImpact: number;
  };
  spatialReasoning?: string;
  confidenceScore: number;
  sourceCount: number;
  sourceTypes: string[];
  aiReasoningSummary: string;
  uncertaintyNotes: string;
  verificationRequired: boolean;
  status: "ai_detected" | "under_review" | "confirmed" | "dismissed";
  createdAt: string;
  lastUpdated: string;
  humanDecision?: {
    decision: string;
    justification: string;
    operatorId: string;
    timestamp: string;
  };
}

interface DiscoveryResponse {
  success: boolean;
  openRouterStatus: "active" | "degraded" | "unavailable";
  openRouterAvailable: boolean;
  candidateCount: number;
  byStatus: {
    ai_detected: number;
    under_review: number;
    confirmed: number;
    dismissed: number;
  };
  candidates: CandidateIncident[];
}

const incidentTypeLabels: Record<string, string> = {
  flood: "Flood",
  bridge_blockage: "Bridge Blockage",
  building_collapse: "Building Collapse",
  urban_fire: "Urban Fire",
  landslide: "Landslide",
  infrastructure_failure: "Infrastructure Failure",
  road_blockage: "Road Blockage",
  extreme_weather: "Extreme Weather",
};

const statusColors: Record<string, string> = {
  ai_detected: "#FFD43B",
  under_review: "#4DABF7",
  confirmed: "#51CF66",
  dismissed: "#868E96",
};

const statusLabels: Record<string, string> = {
  ai_detected: "AI-Detected (Unverified)",
  under_review: "Under Review",
  confirmed: "Confirmed",
  dismissed: "Dismissed",
};

export function AIIncidentDiscovery() {
  const [data, setData] = useState<DiscoveryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [justification, setJustification] = useState("");

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/ai-discovery");
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Failed to fetch candidates:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const runDiscovery = async () => {
    setDiscovering(true);
    try {
      const signalsResponse = await fetch("/api/signals?sources=gdacs,weather,noaa");
      const signalsData = await signalsResponse.json();

      const response = await fetch("/api/ai-discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signals: signalsData.signals || [] }),
      });

      await response.json();
      await fetchCandidates();
    } catch (error) {
      console.error("Discovery failed:", error);
    } finally {
      setDiscovering(false);
    }
  };

  const verifyCandidate = async (id: string, decision: "confirmed" | "dismissed") => {
    if (!justification || justification.length < 10) {
      return;
    }

    try {
      await fetch(`/api/candidates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          justification,
          operatorId: "operator_001",
        }),
      });

      setVerifyingId(null);
      setJustification("");
      await fetchCandidates();
    } catch (error) {
      console.error("Verification failed:", error);
    }
  };

  useEffect(() => {
    fetchCandidates();
    const interval = setInterval(fetchCandidates, 60000);
    return () => clearInterval(interval);
  }, [fetchCandidates]);

  const selected = data?.candidates?.find((c) => c.id === selectedCandidate);

  return (
    <GlassPanel
      title="AI Incident Discovery"
      icon={<Brain size={16} />}
      className="h-full"
      headerAction={
        <div className="flex items-center gap-3">
          {data && (
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  data?.openRouterStatus === "active"
                    ? "bg-nrc-severity-l2"
                    : data?.openRouterStatus === "degraded"
                    ? "bg-nrc-severity-l4"
                    : "bg-nrc-severity-l5"
                }`}
              />
              <span className="text-xs text-nrc-text-muted capitalize">{data?.openRouterStatus}</span>
            </div>
          )}
          <button
            onClick={runDiscovery}
            disabled={discovering || !data?.openRouterAvailable}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-nrc-aurora-purple/20 text-nrc-aurora-purple hover:bg-nrc-aurora-purple/30 disabled:opacity-50"
          >
            <Zap size={12} className={discovering ? "animate-pulse" : ""} />
            {discovering ? "Analyzing..." : "Run Discovery"}
          </button>
          <button
            onClick={fetchCandidates}
            disabled={loading}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-white/10 text-nrc-text-secondary hover:bg-white/20"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      }
    >
      <div className="p-4 h-full flex flex-col">
        {data?.byStatus && (
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-xs text-nrc-text-muted mb-1">AI-Detected</p>
                <p className="text-2xl font-bold text-yellow-400">{data?.byStatus?.ai_detected || 0}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <p className="text-xs text-nrc-text-muted mb-1">Under Review</p>
                <p className="text-2xl font-bold text-blue-400">{data?.byStatus?.under_review || 0}</p>
              </div>
              <div className="p-3 rounded-xl bg-nrc-severity-l2/10 border border-nrc-severity-l2/20">
                <p className="text-xs text-nrc-text-muted mb-1">Confirmed</p>
                <p className="text-2xl font-bold text-nrc-severity-l2">{data?.byStatus?.confirmed || 0}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-nrc-text-muted mb-1">Dismissed</p>
                <p className="text-2xl font-bold text-nrc-text-muted">{data?.byStatus?.dismissed || 0}</p>
              </div>
            </div>
        )}

        {!data?.openRouterAvailable && (
          <div className="p-4 rounded-xl bg-nrc-severity-l4/10 border border-nrc-severity-l4/20 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-nrc-severity-l4" />
              <span className="text-sm font-medium text-nrc-severity-l4">AI Discovery Unavailable</span>
            </div>
            <p className="text-xs text-nrc-text-muted">
              OpenRouter API is not configured. System continues with sensor data only.
            </p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-2">
          {loading && !data && (
            <div className="flex items-center justify-center h-full">
              <RefreshCw size={24} className="animate-spin text-nrc-aurora-purple" />
            </div>
          )}

          {data?.candidates
            .filter((c) => c.status !== "dismissed")
            .map((candidate) => {
              const isSelected = selectedCandidate === candidate.id;
              const isVerifying = verifyingId === candidate.id;

              return (
                <div
                  key={candidate.id}
                  className={`p-3 rounded-xl cursor-pointer transition-all border ${
                    isSelected
                      ? "bg-white/10 border-white/20"
                      : "bg-white/5 border-transparent hover:bg-white/8"
                  }`}
                >
                  <div
                    onClick={() => setSelectedCandidate(isSelected ? null : candidate.id)}
                    className="flex items-start gap-3"
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${statusColors[candidate.status]}20` }}
                    >
                      {candidate.status === "ai_detected" && (
                        <Brain size={16} style={{ color: statusColors[candidate.status] }} />
                      )}
                      {candidate.status === "under_review" && (
                        <Eye size={16} style={{ color: statusColors[candidate.status] }} />
                      )}
                      {candidate.status === "confirmed" && (
                        <CheckCircle2 size={16} style={{ color: statusColors[candidate.status] }} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-nrc-text-primary">
                          {incidentTypeLabels[candidate.incidentType] || candidate.incidentType}
                        </span>
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                          style={{
                            backgroundColor: `${statusColors[candidate.status]}20`,
                            color: statusColors[candidate.status],
                          }}
                        >
                          {statusLabels[candidate.status]}
                        </span>
                      </div>

                      <p className="text-xs text-nrc-text-muted mb-2 flex items-center gap-1">
                        <MapPin size={10} />
                        {candidate.locationZone}
                      </p>

                      <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1 text-nrc-text-muted">
                          <Target size={10} />
                          <span className="text-nrc-aurora-cyan font-mono">
                            {(candidate.confidenceScore * 100).toFixed(0)}%
                          </span>
                        </span>
                        <span className="flex items-center gap-1 text-nrc-text-muted">
                          <Activity size={10} />
                          {candidate.sourceCount} sources
                        </span>
                        <span className="flex items-center gap-1 text-nrc-text-muted">
                          <Clock size={10} />
                          {new Date(candidate.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      {isSelected ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
                        {candidate.spatialScores && (
                          <div className="p-3 rounded-lg bg-nrc-aurora-cyan/5 border border-nrc-aurora-cyan/10">
                            <div className="flex items-center gap-2 mb-2">
                              <Shield size={12} className="text-nrc-aurora-cyan" />
                              <span className="text-[10px] font-bold text-nrc-aurora-cyan uppercase">OSM Spatial Intelligence</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mb-2">
                              <div className="text-center">
                                <p className="text-[8px] text-nrc-text-muted uppercase">Isolation</p>
                                <p className={`text-xs font-bold ${candidate.spatialScores.isolationRiskScore > 0.6 ? 'text-nrc-severity-l4' : 'text-nrc-text-primary'}`}>
                                  {(candidate.spatialScores.isolationRiskScore * 100).toFixed(0)}%
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-[8px] text-nrc-text-muted uppercase">Bridge Risk</p>
                                <p className={`text-xs font-bold ${candidate.spatialScores.bridgeRiskScore > 0.7 ? 'text-nrc-severity-l5' : 'text-nrc-text-primary'}`}>
                                  {(candidate.spatialScores.bridgeRiskScore * 100).toFixed(0)}%
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-[8px] text-nrc-text-muted uppercase">POI Crit.</p>
                                <p className="text-xs font-bold text-nrc-aurora-purple">
                                  {(candidate.spatialScores.poiCriticalityScore * 100).toFixed(0)}%
                                </p>
                              </div>
                            </div>
                            <p className="text-[10px] text-nrc-text-secondary italic">
                              {candidate.spatialReasoning || "Analyzing spatial constraints..."}
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">

                        <div>
                          <p className="text-[10px] text-nrc-text-muted uppercase mb-1">AI Reasoning</p>
                          <p className="text-xs text-nrc-text-secondary bg-white/5 p-2 rounded">
                            {candidate.aiReasoningSummary}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-nrc-text-muted uppercase mb-1">Uncertainty Notes</p>
                          <p className="text-xs text-nrc-severity-l4 bg-nrc-severity-l4/10 p-2 rounded">
                            {candidate.uncertaintyNotes}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] text-nrc-text-muted uppercase mb-1">Contributing Sources</p>
                        <div className="flex flex-wrap gap-1">
                          {candidate.sourceTypes.map((source, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-white/10 text-xs text-nrc-text-secondary">
                              {source}
                            </span>
                          ))}
                        </div>
                      </div>

                      {candidate.coordinates && (
                        <div>
                          <p className="text-[10px] text-nrc-text-muted uppercase mb-1">Coordinates</p>
                          <p className="text-xs font-mono text-nrc-text-secondary">
                            {candidate.coordinates.lat.toFixed(4)}, {candidate.coordinates.lng.toFixed(4)}
                          </p>
                        </div>
                      )}

                      {candidate.status === "ai_detected" && !isVerifying && (
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setVerifyingId(candidate.id);
                            }}
                            className="flex-1 px-3 py-2 rounded-lg bg-nrc-severity-l2 text-nrc-base text-xs font-medium hover:opacity-90 flex items-center justify-center gap-1"
                          >
                            <CheckCircle2 size={14} />
                            Confirm Incident
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setVerifyingId(candidate.id);
                            }}
                            className="flex-1 px-3 py-2 rounded-lg bg-white/10 text-nrc-text-secondary text-xs hover:bg-white/20 flex items-center justify-center gap-1"
                          >
                            <XCircle size={14} />
                            Dismiss
                          </button>
                        </div>
                      )}

                      {isVerifying && (
                        <div className="pt-2 space-y-3">
                          <div>
                            <label className="text-[10px] text-nrc-text-muted uppercase block mb-1">
                              Justification (required)
                            </label>
                            <textarea
                              value={justification}
                              onChange={(e) => setJustification(e.target.value)}
                              placeholder="Enter reason for your decision (min 10 characters)..."
                              className="w-full p-2 rounded-lg bg-white/5 border border-white/10 text-xs text-nrc-text-primary placeholder-nrc-text-muted resize-none"
                              rows={2}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                verifyCandidate(candidate.id, "confirmed");
                              }}
                              disabled={justification.length < 10}
                              className="flex-1 px-3 py-2 rounded-lg bg-nrc-severity-l2 text-nrc-base text-xs font-medium hover:opacity-90 disabled:opacity-50"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                verifyCandidate(candidate.id, "dismissed");
                              }}
                              disabled={justification.length < 10}
                              className="flex-1 px-3 py-2 rounded-lg bg-nrc-severity-l5 text-white text-xs font-medium hover:opacity-90 disabled:opacity-50"
                            >
                              Dismiss
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setVerifyingId(null);
                                setJustification("");
                              }}
                              className="px-3 py-2 rounded-lg bg-white/10 text-nrc-text-secondary text-xs hover:bg-white/20"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {candidate.humanDecision && (
                        <div className="pt-2 p-3 rounded-lg bg-white/5">
                          <p className="text-[10px] text-nrc-text-muted uppercase mb-2">Human Decision</p>
                          <div className="flex items-center gap-2 mb-1">
                            {candidate.humanDecision.decision === "confirmed" ? (
                              <CheckCircle2 size={14} className="text-nrc-severity-l2" />
                            ) : (
                              <XCircle size={14} className="text-nrc-text-muted" />
                            )}
                            <span className="text-xs text-nrc-text-primary capitalize">
                              {candidate.humanDecision.decision}
                            </span>
                            <span className="text-[10px] text-nrc-text-muted">
                              by {candidate.humanDecision.operatorId}
                            </span>
                          </div>
                          <p className="text-xs text-nrc-text-muted flex items-start gap-1">
                            <MessageSquare size={10} className="flex-shrink-0 mt-0.5" />
                            {candidate.humanDecision.justification}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

          {data?.candidates.filter((c) => c.status !== "dismissed").length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8">
                <Shield size={32} className="text-nrc-aurora-purple mx-auto mb-3 opacity-50" />
                <p className="text-sm text-nrc-text-secondary">No active candidates</p>
                <p className="text-xs text-nrc-text-muted">Run discovery to detect incidents</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </GlassPanel>
  );
}
