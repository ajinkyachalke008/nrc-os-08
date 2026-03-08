"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  AlertTriangle,
  Truck,
  Brain,
  FileText,
  MessageSquare,
  Users,
  Map,
  Shield,
  Database,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/incidents", label: "Incidents", icon: AlertTriangle },
  { href: "/resources", label: "Resources", icon: Truck },
  { href: "/map", label: "Live Map", icon: Map },
  { href: "/ai-advisory", label: "AI Advisory", icon: Brain },
  { href: "/sop", label: "SOP Status", icon: FileText },
  { href: "/comms", label: "Live Comms", icon: MessageSquare },
  { href: "/agencies", label: "Agencies", icon: Users },
  { href: "/api-status", label: "API Status", icon: Database },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-full border-r border-white/5 bg-nrc-base/30 flex flex-col">
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nrc-aurora-cyan to-nrc-aurora-blue flex items-center justify-center">
            <Shield size={20} className="text-nrc-base" />
          </div>
          <div>
            <h1 className="text-base font-bold text-nrc-text-primary">NRC-OS</h1>
            <p className="text-xs text-nrc-text-muted">Command Center</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-nrc-aurora-cyan/10 text-nrc-aurora-cyan border border-nrc-aurora-cyan/20"
                  : "text-nrc-text-muted hover:text-nrc-text-primary hover:bg-white/5"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <div className="px-3 py-2 rounded-xl bg-nrc-severity-l4/10 border border-nrc-severity-l4/20">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-nrc-severity-l4 animate-pulse" />
            <span className="text-xs font-medium text-nrc-severity-l4">4 Active Incidents</span>
          </div>
          <p className="text-xs text-nrc-text-muted mt-1">Maharashtra Region</p>
        </div>
      </div>
    </aside>
  );
}
