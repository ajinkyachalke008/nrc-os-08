import { APIProvider } from "../api/config";

export type SignalType = "earthquake" | "flood" | "cyclone" | "wildfire" | "fire" | "volcano" | "drought" | "landslide" | "collapse" | "roadblock" | "industrial" | "severe_weather" | "extreme_temperature" | "unknown";

export type SignalSeverity = "green" | "orange" | "red";

export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export interface Signal {
  id: string;
  externalId: string;
  source: APIProvider;
  type: SignalType;
  severity: SignalSeverity;
  severityScore: number;
  confidence: number;
  title: string;
  description: string;
  location: GeoCoordinates;
  locationName: string;
  country: string;
  affectedArea?: number;
  affectedPopulation?: number;
  startTime: Date;
  lastUpdate: Date;
  ingestedAt: Date;
  rawData?: Record<string, unknown>;
}

export interface GDACSEvent {
  eventid: string;
  eventtype: string;
  name: string;
  description: string;
  alertlevel: string;
  alertscore: number;
  country: string;
  fromdate: string;
  todate: string;
  latitude: number;
  longitude: number;
  episodeid?: string;
  severity?: {
    severitytext: string;
    severitylevel: number;
  };
  population?: {
    population: number;
    density: number;
  };
}

export interface FIRMSHotspot {
  latitude: number;
  longitude: number;
  brightness: number;
  scan: number;
  track: number;
  acq_date: string;
  acq_time: string;
  satellite: string;
  confidence: string;
  version: string;
  bright_t31: number;
  frp: number;
  daynight: string;
}

export interface OpenMeteoData {
  latitude: number;
  longitude: number;
  timezone: string;
  current?: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_gusts_10m: number;
  };
  hourly?: {
    time: string[];
    temperature_2m: number[];
    precipitation: number[];
    precipitation_probability: number[];
    weather_code: number[];
    wind_speed_10m: number[];
  };
  daily?: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
  };
}

export interface NOAAAlert {
  id: string;
  areaDesc: string;
  geocode: {
    SAME: string[];
    UGC: string[];
  };
  affectedZones: string[];
  sent: string;
  effective: string;
  onset: string;
  expires: string;
  ends: string;
  status: string;
  messageType: string;
  category: string;
  severity: string;
  certainty: string;
  urgency: string;
  event: string;
  headline: string;
  description: string;
  instruction: string;
  parameters: Record<string, string[]>;
}

export interface CopernicusActivation {
  activationId: string;
  eventType: string;
  title: string;
  countryCode: string;
  location: string;
  activationTime: string;
  status: string;
  products?: {
    productId: string;
    productType: string;
    downloadUrl?: string;
  }[];
}

export function mapGDACSEventType(eventtype: string): SignalType {
  const mapping: Record<string, SignalType> = {
    EQ: "earthquake",
    FL: "flood",
    TC: "cyclone",
    WF: "wildfire",
    VO: "volcano",
    DR: "drought",
  };
  return mapping[eventtype] || "unknown";
}

export function mapGDACSAlertLevel(alertlevel: string): SignalSeverity {
  const level = alertlevel?.toLowerCase();
  if (level === "red") return "red";
  if (level === "orange") return "orange";
  return "green";
}

export function normalizeGDACSEvent(event: GDACSEvent): Signal {
  const severityMapping: Record<string, number> = {
    red: 4,
    orange: 3,
    green: 1,
  };

  const alertLevel = mapGDACSAlertLevel(event.alertlevel);
  const severityScore = event.alertscore || severityMapping[alertLevel] || 1;

  return {
    id: `gdacs_${event.eventid}_${event.episodeid || "main"}`,
    externalId: event.eventid,
    source: "GDACS",
    type: mapGDACSEventType(event.eventtype),
    severity: alertLevel,
    severityScore: Math.min(severityScore, 5),
    confidence: Math.min(95, 70 + (event.alertscore || 0) * 5),
    title: event.name || `${event.eventtype} Alert - ${event.country}`,
    description: event.description || `${event.eventtype} event detected in ${event.country}`,
    location: {
      lat: event.latitude,
      lng: event.longitude,
    },
    locationName: event.country,
    country: event.country,
    affectedPopulation: event.population?.population,
    startTime: new Date(event.fromdate),
    lastUpdate: new Date(event.todate || event.fromdate),
    ingestedAt: new Date(),
    rawData: event as unknown as Record<string, unknown>,
  };
}

