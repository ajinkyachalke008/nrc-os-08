"use client";

import { useState, useEffect } from "react";
import { GlassPanel } from "./GlassPanel";
import { Brain, ShieldCheck, ShieldAlert, Clock, MapPin, AlertTriangle, TrendingUp, Info } from "lucide-react";
import { Button } from "../ui/button";

export interface CandidateIncident {
  id: string;
  incidentType: string;
  locationZone: string;
  confidenceScore: number;
  sourceCount: number;
  sourceTypes: string[];
  aiReasoningSummary: string;
  uncertaintyNotes: string;
  timestamp: string;
  status: "ai_detected" | "under_review" | "confirmed" | "dismissed";
  createdAt: string;
}

export function AICandidateList() {
  const [candidates, setCandidates] = useState<CandidateIncident[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCandidates = async () => {
    try {
      const res = await fetch("/api/candidates");
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data.candidates) ? data.candidates : [];
        setCandidates(list.filter((c: any) => c.status === "ai_detected" || c.status === "unverified"));
      }
    } catch (e) {
      console.error("Failed to fetch candidates");
    }
  };

  const triggerDiscovery = async () => {
    setLoading(true);
    try {
      await fetch("/api/ai-discovery", { method: "POST" });
      await fetchCandidates();
    } catch (e) {
      console.error("Discovery failed");
    } finally {
      setLoading(false);
    }
  };

  const verify = async (id: string, status: "confirmed" | "dismissed") => {
    try {
      const res = await fetch(`/api/candidates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes: "Verified via dashboard" }),
      });
      if (res.ok) {
        setCandidates(prev => prev.filter(c => c.id !== id));
      }
    } catch (e) {
      console.error("Verification failed");
    }
  };

  useEffect(() => {
    fetchCandidates();
    const interval = setInterval(fetchCandidates, 60000);
    return () => clearInterval(interval);
  }, []);

  if (candidates.length === 0) {
    return (
      <GlassPanel 
        title="AI Incident Discovery" 
        icon={<Brain size={16} className="text-nrc-aurora-purple" />}
        headerAction={
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 text-[10px] text-nrc-aurora-purple hover:bg-nrc-aurora-purple/10"
            onClick={triggerDiscovery}
            disabled={loading}
          >
            {loading ? "ANALYZING..." : "TRIGGER ANALYSIS"}
          </Button>
        }
      >
        <div className="p-8 text-center">
          <Brain size={32} className="mx-auto text-nrc-text-muted/20 mb-3" />
          <p className="text-xs text-nrc-text-muted">No unverified AI-detected incidents</p>
          <p className="text-[10px] text-nrc-text-muted/60 mt-1">Signals are continuously monitored for anomalies</p>
        </div>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel 
      title={`AI-Detected Candidates (${candidates.length})`} 
      icon={<Brain size={16} className="text-nrc-aurora-purple" />}
      headerAction={
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 text-[10px] text-nrc-aurora-purple hover:bg-nrc-aurora-purple/10"
          onClick={triggerDiscovery}
          disabled={loading}
        >
          {loading ? "ANALYZING..." : "REFRESH"}
        </Button>
      }
    >
      <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
        {candidates.map((candidate) => (
            <div key={candidate.id} className="p-3 rounded-xl bg-nrc-aurora-purple/5 border border-nrc-aurora-purple/10 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-nrc-aurora-purple/20 text-nrc-aurora-purple text-[10px] font-bold uppercase tracking-wider">
                    AI-Detected
                  </span>
                  <span className="text-sm font-medium text-nrc-text-primary">{candidate.incidentType}</span>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1 text-[10px] font-mono text-nrc-aurora-purple">
                    <TrendingUp size={10} />
                    {(candidate.confidenceScore * 100).toFixed(0)}% Confidence
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1.5 text-xs text-nrc-text-muted">
                  <MapPin size={12} className="text-nrc-aurora-cyan" />
                  {candidate.locationZone}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-nrc-text-muted">
                  <Clock size={12} className="text-nrc-aurora-cyan" />
                  {new Date(candidate.createdAt || candidate.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <div className="p-2 rounded bg-white/5 space-y-1">
                <div className="flex items-center gap-1 text-[10px] font-bold text-nrc-text-muted uppercase">
                  <Info size={10} /> AI Reasoning
                </div>
                <p className="text-[11px] text-nrc-text-primary leading-relaxed">{candidate.aiReasoningSummary}</p>
                {candidate.uncertaintyNotes && (
                  <p className="text-[10px] text-nrc-severity-l4 italic mt-1">Uncertainty: {candidate.uncertaintyNotes}</p>
                )}
              </div>


            <div className="flex items-center gap-2 pt-1">
              <Button 
                className="flex-1 h-8 bg-nrc-severity-l2/20 hover:bg-nrc-severity-l2/30 text-nrc-severity-l2 text-[10px] font-bold border-none"
                onClick={() => verify(candidate.id, "confirmed")}
              >
                <ShieldCheck size={14} className="mr-1" /> CONFIRM INCIDENT
              </Button>
              <Button 
                className="flex-1 h-8 bg-nrc-severity-l5/20 hover:bg-nrc-severity-l5/30 text-nrc-severity-l5 text-[10px] font-bold border-none"
                onClick={() => verify(candidate.id, "dismissed")}
              >
                <ShieldAlert size={14} className="mr-1" /> DISMISS
              </Button>
            </div>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}
