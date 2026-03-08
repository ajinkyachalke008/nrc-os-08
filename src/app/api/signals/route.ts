import { NextResponse } from "next/server";
import { getAPIStatus, APIProvider, validateAPIKey, SOURCE_CONFIDENCE_WEIGHTS } from "@/lib/api/config";
import { getAuditStats } from "@/lib/api/audit";
import { Signal } from "@/lib/services/signals";
import { SignalIngestionService, MergedSignal } from "@/lib/services/signal-ingestion";

const signalCache: Map<string, { signals: Signal[]; timestamp: number }> = new Map();
const CACHE_TTL = 60000;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sources = (searchParams.get("sources") || "gdacs,weather,noaa").split(",");
  const refresh = searchParams.get("refresh") === "true";
  const country = searchParams.get("country") || "IND";
  const merge = searchParams.get("merge") !== "false";

  const allSignals: Signal[] = [];
  const errors: { provider: string; error: string }[] = [];
  const apiStatus = getAPIStatus();
  const sourcesUsed: APIProvider[] = [];
  const sourcesFailed: APIProvider[] = [];

  const baseUrl = new URL(request.url).origin;

  for (const source of sources) {
    const provider = source.toLowerCase();
    const cacheKey = `${provider}_${country}`;

    if (!refresh && signalCache.has(cacheKey)) {
      const cached = signalCache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        allSignals.push(...cached.signals);
        continue;
      }
    }

    try {
      if (provider === "gdacs") {
        const response = await fetch(`${baseUrl}/api/gdacs?country=${country}&limit=30`);
        if (response.ok) {
          const data = await response.json();
          const signals = data.signals || [];
          signalCache.set(cacheKey, { signals, timestamp: Date.now() });
          allSignals.push(...signals);
          sourcesUsed.push("GDACS");
        } else {
          const errorData = await response.json().catch(() => ({}));
          errors.push({ provider: "GDACS", error: errorData.error || `HTTP ${response.status}` });
          sourcesFailed.push("GDACS");
        }
      }

      if (provider === "firms") {
        if (!apiStatus.NASA_FIRMS.available) {
          errors.push({ provider: "NASA_FIRMS", error: apiStatus.NASA_FIRMS.message });
          sourcesFailed.push("NASA_FIRMS");
          continue;
        }

        const response = await fetch(`${baseUrl}/api/firms?country=${country}&days=1&limit=50`);
        if (response.ok) {
          const data = await response.json();
          const signals = data.signals || [];
          signalCache.set(cacheKey, { signals, timestamp: Date.now() });
          allSignals.push(...signals);
          sourcesUsed.push("NASA_FIRMS");
        } else {
          const errorData = await response.json().catch(() => ({}));
          errors.push({ provider: "NASA_FIRMS", error: errorData.error || `HTTP ${response.status}` });
          sourcesFailed.push("NASA_FIRMS");
        }
      }

      if (provider === "weather" || provider === "openmeteo") {
        const response = await fetch(`${baseUrl}/api/weather?multi=true`);
        if (response.ok) {
          const data = await response.json();
          const signals = data.signals || [];
          signalCache.set(cacheKey, { signals, timestamp: Date.now() });
          allSignals.push(...signals);
          sourcesUsed.push("OPEN_METEO");
        } else {
          const errorData = await response.json().catch(() => ({}));
          errors.push({ provider: "OPEN_METEO", error: errorData.error || `HTTP ${response.status}` });
          sourcesFailed.push("OPEN_METEO");
        }
      }

      if (provider === "noaa") {
        const response = await fetch(`${baseUrl}/api/noaa?limit=20`);
        if (response.ok) {
          const data = await response.json();
          const signals = data.signals || [];
          signalCache.set(cacheKey, { signals, timestamp: Date.now() });
          allSignals.push(...signals);
          sourcesUsed.push("NOAA");
        } else {
          const errorData = await response.json().catch(() => ({}));
          errors.push({ provider: "NOAA", error: errorData.error || `HTTP ${response.status}` });
          sourcesFailed.push("NOAA");
        }
      }
    } catch (error) {
      const providerName = provider.toUpperCase() as APIProvider;
      errors.push({ provider: providerName, error: error instanceof Error ? error.message : "Unknown error" });
      sourcesFailed.push(providerName);
    }
  }

  let finalSignals: (Signal | MergedSignal)[] = allSignals;
  
  if (merge && allSignals.length > 0) {
    finalSignals = SignalIngestionService.mergeSignals(allSignals);
  }

  const sortedSignals = finalSignals.sort((a, b) => {
    if (a.severityScore !== b.severityScore) {
      return b.severityScore - a.severityScore;
    }
    return new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime();
  });

  const stats = getAuditStats(new Date(Date.now() - 3600000));
  const openRouterValidation = validateAPIKey("OPENROUTER");

  const extendedApiStatus = {
    ...apiStatus,
    OPENROUTER: {
      available: openRouterValidation.valid,
      message: openRouterValidation.message,
      requiresKey: true,
      confidenceWeight: SOURCE_CONFIDENCE_WEIGHTS.OPENROUTER || 0.8,
    },
  };

  return NextResponse.json({
    success: errors.length === 0,
    timestamp: new Date().toISOString(),
    summary: {
      totalSignals: sortedSignals.length,
      bySeverity: {
        red: sortedSignals.filter((s) => s.severity === "red").length,
        orange: sortedSignals.filter((s) => s.severity === "orange").length,
        green: sortedSignals.filter((s) => s.severity === "green").length,
      },
      byType: sortedSignals.reduce(
        (acc, s) => {
          acc[s.type] = (acc[s.type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      bySource: sortedSignals.reduce(
        (acc, s) => {
          acc[s.source] = (acc[s.source] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
    },
    sourcesUsed,
    sourcesFailed,
    apiStatus: extendedApiStatus,
    auditStats: stats,
    errors: errors.length > 0 ? errors : undefined,
    signals: sortedSignals,
  });
}
