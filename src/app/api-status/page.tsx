"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/nrc/DashboardLayout";
import { TopBar } from "@/components/nrc/TopBar";
import { GlassPanel } from "@/components/nrc/GlassPanel";
import {
  Activity, CheckCircle2, XCircle, AlertTriangle,
  Globe2, Satellite, Cloud, Database, RefreshCw, Key,
  Shield, Zap, FileText, Thermometer, Radio, Brain
} from "lucide-react";

interface APIStatus {
  available: boolean;
  message: string;
  requiresKey: boolean;
  confidenceWeight: number;
}

interface AuditStats {
  totalRequests: number;
  successRate: number;
  avgLatencyMs: number;
  byProvider: Record<string, { count: number; successRate: number }>;
}

interface StatusResponse {
  apiStatus: Record<string, APIStatus>;
  auditStats: AuditStats;
  timestamp: string;
}

const providerInfo: Record<string, { icon: typeof Globe2; color: string; description: string; docs: string; category: string }> = {
  GDACS: {
    icon: Globe2,
    color: "#4DABF7",
    description: "Global Disaster Alert and Coordination System - UN/EU disaster alerts for earthquakes, floods, cyclones",
    docs: "https://www.gdacs.org/",
    category: "Disaster Intelligence",
  },
  NASA_FIRMS: {
    icon: Satellite,
    color: "#FF922B",
    description: "Fire Information for Resource Management System - Real-time satellite fire detection",
    docs: "https://firms.modaps.eosdis.nasa.gov/",
    category: "Earth Observation",
  },
  OPEN_METEO: {
    icon: Cloud,
    color: "#51CF66",
    description: "Open-source weather API - Global forecasts without API key required",
    docs: "https://open-meteo.com/en/docs",
    category: "Weather",
  },
  NOAA: {
    icon: Radio,
    color: "#4C6EF5",
    description: "National Oceanic and Atmospheric Administration - US weather alerts and cyclone tracking",
    docs: "https://www.weather.gov/documentation/services-web-api",
    category: "Weather",
  },
  COPERNICUS: {
    icon: Satellite,
    color: "#9C36B5",
    description: "EU Earth Observation - Flood extent, fire scar mapping, SAR-based flood monitoring",
    docs: "https://emergency.copernicus.eu/",
    category: "Earth Observation",
  },
  OPENROUTER: {
    icon: Brain,
    color: "#E599F7",
    description: "AI-powered incident discovery engine - Real-time correlation and weak-signal detection",
    docs: "https://openrouter.ai/docs",
    category: "AI Intelligence",
  },
  OPENWEATHER: {
    icon: Thermometer,
    color: "#FCC419",
    description: "OpenWeather API - Weather data and forecasts (requires API key)",
    docs: "https://openweathermap.org/api",
    category: "Weather",
  },
  IMD: {
    icon: Database,
    color: "#868E96",
    description: "India Meteorological Department - Institutional access pending",
    docs: "https://mausam.imd.gov.in/",
    category: "Weather",
  },
};

