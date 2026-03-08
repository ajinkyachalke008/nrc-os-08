"use client";

import { useState, useEffect, useCallback } from "react";
import { GlassPanel } from "./GlassPanel";
import {
  Brain, AlertTriangle, CheckCircle2, XCircle, RefreshCw, Clock,
  MapPin, Zap, Shield, Eye, ThumbsUp, ThumbsDown, ChevronDown,
  Droplets, Mountain, Flame, Building2, Truck, CloudRain, Activity
} from "lucide-react";

interface CandidateIncident {
  id: string;
  type: string;
  title: string;
  description: string;
  locationZone: string;
  coordinates?: { lat: number; lng: number };
  confidenceScore: number;
  sourceCount: number;
  sourceTypes: string[];
  aiReasoningSummary: string;
  uncertaintyNotes: string[];
  verificationRequired: boolean;
  status: "unverified" | "verified" | "dismissed";
  detectedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  dismissedAt?: string;
  dismissedBy?: string;
  dismissalReason?: string;
}

interface CandidatesResponse {
  success: boolean;
  openRouterStatus: { available: boolean; message: string };
  summary: {
    total: number;
    byStatus: { unverified: number; verified: number; dismissed: number };
  };
  candidates: CandidateIncident[];
}

const typeIcons: Record<string, typeof Droplets> = {
  flood: Droplets,
  earthquake: Mountain,
  cyclone: Activity,
  wildfire: Flame,
  urban_fire: Flame,
  building_collapse: Building2,
  bridge_blockage: Truck,
  landslide: Mountain,
  extreme_weather: CloudRain,
  infrastructure_failure: Building2,
  road_blockage: Truck,
  unknown: AlertTriangle,
};

const typeColors: Record<string, string> = {
  flood: "#4DABF7",
  earthquake: "#FF6B6B",
  cyclone: "#9775FA",
  wildfire: "#FF922B",
  urban_fire: "#FF922B",
  building_collapse: "#FA5252",
  landslide: "#8B4513",
  extreme_weather: "#4C6EF5",
  unknown: "#868E96",
};

