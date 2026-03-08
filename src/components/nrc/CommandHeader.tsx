"use client";

import { Shield, Bell, User, Clock, ChevronDown } from "lucide-react";

export function CommandHeader() {
  const currentTime = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-nrc-base/50 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-nrc-aurora-cyan to-nrc-aurora-blue flex items-center justify-center">
            <Shield size={18} className="text-nrc-base" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-nrc-text-primary tracking-wide">
              NRC-OS
            </h1>
            <p className="text-xs text-nrc-text-muted">
              National Response Coordination
            </p>
          </div>
        </div>

        <div className="h-6 w-px bg-white/10 mx-2" />

        <div className="flex items-center gap-2">
          <span className="text-xs text-nrc-text-muted">SEOC</span>
          <span className="text-xs font-medium text-nrc-aurora-cyan">MAHARASHTRA</span>
          <ChevronDown size={14} className="text-nrc-text-muted" />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-nrc-text-secondary">
          <Clock size={14} />
          <span className="text-sm font-mono">{currentTime}</span>
          <span className="text-xs text-nrc-text-muted">IST</span>
        </div>

        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-lg hover:bg-white/5 transition-colors">
            <Bell size={18} className="text-nrc-text-secondary" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-nrc-severity-l5" />
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-nrc-aurora-purple to-nrc-aurora-blue flex items-center justify-center">
              <User size={14} className="text-white" />
            </div>
            <div className="text-left">
              <p className="text-xs font-medium text-nrc-text-primary">State Admin</p>
              <p className="text-xs text-nrc-text-muted">SEOC Control</p>
            </div>
            <ChevronDown size={14} className="text-nrc-text-muted" />
          </div>
        </div>
      </div>
    </header>
  );
}
