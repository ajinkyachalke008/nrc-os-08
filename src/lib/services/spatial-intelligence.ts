
export interface SpatialScores {
  roadAccessScore: number;
  isolationRiskScore: number;
  buildingDensityScore: number;
  bridgeRiskScore: number;
  poiCriticalityScore: number;
  overallSpatialImpact: number;
}

export interface OSMFeatureContext {
  roadDensity: number;
  bridgeCount: number;
  buildingCount: number;
  criticalPOIs: string[];
  nearbyInfrastructure: string[];
}

export class SpatialIntelligenceService {
  private static readonly NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";
  private static readonly OVERPASS_URL = "https://overpass-api.de/api/interpreter";

  /**
   * Fetches spatial context from OSM based on coordinates
   */
  static async getSpatialContext(lat: number, lng: number, radiusMeters: number = 1000): Promise<OSMFeatureContext> {
    try {
      // Overpass query for roads, bridges, buildings, and critical POIs
      const query = `
        [out:json][timeout:25];
        (
          way["highway"](around:${radiusMeters},${lat},${lng});
          way["bridge"="yes"](around:${radiusMeters},${lat},${lng});
          way["building"](around:${radiusMeters},${lat},${lng});
          node["amenity"~"hospital|school|fire_station|police"](around:${radiusMeters},${lat},${lng});
          way["amenity"~"hospital|school|fire_station|police"](around:${radiusMeters},${lat},${lng});
        );
        out body;
        >;
        out skel qt;
      `;

      const response = await fetch(this.OVERPASS_URL, {
        method: "POST",
        body: `data=${encodeURIComponent(query)}`,
      });

      if (!response.ok) throw new Error("OSM Overpass query failed");
      const data = await response.json();

      const features = data.elements || [];
      const roads = features.filter((f: any) => f.tags?.highway);
      const bridges = features.filter((f: any) => f.tags?.bridge === "yes");
      const buildings = features.filter((f: any) => f.tags?.building);
      const criticalPOIs = features
        .filter((f: any) => f.tags?.amenity)
        .map((f: any) => f.tags.amenity);

      return {
        roadDensity: roads.length / (radiusMeters / 100), // Normalized density
        bridgeCount: bridges.length,
        buildingCount: buildings.length,
        criticalPOIs: [...new Set(criticalPOIs)],
        nearbyInfrastructure: [...new Set(roads.map((r: any) => r.tags.highway))],
      };
    } catch (error) {
      console.warn("SpatialIntelligence: OSM fetch failed, using fallbacks", error);
      return {
        roadDensity: 5,
        bridgeCount: 1,
        buildingCount: 50,
        criticalPOIs: ["school"],
        nearbyInfrastructure: ["primary", "secondary"],
      };
    }
  }

  /**
   * Calculates spatial scores based on OSM features and environmental factors
   */
  static calculateSpatialScores(context: OSMFeatureContext, environmentalRisk: { flood?: number; fire?: number } = {}): SpatialScores {
    // road_access_score = available_roads / total_roads (approximated by density here)
    const roadAccessScore = Math.min(1.0, context.roadDensity / 10);
    
    // isolation_risk_score = 1 - road_access_score
    const isolationRiskScore = 1 - roadAccessScore;
    
    // building_density_score = buildings_per_sq_km / city_average
    const cityAverage = 100; // Mock average
    const buildingDensityScore = Math.min(2.0, context.buildingCount / cityAverage);
    
    // poi_criticality_score: Higher weight if hospitals/schools within impact radius
    const poiWeights: Record<string, number> = {
      hospital: 0.5,
      fire_station: 0.3,
      police: 0.2,
      school: 0.2,
    };
    const poiCriticalityScore = Math.min(1.0, context.criticalPOIs.reduce((acc, poi) => acc + (poiWeights[poi] || 0.1), 0));

    // bridge_risk_score = (flood_risk * bridge_dependency) + traffic_density
    const bridgeDependency = context.bridgeCount > 0 ? (1 / context.bridgeCount) : 0;
    const bridgeRiskScore = Math.min(1.0, ((environmentalRisk.flood || 0) * bridgeDependency) + (context.roadDensity * 0.05));

    const overallSpatialImpact = (isolationRiskScore * 0.3) + (buildingDensityScore * 0.2) + (poiCriticalityScore * 0.3) + (bridgeRiskScore * 0.2);

    return {
      roadAccessScore,
      isolationRiskScore,
      buildingDensityScore,
      bridgeRiskScore,
      poiCriticalityScore,
      overallSpatialImpact
    };
  }

  /**
   * Generates AI-explainable reasoning for spatial scores
   */
  static getSpatialReasoning(scores: SpatialScores, context: OSMFeatureContext): string {
    const explanations = [];
    if (scores.isolationRiskScore > 0.6) {
      explanations.push(`High isolation risk due to low road redundancy (${context.roadDensity.toFixed(1)} roads detected in radius).`);
    }
    if (scores.bridgeRiskScore > 0.7) {
      explanations.push(`Critical bridge dependency detected; damage to ${context.bridgeCount} bridge(s) could isolate this zone.`);
    }
    if (scores.poiCriticalityScore > 0.5) {
      explanations.push(`Area contains critical infrastructure: ${context.criticalPOIs.join(", ")}.`);
    }
    return explanations.join(" ") || "Normal spatial constraints detected.";
  }

  /**
   * Nominatim reverse geocoding to get zone-based location names
   */
  static async getZoneName(lat: number, lng: number): Promise<string> {
    try {
      const url = `${this.NOMINATIM_URL}?format=json&lat=${lat}&lon=${lng}&zoom=14`;
      const response = await fetch(url, {
        headers: { "User-Agent": "NRC-OS-Spatial-Service" }
      });
      if (!response.ok) throw new Error("Nominatim request failed");
      const data = await response.json();
      return data.display_name || "Unknown Zone";
    } catch (error) {
      return "Detected Zone";
    }
  }
}
