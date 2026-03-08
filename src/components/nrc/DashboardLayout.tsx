import { ReactNode } from "react";
import { AuroraBackground } from "@/components/nrc/AuroraBackground";
import { Sidebar } from "@/components/nrc/Sidebar";

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuroraBackground>
      <div className="h-screen flex overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </AuroraBackground>
  );
}
