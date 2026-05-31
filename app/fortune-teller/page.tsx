"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, RefreshCw } from "lucide-react";
import { useLuckStore } from "@/store/luckStore";
import { playTick } from "@/lib/audio";
import { COLORS, getFortune } from "./blessings";
import CootieCatcher from "./CootieCatcher";
import { Nunito } from "next/font/google";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["300", "400", "600", "700", "800", "900"],
});

type Phase =
  | "idle"
  | "color-picked"
  | "pick-number"
  | "number-picked"
  | "reveal"
  | "done";

export default function FortuneTellerPage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [chosenColor, setChosenColor] = useState<string | null>(null);
  const [chosenColorIdx, setChosenColorIdx] = useState<number | null>(null);
  const [chosenNumber, setChosenNumber] = useState<number | null>(null);
  const [revealedFlap, setRevealedFlap] = useState<"tl" | "tr" | "bl" | "br" | null>(null);
  const [fortune, setFortune] = useState<string>("");
  const [animCount, setAnimCount] = useState(0);
  const [totalAnimCount, setTotalAnimCount] = useState(0);
  const [openAxis, setOpenAxis] = useState<"x" | "y">("x");

  const addResult = useLuckStore((state) => state.addResult);

  // Pinch animation countdown logic
  useEffect(() => {
    if (animCount <= 0) {
      if (phase === "color-picked") {
        setPhase("pick-number");
      } else if (phase === "number-picked") {
        setPhase("reveal");
      }
      return;
    }

    // Toggle pinch axis
    setOpenAxis((prev) => (prev === "x" ? "y" : "x"));
    
    // Play wood fold tick sound
    playTick();

    const timer = setTimeout(() => {
      setAnimCount((prev) => prev - 1);
    }, 600); // 600ms matches the CSS animation cycle length

    return () => clearTimeout(timer);
  }, [animCount, phase]);

  const handlePickColor = (colorName: string, index: number) => {
    if (phase !== "idle") return;

    setChosenColor(colorName);
    setChosenColorIdx(index);
    const count = colorName.replace(/\s/g, "").length;
    setAnimCount(count);
    setTotalAnimCount(count);
    setPhase("color-picked");
  };

  const handlePickNumber = (num: number) => {
    if (phase !== "pick-number") return;

    setChosenNumber(num);
    setAnimCount(num);
    setTotalAnimCount(num);
    setPhase("number-picked");
  };

  const handleRevealFlap = (position: "tl" | "tr" | "bl" | "br", num: number) => {
    if (phase !== "reveal") return;

    setRevealedFlap(position);

    if (chosenColorIdx !== null) {
      const drawnFortune = getFortune(chosenColorIdx, num);
      setFortune(drawnFortune);

      // Record result to Zustand store
      const resultText = `Origami Fortune: Chosen ${chosenColor} and #${num} -> "${drawnFortune}"`;
      addResult("Origami Fortune", resultText, true);
    }

    setPhase("done");
  };

  const handleReset = () => {
    setPhase("idle");
    setChosenColor(null);
    setChosenColorIdx(null);
    setChosenNumber(null);
    setRevealedFlap(null);
    setFortune("");
    setAnimCount(0);
    setTotalAnimCount(0);
    setOpenAxis("x");
  };

  // Helper to render letter spelling with current letter highlighted
  const renderSpelling = () => {
    if (!chosenColor) return null;
    const cleanColor = chosenColor.replace(/\s/g, "").toUpperCase();
    const currentIdx = totalAnimCount - animCount;

    return (
      <div className="flex items-center gap-1 mt-1 font-mono text-sm tracking-wider font-extrabold">
        {cleanColor.split("").map((letter, idx) => {
          const isActive = idx === currentIdx;
          return (
            <span
              key={idx}
              className={`px-2 py-0.5 rounded transition-all duration-300 ${
                isActive
                  ? "bg-amber-500 text-white scale-110 shadow-md shadow-amber-500/20"
                  : "text-amber-800/40"
              }`}
            >
              {letter}
            </span>
          );
        })}
      </div>
    );
  };

  // Helper to render number counting with current number highlighted
  const renderNumberCount = () => {
    if (chosenNumber === null) return null;
    const currentCount = totalAnimCount - animCount + 1;

    return (
      <div className="flex items-center gap-2 mt-1 font-mono text-sm font-extrabold">
        {Array.from({ length: chosenNumber }).map((_, idx) => {
          const numValue = idx + 1;
          const isActive = numValue === currentCount;
          return (
            <span
              key={idx}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                isActive
                  ? "bg-amber-600 text-white scale-110 shadow-md shadow-amber-600/20"
                  : numValue < currentCount
                  ? "bg-amber-200/50 text-amber-800/40"
                  : "text-amber-800/20"
              }`}
            >
              {numValue}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`flex-1 flex flex-col items-center w-full min-h-[85vh] p-4 sm:p-6 rounded-[2.5rem] bg-[#fdf8f0] border-4 border-[#e6ded4] shadow-2xl relative overflow-hidden select-none dot-grid ${nunito.variable}`}>
      
      {/* Visual background details: subtle dot-grid pattern & soft paper gradients */}
      <style dangerouslySetInnerHTML={{ __html: `
        .dot-grid {
          background-size: 24px 24px;
          background-image: radial-gradient(circle, #e9e2d7 1.5px, transparent 1.5px);
        }
      `}} />

      {/* Back button and breadcrumb */}
      <div className="w-full max-w-4xl mb-6 flex flex-col items-start gap-3 z-10">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-amber-800/40 hover:text-amber-800 transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Lobby
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between w-full gap-2 border-b border-amber-800/10 pb-4">
          <div>
            <h1 className="text-3xl font-black text-amber-900 leading-none">
              Origami Fortune <span className="text-2xl font-bold text-amber-600">Cootie Catcher</span>
            </h1>
            <p className="text-xs font-bold text-amber-800/50 mt-1 italic tracking-wide">
              An interactive 3D folding paper game packed with mystical answers.
            </p>
          </div>
          <div className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-amber-100 border border-amber-200 text-amber-700 uppercase tracking-widest">
            3D Folding Paper
          </div>
        </div>
      </div>

      {/* Cootie Catcher container */}
      <div className="flex-1 flex items-center justify-center z-10 w-full max-w-sm mt-4 min-h-[400px]">
        <CootieCatcher
          phase={phase}
          openAxis={openAxis}
          chosenColor={chosenColor}
          chosenNumber={chosenNumber}
          revealedFlap={revealedFlap}
          fortune={fortune}
          onPickColor={handlePickColor}
          onPickNumber={handlePickNumber}
          onRevealFlap={handleRevealFlap}
        />
      </div>

      {/* Instructions Overlay / Controller panel */}
      <div className="w-full max-w-sm mt-8 flex flex-col items-center gap-4 z-10 min-h-[100px] text-center">
        {phase === "idle" && (
          <div className="flex flex-col items-center gap-1.5 animate-pulse">
            <p className="text-xs font-black uppercase tracking-widest text-amber-800/80">
              Pick a color
            </p>
            <p className="text-sm font-bold text-amber-700/60 italic">
              Tap one of the colored outer flaps to begin the folding journey
            </p>
          </div>
        )}

        {phase === "color-picked" && (
          <div className="flex flex-col items-center gap-1.5">
            <p className="text-xs font-black uppercase tracking-widest text-amber-800">
              Counting Letters
            </p>
            {renderSpelling()}
          </div>
        )}

        {phase === "pick-number" && (
          <div className="flex flex-col items-center gap-1.5">
            <p className="text-xs font-black uppercase tracking-widest text-amber-800/80">
              Now Pick a Number
            </p>
            <p className="text-sm font-bold text-amber-700/60 italic">
              Tap one of the active numbers shown on the inner panels
            </p>
          </div>
        )}

        {phase === "number-picked" && (
          <div className="flex flex-col items-center gap-1.5">
            <p className="text-xs font-black uppercase tracking-widest text-amber-800">
              Counting Steps
            </p>
            {renderNumberCount()}
          </div>
        )}

        {phase === "reveal" && (
          <div className="flex flex-col items-center gap-1.5">
            <p className="text-xs font-black uppercase tracking-widest text-amber-800/80 animate-pulse">
              Unfold Your Fortune
            </p>
            <p className="text-sm font-bold text-amber-700/60 italic">
              Tap one of the outer panels (5, 6, 7, or 8) to lift the paper
            </p>
          </div>
        )}

        {phase === "done" && (
          <div className="flex flex-col items-center gap-4 w-full animate-fade-up">
            <div className="flex flex-col items-center">
              <p className="text-xs font-black uppercase tracking-widest text-amber-800/80">
                The folds have spoken
              </p>
              <p className="text-xs font-bold text-amber-700/50 mt-1 italic">
                Your future blessing has been revealed under the lifted paper flap
              </p>
            </div>
            
            <button
              onClick={handleReset}
              className="py-3 px-8 rounded-2xl font-black text-sm select-none cursor-pointer tracking-wider shadow-lg bg-amber-600 hover:bg-amber-500 text-white hover:shadow-xl hover:shadow-amber-600/10 active:scale-95 transition-all flex items-center gap-2 group font-mono uppercase"
            >
              <RefreshCw className="w-4 h-4 group-hover:rotate-45 transition-transform" />
              Try Another Flap 🔮
            </button>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up {
          animation: fadeUp 0.6s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
      `}} />
    </div>
  );
}
