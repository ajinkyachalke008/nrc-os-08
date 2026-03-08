import { NextRequest, NextResponse } from "next/server";
import { IncidentDiscoveryService } from "@/lib/services/incident-discovery";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { decision, justification, operatorId } = await request.json();
    
    if (!decision || !["confirmed", "dismissed"].includes(decision)) {
      return NextResponse.json({ success: false, error: "Invalid decision" }, { status: 400 });
    }

    const updated = IncidentDiscoveryService.verifyCandidate(params.id, decision, justification, operatorId || "system");
    
    if (!updated) {
      return NextResponse.json({ success: false, error: "Candidate not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, candidate: updated });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Update failed" },
      { status: 500 }
    );
  }
}
