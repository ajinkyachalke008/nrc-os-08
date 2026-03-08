import { NextResponse } from "next/server";
import { API_CONFIGS, getAPIKey, validateAPIKey } from "@/lib/api/config";
import { logAuditEvent } from "@/lib/api/audit";
import { normalizeFIRMSHotspot, Signal, FIRMSHotspot } from "@/lib/services/signals";

const config = API_CONFIGS.NASA_FIRMS;

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(csv: string): FIRMSHotspot[] {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase());
  const hotspots: FIRMSHotspot[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const obj: Record<string, string> = {};

    headers.forEach((header, idx) => {
      obj[header] = values[idx] || "";
    });

    hotspots.push({
      latitude: parseFloat(obj.latitude) || 0,
      longitude: parseFloat(obj.longitude) || 0,
      brightness: parseFloat(obj.brightness) || parseFloat(obj.bright_ti4) || 0,
      scan: parseFloat(obj.scan) || 0,
      track: parseFloat(obj.track) || 0,
      acq_date: obj.acq_date || "",
      acq_time: obj.acq_time || "",
      satellite: obj.satellite || "",
      confidence: obj.confidence || "n",
      version: obj.version || "",
      bright_t31: parseFloat(obj.bright_t31) || parseFloat(obj.bright_ti5) || 0,
      frp: parseFloat(obj.frp) || 0,
      daynight: obj.daynight || "",
    });
  }

  return hotspots;
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

  const validation = validateAPIKey("NASA_FIRMS");
  if (!validation.valid) {
    logAuditEvent("key_validation", "NASA_FIRMS", {
      success: false,
      errorMessage: validation.message,
    });

    return NextResponse.json(
      {
        error: "NASA FIRMS API key not configured",
        message: validation.message,
        setupRequired: true,
      },
      { status: 503 }
    );
  }

  const apiKey = getAPIKey("NASA_FIRMS");
  const country = searchParams.get("country") || "IND";
  const days = Math.min(parseInt(searchParams.get("days") || "1"), 10);
  const source = searchParams.get("source") || "VIIRS_NOAA20_NRT";
  const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);

  try {
    logAuditEvent("api_request", "NASA_FIRMS", {
      success: true,
      metadata: { country, days, source },
    });

    const url = `${config.baseUrl}/country/csv/${apiKey}/${source}/${country}/${days}`;

    const response = await fetchWithRetry(url, {
      method: "GET",
      headers: {
        Accept: "text/csv",
      },
    });

    if (!response.ok) {
      const latencyMs = Date.now() - startTime;

      if (response.status === 401 || response.status === 403) {
        logAuditEvent("api_error", "NASA_FIRMS", {
          success: false,
          latencyMs,
          errorMessage: "Authentication failed - invalid API key",
        });

        return NextResponse.json(
          { error: "Invalid API key", provider: "NASA_FIRMS" },
          { status: 401 }
        );
      }

      if (response.status === 429) {
        logAuditEvent("api_rate_limited", "NASA_FIRMS", {
          success: false,
          latencyMs,
          errorMessage: "Rate limit exceeded",
        });

        return NextResponse.json(
          { error: "Rate limit exceeded", provider: "NASA_FIRMS", retryAfter: 600 },
          { status: 429 }
        );
      }

      logAuditEvent("api_error", "NASA_FIRMS", {
        success: false,
        latencyMs,
        errorMessage: `HTTP ${response.status}: ${response.statusText}`,
      });

      return NextResponse.json(
        { error: "Failed to fetch FIRMS data", status: response.status },
        { status: response.status }
      );
    }

    const csvData = await response.text();
    const latencyMs = Date.now() - startTime;

    const hotspots = parseCSV(csvData);
    const countryName = getCountryName(country);

    const signals: Signal[] = hotspots.slice(0, limit).map((hotspot) => normalizeFIRMSHotspot(hotspot, countryName));

    logAuditEvent("api_response", "NASA_FIRMS", {
      success: true,
      latencyMs,
      metadata: { hotspotCount: signals.length },
    });

    signals.forEach((signal) => {
      logAuditEvent("signal_ingested", "NASA_FIRMS", {
        success: true,
        metadata: { signalId: signal.id, severity: signal.severity },
      });
    });

    return NextResponse.json({
      success: true,
      provider: "NASA_FIRMS",
      timestamp: new Date().toISOString(),
      latencyMs,
      count: signals.length,
      signals,
    });
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    if (errorMessage.includes("abort")) {
      logAuditEvent("api_timeout", "NASA_FIRMS", {
        success: false,
        latencyMs,
        errorMessage: "Request timed out",
      });

      return NextResponse.json(
        { error: "Request timed out", provider: "NASA_FIRMS" },
        { status: 504 }
      );
    }

    logAuditEvent("api_error", "NASA_FIRMS", {
      success: false,
      latencyMs,
      errorMessage,
    });

    return NextResponse.json(
      { error: "Failed to fetch FIRMS data", message: errorMessage },
      { status: 500 }
    );
  }
}

function getCountryName(code: string): string {
  const countries: Record<string, string> = {
    IND: "India",
    USA: "United States",
    AUS: "Australia",
    BRA: "Brazil",
    CAN: "Canada",
  };
  return countries[code] || code;
}
