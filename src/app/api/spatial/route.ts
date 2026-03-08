
import { NextRequest, NextResponse } from "next/server";
import { SpatialIntelligenceService } from "@/lib/services/spatial-intelligence";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") || "0");
  const lng = parseFloat(searchParams.get("lng") || "0");
  const radius = parseInt(searchParams.get("radius") || "1000");

  if (!lat || !lng) {
    return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });
  }

  try {
    const context = await SpatialIntelligenceService.getSpatialContext(lat, lng, radius);
    const scores = SpatialIntelligenceService.calculateSpatialScores(context);
    const zoneName = await SpatialIntelligenceService.getZoneName(lat, lng);

    return NextResponse.json({
      zoneName,
      context,
      scores,
      reasoning: SpatialIntelligenceService.getSpatialReasoning(scores, context)
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch spatial intelligence" }, { status: 500 });
  }
}
