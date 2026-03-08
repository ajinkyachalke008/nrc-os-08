export type APIProvider = 
  | "GDACS" 
  | "NASA_FIRMS" 
  | "OPEN_METEO" 
  | "NOAA" 
  | "COPERNICUS" 
  | "OPENWEATHER" 
    | "IMD"
    | "OPENROUTER"
    | "TELEGRAM";

export type APIKeyStatus = "active" | "expiring" | "expired" | "revoked" | "not_required" | "degraded";

export interface APIKeyMetadata {
  provider: APIProvider;
  scope: string;
  permissions: string[];
  createdAt: Date;
  rotationDueAt: Date;
  status: APIKeyStatus;
  environment: "development" | "staging" | "production";
}

export interface APIConfig {
  provider: APIProvider;
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  rateLimit: {
    maxRequests: number;
    windowMs: number;
  };
  requiresKey: boolean;
  confidenceWeight: number;
  updateFrequencyMs: number;
  description: string;
  docsUrl: string;
  status: "active" | "inactive" | "pending" | "degraded";
}

export const API_CONFIGS: Record<APIProvider, APIConfig> = {
  GDACS: {
    provider: "GDACS",
    baseUrl: "https://www.gdacs.org/gdacsapi/api",
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    rateLimit: { maxRequests: 100, windowMs: 60000 },
    requiresKey: false,
    confidenceWeight: 0.95,
    updateFrequencyMs: 300000,
    description: "Global Disaster Alert and Coordination System - UN/EU disaster alerts",
    docsUrl: "https://www.gdacs.org/",
    status: "active",
  },
  NASA_FIRMS: {
    provider: "NASA_FIRMS",
    baseUrl: "https://firms.modaps.eosdis.nasa.gov/api",
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    rateLimit: { maxRequests: 5000, windowMs: 600000 },
    requiresKey: true,
    confidenceWeight: 0.9,
    updateFrequencyMs: 180000,
    description: "Fire Information for Resource Management System - Real-time satellite fire detection",
    docsUrl: "https://firms.modaps.eosdis.nasa.gov/",
    status: "active",
  },
  OPEN_METEO: {
    provider: "OPEN_METEO",
    baseUrl: "https://api.open-meteo.com/v1",
    timeout: 15000,
    retryAttempts: 3,
    retryDelay: 500,
    rateLimit: { maxRequests: 10000, windowMs: 86400000 },
    requiresKey: false,
    confidenceWeight: 0.7,
    updateFrequencyMs: 900000,
    description: "Open-source weather API - Global forecasts without API key",
    docsUrl: "https://open-meteo.com/en/docs",
    status: "active",
  },
  NOAA: {
    provider: "NOAA",
    baseUrl: "https://api.weather.gov",
    timeout: 20000,
    retryAttempts: 3,
    retryDelay: 1000,
    rateLimit: { maxRequests: 500, windowMs: 60000 },
    requiresKey: false,
    confidenceWeight: 0.85,
    updateFrequencyMs: 1800000,
    description: "National Oceanic and Atmospheric Administration - Cyclone tracking and climate data",
    docsUrl: "https://www.weather.gov/documentation/services-web-api",
    status: "active",
  },
  COPERNICUS: {
    provider: "COPERNICUS",
    baseUrl: "https://emergency.copernicus.eu/mapping/rest",
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    rateLimit: { maxRequests: 100, windowMs: 60000 },
    requiresKey: false,
    confidenceWeight: 0.9,
    updateFrequencyMs: 3600000,
    description: "EU Earth Observation - Flood extent, fire scar mapping, SAR monitoring",
    docsUrl: "https://emergency.copernicus.eu/",
    status: "active",
  },
  OPENWEATHER: {
    provider: "OPENWEATHER",
    baseUrl: "https://api.openweathermap.org/data/2.5",
    timeout: 15000,
    retryAttempts: 3,
    retryDelay: 500,
    rateLimit: { maxRequests: 60, windowMs: 60000 },
    requiresKey: true,
    confidenceWeight: 0.75,
    updateFrequencyMs: 600000,
    description: "OpenWeather API - Weather data and forecasts",
    docsUrl: "https://openweathermap.org/api",
    status: "active",
  },
  IMD: {
    provider: "IMD",
    baseUrl: "https://api.imd.gov.in",
    timeout: 20000,
    retryAttempts: 3,
    retryDelay: 1000,
    rateLimit: { maxRequests: 100, windowMs: 60000 },
    requiresKey: true,
    confidenceWeight: 0.85,
    updateFrequencyMs: 900000,
    description: "India Meteorological Department - Institutional access pending",
    docsUrl: "https://mausam.imd.gov.in/",
    status: "inactive",
  },
    OPENROUTER: {
      provider: "OPENROUTER",
      baseUrl: "https://openrouter.ai/api/v1",
      timeout: 60000,
      retryAttempts: 2,
      retryDelay: 2000,
      rateLimit: { maxRequests: 50, windowMs: 60000 },
      requiresKey: true,
      confidenceWeight: 0.8,
      updateFrequencyMs: 120000,
      description: "AI-powered real-time incident discovery and correlation engine",
      docsUrl: "https://openrouter.ai/docs",
      status: "active",
    },
    TELEGRAM: {
      provider: "TELEGRAM",
      baseUrl: "https://api.telegram.org",
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 500,
      rateLimit: { maxRequests: 30, windowMs: 1000 },
      requiresKey: true,
      confidenceWeight: 0.4,
      updateFrequencyMs: 0,
      description: "Telegram Bot Gateway - Human signal ingestion",
      docsUrl: "https://core.telegram.org/bots/api",
      status: "active",
    },
  };
  
  export const SOURCE_CONFIDENCE_WEIGHTS: Record<APIProvider, number> = {
    GDACS: 0.95,
    COPERNICUS: 0.9,
    NASA_FIRMS: 0.9,
    NOAA: 0.85,
    IMD: 0.85,
    OPENROUTER: 0.8,
    OPENWEATHER: 0.75,
    OPEN_METEO: 0.7,
    TELEGRAM: 0.4,
  };
  
  export function getAPIKey(provider: APIProvider): string | null {
    const keyMap: Record<APIProvider, string> = {
      GDACS: "",
      NASA_FIRMS: process.env.NASA_FIRMS_MAP_KEY || "",
      OPEN_METEO: "",
      NOAA: "",
      COPERNICUS: "",
      OPENWEATHER: process.env.OPENWEATHER_API_KEY || "",
      IMD: process.env.IMD_API_KEY || "",
      OPENROUTER: process.env.OPENROUTER_API_KEY || "",
      TELEGRAM: process.env.TELEGRAM_BOT_TOKEN || "",
    };

  const key = keyMap[provider];
  return key && key !== "" ? key : null;
}

