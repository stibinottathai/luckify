"use client";

import React from "react";
import { Caveat } from "next/font/google";
import "./bottle.css";

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  weight: ["400", "700"],
});

type Phase = "idle" | "uncorking" | "rising" | "reading" | "casting";

interface ScrollProps {
  phase: Phase;
  fortune: string;
}

export default function Scroll({ phase, fortune }: ScrollProps) {
  if (phase === "idle" || phase === "uncorking" || phase === "casting") {
    return null;
  }

  const isReading = phase === "reading";

  return (
    <div
      id="scroll-wrapper"
      className={`absolute bottom-[200px] left-1/2 -translate-x-1/2 flex flex-col items-center z-40 select-none ${
        caveat.variable
      } ${phase === "rising" ? "animate-scroll-rise" : ""}`}
      style={{ transformOrigin: "bottom center" }}
    >
      {/* Top Roll Edge — Remains fixed at the neck */}
      <div
        id="scroll-top-roll"
        className="w-[200px] h-[16px] bg-[#d4b87a] rounded-full shadow-[0_2px_4px_rgba(26,92,110,0.15)] z-10"
        style={{
          background: "linear-gradient(90deg, #b59b5d 0%, #d4b87a 30%, #eadaa2 50%, #d4b87a 70%, #b59b5d 100%)",
        }}
      />

      {/* Unfurl Container — Scales the main parchment body and bottom roller down together */}
      <div
        id="scroll-unfurl-container"
        className="flex flex-col items-center origin-top animate-scroll-unfurl"
        style={{ transformOrigin: "top center" }}
      >
        {/* Main Parchment Scroll Body */}
        <div
          id="scroll-body"
          className="w-[200px] bg-[#f5e4b8] border-l-2 border-r-2 border-[#d4b87a] px-4 py-5 shadow-xl relative overflow-hidden z-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(transparent, transparent 23px, #e8d49a 23px, #e8d49a 24px)",
          }}
        >
          {/* Subtle aged water stain effect */}
          <div className="absolute inset-0 bg-radial from-transparent via-transparent to-[#e6d095]/20 pointer-events-none" />

          {/* Fortune Text — Fades in once scroll is unfurled */}
          {isReading && (
            <p
              id="fortune-text"
              className="text-[#4a3010] text-lg sm:text-xl font-bold text-center leading-relaxed opacity-0 animate-fortune-appear"
              style={{
                fontFamily: "var(--font-caveat)",
                animationDelay: "200ms",
                textShadow: "0.5px 0.5px 0px rgba(255,255,255,0.4)",
              }}
            >
              {fortune}
            </p>
          )}
        </div>

        {/* Bottom Roll Edge — Slides down with the scroll body */}
        <div
          id="scroll-bottom-roll"
          className="w-[200px] h-[16px] bg-[#d4b87a] rounded-full shadow-[0_4px_6px_rgba(0,0,0,0.12)] z-10 -mt-0.5"
          style={{
            background: "linear-gradient(90deg, #b59b5d 0%, #d4b87a 30%, #eadaa2 50%, #d4b87a 70%, #b59b5d 100%)",
          }}
        />
      </div>
    </div>
  );
}
