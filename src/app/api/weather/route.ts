import { NextResponse } from "next/server";
import { API_CONFIGS } from "@/lib/api/config";
import { logAuditEvent } from "@/lib/api/audit";
import { normalizeOpenMeteoData, Signal, OpenMeteoData } from "@/lib/services/signals";

const config = API_CONFIGS.OPEN_METEO;

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

const INDIA_CITIES = [
  { name: "Mumbai", lat: 19.076, lng: 72.8777 },
  { name: "Delhi", lat: 28.6139, lng: 77.209 },
  { name: "Kolkata", lat: 22.5726, lng: 88.3639 },
  { name: "Chennai", lat: 13.0827, lng: 80.2707 },
  { name: "Pune", lat: 18.5204, lng: 73.8567 },
  { name: "Bangalore", lat: 12.9716, lng: 77.5946 },
  { name: "Hyderabad", lat: 17.385, lng: 78.4867 },
  { name: "Ahmedabad", lat: 23.0225, lng: 72.5714 },
  { name: "Kolhapur", lat: 16.705, lng: 74.2433 },
  { name: "Nashik", lat: 19.9975, lng: 73.7898 },
];

export async function GET(request: Request) {
  const startTime = Date.now();
  const { searchParams } = new URL(request.url);

  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const location = searchParams.get("location") || "India";
  const forecast = searchParams.get("forecast") !== "false";
  const multiCity = searchParams.get("multi") === "true";

  try {
    logAuditEvent("api_request", "OPEN_METEO", {
      success: true,
      metadata: { lat, lng, location, forecast, multiCity },
    });

    const allSignals: Signal[] = [];
    const weatherData: OpenMeteoData[] = [];

    const locations = multiCity 
      ? INDIA_CITIES 
      : lat && lng 
        ? [{ name: location, lat: parseFloat(lat), lng: parseFloat(lng) }]
        : [INDIA_CITIES[0]];

    for (const loc of locations) {
      const url = new URL(`${config.baseUrl}/forecast`);
      url.searchParams.set("latitude", loc.lat.toString());
      url.searchParams.set("longitude", loc.lng.toString());
      url.searchParams.set("current", "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_gusts_10m");
      
      if (forecast) {
        url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max");
        url.searchParams.set("forecast_days", "7");
      }
      
      url.searchParams.set("timezone", "auto");

      const response = await fetchWithRetry(url.toString(), {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (response.ok) {
        const data: OpenMeteoData = await response.json();
        weatherData.push(data);
        
        const signals = normalizeOpenMeteoData(data, loc.name);
        allSignals.push(...signals);

        signals.forEach((signal) => {
          logAuditEvent("signal_ingested", "OPEN_METEO", {
            success: true,
            metadata: { signalId: signal.id, type: signal.type, severity: signal.severity },
          });
        });
      }
    }

    const latencyMs = Date.now() - startTime;

    logAuditEvent("api_response", "OPEN_METEO", {
      success: true,
      latencyMs,
      metadata: { signalCount: allSignals.length, locationCount: locations.length },
    });

    return NextResponse.json({
      success: true,
      provider: "OPEN_METEO",
      timestamp: new Date().toISOString(),
      latencyMs,
      requiresKey: false,
      confidenceWeight: config.confidenceWeight,
      count: allSignals.length,
      signals: allSignals,
      rawWeatherData: weatherData,
    });
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    if (errorMessage.includes("abort")) {
      logAuditEvent("api_timeout", "OPEN_METEO", {
        success: false,
        latencyMs,
        errorMessage: "Request timed out",
      });

      return NextResponse.json(
        { error: "Request timed out", provider: "OPEN_METEO" },
        { status: 504 }
      );
    }

    logAuditEvent("api_error", "OPEN_METEO", {
      success: false,
      latencyMs,
      errorMessage,
    });

    return NextResponse.json(
      { error: "Failed to fetch weather data", message: errorMessage },
      { status: 500 }
    );
  }
}
