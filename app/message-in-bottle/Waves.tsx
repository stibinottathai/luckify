"use client";

import React from "react";
import "./bottle.css";

export default function Waves() {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 w-full h-[180px] overflow-hidden rounded-b-[2.5rem] pointer-events-none select-none z-10"
      style={{ maskImage: "linear-gradient(to top, black 85%, transparent)" }}
    >
      {/* Wave Container */}
      <div className="absolute inset-0 w-full h-full">
        {/* Layer 1: Back Wave (Slowest, darkest, deepest depth) */}
        <div
          className="wave wave-back absolute bottom-0 left-0 w-[200%] h-full opacity-60"
          style={{
            borderRadius: "44% 44% 0 0",
            background: "linear-gradient(to top, #0f3a47 0%, #1a5c6e 100%)",
            animation: "waveShift 9s linear infinite",
          }}
        />

        {/* Layer 2: Mid Wave (Medium speed, reversed horizontal shift) */}
        <div
          className="wave wave-mid absolute bottom-0 left-0 w-[200%] h-[90%] opacity-75"
          style={{
            borderRadius: "40% 43% 0 0",
            background: "linear-gradient(to top, #114654 0%, #1e7080 100%)",
            animation: "waveShift 7s linear infinite reverse",
          }}
        />

        {/* Layer 3: Front Wave (Fastest, brightest, closest to bottle) */}
        <div
          className="wave wave-front absolute bottom-0 left-0 w-[200%] h-[78%] opacity-90 shadow-[0_-4px_12px_rgba(36,144,160,0.15)]"
          style={{
            borderRadius: "42% 38% 0 0",
            background: "linear-gradient(to top, #155b68 0%, #2490a0 100%)",
            animation: "waveShift 4.8s linear infinite",
          }}
        />
      </div>
    </div>
  );
}
