"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/nrc/DashboardLayout";
import { TopBar } from "@/components/nrc/TopBar";
import { GlassPanel } from "@/components/nrc/GlassPanel";
import { 
  Brain, AlertTriangle, CheckCircle2, XCircle, Clock, 
  MapPin, Activity, Info, ChevronRight, Loader2, Sparkles
} from "lucide-react";
import { CandidateIncident } from "@/lib/services/incident-discovery";

export default function AIDiscoveryPage() {
  const [candidates, setCandidates] = useState<CandidateIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchCandidates = async () => {
    try {
      const res = await fetch("/api/ai-discovery");
      const data = await res.json();
      setCandidates(data.candidates || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const runDiscovery = async () => {
    setDiscovering(true);
    try {
      const res = await fetch("/api/ai-discovery", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setCandidates(data.candidates);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDiscovering(false);
    }
  };

  const handleVerify = async (id: string, status: "confirmed" | "dismissed") => {
    try {
      const res = await fetch(`/api/candidates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes: "Verified via AI Discovery dashboard" })
      });
      if (res.ok) {
        setCandidates(prev => prev.filter(c => c.id !== id));
        if (selectedId === id) setSelectedId(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const selectedCandidate = candidates.find(c => c.id === selectedId);

  return (
    <DashboardLayout>
      <TopBar title="AI Incident Discovery" />
      
      <main className="flex-1 p-6 overflow-hidden flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-nrc-text-primary flex items-center gap-2">
              <Brain className="text-nrc-aurora-purple" size={24} />
              Real-Time Signal Correlation
            </h2>
            <p className="text-sm text-nrc-text-muted">
              AI-detected emerging incidents based on multi-source cross-correlation
            </p>
          </div>
          
          <button
            onClick={runDiscovery}
            disabled={discovering}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-nrc-aurora-purple text-white hover:bg-nrc-aurora-purple/90 transition-all disabled:opacity-50"
          >
            {discovering ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Sparkles size={18} />
            )}
            {discovering ? "Correlating Signals..." : "Run Discovery"}
          </button>
        </div>

        <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
          {/* Candidates List */}
          <div className="col-span-5 flex flex-col gap-4 overflow-y-auto pr-2">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 size={32} className="animate-spin text-nrc-text-muted" />
              </div>
            ) : candidates.length === 0 ? (
              <GlassPanel variant="sunken" className="flex flex-col items-center justify-center p-12 text-center gap-4">
                <Activity size={48} className="text-nrc-text-muted opacity-20" />
                <p className="text-nrc-text-muted">No unverified AI detections found.</p>
                <p className="text-xs text-nrc-text-muted/60 max-w-[200px]">
                  Run discovery to analyze real-time signals from global sources.
                </p>
              </GlassPanel>
            ) : (
              candidates.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${
                    selectedId === c.id 
                      ? "bg-nrc-aurora-purple/10 border-nrc-aurora-purple shadow-[0_0_15px_rgba(156,54,181,0.2)]" 
                      : "bg-white/5 border-transparent hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-nrc-aurora-purple/20 text-nrc-aurora-purple">
                        <AlertTriangle size={16} />
                      </div>
                      <span className="font-bold text-nrc-text-primary">{c.type}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-mono text-nrc-text-muted">{c.id}</span>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs font-bold text-nrc-aurora-cyan">{(c.confidenceScore * 100).toFixed(0)}%</span>
                        <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-nrc-aurora-cyan" 
                            style={{ width: `${c.confidenceScore * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-nrc-text-muted mb-3">
                    <MapPin size={12} />
                    <span>{c.location}</span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div className="flex items-center gap-1 text-[10px] text-nrc-text-muted uppercase tracking-wider">
                      <Clock size={10} />
                      {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleVerify(c.id, "dismissed"); }}
                        className="p-1.5 rounded-md hover:bg-nrc-severity-l5/20 text-nrc-text-muted hover:text-nrc-severity-l5 transition-colors"
                      >
                        <XCircle size={16} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleVerify(c.id, "confirmed"); }}
                        className="p-1.5 rounded-md hover:bg-nrc-severity-l2/20 text-nrc-text-muted hover:text-nrc-severity-l2 transition-colors"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Details Panel */}
          <div className="col-span-7 flex flex-col gap-4 overflow-hidden">
            {selectedCandidate ? (
              <GlassPanel className="h-full flex flex-col">
                <div className="p-6 border-b border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-nrc-aurora-purple/20 flex items-center justify-center text-nrc-aurora-purple">
                        <Brain size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-nrc-text-primary">{selectedCandidate.type}</h3>
                        <p className="text-sm text-nrc-text-muted">{selectedCandidate.location}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-nrc-aurora-cyan">{(selectedCandidate.confidenceScore * 100).toFixed(0)}%</div>
                      <div className="text-[10px] text-nrc-text-muted uppercase tracking-widest">Confidence</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 rounded-lg bg-white/5">
                      <div className="text-[10px] text-nrc-text-muted uppercase mb-1">Status</div>
                      <div className="text-sm font-bold text-nrc-aurora-purple flex items-center gap-1">
                        <Activity size={12} /> Unverified
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5">
                      <div className="text-[10px] text-nrc-text-muted uppercase mb-1">Sources</div>
                      <div className="text-sm font-bold text-nrc-text-primary">{selectedCandidate.sourceCount} Inputs</div>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5">
                      <div className="text-[10px] text-nrc-text-muted uppercase mb-1">Detected At</div>
                      <div className="text-sm font-bold text-nrc-text-primary">
                        {new Date(selectedCandidate.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <section className="space-y-3">
                    <h4 className="text-xs font-bold text-nrc-aurora-cyan uppercase tracking-wider flex items-center gap-2">
                      <Info size={14} /> AI Reasoning
                    </h4>
                    <p className="text-sm text-nrc-text-primary leading-relaxed bg-white/5 p-4 rounded-xl italic">
                      "{selectedCandidate.reasoning}"
                    </p>
                  </section>

                  <section className="space-y-3">
                    <h4 className="text-xs font-bold text-nrc-severity-l3 uppercase tracking-wider flex items-center gap-2">
                      <AlertTriangle size={14} /> Uncertainty & Gaps
                    </h4>
                    <p className="text-sm text-nrc-text-muted bg-nrc-severity-l3/10 p-4 rounded-xl">
                      {selectedCandidate.uncertainty}
                    </p>
                  </section>

                  <section className="space-y-3">
                    <h4 className="text-xs font-bold text-nrc-text-muted uppercase tracking-wider flex items-center gap-2">
                      <Activity size={14} /> Underlying Signals
                    </h4>
                    <div className="space-y-2">
                      {selectedCandidate.rawSignals.map((s, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                          <div className="flex items-center gap-3">
                            <div className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-nrc-text-muted">
                              {s.source}
                            </div>
                            <span className="text-xs text-nrc-text-primary">{s.title || s.type}</span>
                          </div>
                          <span className="text-[10px] font-mono text-nrc-text-muted">
                            {s.location?.lat.toFixed(2)}, {s.location?.lng.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <div className="p-6 border-t border-white/5 bg-white/5 flex gap-4">
                  <button 
                    onClick={() => handleVerify(selectedCandidate.id, "dismissed")}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-nrc-severity-l5/50 text-nrc-severity-l5 hover:bg-nrc-severity-l5 hover:text-white transition-all font-bold"
                  >
                    <XCircle size={18} /> Dismiss Detection
                  </button>
                  <button 
                    onClick={() => handleVerify(selectedCandidate.id, "confirmed")}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-nrc-severity-l2 text-white hover:bg-nrc-severity-l2/90 transition-all font-bold shadow-[0_4px_15px_rgba(81,207,102,0.3)]"
                  >
                    <CheckCircle2 size={18} /> Confirm Incident
                  </button>
                </div>
              </GlassPanel>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center gap-4 bg-white/5 rounded-2xl border border-white/10 border-dashed">
                <Info size={48} className="text-nrc-text-muted opacity-20" />
                <p className="text-nrc-text-muted">Select a candidate to review intelligence breakdown</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
