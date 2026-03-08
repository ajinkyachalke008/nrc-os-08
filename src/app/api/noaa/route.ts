import { NextResponse } from "next/server";
import { API_CONFIGS } from "@/lib/api/config";
import { logAuditEvent } from "@/lib/api/audit";
import { normalizeNOAAAlert, Signal, NOAAAlert } from "@/lib/services/signals";

const config = API_CONFIGS.NOAA;

interface NOAAAlertResponse {
  type: string;
  features: {
    id: string;
    type: string;
    properties: NOAAAlert;
  }[];
}

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

  const area = searchParams.get("area");
  const severity = searchParams.get("severity") || "Severe,Extreme";
  const status = searchParams.get("status") || "actual";
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  try {
    logAuditEvent("api_request", "NOAA", {
      success: true,
      metadata: { area, severity, status, limit },
    });

    const url = new URL(`${config.baseUrl}/alerts/active`);
    if (area) {
      url.searchParams.set("area", area);
    }

    const response = await fetchWithRetry(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/geo+json",
        "User-Agent": "NRC-OS/1.0 (National Response Coordination System)",
      },
    });

    if (!response.ok) {
      const latencyMs = Date.now() - startTime;
      
      logAuditEvent("api_error", "NOAA", {
        success: false,
        latencyMs,
        errorMessage: `HTTP ${response.status}: ${response.statusText}`,
      });

      return NextResponse.json(
        { error: "Failed to fetch NOAA data", status: response.status },
        { status: response.status }
      );
    }

    const data: NOAAAlertResponse = await response.json();
    const latencyMs = Date.now() - startTime;

    const signals: Signal[] = data.features.slice(0, limit).map((feature) => {
      const alert = feature.properties;
      alert.id = feature.id;
      return normalizeNOAAAlert(alert);
    });

    logAuditEvent("api_response", "NOAA", {
      success: true,
      latencyMs,
      metadata: { alertCount: signals.length },
    });

    signals.forEach((signal) => {
      logAuditEvent("signal_ingested", "NOAA", {
        success: true,
        metadata: { signalId: signal.id, type: signal.type, severity: signal.severity },
      });
    });

    return NextResponse.json({
      success: true,
      provider: "NOAA",
      timestamp: new Date().toISOString(),
      latencyMs,
      requiresKey: false,
      confidenceWeight: config.confidenceWeight,
      count: signals.length,
      signals,
    });
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    if (errorMessage.includes("abort")) {
      logAuditEvent("api_timeout", "NOAA", {
        success: false,
        latencyMs,
        errorMessage: "Request timed out",
      });

      return NextResponse.json(
        { error: "Request timed out", provider: "NOAA" },
        { status: 504 }
      );
    }

    logAuditEvent("api_error", "NOAA", {
      success: false,
      latencyMs,
      errorMessage,
    });

    return NextResponse.json(
      { error: "Failed to fetch NOAA data", message: errorMessage },
      { status: 500 }
    );
  }
}