export function normalizeFIRMSHotspot(hotspot: FIRMSHotspot, country: string): Signal {
  const confidenceMap: Record<string, number> = {
    l: 40,
    n: 70,
    h: 90,
  };

  const confidence = confidenceMap[hotspot.confidence?.toLowerCase()] || 70;
  const frpSeverity = hotspot.frp > 100 ? "red" : hotspot.frp > 50 ? "orange" : "green";

  return {
    id: `firms_${hotspot.latitude}_${hotspot.longitude}_${hotspot.acq_date}_${hotspot.acq_time}`,
    externalId: `${hotspot.latitude}_${hotspot.longitude}_${hotspot.acq_date}`,
    source: "NASA_FIRMS",
    type: "wildfire",
    severity: frpSeverity,
    severityScore: hotspot.frp > 100 ? 4 : hotspot.frp > 50 ? 3 : 2,
    confidence,
    title: `Fire Detected - ${country}`,
    description: `Thermal anomaly detected by ${hotspot.satellite}. Brightness: ${hotspot.brightness}K, FRP: ${hotspot.frp}MW`,
    location: {
      lat: hotspot.latitude,
      lng: hotspot.longitude,
    },
    locationName: country,
    country,
    startTime: new Date(`${hotspot.acq_date} ${hotspot.acq_time.substring(0, 2)}:${hotspot.acq_time.substring(2)}`),
    lastUpdate: new Date(),
    ingestedAt: new Date(),
    rawData: hotspot as unknown as Record<string, unknown>,
  };
}

const WMO_WEATHER_CODES: Record<number, { description: string; severity: SignalSeverity; type: SignalType }> = {
  0: { description: "Clear sky", severity: "green", type: "severe_weather" },
  1: { description: "Mainly clear", severity: "green", type: "severe_weather" },
  2: { description: "Partly cloudy", severity: "green", type: "severe_weather" },
  3: { description: "Overcast", severity: "green", type: "severe_weather" },
  45: { description: "Fog", severity: "green", type: "severe_weather" },
  48: { description: "Depositing rime fog", severity: "orange", type: "severe_weather" },
  51: { description: "Light drizzle", severity: "green", type: "flood" },
  53: { description: "Moderate drizzle", severity: "green", type: "flood" },
  55: { description: "Dense drizzle", severity: "orange", type: "flood" },
  61: { description: "Slight rain", severity: "green", type: "flood" },
  63: { description: "Moderate rain", severity: "orange", type: "flood" },
  65: { description: "Heavy rain", severity: "red", type: "flood" },
  66: { description: "Light freezing rain", severity: "orange", type: "severe_weather" },
  67: { description: "Heavy freezing rain", severity: "red", type: "severe_weather" },
  71: { description: "Slight snow", severity: "green", type: "severe_weather" },
  73: { description: "Moderate snow", severity: "orange", type: "severe_weather" },
  75: { description: "Heavy snow", severity: "red", type: "severe_weather" },
  77: { description: "Snow grains", severity: "green", type: "severe_weather" },
  80: { description: "Slight rain showers", severity: "green", type: "flood" },
  81: { description: "Moderate rain showers", severity: "orange", type: "flood" },
  82: { description: "Violent rain showers", severity: "red", type: "flood" },
  85: { description: "Slight snow showers", severity: "orange", type: "severe_weather" },
  86: { description: "Heavy snow showers", severity: "red", type: "severe_weather" },
  95: { description: "Thunderstorm", severity: "orange", type: "severe_weather" },
  96: { description: "Thunderstorm with slight hail", severity: "red", type: "severe_weather" },
  99: { description: "Thunderstorm with heavy hail", severity: "red", type: "severe_weather" },
};

