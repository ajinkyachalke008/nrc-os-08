"use client";

import { ReactNode } from "react";

export function AuroraBackground({ children }: { children?: ReactNode }) {
  return (
    <div className="fixed inset-0 overflow-hidden bg-nrc-base">
      <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-1/2 -left-1/2 rounded-full will-change-[transform,background]"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(42, 250, 223, 0.12) 0%, transparent 70%)",
              width: "150%",
              height: "150%",
            }}
          />
          <div
            className="absolute -bottom-1/2 -right-1/2 rounded-full will-change-[transform,background]"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(76, 110, 245, 0.1) 0%, transparent 70%)",
              width: "150%",
              height: "150%",
            }}
          />
          <div
            className="absolute top-1/4 right-1/4 rounded-full will-change-[transform,background]"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(156, 54, 181, 0.08) 0%, transparent 70%)",
              width: "100%",
              height: "100%",
            }}
          />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-nrc-base/50" />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
