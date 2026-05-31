"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useLuckStore } from "@/store/luckStore";
import ResultCard from "@/components/ui/ResultCard";
import ShareModal from "@/components/ui/ShareModal";
import { playDiceRoll } from "@/lib/audio";
import { Sparkles, Coins } from "lucide-react";

export default function CoinFlipGame() {
  const [bet, setBet] = useState<"heads" | "tails" | null>(null);
  const [flipping, setFlipping] = useState(false);
  const [resultSide, setResultSide] = useState<"heads" | "tails" | null>(null);
  const [rotationDegrees, setRotationDegrees] = useState(0);

  const [showResult, setShowResult] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const addResult = useLuckStore((state) => state.addResult);
  const currentScore = useLuckStore((state) => state.luckyScore);

  const handleFlip = () => {
    if (!bet) {
      alert("⚠️ Please make your choice (Heads or Tails) before flipping the coin!");
      return;
    }

    if (flipping) return;

    setFlipping(true);
    setResultSide(null);
    setShowResult(false);

    // Audio effects interval during flip
    const audioInterval = setInterval(() => {
      playDiceRoll();
    }, 150);

    // Dynamic random outcome
    const outcome: "heads" | "tails" = Math.random() > 0.5 ? "heads" : "tails";
    
    // Calculate total rotation degrees using a robust modulo strategy.
    // Heads aligns with even multiples of 180 (0, 360, 720...).
    // Tails aligns with odd multiples of 180 (180, 540, 900...).
    // We add at least 6 full 3D spins (2160 degrees) to ensure a premium tumbling sequence over 1.6 seconds.
    const targetModulo = outcome === "heads" ? 0 : 180;
    const baseSpins = 2160;
    const candidate = rotationDegrees + baseSpins;
    const currentModulo = candidate % 360;
    let difference = targetModulo - currentModulo;
    if (difference < 0) {
      difference += 360;
    }
    const finalRotation = candidate + difference;
    
    setRotationDegrees(finalRotation);

    setTimeout(() => {
      clearInterval(audioInterval);
      setFlipping(false);
      setResultSide(outcome);

      const isWin = bet === outcome;
      const scoreImpact = 0; // Pure simulation, zero balance impact
      const resultText = `${outcome.toUpperCase()}! Choice was ${bet.toUpperCase()}. (${isWin ? "CORRECT" : "INCORRECT"})`;

      // Update global luck history without modifying score balance
      addResult("Flip a Coin", resultText, isWin, scoreImpact);

      // Trigger outcome card popup immediately upon landing
      setShowResult(true);

    }, 1600); // 1.6s triggers exactly as the coin lands and settles
  };

  const isWin = bet === resultSide;

  return (
    <div className="w-full max-w-5xl mx-auto py-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start select-none">
        
        {/* LEFT COLUMN: 3D Coin Flip View */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="relative w-full max-w-sm bg-white dark:bg-card border-4 border-primary-gold rounded-3xl p-6 shadow-xl flex flex-col items-center select-none overflow-hidden h-[460px]">
            
            {/* 3D Coin Arena */}
            <div className="flex-1 flex items-center justify-center relative w-full h-[280px] perspective-1000">
              
              {/* Spinning & Flying 3D Coin Container */}
              <motion.div
                animate={
                  flipping
                    ? {
                        rotateY: rotationDegrees,
                        rotateX: [0, 25, -20, 0], // beautifully organic front-to-back tilt
                        rotateZ: [0, 15, -12, 0], // organic roll/wobble side-to-side
                        y: [0, -90, 0], // parabolic vertical travel
                        scale: [1, 1.2, 1], // Z-axis scale depth
                      }
                    : {
                        rotateY: rotationDegrees,
                        rotateX: 0,
                        rotateZ: 0,
                        y: 0,
                        scale: 1,
                      }
                }
                transition={{
                  rotateY: {
                    duration: 1.6,
                    ease: [0.25, 0.1, 0.25, 1], // premium cubic-bezier ease-out
                  },
                  rotateX: {
                    duration: 1.6,
                    times: [0, 0.35, 0.75, 1],
                    ease: "easeInOut",
                  },
                  rotateZ: {
                    duration: 1.6,
                    times: [0, 0.35, 0.75, 1],
                    ease: "easeInOut",
                  },
                  y: {
                    duration: 1.6,
                    times: [0, 0.5, 1],
                    ease: ["easeOut", "easeIn"], // rise decelerates, drop accelerates
                  },
                  scale: {
                    duration: 1.6,
                    times: [0, 0.5, 1],
                    ease: ["easeOut", "easeIn"],
                  },
                }}
                className="w-40 h-40 relative cursor-pointer"
                style={{ transformStyle: "preserve-3d" }}
                onClick={handleFlip}
              >
                {/* HEADS FACE (Front) */}
                <div
                  className="absolute inset-0 w-full h-full rounded-full border-4 border-primary-gold bg-gradient-to-br from-[#FFD54F] via-[#F5B700] to-[#E65100] shadow-2xl flex flex-col items-center justify-center backface-hidden"
                  style={{ transform: "rotateY(0deg)", zIndex: 2 }}
                >
                  {/* Cosmic Sun SVG Graphic */}
                  <svg viewBox="0 0 100 100" className="w-24 h-24 filter drop-shadow-md">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#FFF59D" strokeWidth="2" strokeDasharray="4,4" />
                    {/* Glowing Sun Center */}
                    <circle cx="50" cy="50" r="18" fill="#FFF59D" />
                    {/* Sun Rays */}
                    <g stroke="#FFF59D" strokeWidth="4" strokeLinecap="round">
                      <line x1="50" y1="12" x2="50" y2="22" />
                      <line x1="50" y1="78" x2="50" y2="88" />
                      <line x1="12" y1="50" x2="22" y2="50" />
                      <line x1="78" y1="50" x2="88" y2="50" />
                      <line x1="23" y1="23" x2="30" y2="30" />
                      <line x1="70" y1="70" x2="77" y2="77" />
                      <line x1="77" y1="23" x2="70" y2="30" />
                      <line x1="30" y1="70" x2="23" y2="77" />
                    </g>
                    {/* Text Label */}
                    <text x="50" y="54" fontSize="10" fontWeight="900" textAnchor="middle" fill="#E65100" fontFamily="sans-serif">HEADS</text>
                  </svg>
                </div>

                {/* TAILS FACE (Back) */}
                <div
                  className="absolute inset-0 w-full h-full rounded-full border-4 border-slate-300 bg-gradient-to-br from-[#ECEFF1] via-[#90A4AE] to-[#37474F] shadow-2xl flex flex-col items-center justify-center backface-hidden"
                  style={{ transform: "rotateY(180deg)", zIndex: 1 }}
                >
                  {/* Cosmic Moon SVG Graphic */}
                  <svg viewBox="0 0 100 100" className="w-24 h-24 filter drop-shadow-md">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#CFD8DC" strokeWidth="2" strokeDasharray="3,3" />
                    {/* Crescent Moon */}
                    <path
                      d="M60,30 C40,30 30,42 30,58 C30,72 40,82 58,82 C44,82 36,74 36,58 C36,44 46,32 60,30 Z"
                      fill="#ECEFF1"
                    />
                    {/* Shiny stars */}
                    <circle cx="48" cy="40" r="1.5" fill="#FFF" />
                    <circle cx="62" cy="52" r="1.5" fill="#FFF" />
                    <circle cx="56" cy="65" r="1" fill="#FFF" />
                    {/* Text Label */}
                    <text x="50" y="54" fontSize="10" fontWeight="900" textAnchor="middle" fill="#37474F" fontFamily="sans-serif">TAILS</text>
                  </svg>
                </div>
              </motion.div>
            </div>

            {/* Raised floor barrier */}
            <div className="absolute inset-x-0 bottom-[105px] h-3 bg-slate-300/20 border-t border-slate-300/40 dark:bg-white/5 dark:border-white/10" />

            {/* Action Button Controls */}
            <div className="absolute bottom-4 flex items-center gap-3">
              <button
                disabled={flipping}
                onClick={handleFlip}
                className={`py-3.5 px-8 rounded-2xl font-extrabold text-base select-none cursor-pointer tracking-wider shadow-lg transition-all transform active:scale-95 ${
                  flipping
                    ? "bg-slate-300/30 dark:bg-white/10 text-slate-400 dark:text-slate-500 pointer-events-none"
                    : "bg-[#F5B700] hover:bg-[#E0A700] text-[#2D1B69] hover:shadow-xl"
                }`}
              >
                {flipping ? "Flipping..." : "FLIP THE COIN! 🪙"}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Prediction Selector */}
        <div className="lg:col-span-5 lg:-mt-8 bg-white dark:bg-card border-4 border-primary-gold rounded-3xl p-6 shadow-xl flex flex-col w-full text-slate-900 dark:text-white">
          <h3 className="text-xl font-extrabold font-fredoka text-slate-900 dark:text-[#FFF8E7] mb-2 border-b border-slate-200 dark:border-white/10 pb-3 flex justify-between items-center">
            <span>Flip Predictor 🎨</span>
            <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 dark:bg-white/5 dark:text-cream-soft/40">
              Cosmic Choice
            </span>
          </h3>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-6">
            Make your cosmic choice: Heads or Tails! If your selection matches the coin toss, you win!
          </p>

          {/* Predictor Choice Buttons */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* HEADS Choice Button */}
            <button
              onClick={() => !flipping && setBet("heads")}
              disabled={flipping}
              className={`py-5 px-4 rounded-2xl border-4 font-black text-sm flex flex-col items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50 ${
                bet === "heads"
                  ? "border-[#F5B700] bg-amber-50 text-[#E65100] shadow-md ring-4 ring-amber-400/20"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
              }`}
            >
              <span className="text-3xl">☀️</span>
              <span className="font-fredoka tracking-wider">HEADS</span>
            </button>

            {/* TAILS Choice Button */}
            <button
              onClick={() => !flipping && setBet("tails")}
              disabled={flipping}
              className={`py-5 px-4 rounded-2xl border-4 font-black text-sm flex flex-col items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50 ${
                bet === "tails"
                  ? "border-slate-400 bg-slate-100 text-slate-800 shadow-md ring-4 ring-slate-400/20 dark:bg-white/10 dark:text-white"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
              }`}
            >
              <span className="text-3xl">🌙</span>
              <span className="font-fredoka tracking-wider">TAILS</span>
            </button>
          </div>

          {/* Active selection feedback card */}
          <div className="flex-1 flex flex-col justify-center items-center p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-center">
            {bet ? (
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Your Prediction</p>
                <h4 className="text-lg font-black font-fredoka flex items-center justify-center gap-2 text-primary-gold animate-pulse">
                  <Sparkles className="w-5 h-5" />
                  You selected {bet.toUpperCase()}!
                </h4>
              </div>
            ) : (
              <div className="space-y-1.5 py-4">
                <Coins className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto" />
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 italic">
                  Tap Heads or Tails above to predict the cosmic toss!
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Outcome Cards and sharing modals */}
      {resultSide && (
        <ResultCard
          isOpen={showResult}
          onClose={() => setShowResult(false)}
          gameName="Flip a Coin"
          emoji="🪙"
          title={isWin ? "Spins align! You Won! 🎉" : "Fate has spoken! You Lost. 💔"}
          description={
            isWin
              ? `Congratulations! The cosmic golden coin spun and settled perfectly on ${resultSide.toUpperCase()}, matching your prediction!`
              : `Alas! The coin settled on ${resultSide.toUpperCase()} which did not match your prediction of ${bet?.toUpperCase()}.`
          }
          scoreImpact={0}
          isWin={isWin}
          onRestart={handleFlip}
          onShare={() => setShowShare(true)}
        />
      )}

      {resultSide && (
        <ShareModal
          isOpen={showShare}
          onClose={() => setShowShare(false)}
          score={currentScore}
          game="Flip a Coin"
          prize={isWin ? "Golden Cosmic Blessing" : "Lunar Cosmic Cleansing"}
        />
      )}
    </div>
  );
}
