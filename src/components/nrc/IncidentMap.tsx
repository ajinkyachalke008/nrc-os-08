
"use client";

import { useState, useEffect } from "react";
import { GlassPanel } from "./GlassPanel";
import { 
  Map as MapIcon, Layers, Clock, Eye, AlertTriangle, Droplets, Flame,
  Building2, Mountain, Users, Truck, Activity, ZoomIn, ZoomOut,
  Maximize2, Filter, Play, Pause, ChevronRight, MapPin, Shield, Info
} from "lucide-react";

type LayerType = "incidents" | "resources" | "spatial_scores" | "bridge_risk" | "infrastructure";
type IncidentType = "flood" | "fire" | "collapse" | "landslide";

interface MapLayer {
  id: LayerType;
  name: string;
  icon: typeof Layers;
  color: string;
  active: boolean;
}

interface IncidentMarker {
  id: string;
  lat: number;
  lng: number;
  severity: 1 | 2 | 3 | 4 | 5;
  type: IncidentType;
  label: string;
  phase: string;
  resources: number;
  spatialScores?: {
    isolationRiskScore: number;
    bridgeRiskScore: number;
    roadAccessScore: number;
  };
}

const severityColors: Record<number, string> = {
  1: "#4DABF7", 2: "#51CF66", 3: "#FCC419", 4: "#FF922B", 5: "#FA5252"
};

const typeIcons: Record<IncidentType, typeof Droplets> = {
  flood: Droplets, fire: Flame, collapse: Building2, landslide: Mountain
};

const initialLayers: MapLayer[] = [
  { id: "incidents", name: "Active Incidents", icon: AlertTriangle, color: "#FA5252", active: true },
  { id: "spatial_scores", name: "Spatial Intelligence", icon: Shield, color: "#9C36B5", active: true },
  { id: "bridge_risk", name: "Bridge & Route Risk", icon: Mountain, color: "#FF922B", active: false },
  { id: "resources", name: "Resource Positions", icon: Truck, color: "#2AFADF", active: true },
  { id: "infrastructure", name: "Critical POIs (OSM)", icon: Building2, color: "#FCC419", active: false },
];

