"use client";

import { useState } from "react";
import { GlassPanel } from "./GlassPanel";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquare, Radio, Send, Search, Filter, Pin,
  AlertTriangle, Clock, Users, ChevronDown, Mic, Paperclip,
  ArrowUp, CheckCheck, Eye, Bell, Hash, Zap, RefreshCw,
  MoreVertical, Shield, Volume2, VolumeX, ShieldCheck
} from "lucide-react";

type MessagePriority = "critical" | "high" | "normal" | "low";
type MessageType = "command" | "field" | "inter_agency" | "broadcast";
type ChannelType = "incident" | "agency" | "broadcast" | "direct";

interface Message {
  id: string;
  sender: string;
  senderRole: string;
  senderAgency: string;
  content: string;
  timestamp: string;
  priority: MessagePriority;
  type: MessageType;
  channel: string;
  readReceipts: number;
  isActionable: boolean;
  convertedToAction?: string;
  isPinned?: boolean;
}

interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  unreadCount: number;
  lastActivity: string;
  participants: number;
  incidentId?: string;
}

const priorityConfig: Record<MessagePriority, { color: string; label: string }> = {
  critical: { color: "#FA5252", label: "CRITICAL" },
  high: { color: "#FF922B", label: "HIGH" },
  normal: { color: "#4DABF7", label: "NORMAL" },
  low: { color: "#6C757D", label: "LOW" },
};

const mockChannels: Channel[] = [
  { id: "CH-001", name: "INC-001: Kolhapur Flood", type: "incident", unreadCount: 5, lastActivity: "30s ago", participants: 24, incidentId: "INC-001" },
  { id: "CH-002", name: "INC-002: Pune Flooding", type: "incident", unreadCount: 2, lastActivity: "2m ago", participants: 18, incidentId: "INC-002" },
  { id: "CH-003", name: "NDRF Operations", type: "agency", unreadCount: 0, lastActivity: "5m ago", participants: 32 },
  { id: "CH-004", name: "State Police Coord", type: "agency", unreadCount: 1, lastActivity: "8m ago", participants: 45 },
  { id: "CH-005", name: "SEOC Broadcast", type: "broadcast", unreadCount: 0, lastActivity: "15m ago", participants: 156 },
];

const mockMessages: Message[] = [
  {
    id: "M001",
    sender: "Cmdr. Sharma",
    senderRole: "Incident Commander",
    senderAgency: "NDRF",
    content: "URGENT: Water level rising faster than projected. Requesting immediate deployment of additional 4 rescue boats to Sector 7. Current teams overwhelmed.",
    timestamp: "09:32",
    priority: "critical",
    type: "command",
    channel: "CH-001",
    readReceipts: 18,
    isActionable: true,
    isPinned: true,
  },
  {
    id: "M002",
    sender: "Unit Alpha-3",
    senderRole: "Field Team Lead",
    senderAgency: "NDRF",
    content: "Confirmed 45 civilians evacuated from Block C. Moving to Block D. ETA 12 minutes. Need medical support at staging area.",
    timestamp: "09:30",
    priority: "high",
    type: "field",
    channel: "CH-001",
    readReceipts: 22,
    isActionable: true,
    convertedToAction: "ACT-034",
  },
  {
    id: "M003",
    sender: "Ops Center",
    senderRole: "Control",
    senderAgency: "SEOC",
    content: "Route A now impassable due to flooding. All units switch to Route B via NH60. Traffic clearance confirmed.",
    timestamp: "09:28",
    priority: "high",
    type: "broadcast",
    channel: "CH-001",
    readReceipts: 34,
    isActionable: false,
  },
  {
    id: "M004",
    sender: "Police CP-7",
    senderRole: "Checkpoint Officer",
    senderAgency: "State Police",
    content: "Roadblock established at Junction 4. Civilian traffic diverted. Emergency vehicles have clear corridor.",
    timestamp: "09:25",
    priority: "normal",
    type: "inter_agency",
    channel: "CH-001",
    readReceipts: 15,
    isActionable: false,
  },
  {
    id: "M005",
    sender: "Dr. Kulkarni",
    senderRole: "Medical Lead",
    senderAgency: "Health Dept",
    content: "Medical camp operational at Shelter 3. Can handle 50 patients/hour. Current load: 23. Requesting additional supplies: IV fluids, bandages.",
    timestamp: "09:22",
    priority: "normal",
    type: "field",
    channel: "CH-001",
    readReceipts: 12,
    isActionable: true,
  },
  {
    id: "M006",
    sender: "Drone Op-2",
    senderRole: "Aerial Recon",
    senderAgency: "NDRF",
    content: "Aerial survey complete for Zone G. Identified 3 stranded groups: approx 12 people on rooftop at GPS 16.7042°N, 74.2433°E. Requires boat extraction.",
    timestamp: "09:18",
    priority: "high",
    type: "field",
    channel: "CH-001",
    readReceipts: 20,
    isActionable: true,
  },
];