export default function APIStatusPage() {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<Record<string, { status: string; latency: number } | null>>({});

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/signals?sources=gdacs,weather,noaa");
      const result = await response.json();
      setData({
        apiStatus: result.apiStatus,
        auditStats: result.auditStats,
        timestamp: result.timestamp,
      });
    } catch {
      console.error("Failed to fetch status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const testAPI = async (provider: string) => {
    setTestResults((prev) => ({ ...prev, [provider]: null }));
    const startTime = Date.now();

    try {
      let endpoint = "";
        if (provider === "GDACS") endpoint = "/api/gdacs?limit=1";
        else if (provider === "NASA_FIRMS") endpoint = "/api/firms?limit=1";
        else if (provider === "OPEN_METEO") endpoint = "/api/weather?lat=19.076&lng=72.8777";
        else if (provider === "NOAA") endpoint = "/api/noaa?limit=1";
        else if (provider === "OPENROUTER") endpoint = "/api/ai-discovery";
        else return;

      const response = await fetch(endpoint);
      const latency = Date.now() - startTime;

      setTestResults((prev) => ({
        ...prev,
        [provider]: {
          status: response.ok ? "success" : `error_${response.status}`,
          latency,
        },
      }));
    } catch {
      setTestResults((prev) => ({
        ...prev,
        [provider]: { status: "error", latency: Date.now() - startTime },
      }));
    }
  };

  const availableCount = data ? Object.values(data.apiStatus).filter((s) => s.available).length : 0;
  const totalCount = data ? Object.keys(data.apiStatus).length : 0;
  const freeAPIs = data ? Object.entries(data.apiStatus).filter(([, s]) => !s.requiresKey && s.available).length : 0;

  return (
    <DashboardLayout>
      <TopBar title="API Integration Status" />
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-6">
          {data && (
            <div className="grid grid-cols-5 gap-4">
              <GlassPanel variant="sunken">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-nrc-aurora-cyan/20 flex items-center justify-center">
                      <Activity size={18} className="text-nrc-aurora-cyan" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-nrc-text-primary">{data.auditStats.totalRequests}</p>
                  <p className="text-xs text-nrc-text-muted">Total Requests (1hr)</p>
                </div>
              </GlassPanel>

              <GlassPanel variant="sunken">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-nrc-severity-l2/20 flex items-center justify-center">
                      <CheckCircle2 size={18} className="text-nrc-severity-l2" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-nrc-severity-l2">{data.auditStats.successRate.toFixed(1)}%</p>
                  <p className="text-xs text-nrc-text-muted">Success Rate</p>
                </div>
              </GlassPanel>

              <GlassPanel variant="sunken">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-nrc-aurora-purple/20 flex items-center justify-center">
                      <Zap size={18} className="text-nrc-aurora-purple" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-nrc-text-primary">{data.auditStats.avgLatencyMs.toFixed(0)}ms</p>
                  <p className="text-xs text-nrc-text-muted">Avg Latency</p>
                </div>
              </GlassPanel>

              <GlassPanel variant="sunken">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-nrc-severity-l4/20 flex items-center justify-center">
                      <Database size={18} className="text-nrc-severity-l4" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-nrc-text-primary">{availableCount}/{totalCount}</p>
                  <p className="text-xs text-nrc-text-muted">APIs Available</p>
                </div>
              </GlassPanel>

              <GlassPanel variant="sunken">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-nrc-severity-l2/20 flex items-center justify-center">
                      <Key size={18} className="text-nrc-severity-l2" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-nrc-severity-l2">{freeAPIs}</p>
                  <p className="text-xs text-nrc-text-muted">Free APIs (No Key)</p>
                </div>
              </GlassPanel>
            </div>
          )}

          <GlassPanel
            title="Data Source Providers"
            icon={<Globe2 size={16} />}
            headerAction={
              <button
                onClick={fetchStatus}
                disabled={loading}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-white/10 text-nrc-text-secondary hover:bg-white/20"
              >
                <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
            }
          >
            <div className="p-4 space-y-4">
              {Object.entries(providerInfo).map(([provider, info]) => {
                const Icon = info.icon;
                const status = data?.apiStatus[provider];
                const stats = data?.auditStats.byProvider[provider];
                const testResult = testResults[provider];
                const isInactive = status?.message?.includes("pending") || status?.message?.includes("inactive");

                return (
                  <div 
                    key={provider} 
                    className={`p-4 rounded-xl border ${
                      isInactive 
                        ? "bg-white/3 border-white/5" 
                        : status?.available 
                          ? "bg-white/5 border-white/10" 
                          : "bg-nrc-severity-l4/5 border-nrc-severity-l4/20"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isInactive ? "opacity-50" : ""}`}
                        style={{ backgroundColor: `${info.color}20` }}
                      >
                        <Icon size={24} style={{ color: info.color }} />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className={`text-lg font-semibold ${isInactive ? "text-nrc-text-muted" : "text-nrc-text-primary"}`}>
                            {provider.replace(/_/g, " ")}
                          </h3>
                          
                          {status?.available ? (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-nrc-severity-l2/20 text-nrc-severity-l2 text-xs">
                              <CheckCircle2 size={12} /> Available
                            </span>
                          ) : isInactive ? (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 text-nrc-text-muted text-xs">
                              <AlertTriangle size={12} /> Inactive
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-nrc-severity-l5/20 text-nrc-severity-l5 text-xs">
                              <XCircle size={12} /> {status?.message || "Unavailable"}
                            </span>
                          )}

                          {!status?.requiresKey && status?.available && (
                            <span className="px-2 py-0.5 rounded bg-nrc-severity-l2/10 text-nrc-severity-l2 text-[10px] font-medium">
                              NO KEY REQUIRED
                            </span>
                          )}

                          <span className="px-2 py-0.5 rounded bg-white/10 text-nrc-text-muted text-[10px]">
                            {info.category}
                          </span>
                        </div>

                        <p className={`text-sm mb-3 ${isInactive ? "text-nrc-text-muted/70" : "text-nrc-text-muted"}`}>
                          {info.description}
                        </p>

                        <div className="flex items-center gap-6 text-xs">
                          {stats && stats.count > 0 && (
                            <>
                              <span className="text-nrc-text-muted">
                                Requests: <span className="text-nrc-text-secondary font-mono">{stats.count}</span>
                              </span>
                              <span className="text-nrc-text-muted">
                                Success: <span className="text-nrc-severity-l2 font-mono">{stats.successRate.toFixed(0)}%</span>
                              </span>
                            </>
                          )}
                          {status?.confidenceWeight && (
                            <span className="text-nrc-text-muted">
                              Confidence Weight: <span className="text-nrc-aurora-cyan font-mono">{(status.confidenceWeight * 100).toFixed(0)}%</span>
                            </span>
                          )}
                          <a
                            href={info.docs}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-nrc-aurora-cyan hover:underline"
                          >
                            <FileText size={12} /> Documentation
                          </a>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {!isInactive && (
                          <button
                            onClick={() => testAPI(provider)}
                            disabled={testResult === null && testResults[provider] === null}
                            className="px-3 py-1.5 rounded-lg bg-white/10 text-nrc-text-secondary text-xs hover:bg-white/20 disabled:opacity-50"
                          >
                            Test Connection
                          </button>
                        )}
                        {testResult && (
                          <span
                            className={`text-[10px] text-center ${
                              testResult.status === "success" ? "text-nrc-severity-l2" : "text-nrc-severity-l5"
                            }`}
                          >
                            {testResult.status === "success" ? `OK (${testResult.latency}ms)` : testResult.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassPanel>

          <div className="grid grid-cols-2 gap-6">
            <GlassPanel title="Security & Compliance" icon={<Shield size={16} />}>
              <div className="p-4 space-y-3">
                {[
                  { label: "API Keys Server-Side Only", status: true, desc: "Keys never exposed to frontend" },
                  { label: "Keys Not in Source Control", status: true, desc: "Using .env.local for secrets" },
                  { label: "Audit Logging Enabled", status: true, desc: "All API calls logged with sanitization" },
                  { label: "Sensitive Data Redacted", status: true, desc: "Keys and tokens auto-redacted in logs" },
                  { label: "Rate Limiting Active", status: true, desc: "Per-provider rate limits enforced" },
                  { label: "Fallback Logic Enabled", status: true, desc: "Auto-fallback when sources fail" },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                    {item.status ? (
                      <CheckCircle2 size={16} className="text-nrc-severity-l2 flex-shrink-0" />
                    ) : (
                      <XCircle size={16} className="text-nrc-severity-l5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <span className="text-sm text-nrc-text-primary">{item.label}</span>
                      <p className="text-[10px] text-nrc-text-muted">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassPanel>

            <GlassPanel title="Configuration" icon={<Key size={16} />}>
              <div className="p-4 space-y-3">
                <div className="p-3 rounded-lg bg-white/5">
                  <p className="text-xs text-nrc-text-muted mb-1">Configuration Method</p>
                  <p className="text-sm text-nrc-text-primary">Environment Variables (.env.local)</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5">
                  <p className="text-xs text-nrc-text-muted mb-1">Key Rotation Strategy</p>
                  <p className="text-sm text-nrc-text-primary">Dual-key overlap (90-day cycle)</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5">
                  <p className="text-xs text-nrc-text-muted mb-1">Signal Merging</p>
                  <p className="text-sm text-nrc-text-primary">Multi-source correlation with confidence weighting</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5">
                  <p className="text-xs text-nrc-text-muted mb-1">IMD Handling</p>
                  <p className="text-sm text-nrc-text-primary">Institutional access pending - using Open-Meteo fallback</p>
                </div>
                <div className="p-3 rounded-lg bg-nrc-severity-l2/10 border border-nrc-severity-l2/20">
                  <p className="text-xs text-nrc-severity-l2 mb-1">Free APIs Active</p>
                  <p className="text-sm text-nrc-text-primary">GDACS, Open-Meteo, NOAA - No API keys required</p>
                </div>
              </div>
            </GlassPanel>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
