"use client";

import { GlassPanel } from "./GlassPanel";
import { Activity, TrendingUp, Users, AlertCircle } from "lucide-react";

interface Stat {
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: React.ReactNode;
}

const stats: Stat[] = [
  {
    label: "Active Incidents",
    value: "4",
    change: "+1",
    trend: "up",
    icon: <AlertCircle size={16} className="text-nrc-severity-l4" />,
  },
  {
    label: "Resources Deployed",
    value: "23",
    change: "67%",
    trend: "neutral",
    icon: <Activity size={16} className="text-nrc-aurora-cyan" />,
  },
  {
    label: "Response Rate",
    value: "94%",
    change: "+2%",
    trend: "up",
    icon: <TrendingUp size={16} className="text-nrc-severity-l2" />,
  },
  {
    label: "Personnel Active",
    value: "156",
    icon: <Users size={16} className="text-nrc-aurora-blue" />,
  },
];

export function QuickStats() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {stats.map((stat) => (
        <GlassPanel
          key={stat.label}
          variant="sunken"
        >
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              {stat.icon}
              {stat.change && (
                <span
                  className={`text-xs font-mono ${
                    stat.trend === "up"
                      ? "text-nrc-severity-l2"
                      : stat.trend === "down"
                      ? "text-nrc-severity-l5"
                      : "text-nrc-text-muted"
                  }`}
                >
                  {stat.change}
                </span>
              )}
            </div>
            <div className="text-2xl font-semibold text-nrc-text-primary">
              {stat.value}
            </div>
            <div className="text-xs text-nrc-text-muted mt-1">{stat.label}</div>
          </div>
        </GlassPanel>
      ))}
    </div>
  );
}
