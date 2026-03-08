import { DashboardLayout } from "@/components/nrc/DashboardLayout";
import { TopBar } from "@/components/nrc/TopBar";
import { AgencyCoordination } from "@/components/nrc/AgencyCoordination";

export default function AgenciesPage() {
  return (
    <DashboardLayout>
      <TopBar title="Agency Coordination" />
      <main className="flex-1 p-6 overflow-hidden">
        <div className="h-[calc(100vh-140px)]">
          <AgencyCoordination />
        </div>
      </main>
    </DashboardLayout>
  );
}
