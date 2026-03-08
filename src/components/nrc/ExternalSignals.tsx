"use client";

import { useState, useEffect, useCallback } from "react";
import { GlassPanel } from "./GlassPanel";
import {
  Radio, AlertTriangle, Droplets, Mountain, Flame, Activity,
  RefreshCw, Globe2, Satellite, Database, CheckCircle2, XCircle,
  Clock, TrendingUp, Shield, Zap, MapPin
} from "lucide-react";

interface Signal {
  id: string;
  source: string;
  type: string;
  severity: "green" | "orange" | "red";
  severityScore: number;
  confidence: number;
  title: string;
  description: string;
  location: { lat: number; lng: number };
  locationName: string;
  country: string;
  startTime: string;
  lastUpdate: string;
  ingestedAt: string;
}

interface APIStatus {
  available: boolean;
  message: string;
}

interface SignalsResponse {
  success: boolean;
  timestamp: string;
  summary: {
    totalSignals: number;
    bySeverity: { red: number; orange: number; green: number };
    byType: Record<string, number>;
    bySource: Record<string, number>;
  };
  apiStatus: Record<string, APIStatus>;
  auditStats: {
    totalRequests: number;
    successRate: number;
    avgLatencyMs: number;
  };
  errors?: { provider: string; error: string }[];
  signals: Signal[];
}

const typeIcons: Record<string, typeof Droplets> = {
  flood: Droplets,
  earthquake: Mountain,
  cyclone: Activity,
  wildfire: Flame,
  volcano: Mountain,
  drought: AlertTriangle,
  landslide: Mountain,
  unknown: AlertTriangle,
};

const severityColors: Record<string, string> = {
  red: "#FA5252",
  orange: "#FF922B",
  green: "#51CF66",
};

const sourceIcons: Record<string, typeof Globe2> = {
  GDACS: Globe2,
  NASA_FIRMS: Satellite,
};

