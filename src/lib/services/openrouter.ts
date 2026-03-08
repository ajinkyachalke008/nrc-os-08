import { API_CONFIGS, getAPIKey } from "../api/config";
import { logAuditEvent } from "../api/audit";

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      content: string;
    };
  }[];
  model: string;
}

interface CacheEntry {
  content: string;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 120 * 1000; // 120 seconds as requested

export function validateOpenRouterKey(): { valid: boolean; message: string } {
  const apiKey = getAPIKey("OPENROUTER");
  if (!apiKey) return { valid: false, message: "OpenRouter API key not configured" };
  if (apiKey.includes("your_")) return { valid: false, message: "OpenRouter API key is placeholder" };
  return { valid: true, message: "OpenRouter API key configured" };
}

export class OpenRouterService {
  private static readonly MODEL = "google/gemini-2.0-flash-001"; // Fast and capable for detection

  static async analyzeSignals(systemPrompt: string, userContent: string): Promise<string | null> {
    const cacheKey = btoa(systemPrompt + userContent).substring(0, 32);
    const cached = cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
      return cached.content;
    }

    const config = API_CONFIGS.OPENROUTER;
    const apiKey = getAPIKey("OPENROUTER");

    if (!apiKey) {
      logAuditEvent("api_error", "OPENROUTER", {
        success: false,
        errorMessage: "API key not configured",
      });
      return null;
    }

    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6000ms timeout as requested

      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://nrc-os.org",
          "X-Title": "NRC-OS Incident Discovery",
        },
        body: JSON.stringify({
          model: this.MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
          temperature: 0.1,
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        logAuditEvent("api_error", "OPENROUTER", {
          success: false,
          errorMessage: `API responded with ${response.status}: ${errorText}`,
          latencyMs,
        });
        return null;
      }

      const data: OpenRouterResponse = await response.json();
      const content = data.choices[0]?.message.content || null;

      if (content) {
        cache.set(cacheKey, { content, timestamp: Date.now() });
        
        logAuditEvent("api_response", "OPENROUTER", {
          success: true,
          latencyMs,
          metadata: {
            model: data.model,
            tokens: content.length,
          },
        });
      }

      return content;
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      const errorMessage = error instanceof Error && error.name === 'AbortError' 
        ? 'Request timed out (6s)' 
        : error instanceof Error ? error.message : "Unknown error";

      logAuditEvent("api_error", "OPENROUTER", {
        success: false,
        errorMessage,
        latencyMs,
      });
      return null;
    }
  }
}
