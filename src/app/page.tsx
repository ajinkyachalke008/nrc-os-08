import { DashboardLayout } from "@/components/nrc/DashboardLayout";
import { TopBar } from "@/components/nrc/TopBar";
import { GlassPanel } from "@/components/nrc/GlassPanel";
import { AICandidateList } from "@/components/nrc/AICandidateList";
import { 
  AlertTriangle, Droplets, Building2, Mountain, ArrowRight, 
  Activity, Users, Truck, Brain, ClipboardList, MessageSquare,
  TrendingUp, Shield, Flame, MapPin, Clock, Radio, Zap
} from "lucide-react";
import Link from "next/link";

const activeIncidents = [
  { id: "INC-001", title: "Kolhapur Flash Flood", severity: 4, type: "flood", phase: "Response", resources: 156, escalating: true },
  { id: "INC-002", title: "Pune Urban Flooding", severity: 3, type: "flood", phase: "Response", resources: 78, escalating: true },
  { id: "INC-003", title: "Nashik Collapse", severity: 4, type: "collapse", phase: "Containment", resources: 92, escalating: false },
  { id: "INC-004", title: "Lonavala Landslide", severity: 3, type: "landslide", phase: "Detection", resources: 34, escalating: true },
];

const severityColors: Record<number, string> = {
  1: "#4DABF7", 2: "#51CF66", 3: "#FCC419", 4: "#FF922B", 5: "#FA5252"
};

const typeIcons: Record<string, typeof Droplets> = {
  flood: Droplets, fire: Flame, collapse: Building2, landslide: Mountain
};

const systemModules = [
  { href: "/incidents", label: "Incidents", icon: AlertTriangle, count: 5, status: "critical", color: "#FA5252" },
  { href: "/resources", label: "Resources", icon: Truck, count: 388, status: "active", color: "#2AFADF" },
  { href: "/map", label: "Live Map", icon: MapPin, status: "live", color: "#4C6EF5" },
  { href: "/ai-discovery", label: "AI Discovery", icon: Brain, status: "new", color: "#9C36B5" },
  { href: "/ai-advisory", label: "AI Advisory", icon: Brain, count: 4, status: "pending", color: "#9C36B5" },
  { href: "/sop", label: "SOP Status", icon: ClipboardList, status: "active", color: "#51CF66" },
  { href: "/comms", label: "Live Comms", icon: MessageSquare, count: 8, status: "unread", color: "#FF922B" },
];

const quickStats = [
  { label: "Active Incidents", value: "5", change: "+1", trend: "up", icon: AlertTriangle, color: "#FA5252" },
  { label: "Resources Deployed", value: "388", percent: "67%", icon: Truck, color: "#2AFADF" },
  { label: "Personnel Active", value: "945", icon: Users, color: "#4C6EF5" },
  { label: "AI Advisories", value: "4", status: "pending", icon: Brain, color: "#9C36B5" },
];

const recentDecisions = [
  { id: "DEC-001", action: "Evacuate Zone H - Kolhapur", authority: "Cmdr. Sharma", time: "09:35", status: "executed" },
  { id: "DEC-002", action: "Deploy 4 rescue boats", authority: "Pending", time: "09:40", status: "pending" },
  { id: "DEC-003", action: "Close Route A - Pune", authority: "Traffic Control", time: "09:28", status: "executed" },
];