export function ExternalSignals() {
  const [data, setData] = useState<SignalsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [selectedSignal, setSelectedSignal] = useState<string | null>(null);

  const fetchSignals = useCallback(async (refresh = false) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/signals?sources=gdacs&refresh=${refresh}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const result: SignalsResponse = await response.json();
      setData(result);
      setLastFetch(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch signals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(() => fetchSignals(), 300000);
    return () => clearInterval(interval);
  }, [fetchSignals]);

  const selected = data?.signals.find((s) => s.id === selectedSignal);

  return (
    <GlassPanel
      title="External Intelligence Feed"
      icon={<Radio size={16} />}
      className="h-full"
      headerAction={
        <div className="flex items-center gap-3">
          {lastFetch && (
            <span className="text-xs text-nrc-text-muted flex items-center gap-1">
              <Clock size={10} />
              {lastFetch.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => fetchSignals(true)}
            disabled={loading}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-white/10 text-nrc-text-secondary hover:bg-white/20 disabled:opacity-50"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      }
    >
      <div className="p-4 h-full flex flex-col">
        {data && (
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="p-3 rounded-xl bg-white/5">
              <p className="text-xs text-nrc-text-muted mb-1">Total Signals</p>
              <p className="text-2xl font-bold text-nrc-text-primary">{data.summary.totalSignals}</p>
            </div>
            <div className="p-3 rounded-xl bg-nrc-severity-l5/10 border border-nrc-severity-l5/20">
              <p className="text-xs text-nrc-text-muted mb-1">Critical (Red)</p>
              <p className="text-2xl font-bold text-nrc-severity-l5">{data.summary.bySeverity.red}</p>
            </div>
            <div className="p-3 rounded-xl bg-nrc-severity-l4/10 border border-nrc-severity-l4/20">
              <p className="text-xs text-nrc-text-muted mb-1">Warning (Orange)</p>
              <p className="text-2xl font-bold text-nrc-severity-l4">{data.summary.bySeverity.orange}</p>
            </div>
            <div className="p-3 rounded-xl bg-nrc-severity-l2/10 border border-nrc-severity-l2/20">
              <p className="text-xs text-nrc-text-muted mb-1">Advisory (Green)</p>
              <p className="text-2xl font-bold text-nrc-severity-l2">{data.summary.bySeverity.green}</p>
            </div>
          </div>
        )}

        {data && (
          <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 mb-4">
            <span className="text-xs text-nrc-text-muted">API Status:</span>
            {Object.entries(data.apiStatus).map(([provider, status]) => {
              const Icon = sourceIcons[provider] || Database;
              return (
                <div key={provider} className="flex items-center gap-2">
                  <Icon size={12} className="text-nrc-text-muted" />
                  <span className="text-xs text-nrc-text-secondary">{provider}</span>
                  {status.available ? (
                    <CheckCircle2 size={12} className="text-nrc-severity-l2" />
                  ) : (
                    <XCircle size={12} className="text-nrc-severity-l5" />
                  )}
                </div>
              );
            })}
            {data.auditStats && (
              <>
                <span className="text-xs text-nrc-text-muted ml-auto">Success Rate:</span>
                <span className="text-xs font-mono text-nrc-aurora-cyan">{data.auditStats.successRate.toFixed(0)}%</span>
                <span className="text-xs text-nrc-text-muted">Latency:</span>
                <span className="text-xs font-mono text-nrc-text-secondary">{data.auditStats.avgLatencyMs.toFixed(0)}ms</span>
              </>
            )}
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-nrc-severity-l5/10 border border-nrc-severity-l5/20 mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-nrc-severity-l5" />
              <span className="text-sm text-nrc-severity-l5">{error}</span>
            </div>
          </div>
        )}

        {data?.errors && data.errors.length > 0 && (
          <div className="p-3 rounded-xl bg-nrc-severity-l4/10 border border-nrc-severity-l4/20 mb-4">
            <p className="text-xs text-nrc-severity-l4 mb-2">Partial data - some sources unavailable:</p>
            {data.errors.map((err, idx) => (
              <p key={idx} className="text-xs text-nrc-text-muted">
                {err.provider}: {err.error}
              </p>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-2">
          {loading && !data && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <RefreshCw size={24} className="animate-spin text-nrc-aurora-cyan mx-auto mb-2" />
                <p className="text-sm text-nrc-text-muted">Fetching external intelligence...</p>
              </div>
            </div>
          )}

          {data?.signals.map((signal) => {
            const Icon = typeIcons[signal.type] || AlertTriangle;
            const SourceIcon = sourceIcons[signal.source] || Database;
            const isSelected = selectedSignal === signal.id;

            return (
              <div
                key={signal.id}
                onClick={() => setSelectedSignal(isSelected ? null : signal.id)}
                className={`p-3 rounded-xl cursor-pointer transition-all ${
                  isSelected
                    ? "bg-white/10 border border-white/20"
                    : "bg-white/5 border border-transparent hover:bg-white/8"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${severityColors[signal.severity]}20` }}
                  >
                    <Icon size={16} style={{ color: severityColors[signal.severity] }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-nrc-text-primary truncate">{signal.title}</span>
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase"
                        style={{
                          backgroundColor: `${severityColors[signal.severity]}20`,
                          color: severityColors[signal.severity],
                        }}
                      >
                        {signal.severity}
                      </span>
                    </div>

                    <p className="text-xs text-nrc-text-muted mb-2 line-clamp-1">{signal.description}</p>

                    <div className="flex items-center gap-3 text-xs text-nrc-text-muted">
                      <span className="flex items-center gap-1">
                        <SourceIcon size={10} />
                        {signal.source}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={10} />
                        {signal.locationName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Shield size={10} />
                        {signal.confidence}%
                      </span>
                    </div>

                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-[10px] text-nrc-text-muted">Coordinates</p>
                            <p className="text-xs text-nrc-text-secondary font-mono">
                              {signal.location.lat.toFixed(4)}, {signal.location.lng.toFixed(4)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-nrc-text-muted">Severity Score</p>
                            <p className="text-xs text-nrc-text-secondary">{signal.severityScore}/5</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-nrc-text-muted">Start Time</p>
                            <p className="text-xs text-nrc-text-secondary">{new Date(signal.startTime).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-nrc-text-muted">Ingested</p>
                            <p className="text-xs text-nrc-text-secondary">{new Date(signal.ingestedAt).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button className="flex-1 px-3 py-1.5 rounded-lg bg-nrc-aurora-cyan text-nrc-base text-xs font-medium hover:opacity-90">
                            Create Incident
                          </button>
                          <button className="flex-1 px-3 py-1.5 rounded-lg bg-white/10 text-nrc-text-secondary text-xs hover:bg-white/20">
                            Link to Existing
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {data?.signals.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8">
                <CheckCircle2 size={32} className="text-nrc-severity-l2 mx-auto mb-3" />
                <p className="text-sm text-nrc-text-secondary">No active alerts</p>
                <p className="text-xs text-nrc-text-muted">External intelligence feeds are clear</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </GlassPanel>
  );
}
