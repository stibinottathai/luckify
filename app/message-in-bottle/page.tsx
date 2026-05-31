"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Compass } from "lucide-react";
import { useLuckStore } from "@/store/luckStore";
import { playDiceRoll, playWinChime, playDudSound } from "@/lib/audio";
import { getRandomFortune } from "./fortunes";
import Bottle from "./Bottle";
import Scroll from "./Scroll";
import Waves from "./Waves";
import { Cinzel, Cormorant_Garamond } from "next/font/google";
import "./bottle.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  weight: ["400", "700", "900"],
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

type Phase = "idle" | "uncorking" | "rising" | "reading" | "casting";

export default function MessageInBottlePage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [fortune, setFortune] = useState<string>("");

  const addResult = useLuckStore((state) => state.addResult);

  const handleTap = async () => {
    if (phase !== "idle") return;

    setPhase("uncorking");
    // Play initial cork popping agitation audio
    playDiceRoll();

    // After 500ms, transitions to scroll rising from bottle
    setTimeout(() => {
      setPhase("rising");
      // Subtle paper scroll friction sound (using brief dice roll)
      playDiceRoll();
    }, 500);

    // Asynchronously fetch dynamic affirmation from the free API in parallel
    let chosenFortune = "";
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1800); // 1.8s cutoff

      const res = await fetch("https://www.affirmations.dev", {
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.affirmation) {
          chosenFortune = data.affirmation;
        }
      }
    } catch (error) {
      console.warn(
        "Affirmation API fetch failed or blocked by CORS. Using beautiful local fallback fortunes.",
        error
      );
    }

    // Zero-latency resilient fallback to local curated fortunes
    if (!chosenFortune) {
      chosenFortune = getRandomFortune();
    }

    setFortune(chosenFortune);

    // After 1300ms, scroll is fully unfurled. Reveal text and play win chime!
    setTimeout(() => {
      setPhase("reading");
      playWinChime();

      // Log success to global Zustand store with positive score reward (+5 to +15)
      const scoreImpact = Math.floor(Math.random() * 11) + 5;
      addResult(
        "Message in a Bottle",
        `Discovered fortune: "${chosenFortune}"`,
        true,
        scoreImpact
      );
    }, 1300);
  };

  const handleReset = () => {
    if (phase !== "reading") return;
    setPhase("casting");

    // Play tossing/splash sound (using brief dud sound as a low water thud)
    playDudSound();

    // After 750ms, clear fortune and reset back to idle
    setTimeout(() => {
      setFortune("");
      setPhase("idle");
    }, 750);
  };

  return (
    <div
      className={`flex-1 flex flex-col items-center w-full min-h-[85vh] p-4 sm:p-6 rounded-[2.5rem] bg-gradient-to-b from-[#fde9c4] to-[#f5d49a] border-4 border-[#2d7d6e]/20 shadow-2xl relative overflow-hidden select-none ${cinzel.variable} ${cormorant.variable}`}
    >
      {/* Sun Ray Gradient Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(253,233,196,0.4),transparent_60%)] pointer-events-none" />

      {/* Seagull Floating Sky Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Seagull 1 */}
        <div className="absolute top-[14%] left-[12%] opacity-40 animate-gull">
          <svg
            viewBox="0 0 24 10"
            className="w-7 h-3 text-[#1a4a5c] fill-none stroke-current"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <path d="M 1 6 Q 6 1 11 6 Q 16 1 22 6" />
          </svg>
        </div>
        {/* Seagull 2 */}
        <div
          className="absolute top-[22%] right-[15%] opacity-30 animate-gull"
          style={{ animationDelay: "1.5s" }}
        >
          <svg
            viewBox="0 0 24 10"
            className="w-6 h-2.5 text-[#1a4a5c] fill-none stroke-current"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <path d="M 1 5 Q 6 1 11 5 Q 16 1 22 5" />
          </svg>
        </div>
        {/* Seagull 3 */}
        <div
          className="absolute top-[8%] right-[38%] opacity-20 scale-75 animate-gull"
          style={{ animationDelay: "3s" }}
        >
          <svg
            viewBox="0 0 24 10"
            className="w-5 h-2 text-[#1a4a5c] fill-none stroke-current"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M 1 5 Q 6 1 11 5 Q 16 1 22 5" />
          </svg>
        </div>
      </div>

      {/* Back button and navigation breadcrumb */}
      <div className="w-full max-w-4xl mb-4 flex flex-col items-start gap-2.5 z-20">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[#1a4a5c]/70 hover:text-[#1a4a5c] transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Lobby
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between w-full gap-2 border-b border-[#1a4a5c]/10 pb-3">
          <div>
            <h1 className="text-3xl font-black font-cinzel text-[#1a4a5c] leading-none flex items-center gap-2">
              🍾 <span className="text-2xl font-bold font-fredoka text-[#2d6070]">Bottle Mail</span>
            </h1>
            <p className="text-xs font-bold text-[#2d6070]/80 mt-2 font-cormorant italic tracking-wide">
              Whispers of the tide captured in glass, waiting to meet your gaze.
            </p>
          </div>
          <div className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-[#1a4a5c]/5 border border-[#1a4a5c]/15 text-[#1a4a5c] font-cinzel uppercase tracking-widest">
            海洋の託宣 — OCEAN ORACLE
          </div>
        </div>
      </div>

      {/* Header Title Section */}
      <div className="text-center mt-2 mb-2 z-20 select-none">
        <h2 className="text-3xl sm:text-4xl font-black font-cinzel text-[#1a4a5c] tracking-wide relative pb-1.5 inline-block">
          A Message From the Deep
          {/* Gold Underline */}
          <span className="absolute bottom-0 left-1/4 right-1/4 h-[1.5px] bg-gradient-to-r from-transparent via-[#d4b87a] to-transparent" />
        </h2>
        <p className="text-sm font-medium font-cormorant italic text-[#2d6070]/80 mt-1.5">
          &ldquo;The sea has been waiting to tell you something.&rdquo;
        </p>
      </div>

      {/* central arena wrapper holding waves, bottle, and scroll */}
      <div className="relative flex-1 flex flex-col items-center justify-end w-full max-w-sm min-h-[380px] z-10">
        {/* Parchment Scroll - floats above the neck of the bottle */}
        <Scroll phase={phase} fortune={fortune} />

        {/* Floating Bottle - positioned sitting inside ocean waves */}
        <div className="absolute bottom-[40px] z-20 flex flex-col items-center">
          <Bottle phase={phase} onTap={handleTap} />

          {/* Tap Hint */}
          {phase === "idle" && (
            <p className="mt-2 text-xs font-black uppercase tracking-widest text-[#2d6070]/70 font-cinzel animate-pulse select-none bg-white/40 px-3 py-1 rounded-full backdrop-blur-sm shadow-sm border border-white/20">
              Tap the Bottle 👆
            </p>
          )}
        </div>

        {/* Parallax Ocean Waves */}
        <Waves />
      </div>

      {/* Bottom controls panel */}
      <div className="w-full max-w-md mt-4 mb-2 flex flex-col items-center gap-4 z-20 min-h-[70px]">
        {phase === "reading" && (
          <div className="flex flex-col items-center gap-3 w-full animate-fade-in">
            <button
              onClick={handleReset}
              className="bg-[#1e7080] hover:bg-[#1a5c6e] text-white font-extrabold rounded-full px-8 py-3 select-none cursor-pointer tracking-wider shadow-lg active:scale-95 transition-all flex items-center gap-2 group uppercase font-cinzel text-xs hover:shadow-cyan-900/10 border border-white/20"
            >
              <Compass className="w-4 h-4 text-white group-hover:rotate-45 transition-transform" />
              Cast Another 🌊
            </button>
          </div>
        )}

        {(phase === "uncorking" || phase === "rising") && (
          <div className="flex flex-col items-center gap-1 py-1">
            <div className="flex items-center gap-2 text-center text-[#1a4a5c] font-cinzel text-xs font-black uppercase tracking-widest animate-pulse">
              <Sparkles className="w-4 h-4 animate-spin text-[#d4b87a]" />
              Retrieving scroll...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
