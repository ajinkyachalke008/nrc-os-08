import { DashboardLayout } from "@/components/nrc/DashboardLayout";
import { TopBar } from "@/components/nrc/TopBar";
import { SOPStatus } from "@/components/nrc/SOPStatus";

export default function SOPPage() {
  return (
    <DashboardLayout>
      <TopBar title="SOP Execution" />
      <main className="flex-1 p-6 overflow-hidden">
        <div className="h-[calc(100vh-140px)]">
          <SOPStatus />
        </div>
      </main>
    </DashboardLayout>
  );
}
