"use client";

import React, { useMemo } from "react";
import "./bottle.css";

type Phase = "idle" | "uncorking" | "rising" | "reading" | "casting";

interface BottleProps {
  phase: Phase;
  onTap: () => void;
}

export default function Bottle({ phase, onTap }: BottleProps) {
  // Generate random trajectories for the cork pop particles
  const particles = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => {
      const angle = (i * 2 * Math.PI) / 8 + (Math.random() * 0.3 - 0.15);
      const distanceX = 15 + Math.random() * 20;
      const distanceY = 35 + Math.random() * 30;
      const tx = `${Math.round(Math.cos(angle) * distanceX)}px`;
      const ty = `${-Math.round(Math.sin(angle) * distanceY)}px`;
      const delay = `${Math.round(Math.random() * 80)}ms`;
      return { tx, ty, delay };
    });
  }, []);

  // Determine active animation class for the main bottle
  const getBottleAnimationClass = () => {
    if (phase === "casting") return "animate-bottle-toss";
    if (phase === "uncorking") return "animate-bottle-shake";
    return "animate-bottle-bob"; // idle and reading bob gently
  };

  return (
    <div className="relative select-none w-[150px] h-[325px] flex items-center justify-center">
      {/* Tap trigger zone - invisible overlay to capture taps easily */}
      {phase === "idle" && (
        <div
          onClick={onTap}
          className="absolute inset-0 cursor-pointer z-30 rounded-3xl"
          title="Tap to open the bottle!"
        />
      )}

      {/* Main animated bottle container */}
      <div
        className={`w-full h-full transition-transform duration-500 ease-out ${getBottleAnimationClass()}`}
        style={{ transformOrigin: "bottom center" }}
      >
        <svg
          viewBox="0 0 120 260"
          className="w-full h-full drop-shadow-[0_15px_25px_rgba(26,92,110,0.35)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Layer 1: Bottle Body Back Glass (Dark Teal) */}
          <path
            d="M 48 40 L 72 40 L 72 90 C 72 90 96 110 102 130 L 102 220 C 102 235 85 245 60 245 C 35 245 18 235 18 220 L 18 130 C 24 110 48 90 48 90 Z"
            fill="#2d7d6e"
          />

          {/* Layer 2: Glass Highlight (Shine Strip, Left Side) */}
          <path
            d="M 50 42 C 50 42 50 85 50 90 C 50 90 26 110 22 130 L 22 220 C 22 230 32 241 45 242 C 34 240 24 230 24 220 L 24 130 C 28 112 52 92 52 92 Z"
            fill="rgba(255, 255, 255, 0.22)"
          />

          {/* Layer 3: Scroll Inside Bottle (Visible only in 'idle' phase) */}
          {phase === "idle" && (
            <g className="transition-opacity duration-300">
              {/* Rolled parchment cylinder */}
              <rect
                x="48"
                y="145"
                width="24"
                height="60"
                rx="3"
                fill="#f0d9a0"
                transform="rotate(-12 60 175)"
                stroke="#d4b87a"
                strokeWidth="1"
              />
              {/* Ribbon tying the parchment */}
              <rect
                x="46"
                y="172"
                width="28"
                height="6"
                rx="1"
                fill="#d9534f"
                transform="rotate(-12 60 175)"
              />
            </g>
          )}

          {/* Layer 4: Bottle Body Front Glass (Semi-Transparent Overlay for depth) */}
          <path
            d="M 48 40 L 72 40 L 72 90 C 72 90 96 110 102 130 L 102 220 C 102 235 85 245 60 245 C 35 245 18 235 18 220 L 18 130 C 24 110 48 90 48 90 Z"
            fill="rgba(45, 125, 110, 0.45)"
          />

          {/* Layer 5: Neck Ring (Decorative Collar where neck meets body) */}
          <rect
            x="46"
            y="86"
            width="28"
            height="6"
            rx="1.5"
            fill="#1a5c50"
          />

          {/* Layer 6: Cork (Above neck opening, animated when phase !== idle) */}
          {phase === "idle" && (
            <rect
              x="47"
              y="22"
              width="26"
              height="18"
              rx="2.5"
              fill="#b5813a"
              stroke="#8a5e24"
              strokeWidth="0.75"
            />
          )}

          {/* Uncorking flight animation for the cork */}
          {phase !== "idle" && phase !== "casting" && (
            <g className="animate-cork-pop" style={{ transformOrigin: "60px 30px" }}>
              <rect
                x="47"
                y="22"
                width="26"
                height="18"
                rx="2.5"
                fill="#b5813a"
                stroke="#8a5e24"
                strokeWidth="0.75"
              />
            </g>
          )}
        </svg>

        {/* Cork Particle Burst Layer */}
        {phase === "uncorking" && (
          <div className="absolute left-1/2 top-[12%] -translate-x-1/2 pointer-events-none z-20">
            {particles.map((p, idx) => (
              <div
                key={idx}
                className="absolute w-1.5 h-1.5 rounded-full bg-[#b5813a] shadow-sm animate-speck-burst"
                style={{
                  left: "0px",
                  top: "0px",
                  "--tx": p.tx,
                  "--ty": p.ty,
                  animationDelay: p.delay,
                } as React.CSSProperties}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