export function normalizeOpenMeteoData(data: OpenMeteoData, locationName: string): Signal[] {
  const signals: Signal[] = [];
  
  if (data.current) {
    const weatherInfo = WMO_WEATHER_CODES[data.current.weather_code] || { description: "Unknown", severity: "green" as const, type: "severe_weather" as const };
    
    const isSevere = data.current.precipitation > 10 || 
                     data.current.wind_speed_10m > 60 ||
                     data.current.wind_gusts_10m > 90 ||
                     data.current.temperature_2m > 45 ||
                     data.current.temperature_2m < -10;

    if (isSevere || weatherInfo.severity !== "green") {
      let severity: SignalSeverity = weatherInfo.severity;
      let severityScore = severity === "red" ? 4 : severity === "orange" ? 3 : 2;
      
      if (data.current.precipitation > 50) {
        severity = "red";
        severityScore = 5;
      } else if (data.current.precipitation > 25) {
        severity = "red";
        severityScore = 4;
      }

      signals.push({
        id: `openmeteo_${data.latitude}_${data.longitude}_${Date.now()}`,
        externalId: `${data.latitude}_${data.longitude}`,
        source: "OPEN_METEO",
        type: weatherInfo.type,
        severity,
        severityScore,
        confidence: 70,
        title: `${weatherInfo.description} - ${locationName}`,
        description: `Weather: ${weatherInfo.description}. Temp: ${data.current.temperature_2m}°C, Precipitation: ${data.current.precipitation}mm, Wind: ${data.current.wind_speed_10m}km/h (gusts ${data.current.wind_gusts_10m}km/h)`,
        location: { lat: data.latitude, lng: data.longitude },
        locationName,
        country: locationName,
        startTime: new Date(data.current.time),
        lastUpdate: new Date(),
        ingestedAt: new Date(),
        rawData: data as unknown as Record<string, unknown>,
      });
    }
  }

  if (data.daily) {
    for (let i = 0; i < Math.min(3, data.daily.time.length); i++) {
      const precipProb = data.daily.precipitation_probability_max?.[i] || 0;
      const precipSum = data.daily.precipitation_sum?.[i] || 0;
      
      if (precipProb > 70 && precipSum > 20) {
        const severity: SignalSeverity = precipSum > 50 ? "red" : precipSum > 30 ? "orange" : "green";
        
        signals.push({
          id: `openmeteo_forecast_${data.latitude}_${data.longitude}_${data.daily.time[i]}`,
          externalId: `forecast_${data.daily.time[i]}`,
          source: "OPEN_METEO",
          type: "flood",
          severity,
          severityScore: severity === "red" ? 4 : severity === "orange" ? 3 : 2,
          confidence: Math.min(precipProb, 85),
          title: `Heavy Rain Forecast - ${locationName} (${data.daily.time[i]})`,
          description: `Forecast: ${precipSum}mm precipitation expected with ${precipProb}% probability. High: ${data.daily.temperature_2m_max?.[i]}°C, Low: ${data.daily.temperature_2m_min?.[i]}°C`,
          location: { lat: data.latitude, lng: data.longitude },
          locationName,
          country: locationName,
          startTime: new Date(data.daily.time[i]),
          lastUpdate: new Date(),
          ingestedAt: new Date(),
          rawData: { day: data.daily.time[i], precipitation: precipSum, probability: precipProb },
        });
      }
    }
  }

  return signals;
}

export function normalizeNOAAAlert(alert: NOAAAlert): Signal {
  const severityMap: Record<string, SignalSeverity> = {
    Extreme: "red",
    Severe: "red",
    Moderate: "orange",
    Minor: "green",
    Unknown: "green",
  };

  const eventTypeMap: Record<string, SignalType> = {
    "Flash Flood": "flood",
    "Flood": "flood",
    "Coastal Flood": "flood",
    "Hurricane": "cyclone",
    "Tropical Storm": "cyclone",
    "Tornado": "severe_weather",
    "Severe Thunderstorm": "severe_weather",
    "Winter Storm": "severe_weather",
    "Extreme Heat": "extreme_temperature",
    "Extreme Cold": "extreme_temperature",
    "Fire Weather": "wildfire",
    "Red Flag": "wildfire",
  };

  const severity = severityMap[alert.severity] || "orange";
  let type: SignalType = "severe_weather";
  
  for (const [key, value] of Object.entries(eventTypeMap)) {
    if (alert.event.toLowerCase().includes(key.toLowerCase())) {
      type = value;
      break;
    }
  }

  return {
    id: `noaa_${alert.id}`,
    externalId: alert.id,
    source: "NOAA",
    type,
    severity,
    severityScore: severity === "red" ? 4 : severity === "orange" ? 3 : 2,
    confidence: alert.certainty === "Observed" ? 95 : alert.certainty === "Likely" ? 80 : 60,
    title: alert.headline || alert.event,
    description: alert.description?.substring(0, 500) || "",
    location: { lat: 0, lng: 0 },
    locationName: alert.areaDesc,
    country: "USA",
    startTime: new Date(alert.onset || alert.effective),
    lastUpdate: new Date(alert.sent),
    ingestedAt: new Date(),
    rawData: alert as unknown as Record<string, unknown>,
  };
}

export function normalizeCopernicusActivation(activation: CopernicusActivation): Signal {
  const eventTypeMap: Record<string, SignalType> = {
    "Flood": "flood",
    "Fire": "wildfire",
    "Earthquake": "earthquake",
    "Storm": "cyclone",
    "Landslide": "landslide",
    "Volcano": "volcano",
  };

  let type: SignalType = "unknown";
  for (const [key, value] of Object.entries(eventTypeMap)) {
    if (activation.eventType.toLowerCase().includes(key.toLowerCase())) {
      type = value;
      break;
    }
  }

  return {
    id: `copernicus_${activation.activationId}`,
    externalId: activation.activationId,
    source: "COPERNICUS",
    type,
    severity: "orange",
    severityScore: 3,
    confidence: 90,
    title: activation.title,
    description: `Copernicus EMS Activation: ${activation.eventType} in ${activation.location}`,
    location: { lat: 0, lng: 0 },
    locationName: activation.location,
    country: activation.countryCode,
    startTime: new Date(activation.activationTime),
    lastUpdate: new Date(),
    ingestedAt: new Date(),
    rawData: activation as unknown as Record<string, unknown>,
  };
}