export default function Home() {
  return (
    <DashboardLayout>
      <TopBar title="Command Dashboard" />
      
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            {quickStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <GlassPanel key={stat.label} variant="sunken">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}20` }}>
                        <Icon size={18} style={{ color: stat.color }} />
                      </div>
                      {stat.change && (
                        <span className={`flex items-center gap-1 text-xs font-mono ${stat.trend === "up" ? "text-nrc-severity-l5" : "text-nrc-severity-l2"}`}>
                          <TrendingUp size={10} />
                          {stat.change}
                        </span>
                      )}
                      {stat.percent && (
                        <span className="text-xs font-mono text-nrc-text-muted">{stat.percent}</span>
                      )}
                      {stat.status && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-nrc-aurora-purple/20 text-nrc-aurora-purple">
                          {stat.status.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-nrc-text-primary mb-1">{stat.value}</p>
                    <p className="text-xs text-nrc-text-muted">{stat.label}</p>
                  </div>
                </GlassPanel>
              );
            })}
          </div>

          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-8">
              <GlassPanel 
                title="Active Incidents" 
                icon={<AlertTriangle size={16} />}
                headerAction={
                  <Link href="/incidents" className="flex items-center gap-1 text-xs text-nrc-aurora-cyan hover:underline">
                    View All <ArrowRight size={12} />
                  </Link>
                }
              >
                <div className="p-4 space-y-3">
                  {activeIncidents.map((incident) => {
                    const Icon = typeIcons[incident.type] || AlertTriangle;
                    return (
                      <Link
                        key={incident.id}
                        href="/incidents"
                        className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
                      >
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${severityColors[incident.severity]}20` }}
                        >
                          <Icon size={18} style={{ color: severityColors[incident.severity] }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-nrc-text-primary">{incident.title}</span>
                            {incident.escalating && (
                              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-nrc-severity-l5/20 text-nrc-severity-l5 text-[10px]">
                                <TrendingUp size={8} /> ESCALATING
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-nrc-text-muted">
                            <span className="font-mono">{incident.id}</span>
                            <span>•</span>
                            <span>{incident.phase}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Users size={10} /> {incident.resources}
                            </span>
                          </div>
                        </div>
                        <span
                          className="px-2 py-1 rounded text-xs font-bold"
                          style={{ backgroundColor: `${severityColors[incident.severity]}20`, color: severityColors[incident.severity] }}
                        >
                          L{incident.severity}
                        </span>
                        <ArrowRight size={16} className="text-nrc-text-muted group-hover:text-nrc-aurora-cyan transition-colors" />
                      </Link>
                    );
                  })}
                </div>
              </GlassPanel>
            </div>

            <div className="col-span-4 space-y-6">
              <AICandidateList />

              <GlassPanel 
                title="Recent Decisions" 
                icon={<Shield size={16} />}
                headerAction={
                  <span className="flex items-center gap-1 text-xs text-nrc-text-muted">
                    <Activity size={10} /> Live
                  </span>
                }
              >
                <div className="p-4 space-y-2">
                  {recentDecisions.map((decision) => (
                    <div 
                      key={decision.id} 
                      className={`p-3 rounded-lg ${decision.status === "pending" ? "bg-nrc-severity-l4/10 border border-nrc-severity-l4/20" : "bg-white/5"}`}
                    >
                      <p className="text-sm text-nrc-text-primary mb-1">{decision.action}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-nrc-text-muted">{decision.authority} • {decision.time}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          decision.status === "executed" ? "bg-nrc-severity-l2/20 text-nrc-severity-l2" : "bg-nrc-severity-l4/20 text-nrc-severity-l4"
                        }`}>
                          {decision.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassPanel>

              <GlassPanel title="System Status">
                <div className="p-4 space-y-2">
                  {[
                    { name: "NDMA Link", status: "Online", color: "bg-nrc-severity-l2" },
                    { name: "State EOC", status: "Online", color: "bg-nrc-severity-l2" },
                    { name: "District Network", status: "Online", color: "bg-nrc-severity-l2" },
                    { name: "AI Discovery Engine", status: "Active", color: "bg-nrc-aurora-purple" },
                    { name: "OpenRouter Link", status: "Connected", color: "bg-nrc-aurora-cyan" },
                  ].map((system) => (
                    <div key={system.name} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                      <div className={`w-2 h-2 rounded-full ${system.color}`} />
                      <span className="text-sm text-nrc-text-primary flex-1">{system.name}</span>
                      <span className="text-xs text-nrc-text-muted">{system.status}</span>
                    </div>
                  ))}
                </div>
              </GlassPanel>
            </div>
          </div>

          <GlassPanel title="Quick Access Modules">
            <div className="p-4 grid grid-cols-7 gap-3">
              {systemModules.map((module) => {
                const Icon = module.icon;
                return (
                  <Link
                    key={module.href}
                    href={module.href}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all group"
                  >
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `${module.color}20` }}
                    >
                      <Icon size={20} style={{ color: module.color }} />
                    </div>
                    <span className="text-xs font-medium text-nrc-text-primary">{module.label}</span>
                    {module.count !== undefined && (
                      <span 
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{ backgroundColor: `${module.color}20`, color: module.color }}
                      >
                        {module.count}
                      </span>
                    )}
                    {module.status && !module.count && (
                      <span className="text-[10px] text-nrc-text-muted uppercase">{module.status}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </GlassPanel>
        </div>
      </main>
    </DashboardLayout>
  );
}
