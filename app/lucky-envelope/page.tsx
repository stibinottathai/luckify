"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, RefreshCw } from "lucide-react";
import { useLuckStore } from "@/store/luckStore";
import { playTick, playWinChime } from "@/lib/audio";
import { getRandomFortune, Fortune } from "./blessings";
import EnvelopeCard from "./EnvelopeCard";
import { Cinzel, Cormorant_Garamond } from "next/font/google";

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

export default function LuckyEnvelopePage() {
  const [phase, setPhase] = useState<"idle" | "opening" | "revealing" | "done">("idle");
  const [fortune, setFortune] = useState<Fortune | null>(null);

  const addResult = useLuckStore((state) => state.addResult);

  // Auto-advance phases
  useEffect(() => {
    if (phase === "opening") {
      playTick();
      const timer = setTimeout(() => {
        setPhase("revealing");
      }, 800);
      return () => clearTimeout(timer);
    } else if (phase === "revealing") {
      playWinChime();
      const timer = setTimeout(() => {
        setPhase("done");
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const handleOpenEnvelope = () => {
    if (phase !== "idle") return;

    const newFortune = getRandomFortune();
    setFortune(newFortune);
    setPhase("opening");

    // Add result to history log and impact the lucky score
    // Wins give +5 to +15. Opening an envelope is a positive experience!
    const resultText = `Opened Red Packet: Lucky #${newFortune.luckyNumber} - "${newFortune.blessing}"`;
    addResult("Lucky Envelope", resultText, true);
  };

  const handleReset = () => {
    setPhase("idle");
    setFortune(null);
  };

  return (
    <div className={`flex-1 flex flex-col items-center w-full min-h-[85vh] p-4 sm:p-6 rounded-[2.5rem] bg-[radial-gradient(ellipse_at_center,_#250b0b,_#0a0303)] border-4 border-[#501313] shadow-2xl relative overflow-hidden select-none ${cinzel.variable} ${cormorant.variable}`}>
      
      {/* Visual background details: Soft gold lanterns / cloud sparks */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,183,0,0.06),transparent_40%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(245,183,0,0.06),transparent_40%)] pointer-events-none" />
      
      {/* Back button and breadcrumb */}
      <div className="w-full max-w-4xl mb-8 flex flex-col items-start gap-3 z-10">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-amber-400/40 hover:text-amber-400 transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Lobby
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between w-full gap-2 border-b border-amber-950/40 pb-4">
          <div>
            <h1 className="text-3xl font-black font-cinzel text-amber-400 leading-none flex items-center gap-2">
              红包 <span className="text-2xl font-bold font-fredoka text-amber-300">Lucky Envelope</span>
            </h1>
            <p className="text-xs font-bold text-amber-200/50 mt-2 font-cormorant italic tracking-wide">
              An ancient tradition of sharing blessings, fortune, and prosperity.
            </p>
          </div>
          <div className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-400/20 text-amber-300 font-cinzel uppercase tracking-widest">
            Traditional Fortune
          </div>
        </div>
      </div>

      {/* Main interactive envelope container */}
      <div className="flex-1 flex flex-col items-center justify-center z-10 w-full max-w-sm mt-4 min-h-[420px]">
        <EnvelopeCard phase={phase} fortune={fortune} onClick={handleOpenEnvelope} />
      </div>

      {/* UX Instructions and Actions */}
      <div className="w-full max-w-sm mt-8 flex flex-col items-center gap-4 z-10 min-h-[80px]">
        {phase === "idle" && (
          <div className="flex flex-col items-center gap-1 animate-pulse text-center">
            <p className="text-xs font-black uppercase tracking-widest text-amber-400 font-cinzel">
              Tap the Red Packet
            </p>
            <p className="text-sm font-bold text-amber-200/70 font-cormorant italic">
              Unveil your golden number and prosperity blessing
            </p>
          </div>
        )}

        {(phase === "opening" || phase === "revealing") && (
          <div className="flex items-center gap-2 text-center text-amber-400 font-cinzel text-xs font-black uppercase tracking-widest">
            <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
            Unfolding Destiny...
          </div>
        )}

        {phase === "done" && (
          <div className="flex flex-col items-center gap-4 w-full animate-fade-in">
            {/* Try Again / Open Another button */}
            <button
              onClick={handleReset}
              className="py-3 px-8 rounded-2xl font-black text-sm select-none cursor-pointer tracking-wider shadow-lg bg-amber-400 hover:bg-amber-300 text-red-950 hover:shadow-xl hover:shadow-amber-400/10 active:scale-95 transition-all flex items-center gap-2 group font-cinzel uppercase"
            >
              <RefreshCw className="w-4 h-4 group-hover:rotate-45 transition-transform" />
              Open Another 🧧
            </button>
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-400/40 font-cinzel text-center">
              Your luck score has been updated!
            </p>
          </div>
        )}
      </div>

      {/* Custom localized animation for fading in controls */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}} />
    </div>
  );
}
