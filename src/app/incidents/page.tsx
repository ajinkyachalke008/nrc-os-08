import { DashboardLayout } from "@/components/nrc/DashboardLayout";
import { TopBar } from "@/components/nrc/TopBar";
import { IncidentBriefing } from "@/components/nrc/IncidentBriefing";
import { ExternalSignals } from "@/components/nrc/ExternalSignals";
import { AICandidates } from "@/components/nrc/AICandidates";

export default function IncidentsPage() {
  return (
    <DashboardLayout>
      <TopBar title="Incident Management" />
      <main className="flex-1 p-6 overflow-hidden">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-140px)]">
          <div className="col-span-5 h-full">
            <IncidentBriefing />
          </div>
          <div className="col-span-4 h-full">
            <AICandidates />
          </div>
          <div className="col-span-3 h-full">
            <ExternalSignals />
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
