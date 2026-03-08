import { APIProvider, SOURCE_CONFIDENCE_WEIGHTS, getAPIStatus } from "../api/config";
import { logAuditEvent } from "../api/audit";
import { Signal, SignalType } from "./signals";

export interface WeatherSignal extends Signal {
  temperature?: number;
  precipitation?: number;
  windSpeed?: number;
}

export interface MergedSignal extends Signal {
  contributingSources: APIProvider[];
  sourceConfidences: Record<APIProvider, number>;
  mergedConfidence: number;
  provenance: string[];
}

export interface IngestionResult {
  signals: MergedSignal[];
  errors: { provider: APIProvider; error: string }[];
  sourcesUsed: APIProvider[];
  sourcesFailed: APIProvider[];
  fallbacksActivated: APIProvider[];
  timestamp: Date;
}

export class SignalIngestionService {
  static async getAllSignals(baseUrl: string = "http://localhost:3000"): Promise<MergedSignal[]> {
    try {
      const sources = "gdacs,weather,noaa,firms";
      const response = await fetch(`${baseUrl}/api/signals?sources=${sources}&refresh=true&merge=true`);
      
      if (response.ok) {
        const data = await response.json();
        return data.signals || [];
      }
      
      return [];
    } catch (e) {
      console.error("SignalIngestionService: Failed to fetch signals", e);
      return [];
    }
  }

  static mergeSignals(signals: Signal[]): MergedSignal[] {
    return mergeSignalsInternal(signals);
  }
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function signalsMatch(s1: Signal, s2: Signal, maxDistanceKm = 50): boolean {
  if (s1.type !== s2.type) return false;
  
  const distance = calculateDistance(s1.location.lat, s1.location.lng, s2.location.lat, s2.location.lng);
  if (distance > maxDistanceKm) return false;

  const timeDiff = Math.abs(new Date(s1.startTime).getTime() - new Date(s2.startTime).getTime());
  const maxTimeDiff = 24 * 60 * 60 * 1000;
  if (timeDiff > maxTimeDiff) return false;

  return true;
}

function mergeSignalsInternal(signals: Signal[]): MergedSignal[] {
  const merged: MergedSignal[] = [];
  const processed = new Set<string>();

  const sortedSignals = [...signals].sort((a, b) => {
    const weightA = SOURCE_CONFIDENCE_WEIGHTS[a.source] || 0.5;
    const weightB = SOURCE_CONFIDENCE_WEIGHTS[b.source] || 0.5;
    if (weightA !== weightB) return weightB - weightA;
    return b.severityScore - a.severityScore;
  });

  for (const signal of sortedSignals) {
    if (processed.has(signal.id)) continue;

    const matches = sortedSignals.filter(
      (s) => s.id !== signal.id && !processed.has(s.id) && signalsMatch(signal, s)
    );

    const allSources = [signal, ...matches];
    const contributingSources = [...new Set(allSources.map((s) => s.source))];
    
    const sourceConfidences: Record<APIProvider, number> = {} as Record<APIProvider, number>;
    allSources.forEach((s) => {
      const weight = SOURCE_CONFIDENCE_WEIGHTS[s.source] || 0.5;
      sourceConfidences[s.source] = Math.max(sourceConfidences[s.source] || 0, s.confidence * weight);
    });

    const totalWeight = contributingSources.reduce((sum, src) => sum + (SOURCE_CONFIDENCE_WEIGHTS[src] || 0.5), 0);
    const mergedConfidence = Math.min(
      99,
      contributingSources.reduce((sum, src) => sum + sourceConfidences[src], 0) / totalWeight
    );

    const bestSignal = allSources.reduce((best, curr) => {
      const bestWeight = SOURCE_CONFIDENCE_WEIGHTS[best.source] || 0.5;
      const currWeight = SOURCE_CONFIDENCE_WEIGHTS[curr.source] || 0.5;
      return currWeight > bestWeight ? curr : best;
    }, signal);

    const mergedSignal: MergedSignal = {
      ...bestSignal,
      contributingSources,
      sourceConfidences,
      mergedConfidence,
      provenance: contributingSources.map((src) => `${src} (${(SOURCE_CONFIDENCE_WEIGHTS[src] * 100).toFixed(0)}% weight)`),
    };

    merged.push(mergedSignal);
    processed.add(signal.id);
    matches.forEach((m) => processed.add(m.id));

    if (contributingSources.length > 1) {
      logAuditEvent("signal_merged", bestSignal.source, {
        success: true,
        metadata: {
          mergedId: mergedSignal.id,
          sourceCount: contributingSources.length,
          sources: contributingSources,
          mergedConfidence,
        },
      });
    }
  }

  return merged;
}

export function applyFallbackLogic(
  results: Map<APIProvider, { signals: Signal[]; error?: string }>,
  preferredSources: APIProvider[]
): { signals: Signal[]; fallbacksUsed: APIProvider[] } {
  const allSignals: Signal[] = [];
  const fallbacksUsed: APIProvider[] = [];
  const typesCovered = new Set<SignalType>();

  for (const source of preferredSources) {
    const result = results.get(source);
    if (result && !result.error && result.signals.length > 0) {
      allSignals.push(...result.signals);
      result.signals.forEach((s) => typesCovered.add(s.type));
    }
  }

  const fallbackMap: Record<APIProvider, APIProvider[]> = {
    IMD: ["OPEN_METEO", "NOAA"],
    OPENWEATHER: ["OPEN_METEO"],
    NASA_FIRMS: [],
    GDACS: [],
    OPEN_METEO: [],
    NOAA: [],
    COPERNICUS: ["GDACS"],
  };

  for (const source of preferredSources) {
    const result = results.get(source);
    if (result?.error || result?.signals.length === 0) {
      const fallbacks = fallbackMap[source] || [];
      for (const fallback of fallbacks) {
        const fallbackResult = results.get(fallback);
        if (fallbackResult && !fallbackResult.error && fallbackResult.signals.length > 0) {
          const newSignals = fallbackResult.signals.filter((s) => !typesCovered.has(s.type));
          if (newSignals.length > 0) {
            allSignals.push(...newSignals);
            fallbacksUsed.push(fallback);
            newSignals.forEach((s) => typesCovered.add(s.type));

            logAuditEvent("fallback_activated", fallback, {
              success: true,
              metadata: {
                originalSource: source,
                fallbackSource: fallback,
                signalsAdded: newSignals.length,
              },
            });

            break;
          }
        }
      }
    }
  }

  return { signals: allSignals, fallbacksUsed };
}

export function getAvailableSources(): APIProvider[] {
  const status = getAPIStatus();
  return (Object.keys(status) as APIProvider[]).filter((p) => status[p].available);
}

export function prioritizeSources(sources: APIProvider[]): APIProvider[] {
  return sources.sort((a, b) => {
    const weightA = SOURCE_CONFIDENCE_WEIGHTS[a] || 0.5;
    const weightB = SOURCE_CONFIDENCE_WEIGHTS[b] || 0.5;
    return weightB - weightA;
  });
}
