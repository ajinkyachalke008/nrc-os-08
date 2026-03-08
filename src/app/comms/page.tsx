import { DashboardLayout } from "@/components/nrc/DashboardLayout";
import { TopBar } from "@/components/nrc/TopBar";
import { LiveComms } from "@/components/nrc/LiveComms";

export default function CommsPage() {
  return (
    <DashboardLayout>
      <TopBar title="Live Communications" />
      <main className="flex-1 p-6 overflow-hidden">
        <div className="h-[calc(100vh-140px)]">
          <LiveComms />
        </div>
      </main>
    </DashboardLayout>
  );
}