export function AICandidates() {
  const [data, setData] = useState<CandidatesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dismissReason, setDismissReason] = useState("");
  const [showDismissModal, setShowDismissModal] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("unverified");

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/candidates?status=${statusFilter}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Failed to fetch candidates:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const triggerAnalysis = async () => {
    setAnalyzing(true);
    try {
      const signalsRes = await fetch("/api/signals?sources=gdacs,weather,noaa");
      const signalsData = await signalsRes.json();

      await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signals: signalsData.signals || [],
          weatherData: signalsData.weather,
        }),
      });

      await fetchCandidates();
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleVerify = async (id: string) => {
    try {
      await fetch(`/api/candidates/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", operator: "current_user" }),
      });
      await fetchCandidates();
    } catch (error) {
      console.error("Verification failed:", error);
    }
  };

  const handleDismiss = async (id: string) => {
    if (!dismissReason.trim()) return;
    try {
      await fetch(`/api/candidates/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "dismiss",
          operator: "current_user",
          reason: dismissReason,
        }),
      });
      setShowDismissModal(null);
      setDismissReason("");
      await fetchCandidates();
    } catch (error) {
      console.error("Dismissal failed:", error);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const selected = data?.candidates.find((c) => c.id === selectedId);

  return (
    <GlassPanel
      title="AI-Detected Incidents"
      icon={<Brain size={16} />}
      className="h-full"
      headerAction={
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2 py-1 rounded text-xs bg-white/10 text-nrc-text-secondary border-none outline-none"
          >
            <option value="unverified">Unverified</option>
            <option value="verified">Verified</option>
            <option value="dismissed">Dismissed</option>
          </select>
          <button
            onClick={triggerAnalysis}
            disabled={analyzing}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-nrc-aurora-purple/20 text-nrc-aurora-purple hover:bg-nrc-aurora-purple/30 disabled:opacity-50"
          >
            <Brain size={12} className={analyzing ? "animate-pulse" : ""} />
            {analyzing ? "Analyzing..." : "Run Analysis"}
          </button>
          <button
            onClick={() => fetchCandidates()}
            disabled={loading}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-white/10 text-nrc-text-secondary hover:bg-white/20"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      }
    >
      <div className="p-4 h-full flex flex-col">
        {data && !data.openRouterStatus.available && (
          <div className="p-3 rounded-xl bg-nrc-severity-l4/10 border border-nrc-severity-l4/20 mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-nrc-severity-l4" />
              <span className="text-sm text-nrc-severity-l4">
                OpenRouter AI not configured - AI incident discovery disabled
              </span>
            </div>
          </div>
        )}

        {data && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="p-3 rounded-xl bg-nrc-severity-l4/10 border border-nrc-severity-l4/20">
              <p className="text-xs text-nrc-text-muted mb-1">Unverified</p>
              <p className="text-2xl font-bold text-nrc-severity-l4">{data.summary.byStatus.unverified}</p>
            </div>
            <div className="p-3 rounded-xl bg-nrc-severity-l2/10 border border-nrc-severity-l2/20">
              <p className="text-xs text-nrc-text-muted mb-1">Verified</p>
              <p className="text-2xl font-bold text-nrc-severity-l2">{data.summary.byStatus.verified}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs text-nrc-text-muted mb-1">Dismissed</p>
              <p className="text-2xl font-bold text-nrc-text-muted">{data.summary.byStatus.dismissed}</p>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-2">
          {loading && !data && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <RefreshCw size={24} className="animate-spin text-nrc-aurora-purple mx-auto mb-2" />
                <p className="text-sm text-nrc-text-muted">Loading candidates...</p>
              </div>
            </div>
          )}

          {data?.candidates.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8">
                <Brain size={32} className="text-nrc-aurora-purple mx-auto mb-3 opacity-50" />
                <p className="text-sm text-nrc-text-secondary">No {statusFilter} candidates</p>
                <p className="text-xs text-nrc-text-muted mt-1">
                  {statusFilter === "unverified" ? "Run analysis to discover new incidents" : "Change filter to see other candidates"}
                </p>
              </div>
            </div>
          )}

          {data?.candidates.map((candidate) => {
            const Icon = typeIcons[candidate.type] || AlertTriangle;
            const color = typeColors[candidate.type] || "#868E96";
            const isSelected = selectedId === candidate.id;

            return (
              <div
                key={candidate.id}
                onClick={() => setSelectedId(isSelected ? null : candidate.id)}
                className={`p-3 rounded-xl cursor-pointer transition-all border-l-4 ${
                  isSelected
                    ? "bg-white/10 border-white/20"
                    : "bg-white/5 border-transparent hover:bg-white/8"
                }`}
                style={{ borderLeftColor: color }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <Icon size={16} style={{ color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-nrc-text-primary truncate">
                        {candidate.title}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-nrc-aurora-purple/20 text-nrc-aurora-purple text-[10px] font-medium">
                        AI-DETECTED
                      </span>
                      {candidate.status === "verified" && (
                        <span className="px-1.5 py-0.5 rounded bg-nrc-severity-l2/20 text-nrc-severity-l2 text-[10px]">
                          VERIFIED
                        </span>
                      )}
                      {candidate.status === "dismissed" && (
                        <span className="px-1.5 py-0.5 rounded bg-white/10 text-nrc-text-muted text-[10px]">
                          DISMISSED
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-nrc-text-muted mb-2 line-clamp-1">
                      {candidate.description}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-nrc-text-muted">
                      <span className="flex items-center gap-1">
                        <MapPin size={10} />
                        {candidate.locationZone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap size={10} />
                        {(candidate.confidenceScore * 100).toFixed(0)}%
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye size={10} />
                        {candidate.sourceCount} sources
                      </span>
                    </div>

                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
                        <div>
                          <p className="text-[10px] text-nrc-text-muted mb-1">AI Reasoning</p>
                          <p className="text-xs text-nrc-text-secondary">{candidate.aiReasoningSummary}</p>
                        </div>

                        {candidate.uncertaintyNotes.length > 0 && (
                          <div>
                            <p className="text-[10px] text-nrc-severity-l4 mb-1">Uncertainties</p>
                            <ul className="text-xs text-nrc-text-muted space-y-1">
                              {candidate.uncertaintyNotes.map((note, idx) => (
                                <li key={idx} className="flex items-start gap-1">
                                  <span className="text-nrc-severity-l4">•</span> {note}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1">
                          {candidate.sourceTypes.map((source) => (
                            <span
                              key={source}
                              className="px-2 py-0.5 rounded bg-white/10 text-[10px] text-nrc-text-secondary"
                            >
                              {source}
                            </span>
                          ))}
                        </div>

                        {candidate.status === "unverified" && (
                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVerify(candidate.id);
                              }}
                              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-nrc-severity-l2 text-nrc-base text-xs font-medium hover:opacity-90"
                            >
                              <ThumbsUp size={12} />
                              Confirm & Create Incident
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowDismissModal(candidate.id);
                              }}
                              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-white/10 text-nrc-text-secondary text-xs hover:bg-white/20"
                            >
                              <ThumbsDown size={12} />
                              Dismiss
                            </button>
                          </div>
                        )}

                        {candidate.status === "verified" && candidate.verifiedBy && (
                          <div className="p-2 rounded bg-nrc-severity-l2/10 text-xs">
                            <span className="text-nrc-severity-l2">Verified by {candidate.verifiedBy}</span>
                            {candidate.verifiedAt && (
                              <span className="text-nrc-text-muted ml-2">
                                {new Date(candidate.verifiedAt).toLocaleString()}
                              </span>
                            )}
                          </div>
                        )}

                        {candidate.status === "dismissed" && (
                          <div className="p-2 rounded bg-white/5 text-xs">
                            <span className="text-nrc-text-muted">Dismissed: </span>
                            <span className="text-nrc-text-secondary">{candidate.dismissalReason}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end">
                    <div
                      className="w-10 h-2 rounded-full overflow-hidden bg-white/10"
                      title={`Confidence: ${(candidate.confidenceScore * 100).toFixed(0)}%`}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${candidate.confidenceScore * 100}%`,
                          backgroundColor:
                            candidate.confidenceScore >= 0.8
                              ? "#51CF66"
                              : candidate.confidenceScore >= 0.6
                              ? "#FF922B"
                              : "#FA5252",
                        }}
                      />
                    </div>
                    <ChevronDown
                      size={14}
                      className={`mt-2 text-nrc-text-muted transition-transform ${isSelected ? "rotate-180" : ""}`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {showDismissModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDismissModal(null)}>
            <div className="bg-nrc-surface p-6 rounded-2xl w-96 border border-white/10" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-nrc-text-primary mb-4">Dismiss Candidate</h3>
              <p className="text-sm text-nrc-text-muted mb-4">
                Please provide a reason for dismissing this AI-detected incident. This will be logged for model improvement.
              </p>
              <textarea
                value={dismissReason}
                onChange={(e) => setDismissReason(e.target.value)}
                placeholder="Enter dismissal reason..."
                className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-sm text-nrc-text-primary placeholder-nrc-text-muted outline-none focus:border-nrc-aurora-cyan resize-none"
                rows={3}
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowDismissModal(null)}
                  className="flex-1 px-4 py-2 rounded-lg bg-white/10 text-nrc-text-secondary hover:bg-white/20"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDismiss(showDismissModal)}
                  disabled={!dismissReason.trim()}
                  className="flex-1 px-4 py-2 rounded-lg bg-nrc-severity-l5 text-white hover:opacity-90 disabled:opacity-50"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </GlassPanel>
  );
}
