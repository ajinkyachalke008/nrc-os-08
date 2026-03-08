import { DashboardLayout } from "@/components/nrc/DashboardLayout";
import { TopBar } from "@/components/nrc/TopBar";
import { ResourcesDeployed } from "@/components/nrc/ResourcesDeployed";

export default function ResourcesPage() {
  return (
    <DashboardLayout>
      <TopBar title="Resource Management" />
      <main className="flex-1 p-6 overflow-hidden">
        <div className="h-[calc(100vh-140px)]">
          <ResourcesDeployed />
        </div>
      </main>
    </DashboardLayout>
  );
}
