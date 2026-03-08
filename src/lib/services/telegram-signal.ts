import { Signal, SignalType, SignalSeverity } from "./signals";
import { APIProvider } from "../api/config";
import { OpenRouterService } from "./openrouter.ts";

export interface TelegramSignalMetadata {
  chatId: number;
  messageId: number;
  userId?: number;
  username?: string;
  hasPhoto: boolean;
  caption?: string;
}

export class TelegramSignalService {
  private static STORAGE_KEY = "telegram_signals";
  private static inMemorySignals: Signal[] = [];

  static async normalizeMessage(
    text: string,
    metadata: TelegramSignalMetadata,
    location?: { lat: number; lng: number }
  ): Promise<Signal> {
    const signalId = `tg_${metadata.chatId}_${metadata.messageId}`;
    
    // AI Correlation & Enrichment
    const aiAnalysis = await this.analyzeWithAI(text, metadata.caption);

    const type: SignalType = aiAnalysis.type;
    const severity: SignalSeverity = aiAnalysis.severity;
    const confidence = aiAnalysis.confidence;

    const signal: Signal = {
      id: signalId,
      externalId: signalId,
      source: "TELEGRAM",
      type,
      severity,
      severityScore: severity === "red" ? 4 : severity === "orange" ? 3 : 2,
      confidence,
      title: aiAnalysis.title || `Telegram Signal: ${type}`,
      description: text || metadata.caption || "No content provided",
      location: location || { lat: 18.5204, lng: 73.8567 }, // Default to Pune area for demo
      locationName: aiAnalysis.locationName || "Reported via Telegram",
      country: "IND",
      startTime: new Date(),
      lastUpdate: new Date(),
      ingestedAt: new Date(),
      rawData: {
        ...metadata,
        aiAnalysis,
        rawText: text,
      } as any,
    };

    // Save to in-memory store
    this.inMemorySignals.unshift(signal);
    if (this.inMemorySignals.length > 50) this.inMemorySignals.pop();

    return signal;
  }

  static getSignals(): Signal[] {
    return this.inMemorySignals;
  }

  private static async analyzeWithAI(text: string, caption?: string) {
    const combinedText = `${text || ""} ${caption || ""}`.trim();
    
    try {
      const prompt = `
        Analyze this emergency signal from a Telegram message.
        Message: "${combinedText}"
        
        Extract:
        1. Incident Type (flood, fire, collapse, landslide, roadblock, or unknown)
        2. Severity (red, orange, green)
        3. Confidence (0-100)
        4. Brief Title
        5. Location Name (if mentioned)
        
        Return JSON ONLY:
        {
          "type": "flood",
          "severity": "orange",
          "confidence": 75,
          "title": "Flooding reported in Sector 4",
          "locationName": "Sector 4"
        }
      `;

      const response = await OpenRouterService.generateResponse(prompt, {
        systemPrompt: "You are an expert emergency signal analyst for the National Response Coordination System."
      });

      // Clean response for JSON parsing
      const jsonStr = response.choices?.[0]?.message?.content?.match(/\{[\s\S]*\}/)?.[0];
      if (jsonStr) {
        return JSON.parse(jsonStr);
      }
    } catch (e) {
      console.error("TelegramSignalService: AI Analysis failed", e);
    }

    // Fallback if AI fails or doesn't return JSON
    return {
      type: this.guessType(combinedText),
      severity: "orange",
      confidence: 40,
      title: "Unverified Telegram Signal",
      locationName: "Unknown"
    };
  }

  private static guessType(text: string): SignalType {
    const lower = text.toLowerCase();
    if (lower.includes("flood") || lower.includes("water")) return "flood";
    if (lower.includes("fire") || lower.includes("smoke")) return "fire";
    if (lower.includes("collapse") || lower.includes("fall")) return "collapse";
    if (lower.includes("landslide") || lower.includes("mud")) return "landslide";
    if (lower.includes("road") || lower.includes("block")) return "roadblock";
    return "unknown";
  }
}
