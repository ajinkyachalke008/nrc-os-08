import { NextResponse } from "next/server";
import { IncidentDiscoveryService } from "@/lib/services/incident-discovery";

export async function GET() {
  const candidates = IncidentDiscoveryService.getCandidates();
  return NextResponse.json({ candidates });
}
