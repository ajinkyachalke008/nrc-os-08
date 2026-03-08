import { DashboardLayout } from "@/components/nrc/DashboardLayout";
import { TopBar } from "@/components/nrc/TopBar";
import { IncidentMap } from "@/components/nrc/IncidentMap";

export default function MapPage() {
  return (
    <DashboardLayout>
      <TopBar title="Live Incident Map" />
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="h-[calc(100vh-140px)]">
          <IncidentMap />
        </div>
      </main>
    </DashboardLayout>
  );
}
