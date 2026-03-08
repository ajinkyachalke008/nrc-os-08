import { NextResponse } from "next/server";
import { IncidentDiscoveryService } from "@/lib/services/incident-discovery";

export async function POST() {
  try {
    const candidates = await IncidentDiscoveryService.discoverIncidents();
    return NextResponse.json({ 
      success: true, 
      candidates,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Discovery failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const candidates = IncidentDiscoveryService.getCandidates();
  const byStatus = IncidentDiscoveryService.getStatusCounts();
  const openRouterAvailable = IncidentDiscoveryService.isOpenRouterAvailable();
  
  return NextResponse.json({ 
    success: true,
    openRouterStatus: openRouterAvailable ? "active" : "unavailable",
    openRouterAvailable,
    candidateCount: candidates.length,
    byStatus,
    candidates 
  });
}
