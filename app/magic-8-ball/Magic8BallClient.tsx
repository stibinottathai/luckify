"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useLuckStore } from "@/store/luckStore";
import { playDiceRoll, playWinChime, playDudSound } from "@/lib/audio";
import { getRandomAnswer, Answer } from "./answers";
import EightBall from "./EightBall";
import { Cinzel, Cinzel_Decorative, Cormorant_Garamond } from "next/font/google";
import "./8ball.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  weight: ["400", "700", "900"],
});

const cinzelDecorative = Cinzel_Decorative({
  subsets: ["latin"],
  variable: "--font-cinzel-decorative",
  weight: ["400", "700"],
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

type Phase = "idle" | "shaking" | "revealing" | "answer" | "resetting";

const PARTICLES = [
  { top: "-10%", left: "15%", color: "bg-purple-400", delay: "0.2s", duration: "3.2s", size: 4 },
  { top: "5%", left: "85%", color: "bg-blue-400", delay: "0.8s", duration: "2.8s", size: 3 },
  { top: "80%", left: "-5%", color: "bg-white", delay: "1.4s", duration: "3.6s", size: 5 },
  { top: "90%", left: "75%", color: "bg-purple-300", delay: "0.5s", duration: "2.5s", size: 3 },
  { top: "-15%", left: "55%", color: "bg-indigo-400", delay: "1.9s", duration: "4.0s", size: 4 },
  { top: "40%", left: "-12%", color: "bg-blue-300", delay: "2.2s", duration: "3.0s", size: 3 },
  { top: "35%", left: "105%", color: "bg-white", delay: "0.0s", duration: "3.5s", size: 5 },
  { top: "105%", left: "30%", color: "bg-purple-500", delay: "1.1s", duration: "2.2s", size: 4 },
  { top: "60%", left: "-10%", color: "bg-indigo-300", delay: "0.7s", duration: "2.9s", size: 3 },
  { top: "-5%", left: "80%", color: "bg-blue-500", delay: "1.6s", duration: "3.8s", size: 4 },
  { top: "95%", left: "50%", color: "bg-white", delay: "2.3s", duration: "3.1s", size: 3 },
  { top: "-8%", left: "35%", color: "bg-purple-400", delay: "1.2s", duration: "2.7s", size: 5 },
];

export default function Magic8BallClient() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addResult = useLuckStore((state) => state.addResult);

  // Auto-focus input on initial mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleAsk = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!question.trim() || phase !== "idle") return;

    // Pick response
    const pick = getRandomAnswer();
    setAnswer(pick);
    setPhase("shaking");

    // Play shaking sounds
    const audioInterval = setInterval(() => {
      playDiceRoll();
    }, 150);

    // 900ms -> Transition to revealing phase
    setTimeout(() => {
      clearInterval(audioInterval);
      setPhase("revealing");

      // Play final reveal chime or dud based on outcome
      if (pick.type === "positive") {
        playWinChime();
      } else if (pick.type === "negative") {
        playDudSound();
      } else {
        playDiceRoll();
      }
    }, 900);

    // 1600ms -> Transition to final answer state, log to Zustand history store
    setTimeout(() => {
      setPhase("answer");

      const isWin = pick.type === "positive";
      // Score impact (Wins +5 to +15, Neutrals +2 to -2, Negatives -4 to -10)
      let scoreImpact = 0;
      if (pick.type === "positive") {
        scoreImpact = Math.floor(Math.random() * 11) + 5;
      } else if (pick.type === "neutral") {
        scoreImpact = Math.floor(Math.random() * 5) - 2;
      } else {
        scoreImpact = -(Math.floor(Math.random() * 7) + 4);
      }

      const logText = `Consulted the Oracle: "${question}" -> "${pick.text}" (${pick.type.toUpperCase()})`;
      addResult("Magic 8-Ball", logText, isWin, scoreImpact);
    }, 1600);
  };

  const handleReset = () => {
    if (phase !== "answer") return;
    setPhase("resetting");

    setTimeout(() => {
      setPhase("idle");
      setAnswer(null);
      setQuestion("");
      // Force refocus the input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }, 400);
  };

  return (
    <div
      className={`flex-1 flex flex-col items-center w-full min-h-[85vh] p-4 sm:p-6 rounded-[2.5rem] bg-[#080808] bg-[radial-gradient(circle_at_center,_#121212_0%,_#050505_100%)] border-4 border-[#1a1a1a] shadow-2xl relative overflow-hidden select-none ${cinzel.variable} ${cinzelDecorative.variable} ${cormorant.variable}`}
    >
      {/* Background vignette & cosmic sparkles */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.05),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(59,130,246,0.04),transparent_50%)] pointer-events-none" />

      {/* Back button and navigation breadcrumb */}
      <div className="w-full max-w-4xl mb-6 flex flex-col items-start gap-3 z-20">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-slate-500 hover:text-white transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Lobby
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between w-full gap-2 border-b border-white/5 pb-4">
          <div>
            <h1 className="text-3xl font-black font-cinzel text-white leading-none flex items-center gap-2">
              🔮 <span className="text-2xl font-bold font-fredoka text-slate-200">Magic 8-Ball</span>
            </h1>
            <p className="text-xs font-bold text-slate-500 mt-2 font-cormorant italic tracking-wide">
              Peer deep into the mystical sphere and seek cosmic validation.
            </p>
          </div>
          <div className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 font-cinzel uppercase tracking-widest">
            ASTRAL DIVINATION
          </div>
        </div>
      </div>

      {/* Header Title Section */}
      <div className="text-center mt-2 mb-4 z-10">
        <h2 
          className="text-4xl sm:text-5xl font-black font-cinzel-decorative text-white tracking-wide relative pb-2 inline-block"
        >
          The Oracle
          {/* Gold Underline */}
          <span className="absolute bottom-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
        </h2>
        <p className="text-sm font-medium font-cormorant italic text-gray-400 mt-2">
          &ldquo;Ask your question. The cosmos will answer.&rdquo;
        </p>
      </div>

      {/* Central 8-Ball Arena with Particle Layer */}
      <div className="relative flex-1 flex items-center justify-center w-full max-w-sm mt-4 min-h-[360px] z-10">
        
        {/* Mystic floating particles surrounding the ball */}
        {phase === "answer" && (
          <div className="absolute inset-0 pointer-events-none overflow-visible">
            {PARTICLES.map((p, idx) => (
              <div
                key={idx}
                className={`absolute rounded-full animate-particle ${p.color}`}
                style={{
                  top: p.top,
                  left: p.left,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  boxShadow: "0 0 8px currentColor",
                  ["--delay" as any]: p.delay,
                  ["--duration" as any]: p.duration,
                }}
              />
            ))}
          </div>
        )}

        {/* 8-Ball CSS Renderer */}
        <EightBall phase={phase} answer={answer} />
      </div>

      {/* Input query and Ask button Controls */}
      <div className="w-full max-w-md mt-6 flex flex-col items-center gap-4 z-20 min-h-[140px]">
        {phase === "idle" && (
          <form onSubmit={handleAsk} className="w-full flex flex-col items-center gap-4 animate-fade-in">
            <input
              ref={inputRef}
              type="text"
              required
              maxLength={120}
              placeholder="Will the stars align for me?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full bg-[#111] border border-gray-700 text-white rounded-full px-6 py-3.5 text-center font-semibold placeholder:text-gray-600 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/20 transition-all font-cormorant text-lg"
            />
            
            <button
              type="submit"
              disabled={!question.trim()}
              className="bg-white hover:bg-gray-200 text-black font-extrabold rounded-full px-10 py-3.5 select-none cursor-pointer tracking-wider shadow-lg active:scale-95 transition-all flex items-center gap-2 group uppercase font-cinzel text-xs disabled:opacity-40 disabled:pointer-events-none"
            >
              <Sparkles className="w-4 h-4 text-black group-hover:animate-pulse" />
              Ask the Oracle
            </button>
          </form>
        )}

        {(phase === "shaking" || phase === "revealing") && (
          <div className="flex flex-col items-center gap-2 py-4">
            <div className="flex items-center gap-2 text-center text-gray-400 font-cinzel text-xs font-black uppercase tracking-widest animate-pulse">
              <Sparkles className="w-4 h-4 animate-spin text-white" />
              Agitating the Void...
            </div>
            <p className="text-xs font-bold text-gray-600 font-cormorant italic text-center">
              Deciphering the alignment of the cosmos
            </p>
          </div>
        )}

        {phase === "answer" && (
          <div className="flex flex-col items-center gap-3 w-full animate-fade-in">
            {/* Display the users query again for context */}
            <div className="text-center max-w-xs px-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-500 font-cinzel mb-1">
                You asked the cosmic void:
              </p>
              <p className="text-sm font-bold text-slate-300 font-cormorant italic leading-snug">
                &ldquo;{question}&rdquo;
              </p>
            </div>

            {/* Ask Again link button */}
            <button
              onClick={handleReset}
              className="mt-2 text-gray-500 hover:text-white text-xs font-bold font-cinzel uppercase tracking-widest underline decoration-gray-700 hover:decoration-white transition-all cursor-pointer bg-transparent border-0"
            >
              Ask Another Question
            </button>
          </div>
        )}
      </div>

      {/* Embedded fade-in animation style helper */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}} />
    </div>
  );
}
