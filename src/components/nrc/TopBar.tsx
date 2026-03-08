"use client";

import { Bell, Clock, User, ChevronDown } from "lucide-react";

export function TopBar({ title }: { title: string }) {
  const currentTime = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
      <div>
        <h1 className="text-xl font-semibold text-nrc-text-primary">{title}</h1>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-nrc-text-muted">SEOC</span>
          <span className="w-1 h-1 rounded-full bg-nrc-text-muted" />
          <span className="text-xs font-medium text-nrc-aurora-cyan">MAHARASHTRA</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-nrc-text-secondary">
          <Clock size={14} />
          <span className="text-sm font-mono">{currentTime}</span>
          <span className="text-xs text-nrc-text-muted">IST</span>
        </div>

        <button className="relative p-2 rounded-lg hover:bg-white/5">
          <Bell size={18} className="text-nrc-text-secondary" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-nrc-severity-l5" />
        </button>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-nrc-aurora-purple to-nrc-aurora-blue flex items-center justify-center">
            <User size={14} className="text-white" />
          </div>
          <div className="text-left">
            <p className="text-xs font-medium text-nrc-text-primary">State Admin</p>
          </div>
          <ChevronDown size={14} className="text-nrc-text-muted" />
        </div>
      </div>
    </header>
  );
}
