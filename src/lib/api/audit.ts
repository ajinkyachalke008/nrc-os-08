import { APIProvider } from "../api/config";

export type AuditEventType = 
  | "api_request"
  | "api_response"
  | "api_error"
  | "api_timeout"
  | "api_rate_limited"
  | "key_validation"
  | "signal_ingested"
  | "signal_merged"
  | "incident_created"
  | "incident_enriched"
  | "fallback_activated";

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  provider: APIProvider;
  environment: string;
  incidentId?: string;
  success: boolean;
  latencyMs?: number;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

const auditLogs: AuditLogEntry[] = [];
const MAX_LOGS = 10000;

function generateId(): string {
  return `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const forbidden = ["key", "api_key", "apikey", "token", "secret", "password", "authorization"];
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(metadata)) {
    const lowerKey = key.toLowerCase();
    if (forbidden.some((f) => lowerKey.includes(f))) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeMetadata(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export function logAuditEvent(
  eventType: AuditEventType,
  provider: APIProvider,
  options: {
    success: boolean;
    incidentId?: string;
    latencyMs?: number;
    errorMessage?: string;
    metadata?: Record<string, unknown>;
  }
): AuditLogEntry {
  const entry: AuditLogEntry = {
    id: generateId(),
    timestamp: new Date(),
    eventType,
    provider,
    environment: process.env.NODE_ENV || "development",
    success: options.success,
    incidentId: options.incidentId,
    latencyMs: options.latencyMs,
    errorMessage: options.errorMessage ? options.errorMessage.substring(0, 500) : undefined,
    metadata: options.metadata ? sanitizeMetadata(options.metadata) : undefined,
  };

  auditLogs.unshift(entry);

  if (auditLogs.length > MAX_LOGS) {
    auditLogs.splice(MAX_LOGS);
  }

  if (process.env.NODE_ENV === "development") {
    console.log(`[AUDIT] ${entry.eventType} | ${entry.provider} | ${entry.success ? "SUCCESS" : "FAILURE"}`);
  }

  return entry;
}

export function getAuditLogs(options?: {
  provider?: APIProvider;
  eventType?: AuditEventType;
  success?: boolean;
  limit?: number;
  since?: Date;
}): AuditLogEntry[] {
  let filtered = [...auditLogs];

  if (options?.provider) {
    filtered = filtered.filter((log) => log.provider === options.provider);
  }

  if (options?.eventType) {
    filtered = filtered.filter((log) => log.eventType === options.eventType);
  }

  if (options?.success !== undefined) {
    filtered = filtered.filter((log) => log.success === options.success);
  }

  if (options?.since) {
    filtered = filtered.filter((log) => log.timestamp >= options.since);
  }

  if (options?.limit) {
    filtered = filtered.slice(0, options.limit);
  }

  return filtered;
}

export function getAuditStats(since?: Date): {
  totalRequests: number;
  successRate: number;
  avgLatencyMs: number;
  byProvider: Record<APIProvider, { count: number; successRate: number }>;
} {
  const logs = since ? auditLogs.filter((log) => log.timestamp >= since) : auditLogs;
  const apiRequests = logs.filter((log) => log.eventType === "api_request" || log.eventType === "api_response");

  const totalRequests = apiRequests.length;
  const successCount = apiRequests.filter((log) => log.success).length;
  const successRate = totalRequests > 0 ? (successCount / totalRequests) * 100 : 100;

  const latencies = apiRequests.filter((log) => log.latencyMs !== undefined).map((log) => log.latencyMs!);
  const avgLatencyMs = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;

  const providers: APIProvider[] = ["GDACS", "NASA_FIRMS", "OPEN_METEO", "NOAA", "COPERNICUS", "OPENWEATHER", "IMD", "OPENROUTER"];
  const byProvider = {} as Record<APIProvider, { count: number; successRate: number }>;

  for (const provider of providers) {
    const providerLogs = apiRequests.filter((log) => log.provider === provider);
    const providerSuccess = providerLogs.filter((log) => log.success).length;
    byProvider[provider] = {
      count: providerLogs.length,
      successRate: providerLogs.length > 0 ? (providerSuccess / providerLogs.length) * 100 : 100,
    };
  }

  return { totalRequests, successRate, avgLatencyMs, byProvider };
}