export function validateAPIKey(provider: APIProvider): { valid: boolean; message: string } {
  const config = API_CONFIGS[provider];

  if (!config.requiresKey) {
    return { valid: true, message: `${provider} uses public API - no key required` };
  }

  if (config.status === "inactive") {
    return { valid: false, message: `${provider} - Institutional access pending` };
  }

  const key = getAPIKey(provider);
  
  if (!key) {
    return { valid: false, message: `${provider} API key not configured` };
  }

  if (key.includes("your_") || key.includes("_here")) {
    return { valid: false, message: `${provider} API key is placeholder value` };
  }

  return { valid: true, message: `${provider} API key configured` };
}

export function getAPIStatus(): Record<APIProvider, { available: boolean; message: string; requiresKey: boolean; confidenceWeight: number }> {
    const providers: APIProvider[] = ["GDACS", "NASA_FIRMS", "OPEN_METEO", "NOAA", "COPERNICUS", "OPENWEATHER", "IMD", "OPENROUTER", "TELEGRAM"];
    const status: Record<APIProvider, { available: boolean; message: string; requiresKey: boolean; confidenceWeight: number }> = {} as Record<APIProvider, { available: boolean; message: string; requiresKey: boolean; confidenceWeight: number }>;

  for (const provider of providers) {
    const config = API_CONFIGS[provider];
    const validation = validateAPIKey(provider);
    status[provider] = {
      available: validation.valid && config.status === "active",
      message: config.status === "inactive" ? "Institutional access pending" : validation.message,
      requiresKey: config.requiresKey,
      confidenceWeight: config.confidenceWeight,
    };
  }

  return status;
}

export function getActiveProviders(): APIProvider[] {
  const status = getAPIStatus();
  return (Object.keys(status) as APIProvider[]).filter(p => status[p].available);
}
