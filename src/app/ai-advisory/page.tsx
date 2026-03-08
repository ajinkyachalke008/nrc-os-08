import { DashboardLayout } from "@/components/nrc/DashboardLayout";
import { TopBar } from "@/components/nrc/TopBar";
import { AIAdvisory } from "@/components/nrc/AIAdvisory";
import { AIIncidentDiscovery } from "@/components/nrc/AIIncidentDiscovery";

export default function AIAdvisoryPage() {
  return (
    <DashboardLayout>
      <TopBar title="AI Advisory System" />
      <main className="flex-1 p-6 overflow-hidden">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-140px)]">
          <div className="col-span-7 h-full">
            <AIAdvisory />
          </div>
          <div className="col-span-5 h-full">
            <AIIncidentDiscovery />
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