export function LiveComms() {
  const [selectedChannel, setSelectedChannel] = useState("CH-001");
  const [messageInput, setMessageInput] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<MessagePriority | "all">("all");
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);

  const currentChannel = mockChannels.find(c => c.id === selectedChannel);
  const filteredMessages = mockMessages.filter(m => {
    if (m.channel !== selectedChannel) return false;
    if (priorityFilter !== "all" && m.priority !== priorityFilter) return false;
    if (showPinnedOnly && !m.isPinned) return false;
    return true;
  });

  return (
    <div className="grid grid-cols-12 gap-4 h-full">
      <div className="col-span-3">
        <GlassPanel
          title="Channels"
          icon={<Hash size={16} />}
          className="h-full"
          headerAction={
            <button className="p-1 rounded hover:bg-white/10">
              <Search size={14} className="text-nrc-text-muted" />
            </button>
          }
        >
          <div className="p-2 space-y-1 max-h-[calc(100vh-280px)] overflow-y-auto">
            {mockChannels.map((channel) => {
              const isActive = selectedChannel === channel.id;
              return (
                <div
                  key={channel.id}
                  onClick={() => setSelectedChannel(channel.id)}
                  className={`p-3 rounded-xl cursor-pointer transition-all ${
                    isActive ? 'bg-white/10 border border-white/20' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {channel.type === "incident" && <AlertTriangle size={12} className="text-nrc-severity-l4" />}
                      {channel.type === "agency" && <Users size={12} className="text-nrc-aurora-blue" />}
                      {channel.type === "broadcast" && <Radio size={12} className="text-nrc-aurora-purple" />}
                      <span className={`text-sm font-medium ${isActive ? 'text-nrc-text-primary' : 'text-nrc-text-secondary'}`}>
                        {channel.name}
                      </span>
                    </div>
                    {channel.unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-nrc-aurora-cyan text-nrc-base text-[10px] font-bold">
                        {channel.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-nrc-text-muted">
                    <span>{channel.lastActivity}</span>
                    <span>•</span>
                    <span>{channel.participants} participants</span>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassPanel>
      </div>

      <div className="col-span-9">
        <GlassPanel
          title={currentChannel?.name || "Select Channel"}
          icon={<MessageSquare size={16} />}
          className="h-full flex flex-col"
          headerAction={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPinnedOnly(!showPinnedOnly)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                  showPinnedOnly ? 'bg-nrc-aurora-cyan/20 text-nrc-aurora-cyan' : 'text-nrc-text-muted hover:text-nrc-text-secondary'
                }`}
              >
                <Pin size={12} />
                Pinned
              </button>
              <div className="flex items-center">
                {(["all", "critical", "high"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriorityFilter(p)}
                    className={`px-2 py-1 text-xs font-medium ${
                      priorityFilter === p ? 'bg-white/10 text-nrc-text-primary' : 'text-nrc-text-muted hover:text-nrc-text-secondary'
                    } ${p === "all" ? 'rounded-l' : ''} ${p === "high" ? 'rounded-r' : ''}`}
                  >
                    {p === "all" ? "All" : p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1">
                <Radio size={12} className="text-nrc-severity-l5" />
                <span className="text-xs text-nrc-text-muted">LIVE</span>
              </div>
            </div>
          }
        >
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {filteredMessages.map((message) => {
                const priorityConf = priorityConfig[message.priority];
                return (
                  <div
                    key={message.id}
                    className={`relative p-3 rounded-xl ${
                      message.priority === "critical" ? 'bg-nrc-severity-l5/10 border border-nrc-severity-l5/20' :
                      message.priority === "high" ? 'bg-nrc-severity-l4/5 border border-nrc-severity-l4/10' :
                      'bg-white/5'
                    }`}
                  >
                    {message.isPinned && (
                      <div className="absolute top-2 right-2">
                        <Pin size={12} className="text-nrc-aurora-cyan" />
                      </div>
                    )}
                    
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-nrc-aurora-cyan">
                          {message.sender.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-nrc-text-primary">{message.sender}</span>
                          <span className="text-xs text-nrc-text-muted">{message.senderRole}</span>
                          <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-nrc-text-muted">
                            {message.senderAgency}
                          </span>
                          <span className="text-xs text-nrc-text-muted ml-auto">{message.timestamp}</span>
                        </div>
                        
                        <p className="text-sm text-nrc-text-secondary mb-2 leading-relaxed">{message.content}</p>
                        
                        <div className="flex items-center gap-3">
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold"
                            style={{ backgroundColor: `${priorityConf.color}20`, color: priorityConf.color }}
                          >
                            {priorityConf.label}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-nrc-text-muted">
                            <CheckCheck size={12} />
                            {message.readReceipts}
                          </span>
                          {message.isActionable && !message.convertedToAction && (
                            <button className="px-2 py-0.5 rounded bg-nrc-aurora-cyan/20 text-nrc-aurora-cyan text-[10px] font-medium hover:bg-nrc-aurora-cyan/30">
                              Convert to Action
                            </button>
                          )}
                          {message.convertedToAction && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-nrc-severity-l2/20 text-nrc-severity-l2 text-[10px]">
                              <CheckCheck size={10} />
                              {message.convertedToAction}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 border-t border-white/5">
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg bg-white/5 text-nrc-text-muted hover:text-nrc-text-primary hover:bg-white/10">
                  <Paperclip size={18} />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-nrc-text-primary placeholder:text-nrc-text-muted focus:outline-none focus:border-nrc-aurora-cyan/50"
                  />
                </div>
                <button className="p-2 rounded-lg bg-white/5 text-nrc-text-muted hover:text-nrc-text-primary hover:bg-white/10">
                  <Mic size={18} />
                </button>
                <button className="p-2.5 rounded-xl bg-nrc-aurora-cyan text-nrc-base hover:opacity-90">
                  <Send size={18} />
                </button>
              </div>
              <div className="flex items-center gap-4 mt-2 px-2">
                <span className="text-xs text-nrc-text-muted">Priority:</span>
                {(["normal", "high", "critical"] as MessagePriority[]).map((p) => (
                  <button
                    key={p}
                    className="text-xs text-nrc-text-muted hover:text-nrc-text-secondary capitalize"
                  >
                    {p}
                  </button>
                ))}
                <span className="ml-auto text-xs text-nrc-text-muted flex items-center gap-1">
                  <Eye size={10} />
                  All messages are logged and auditable
                </span>
              </div>
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
