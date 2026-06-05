"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playTick, playDiceRoll, playWinChime, playDudSound } from "@/lib/audio";
import { useLuckStore } from "@/store/luckStore";
import ResultCard from "@/components/ui/ResultCard";
import ShareModal from "@/components/ui/ShareModal";
import confetti from "canvas-confetti";

export default function PickerGame() {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [visibleBalls, setVisibleBalls] = useState<number[]>([]);
  const [drawFrequency, setDrawFrequency] = useState<number[]>(Array(50).fill(0));

  const [showResult, setShowResult] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [matchCount, setMatchCount] = useState(0);

  const addResult = useLuckStore((state) => state.addResult);
  const currentScore = useLuckStore((state) => state.luckyScore);

  const handleNumberSelect = (num: number) => {
    if (isDrawing) return;

    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter((n) => n !== num));
      playTick();
    } else {
      if (selectedNumbers.length >= 6) return; // limit to 6
      setSelectedNumbers([...selectedNumbers, num]);
      playTick();
    }
  };

  const handleDraw = () => {
    if (selectedNumbers.length < 6 || isDrawing) return;

    setIsDrawing(true);
    setDrawnNumbers([]);
    setVisibleBalls([]);
    setShowResult(false);

    // 1. Generate 6 unique random numbers 1-49
    const draws: number[] = [];
    while (draws.length < 6) {
      const rn = Math.floor(Math.random() * 49) + 1;
      if (!draws.includes(rn)) {
        draws.push(rn);
      }
    }

    setDrawnNumbers(draws);

    // 2. Animate balls dropping one by one
    draws.forEach((num, index) => {
      setTimeout(() => {
        setVisibleBalls((prev) => [...prev, num]);
        playDiceRoll();

        // If it's the last ball
        if (index === 5) {
          setIsDrawing(false);

          // Update frequencies count
          setDrawFrequency((prev) => {
            const nextFreq = [...prev];
            draws.forEach((n) => {
              nextFreq[n] = (nextFreq[n] || 0) + 1;
            });
            return nextFreq;
          });

          // Calculate matches
          const matches = selectedNumbers.filter((n) => draws.includes(n)).length;
          setMatchCount(matches);

          // Score configurations based on matches
          let scoreImpact = -5;
          let isWin = false;

          if (matches >= 3) {
            isWin = true;
            if (matches === 3) scoreImpact = 10;
            else if (matches === 4) scoreImpact = 18;
            else if (matches === 5) scoreImpact = 30;
            else if (matches === 6) {
              scoreImpact = 55; // 6-number top prize
              confetti({
                particleCount: 200,
                spread: 120,
              });
            }
          }

          // Slide up result
          setTimeout(() => {
            setShowResult(true);
            addResult(
              "Number Picker",
              `Matched ${matches} numbers`,
              isWin,
              scoreImpact
            );
          }, 800);
        }
      }, (index + 1) * 700); // 700ms staggered drops
    });
  };

  const clearSelection = () => {
    if (isDrawing) return;
    setSelectedNumbers([]);
    setVisibleBalls([]);
    setDrawnNumbers([]);
    setShowResult(false);
  };

  const getMatchVibesText = (matches: number) => {
    switch (matches) {
      case 0:
      case 1:
      case 2:
        return {
          title: "Better luck next time!",
          desc: `You matched ${matches} numbers. Keep shaking up the vibes, fortune is bound to turn!`,
          emoji: "🙁",
        };
      case 3:
        return {
          title: "Lucky Pick! 🍀",
          desc: "Matched 3 numbers! Solid vibes are aligning. You got a nice little boost!",
          emoji: "🍀",
        };
      case 4:
        return {
          title: "Highly Fortunate! ⭐",
          desc: "Matched 4 numbers! Incredibly lucky picks! Your fortune scale is rising.",
          emoji: "🌟",
        };
      case 5:
        return {
          title: "Spectacular Sync! 🔥",
          desc: "Matched 5 numbers! Outstanding cosmic alignment! You've unlocked extreme luck rewards.",
          emoji: "💎",
        };
      case 6:
        return {
          title: "ULTIMATE LOTTO JACKPOT! 🎰",
          desc: "UNBELIEVABLE! You matched all 6 numbers and hit the absolute peak of luck! 🌌",
          emoji: "🎰",
        };
      default:
        return { title: "Good effort!", desc: "", emoji: "✨" };
    }
  };

  // Find max draw counts for inline SVG frequency graph scaling
  const maxFrequency = Math.max(...drawFrequency, 1);

  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto py-4 select-none">
      
      {/* Dynamic machine ball drop tray */}
      <div className="w-full max-w-md bg-gradient-to-b from-[#2D1B69] to-[#1E1145] dark:from-[#1B0F40] dark:to-[#0D0725] border-4 border-primary-gold rounded-3xl p-4 shadow-xl mb-6 flex flex-col items-center">
        
        {/* Ball dropping container */}
        <div className="w-full h-20 bg-black/30 rounded-2xl flex items-center justify-center gap-3 relative overflow-hidden px-4">
          <AnimatePresence>
            {visibleBalls.length === 0 ? (
              <span className="text-xs font-bold uppercase tracking-widest text-[#FFF8E7]/30">
                {isDrawing ? "Drawing..." : "Balls will drop here 🎰"}
              </span>
            ) : (
              visibleBalls.map((ball, i) => (
                <motion.div
                  key={i}
                  initial={{ y: -80, opacity: 0, scale: 0.3 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: 40, opacity: 0 }}
                  transition={{
                    type: "spring",
                    damping: 8, // bouncy elastic drop
                    stiffness: 90,
                  }}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white border-2 border-primary-gold flex items-center justify-center font-mono font-black text-sm sm:text-base text-deep-violet shadow-lg relative"
                >
                  {/* Subtle sphere shadow */}
                  <div className="absolute inset-0.5 rounded-full bg-radial from-transparent to-black/20 pointer-events-none" />
                  {ball}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left Side: Number Selection Grid */}
        <div className="bg-white dark:bg-card border-2 border-deep-violet/10 dark:border-white/10 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-deep-violet/10 dark:border-white/10 pb-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-deep-violet/40 dark:text-soft-cream/40">
              Picked:{" "}
              <span className="text-primary-gold font-mono text-sm font-black">
                {selectedNumbers.length} / 6
              </span>
            </span>
            <button
              onClick={clearSelection}
              className="text-[10px] uppercase font-black tracking-wider text-alert-coral hover:underline bg-transparent border-0 cursor-pointer"
            >
              Clear Picks
            </button>
          </div>

          {/* 1-49 Grid layout (7 columns) */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 49 }).map((_, i) => {
              const num = i + 1;
              const isSelected = selectedNumbers.includes(num);
              const isDrawnMatch = drawnNumbers.includes(num) && isSelected;

              return (
                <button
                  key={num}
                  disabled={isDrawing}
                  onClick={() => handleNumberSelect(num)}
                  className={`aspect-square rounded-full font-mono font-bold text-xs flex items-center justify-center transition-all cursor-pointer border ${
                    isDrawnMatch
                      ? "bg-accent-teal border-accent-teal text-white ring-4 ring-accent-teal/20 scale-105"
                      : isSelected
                      ? "bg-primary-gold border-primary-gold text-deep-violet shadow-xs font-black"
                      : "bg-deep-violet/5 hover:bg-deep-violet/10 border-transparent text-deep-violet/80 dark:bg-white/5 dark:hover:bg-white/10 dark:text-soft-cream/80"
                  }`}
                >
                  {num}
                </button>
              );
            })}
          </div>

          {/* Submit Action */}
          <button
            disabled={selectedNumbers.length < 6 || isDrawing}
            onClick={handleDraw}
            className={`w-full mt-5 py-3.5 rounded-2xl font-extrabold text-sm select-none cursor-pointer tracking-wider shadow-md transition-all active:scale-95 ${
              selectedNumbers.length < 6 || isDrawing
                ? "bg-deep-violet/30 dark:bg-white/10 text-deep-violet/50 dark:text-soft-cream/50 pointer-events-none cursor-not-allowed border border-transparent"
                : "bg-primary-gold hover:bg-[#E0A700] text-deep-violet shadow-lg"
            }`}
          >
            {isDrawing ? "Drawing..." : "DRAW NUMBERS! 🎰"}
          </button>
        </div>

        {/* Right Side: Frequency SVG Bar Chart */}
        <div className="bg-white dark:bg-card border-2 border-deep-violet/10 dark:border-white/10 rounded-3xl p-5 shadow-sm flex flex-col h-full">
          <h4 className="text-xs font-extrabold uppercase tracking-widest text-deep-violet/40 dark:text-soft-cream/40 border-b border-deep-violet/10 dark:border-white/10 pb-3 mb-4">
            Session Draw Frequencies 📊
          </h4>

          {/* Simple Inline SVG Bar Chart */}
          <div className="flex-1 min-h-[220px] flex flex-col justify-end">
            <svg viewBox="0 0 490 140" className="w-full overflow-visible">
              {Array.from({ length: 49 }).map((_, i) => {
                const num = i + 1;
                const freq = drawFrequency[num] || 0;
                
                // SVG math dimensions
                const colWidth = 8;
                const colGap = 2;
                const x = i * (colWidth + colGap);
                
                const height = (freq / maxFrequency) * 100;
                const y = 120 - height;

                return (
                  <g key={num} className="group cursor-help">
                    {/* Tooltip trigger hover block */}
                    <rect
                      x={x - 1}
                      y={0}
                      width={colWidth + 2}
                      height={120}
                      fill="transparent"
                    />
                    
                    {/* Visual Bar column */}
                    <rect
                      x={x}
                      y={y}
                      width={colWidth}
                      height={Math.max(2, height)}
                      rx={2}
                      className={`${
                        freq > 0
                          ? "fill-primary-gold group-hover:fill-accent-teal transition-colors"
                          : "fill-deep-violet/10 dark:fill-white/10"
                      }`}
                    />
                    
                    {/* Numbers text x-axis labels */}
                    {num % 5 === 0 && (
                      <text
                        x={x + colWidth / 2}
                        y={135}
                        textAnchor="middle"
                        className="font-mono text-[9px] font-bold fill-deep-violet/30 dark:fill-soft-cream/30"
                      >
                        {num}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
            <span className="text-[10px] text-center font-bold text-deep-violet/30 dark:text-soft-cream/30 mt-3 font-mono">
              Numbers 1 - 49 (Frequency Bar Heights scale dynamically)
            </span>
          </div>
        </div>
      </div>

      {/* Outcome Cards and sharing dialogs */}
      {drawnNumbers.length === 6 && (
        <ResultCard
          isOpen={showResult}
          onClose={() => setShowResult(false)}
          gameName="Number Picker"
          emoji={getMatchVibesText(matchCount).emoji}
          title={getMatchVibesText(matchCount).title}
          description={getMatchVibesText(matchCount).desc}
          scoreImpact={
            matchCount < 3
              ? -5
              : matchCount === 3
              ? 10
              : matchCount === 4
              ? 18
              : matchCount === 5
              ? 30
              : 55
          }
          isWin={matchCount >= 3}
          onRestart={handleDraw}
          onShare={() => setShowShare(true)}
        />
      )}

      {drawnNumbers.length === 6 && (
        <ShareModal
          isOpen={showShare}
          onClose={() => setShowShare(false)}
          score={currentScore}
          game="Number Picker"
          prize={`Matched ${matchCount} numbers`}
        />
      )}
    </div>
  );
}
