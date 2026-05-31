"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, HelpCircle, Compass } from "lucide-react";
import { useLuckStore } from "@/store/luckStore";
import { usePendulum } from "./usePendulum";
import ResultCard from "@/components/ui/ResultCard";
import ShareModal from "@/components/ui/ShareModal";
import { Cinzel } from "next/font/google";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-cinzel",
});

export default function PendulumPage() {
  const [question, setQuestion] = useState("");
  const [phase, setPhase] = useState<"idle" | "swinging" | "settled">("idle");
  const [answer, setAnswer] = useState<"yes" | "no" | null>(null);

  const [showResult, setShowResult] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const addResult = useLuckStore((state) => state.addResult);
  const currentScore = useLuckStore((state) => state.luckyScore);

  const handleSettle = (finalAnswer: "yes" | "no") => {
    // Determine score impact: Yes grants a slight positive cosmic blessing, No grants a cosmic cleansing
    const isYes = finalAnswer === "yes";
    const scoreImpact = isYes ? 12 : -6;
    const verdictText = `Asked: "${question || "Should I take this step?"}" - Oracle answered: ${finalAnswer.toUpperCase()}`;

    // Add to our global luck store history
    addResult("Pendulum Divination", verdictText, isYes, scoreImpact);

    // Delayed trigger for premium victory card popup
    setTimeout(() => {
      setShowResult(true);
    }, 1500);
  };

  const { canvasRef, startDivination, resetDivination } = usePendulum({
    phase,
    setPhase,
    answer,
    setAnswer,
    onSettle: handleSettle,
  });

  const handleRelease = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) {
      alert("🔮 Please write down your query for the cosmic pendulum first!");
      return;
    }
    startDivination();
  };

  const handleReset = () => {
    setQuestion("");
    resetDivination();
    setShowResult(false);
  };

  return (
    <div className={`flex-1 flex flex-col items-center select-none w-full max-w-5xl mx-auto py-2 ${cinzel.variable}`}>
      {/* Page Title & Back link */}
      <div className="w-full mb-6 flex flex-col items-start gap-2.5 select-none px-4">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-deep-violet/40 hover:text-deep-violet dark:text-cream-soft/40 dark:hover:text-cream-soft transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Lobby
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold font-fredoka text-deep-violet dark:text-cream-soft leading-none">
            Pendulum Divination 🔮
          </h1>
          <p className="text-xs font-semibold text-deep-violet/50 dark:text-cream-soft/50 mt-1.5">
            Type your yes/no query, focus your intention, release the pendulum, and let gravity unlock the cosmos!
          </p>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start px-4">
        
        {/* LEFT COLUMN: The Physical Divination Canvas Arena */}
        <div className="lg:col-span-7 flex flex-col items-center w-full">
          <div className="relative w-full max-w-lg bg-[#060b18] border-4 border-primary-gold/70 rounded-3xl p-5 shadow-2xl flex flex-col items-center overflow-hidden h-[490px]">
            
            {/* Mesh starfield backgrounds inside the container */}
            <div className="absolute inset-0 bg-radial from-[#1e1b4b]/20 via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-80 h-80 bg-[radial-gradient(circle,rgba(99,102,241,0.06)_0%,transparent_70%)] pointer-events-none rounded-full blur-xl" />
            
            {/* Top decorative header */}
            <div className="w-full flex items-center justify-between border-b border-white/5 pb-2.5 mb-2 z-10">
              <span className="text-[10px] font-black font-fredoka tracking-wider text-primary-gold uppercase flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 animate-spin-slow" />
                Astral Core Alignment
              </span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/5 text-cream-soft/40 tracking-widest uppercase font-mono">
                {phase.toUpperCase()}
              </span>
            </div>

            {/* Canvas Container */}
            <div className="flex-1 w-full flex items-center justify-center relative z-10">
              <canvas
                ref={canvasRef}
                className="max-w-full block aspect-[50/42] rounded-2xl cursor-default"
                style={{ filter: phase === "swinging" ? "drop-shadow(0 0 6px rgba(245,183,0,0.15))" : "none" }}
              />
              
              {/* Central mystical guidelines / crosshair shown in idle state */}
              {phase === "idle" && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-[1px] h-[300px] border-l border-dashed border-white/5 absolute top-[50px] left-1/2" />
                  <div className="w-36 h-36 border border-dashed border-white/5 rounded-full absolute top-[135px] left-1/2 -translate-x-1/2" />
                </div>
              )}
            </div>

            {/* Subtle glow layer above the bottom */}
            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
          </div>
        </div>

        {/* RIGHT COLUMN: Oracle Input, Query Control, & Visual Outcomes */}
        <div className="lg:col-span-5 bg-white dark:bg-card border-4 border-primary-gold rounded-3xl p-6 shadow-xl flex flex-col w-full text-slate-900 dark:text-white h-[490px]">
          
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-4 pb-3 border-b border-slate-100 dark:border-white/5">
            🔮 Focus your consciousness on a binary (Yes/No) decision, input your query below, and release the cosmic pendulum wire.
          </p>

          {/* Form wrapper */}
          <form onSubmit={handleRelease} className="space-y-4 flex flex-col flex-1">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Your Yes / No Question
              </label>
              
              <div className="relative">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  disabled={phase !== "idle"}
                  placeholder="Will my next venture bring prosperity?..."
                  className="w-full bg-slate-50 dark:bg-white/5 border-2 border-slate-200 dark:border-white/10 focus:border-primary-gold dark:focus:border-primary-gold focus:ring-4 focus:ring-primary-gold/10 rounded-2xl py-4 pl-4 pr-10 text-sm font-semibold placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 dark:text-cream-soft"
                  maxLength={100}
                />
                <HelpCircle className="w-5 h-5 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600" />
              </div>
            </div>

            {/* Middle Active Status Card */}
            <div className="flex-1 flex flex-col justify-center items-center p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-center relative overflow-hidden">
              
              {phase === "idle" && (
                <div className="space-y-1.5 py-3">
                  <Compass className="w-8 h-8 text-primary-gold animate-spin-slow mx-auto" />
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400 max-w-xs leading-normal">
                    Enter your question above and click <span className="font-extrabold text-primary-gold">RELEASE</span> to start the astral vibration!
                  </p>
                </div>
              )}

              {phase === "swinging" && (
                <div className="space-y-2.5 py-3 flex flex-col items-center">
                  {/* Glowing spiral animated loading effect */}
                  <div className="relative flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-primary-gold/20 border-t-primary-gold rounded-full animate-spin" />
                    <Sparkles className="w-4 h-4 text-primary-gold absolute animate-pulse" />
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary-gold animate-pulse">
                      Analyzing Spatial Vectors...
                    </p>
                    <p className="text-xs font-bold italic text-slate-500 dark:text-slate-400 max-w-xs leading-normal">
                      &quot;{question}&quot;
                    </p>
                  </div>
                </div>
              )}

              {phase === "settled" && answer && (
                <div className="space-y-3 py-2 flex flex-col items-center w-full animate-fade-in">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 leading-none">
                    The Oracle Decrees:
                  </p>
                  
                  <h4
                    className={`text-5xl font-black font-cinzel leading-none select-none ${
                      answer === "yes" 
                        ? "text-amber-400 drop-shadow-[0_0_12px_rgba(245,183,0,0.5)]" 
                        : "text-blue-300 drop-shadow-[0_0_12px_rgba(147,197,253,0.5)]"
                    }`}
                    style={
                      answer === "yes"
                        ? { textShadow: "0 0 15px rgba(245, 183, 0, 0.4)" }
                        : { textShadow: "0 0 15px rgba(147, 197, 253, 0.4)" }
                    }
                  >
                    {answer === "yes" ? "YES" : "NO"}
                  </h4>

                  <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 max-w-[280px] leading-relaxed mx-auto italic">
                    {answer === "yes"
                      ? "✨ Stellar structures are aligned! Your path glows with cosmic approval and prosperity."
                      : "🌀 Celestial winds advise caution! Re-evaluate details before committing to this route."}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="w-full pt-2">
              {phase === "idle" && (
                <button
                  type="submit"
                  disabled={!question.trim()}
                  className={`w-full py-4 rounded-2xl font-extrabold text-sm tracking-widest text-[#2D1B69] bg-primary-gold hover:bg-[#E0A700] hover:shadow-xl active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 uppercase select-none ${
                    !question.trim() ? "opacity-40 cursor-not-allowed pointer-events-none" : ""
                  }`}
                >
                  <Sparkles className="w-4.5 h-4.5" />
                  Release Pendulum 🔮
                </button>
              )}

              {phase === "swinging" && (
                <button
                  type="button"
                  disabled
                  className="w-full py-4 rounded-2xl font-extrabold text-sm tracking-widest text-slate-400 dark:text-slate-500 bg-slate-300/35 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center gap-2 uppercase select-none cursor-default"
                >
                  Swinging Astral Wire...
                </button>
              )}

              {phase === "settled" && (
                <div className="w-full grid grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="py-3.5 px-4 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-900 dark:text-cream-soft border border-slate-200 dark:border-white/10 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 uppercase text-[11px] tracking-wider"
                  >
                    Ask Another 🌀
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResult(true)}
                    className="py-3.5 px-4 rounded-xl font-bold bg-primary-gold hover:bg-[#E0A700] text-deep-violet shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 uppercase text-[11px] tracking-wider"
                  >
                    View Verdict 📜
                  </button>
                </div>
              )}
            </div>

          </form>
        </div>

      </div>

      {/* Outcome Popup Modals */}
      {answer && (
        <ResultCard
          isOpen={showResult}
          onClose={() => setShowResult(false)}
          gameName="Pendulum Divination"
          emoji="🔮"
          title={answer === "yes" ? "Stellar Alignment! YES! ✨" : "Astral Blockade! NO. 🌀"}
          description={
            answer === "yes"
              ? `The stars glow in perfect harmony for your query: "${question || "Should I take this step?"}". The pendulum wire settled decisively on the side of prosperity and approval!`
              : `The astral energy suggests re-evaluating your query: "${question || "Should I take this step?"}". The silver bob swung and settled clearly warning you of impending turbulence.`
          }
          scoreImpact={answer === "yes" ? 12 : -6}
          isWin={answer === "yes"}
          onRestart={handleReset}
          onShare={() => setShowShare(true)}
        />
      )}

      {answer && (
        <ShareModal
          isOpen={showShare}
          onClose={() => setShowShare(false)}
          score={currentScore}
          game="Pendulum Divination"
          prize={answer === "yes" ? "Celestial Cosmic Aura" : "Cosmic Purifying Protection"}
        />
      )}
    </div>
  );
}