export function IncidentMap() {
  const [layers, setLayers] = useState(initialLayers);
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [zoom, setZoom] = useState(12);
  const [center, setCenter] = useState({ lat: 18.5204, lng: 73.8567 }); // Pune/Maharashtra area
  const [mapType, setMapType] = useState<"standard" | "topo">("standard");

  const toggleLayer = (id: LayerType) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, active: !l.active } : l));
  };

  // Mock incidents with spatial data
  const incidents: IncidentMarker[] = [
    { 
      id: "INC-001", lat: 18.5204, lng: 73.8567, severity: 4, type: "flood", label: "Pune Urban Flooding", phase: "Response", resources: 156,
      spatialScores: { isolationRiskScore: 0.72, bridgeRiskScore: 0.85, roadAccessScore: 0.45 }
    },
    { 
      id: "INC-002", lat: 18.6298, lng: 73.7997, severity: 3, type: "landslide", label: "Pimpri Slope Anomaly", phase: "Detection", resources: 34,
      spatialScores: { isolationRiskScore: 0.45, bridgeRiskScore: 0.32, roadAccessScore: 0.65 }
    },
    { 
      id: "INC-003", lat: 18.4575, lng: 73.8677, severity: 5, type: "collapse", label: "Katraj Structure Failure", phase: "Response", resources: 92,
      spatialScores: { isolationRiskScore: 0.88, bridgeRiskScore: 0.92, roadAccessScore: 0.12 }
    }
  ];

  const selected = incidents.find(i => i.id === selectedIncident);

  return (
    <GlassPanel
      title="Spatial Intelligence Center"
      icon={<MapIcon size={16} />}
      className="h-full"
      headerAction={
        <div className="flex items-center gap-3">
          <select 
            value={mapType}
            onChange={(e) => setMapType(e.target.value as any)}
            className="bg-transparent text-xs text-nrc-text-muted border-none focus:ring-0 cursor-pointer"
          >
            <option value="standard" className="bg-nrc-base">OSM Standard</option>
            <option value="topo" className="bg-nrc-base">OpenTopoMap</option>
          </select>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-nrc-severity-l2" />
            <span className="text-xs font-mono text-nrc-aurora-cyan uppercase">OSM Backbone active</span>
          </div>
        </div>
      }
    >
      <div className="relative h-full min-h-[550px] flex">
        {/* Layer Panel */}
        <div className="w-56 border-r border-white/5 p-3 flex-shrink-0 bg-nrc-base/20 backdrop-blur-md">
          <h4 className="text-[10px] font-bold text-nrc-text-muted uppercase tracking-widest mb-4">Intelligence Layers</h4>
          <div className="space-y-1">
            {layers.map((layer) => {
              const Icon = layer.icon;
              return (
                <button
                  key={layer.id}
                  onClick={() => toggleLayer(layer.id)}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all ${
                    layer.active ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded flex items-center justify-center ${
                      layer.active ? "opacity-100" : "opacity-50"
                    }`}
                    style={{ backgroundColor: `${layer.color}20` }}
                  >
                    <Icon size={12} style={{ color: layer.color }} />
                  </div>
                  <span className={`text-xs flex-1 ${layer.active ? "text-nrc-text-primary" : "text-nrc-text-muted"}`}>
                    {layer.name}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-8 pt-4 border-t border-white/5">
            <h4 className="text-[10px] font-bold text-nrc-text-muted uppercase tracking-widest mb-3">Spatial Indicators</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-nrc-text-muted">High Isolation Risk</span>
                <div className="w-2 h-2 rounded-full bg-nrc-severity-l4" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-nrc-text-muted">Bridge Dependency</span>
                <div className="w-2 h-2 rounded-full bg-nrc-severity-l5" />
              </div>
            </div>
          </div>
        </div>

        {/* Map Viewport */}
        <div className="flex-1 relative overflow-hidden bg-[#0a0c10]">
          {/* Mock OSM Tiles Pattern */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute inset-0" style={{ 
              backgroundImage: `url("https://www.openstreetmap.org/assets/osm_logo-6169a48d617417e2c0e816a69528d7d4.svg")`,
              backgroundSize: "200px",
              backgroundRepeat: "repeat",
              filter: "invert(1) brightness(0.5)"
            }} />
          </div>

          <svg className="absolute inset-0 w-full h-full">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Mock OSM Road Network (Simplified) */}
            <path d="M 0 100 L 1000 120 M 200 0 L 180 1000 M 0 500 Q 500 480 1000 520" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
          </svg>

          {/* Markers */}
          {incidents.map((incident) => {
            const Icon = typeIcons[incident.type];
            const isSelected = selectedIncident === incident.id;
            // Map lat/lng to viewport % (Simplified for demo)
            const x = ((incident.lng - 73.7) * 100) / (74.0 - 73.7);
            const y = 100 - ((incident.lat - 18.4) * 100) / (18.7 - 18.4);

            return (
              <div
                key={incident.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-10"
                style={{ left: `${x}%`, top: `${y}%` }}
                onClick={() => setSelectedIncident(isSelected ? null : incident.id)}
              >
                {/* Isolation Risk Halo */}
                {layers.find(l => l.id === "spatial_scores")?.active && incident.spatialScores && (
                  <div 
                    className="absolute inset-0 -m-4 rounded-full animate-pulse border-2 border-dashed opacity-40"
                    style={{ 
                      borderColor: incident.spatialScores.isolationRiskScore > 0.7 ? "#FA5252" : "#4C6EF5",
                      transform: `scale(${1 + incident.spatialScores.isolationRiskScore})`
                    }}
                  />
                )}

                <div className={`relative transition-all ${isSelected ? "scale-125" : "hover:scale-110"}`}>
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow-2xl backdrop-blur-sm"
                    style={{ 
                      backgroundColor: `${severityColors[incident.severity]}`,
                      border: "2px solid rgba(255,255,255,0.2)"
                    }}
                  >
                    <Icon size={18} className="text-white" />
                  </div>
                  
                  {/* Tooltip */}
                  <div className={`absolute left-12 top-0 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20`}>
                    <div className="bg-nrc-base/95 border border-white/20 p-2 rounded-lg shadow-2xl">
                      <p className="text-xs font-bold text-nrc-text-primary">{incident.label}</p>
                      <p className="text-[10px] text-nrc-text-muted">{incident.phase} • {incident.resources} deployed</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <button className="w-10 h-10 rounded-xl bg-nrc-base/80 border border-white/10 flex items-center justify-center text-nrc-text-primary hover:bg-white/10 transition-colors">
              <ZoomIn size={18} />
            </button>
            <button className="w-10 h-10 rounded-xl bg-nrc-base/80 border border-white/10 flex items-center justify-center text-nrc-text-primary hover:bg-white/10 transition-colors">
              <ZoomOut size={18} />
            </button>
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between pointer-events-none">
            <div className="bg-nrc-base/80 backdrop-blur-md border border-white/10 p-3 rounded-xl pointer-events-auto">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-nrc-severity-l2 animate-pulse" />
                  <span className="text-[10px] font-mono text-nrc-text-muted">OSM COORDINATES: 18.5204°N, 73.8567°E</span>
                </div>
                <div className="h-4 w-[1px] bg-white/10" />
                <span className="text-[10px] text-nrc-aurora-cyan uppercase tracking-tighter">Powered by OSM Spatial Intelligence</span>
              </div>
            </div>
          </div>
        </div>

        {/* Intelligence Side Panel */}
        {selected && (
          <div className="w-80 border-l border-white/5 p-4 flex-shrink-0 bg-nrc-base/40 backdrop-blur-xl overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="text-xs font-bold text-nrc-text-muted uppercase tracking-widest">Spatial Report</h4>
                <p className="text-sm font-semibold text-nrc-text-primary">{selected.label}</p>
              </div>
              <button onClick={() => setSelectedIncident(null)} className="text-nrc-text-muted hover:text-white">×</button>
            </div>

            <div className="space-y-6">
              {/* Spatial Scores */}
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-nrc-text-muted">Isolation Risk</span>
                    <span className={`text-xs font-bold ${selected.spatialScores?.isolationRiskScore! > 0.7 ? "text-nrc-severity-l4" : "text-nrc-severity-l2"}`}>
                      {(selected.spatialScores?.isolationRiskScore! * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-nrc-severity-l4 rounded-full transition-all"
                      style={{ width: `${selected.spatialScores?.isolationRiskScore! * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-nrc-text-muted mt-2">
                    {selected.spatialScores?.isolationRiskScore! > 0.7 
                      ? "Critical: Limited evacuation routes available. High dependency on primary road."
                      : "Standard: Multiple alternate routes detected in zone."}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-nrc-text-muted">Bridge Dependency</span>
                    <span className="text-xs font-bold text-nrc-severity-l5">
                      {(selected.spatialScores?.bridgeRiskScore! * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-nrc-severity-l5 rounded-full transition-all"
                      style={{ width: `${selected.spatialScores?.bridgeRiskScore! * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-nrc-text-muted mt-2">
                    Zone isolated if bridges over Mula-Mutha river are compromised.
                  </p>
                </div>
              </div>

              {/* Infrastructure Snippet */}
              <div className="space-y-3">
                <h5 className="text-[10px] font-bold text-nrc-text-muted uppercase">Nearby Infrastructure (OSM)</h5>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-white/5 flex items-center gap-2">
                    <Building2 size={12} className="text-nrc-aurora-cyan" />
                    <span className="text-[10px] text-nrc-text-primary">2 Hospitals</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5 flex items-center gap-2">
                    <Mountain size={12} className="text-nrc-aurora-purple" />
                    <span className="text-[10px] text-nrc-text-primary">4 Bridges</span>
                  </div>
                </div>
              </div>

              {/* AI Advisory Callout */}
              <div className="p-3 rounded-xl bg-nrc-aurora-purple/10 border border-nrc-aurora-purple/20">
                <div className="flex items-center gap-2 mb-2">
                  <Activity size={12} className="text-nrc-aurora-purple" />
                  <span className="text-[10px] font-bold text-nrc-aurora-purple uppercase">AI Spatial Reasoning</span>
                </div>
                <p className="text-xs text-nrc-text-primary italic leading-relaxed">
                  "Evacuation complexity is high due to standard road width constraints in central zone. Recommend prioritizing air-rescue for critical cases in the river-bank sectors."
                </p>
              </div>

              <button className="w-full py-2.5 rounded-xl bg-white text-nrc-base text-xs font-bold hover:bg-opacity-90 transition-all flex items-center justify-center gap-2">
                <Activity size={14} />
                Generate SOP Update
              </button>
            </div>
          </div>
        )}
      </div>
    </GlassPanel>
  );
}
