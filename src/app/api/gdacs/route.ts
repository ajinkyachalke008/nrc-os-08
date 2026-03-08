import { NextResponse } from "next/server";
import { API_CONFIGS } from "@/lib/api/config";
import { logAuditEvent } from "@/lib/api/audit";
import { normalizeGDACSEvent, Signal, GDACSEvent } from "@/lib/services/signals";

interface GDACSFeature {
  type: "Feature";
  properties: GDACSEvent;
  geometry: {
    type: string;
    coordinates: number[];
  };
}

interface GDACSResponse {
  type: "FeatureCollection";
  features: GDACSFeature[];
}

const config = API_CONFIGS.GDACS;

async function fetchWithRetry(url: string, options: RequestInit, retries = config.retryAttempts): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, config.retryDelay));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

export async function GET(request: Request) {
  const startTime = Date.now();
  const { searchParams } = new URL(request.url);

  const eventType = searchParams.get("type") || "FL,TC,EQ,WF";
  const country = searchParams.get("country");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  try {
    logAuditEvent("api_request", "GDACS", {
      success: true,
      metadata: { eventType, country, limit },
    });

    const url = new URL(`${config.baseUrl}/events/geteventlist/SEARCH`);
    url.searchParams.set("eventlist", eventType);
    url.searchParams.set("alertlevel", "Green;Orange;Red");
    if (country) {
      url.searchParams.set("country", country);
    }

    const response = await fetchWithRetry(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const latencyMs = Date.now() - startTime;
      logAuditEvent("api_error", "GDACS", {
        success: false,
        latencyMs,
        errorMessage: `HTTP ${response.status}: ${response.statusText}`,
      });

      return NextResponse.json(
        { error: "Failed to fetch GDACS data", status: response.status },
        { status: response.status }
      );
    }

    const data: GDACSResponse = await response.json();
    const latencyMs = Date.now() - startTime;

    const signals: Signal[] = data.features
      .slice(0, limit)
      .map((feature) => {
        const event = feature.properties;
        if (feature.geometry?.coordinates) {
          event.longitude = feature.geometry.coordinates[0];
          event.latitude = feature.geometry.coordinates[1];
        }
        return normalizeGDACSEvent(event);
      });

    logAuditEvent("api_response", "GDACS", {
      success: true,
      latencyMs,
      metadata: { eventCount: signals.length },
    });

    signals.forEach((signal) => {
      logAuditEvent("signal_ingested", "GDACS", {
        success: true,
        metadata: { signalId: signal.id, type: signal.type, severity: signal.severity },
      });
    });

    return NextResponse.json({
      success: true,
      provider: "GDACS",
      timestamp: new Date().toISOString(),
      latencyMs,
      count: signals.length,
      signals,
    });
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    if (errorMessage.includes("abort")) {
      logAuditEvent("api_timeout", "GDACS", {
        success: false,
        latencyMs,
        errorMessage: "Request timed out",
      });

      return NextResponse.json(
        { error: "Request timed out", provider: "GDACS" },
        { status: 504 }
      );
    }

    logAuditEvent("api_error", "GDACS", {
      success: false,
      latencyMs,
      errorMessage,
    });

    return NextResponse.json(
      { error: "Failed to fetch GDACS data", message: errorMessage },
      { status: 500 }
    );
  }
}
