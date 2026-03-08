"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  title?: string;
  icon?: ReactNode;
  headerAction?: ReactNode;
  onClick?: () => void;
  isActive?: boolean;
  variant?: "default" | "elevated" | "sunken";
}

export function GlassPanel({
  children,
  className,
  title,
  icon,
  headerAction,
  onClick,
  isActive = false,
  variant = "default",
}: GlassPanelProps) {
  const variants = {
    default: "bg-[rgba(255,255,255,0.06)]",
    elevated: "bg-[rgba(255,255,255,0.08)]",
    sunken: "bg-[rgba(0,0,0,0.3)]",
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative rounded-2xl border border-white/10 backdrop-blur-sm overflow-hidden transform-gpu translate-z-0",
        variants[variant],
        isActive && "border-white/20 shadow-lg shadow-nrc-aurora-cyan/10",
        onClick && "cursor-pointer hover:border-white/20",
        className
      )}
    >
      {(title || icon || headerAction) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            {icon && <span className="text-nrc-aurora-cyan">{icon}</span>}
            {title && (
              <h3 className="text-sm font-medium text-nrc-text-secondary tracking-wide uppercase">
                {title}
              </h3>
            )}
          </div>
          {headerAction}
        </div>
      )}
      <div className="relative">{children}</div>
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%)",
        }}
      />
    </div>
  );
}
