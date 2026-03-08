import { OpenRouterService, validateOpenRouterKey } from "./openrouter";
import { SignalIngestionService } from "./signal-ingestion";
import { SpatialIntelligenceService, SpatialScores } from "./spatial-intelligence";
import { logAuditEvent } from "../api/audit";

export interface CandidateIncident {
  id: string;
  incidentType: string;
  locationZone: string;
  coordinates?: { lat: number; lng: number };
  spatialScores?: SpatialScores;
  spatialReasoning?: string;
  confidenceScore: number;
  sourceCount: number;
  sourceTypes: string[];
  aiReasoningSummary: string;
  uncertaintyNotes: string;
  verificationRequired: boolean;
  status: "ai_detected" | "under_review" | "confirmed" | "dismissed";
  createdAt: string;
  lastUpdated: string;
  humanDecision?: {
    decision: string;
    justification: string;
    operatorId: string;
    timestamp: string;
  };
  rawSignals: any[];
}

let candidateIncidents: CandidateIncident[] = [];

export class IncidentDiscoveryService {
  private static readonly SYSTEM_PROMPT = `
You are the NRC-OS Real-Time Incident Discovery Engine. 
Your task is to analyze multiple data signals and detect early, emerging, or weak-signal real-world incidents.
Supported incident types: flood, bridge_blockage, building_collapse, urban_fire, landslide, infrastructure_failure, road_blockage, extreme_weather.

CRITICAL RULES:
1. Detect early signs of incidents that haven't been fully confirmed by official sources yet.
2. Correlate multiple signals (e.g., heavy rain + local traffic report + bridge sensor anomaly).
3. Provide a confidence score (0.0 to 1.0).
4. Explain your reasoning and uncertainty clearly.
5. Identify specific location zones and approximate coordinates if possible.
6. OUTPUT ONLY VALID JSON.

Response Format:
{
  "incidents": [
    {
      "incidentType": "flood",
      "locationZone": "Specific Location/Zone",
      "coordinates": {"lat": 40.7128, "lng": -74.0060},
      "confidenceScore": 0.85,
      "sourceIds": ["ID1", "ID2"],
      "aiReasoningSummary": "Detailed reasoning based on signals",
      "uncertaintyNotes": "What remains unclear"
    }
  ]
}
`;

  private static readonly MIN_CONFIDENCE = 0.55;
  private static readonly MIN_SOURCES = 2;
  private static readonly DUPLICATE_WINDOW_MS = 30 * 60 * 1000;

  static async discoverIncidents(): Promise<CandidateIncident[]> {
    try {
      const signals = await SignalIngestionService.getAllSignals();
      
      if (signals.length === 0) {
        return candidateIncidents;
      }

      const userContent = `Current Signals:\n${JSON.stringify(signals.map(s => ({
        id: s.id,
        type: s.type,
        location: s.location,
        description: s.description,
        confidence: s.confidence,
        timestamp: s.startTime,
        source: s.source
      })), null, 2)}`;

      const response = await OpenRouterService.analyzeSignals(this.SYSTEM_PROMPT, userContent);

      if (response) {
        const jsonStr = response.replace(/```json\n?|\n?```/g, "").trim();
        const data = JSON.parse(jsonStr);

        if (data.incidents && Array.isArray(data.incidents)) {
          for (const item of data.incidents) {
            const isDuplicate = candidateIncidents.some(existing => 
              existing.incidentType === item.incidentType && 
              existing.locationZone === item.locationZone && 
              (Date.now() - new Date(existing.createdAt).getTime()) < this.DUPLICATE_WINDOW_MS
            );

            if (!isDuplicate && item.confidenceScore >= this.MIN_CONFIDENCE && (item.sourceIds?.length || 0) >= this.MIN_SOURCES) {
              let spatialScores: SpatialScores | undefined;
              let spatialReasoning: string | undefined;

              if (item.coordinates?.lat && item.coordinates?.lng) {
                const context = await SpatialIntelligenceService.getSpatialContext(item.coordinates.lat, item.coordinates.lng);
                spatialScores = SpatialIntelligenceService.calculateSpatialScores(context, {
                  flood: item.incidentType === "flood" ? 0.8 : 0,
                  fire: item.incidentType === "fire" ? 0.8 : 0,
                });
                spatialReasoning = SpatialIntelligenceService.getSpatialReasoning(spatialScores, context);
              }

              const candidate: CandidateIncident = {
                id: `CAND-${Date.now()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
                incidentType: item.incidentType,
                locationZone: item.locationZone,
                coordinates: item.coordinates,
                spatialScores,
                spatialReasoning,
                confidenceScore: item.confidenceScore,
                sourceCount: item.sourceIds?.length || 0,
                sourceTypes: [...new Set(signals.filter(s => item.sourceIds?.includes(s.id)).map(s => s.source))],
                aiReasoningSummary: item.aiReasoningSummary,
                uncertaintyNotes: item.uncertaintyNotes,
                verificationRequired: true,
                status: "ai_detected",
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                rawSignals: signals.filter(s => item.sourceIds?.includes(s.id)),
              };
              
              candidateIncidents.unshift(candidate);
              
              logAuditEvent("incident_created", "OPENROUTER", {
                success: true,
                metadata: {
                  candidateId: candidate.id,
                  type: candidate.incidentType,
                  confidence: candidate.confidenceScore,
                  sourceCount: candidate.sourceCount
                }
              });
            }
          }
        }
      }
    } catch (e) {
      console.error("IncidentDiscoveryService: Discovery failed", e);
    }

    return candidateIncidents;
  }

  static getCandidates(): CandidateIncident[] {
    return candidateIncidents;
  }

  static getStatusCounts() {
    return {
      ai_detected: candidateIncidents.filter(c => c.status === "ai_detected").length,
      under_review: candidateIncidents.filter(c => c.status === "under_review").length,
      confirmed: candidateIncidents.filter(c => c.status === "confirmed").length,
      dismissed: candidateIncidents.filter(c => c.status === "dismissed").length,
    };
  }

  static isOpenRouterAvailable(): boolean {
    return validateOpenRouterKey().valid;
  }

  static verifyCandidate(id: string, decision: "confirmed" | "dismissed", justification: string, operatorId: string): CandidateIncident | null {
    const index = candidateIncidents.findIndex(i => i.id === id);
    if (index !== -1) {
      const candidate = candidateIncidents[index];
      candidate.status = decision;
      candidate.humanDecision = {
        decision,
        justification,
        operatorId,
        timestamp: new Date().toISOString()
      };
      candidate.lastUpdated = new Date().toISOString();

      logAuditEvent("incident_enriched", "OPENROUTER", {
        success: true,
        metadata: {
          candidateId: id,
          humanDecision: decision,
          justification
        }
      });

      return candidate;
    }
    return null;
  }
}
