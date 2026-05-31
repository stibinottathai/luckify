"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MYSTERY_PRIZES } from "@/lib/prizes";
import { playWinChime, playDudSound, playTick } from "@/lib/audio";
import { useLuckStore } from "@/store/luckStore";
import ResultCard from "@/components/ui/ResultCard";
import ShareModal from "@/components/ui/ShareModal";
import confetti from "canvas-confetti";

interface BoxData {
  id: number;
  emoji: string;
  name: string;
  isWin: boolean;
  scoreImpact: number;
  isJackpot: boolean;
}

export default function MysteryGame() {
  const [boxes, setBoxes] = useState<BoxData[]>([]);
  const [openedIndices, setOpenedIndices] = useState<number[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [finalJackpotBox, setFinalJackpotBox] = useState<BoxData | null>(null);

  const [showResult, setShowResult] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const addResult = useLuckStore((state) => state.addResult);
  const currentScore = useLuckStore((state) => state.luckyScore);

  const initializeBoxes = () => {
    // 1. Filter out the jackpot (Unicorn)
    const jackpotPrize = MYSTERY_PRIZES.find((p) => p.isJackpot)!;
    const standardPrizes = MYSTERY_PRIZES.filter((p) => !p.isJackpot);

    // 2. Shuffle standard prizes and pick 8 of them
    const shuffledStandards = [...standardPrizes].sort(() => Math.random() - 0.5);
    const selectedPrizes: BoxData[] = shuffledStandards.slice(0, 8).map((p, index) => ({
      id: index,
      emoji: p.emoji,
      name: p.name,
      isWin: p.isWin,
      scoreImpact: p.scoreImpact,
      isJackpot: false,
    }));

    // 3. Put jackpot in a random spot 0-8
    const jackpotIndex = Math.floor(Math.random() * 9);
    const finalJackpot: BoxData = {
      id: 8,
      emoji: jackpotPrize.emoji,
      name: jackpotPrize.name,
      isWin: jackpotPrize.isWin,
      scoreImpact: jackpotPrize.scoreImpact,
      isJackpot: true,
    };

    selectedPrizes.splice(jackpotIndex, 0, finalJackpot);
    
    // Set states
    setBoxes(selectedPrizes);
    setOpenedIndices([]);
    setAttempts(0);
    setIsGameOver(false);
    setFinalJackpotBox(null);
    setShowResult(false);
  };

  useEffect(() => {
    initializeBoxes();
  }, []);

  const handleBoxClick = (e: React.MouseEvent, index: number) => {
    if (openedIndices.includes(index) || isGameOver) return;

    const clickedBox = boxes[index];
    const newOpened = [...openedIndices, index];
    const newAttempts = attempts + 1;

    setOpenedIndices(newOpened);
    setAttempts(newAttempts);

    // Click particle burst coordinates
    try {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;

      if (clickedBox.isJackpot) {
        // Jackpot arpeggio synthesis + full celebration
        playWinChime();
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { x, y },
          colors: ["#F5B700", "#FF6B6B", "#00B4A0", "#ffffff"],
        });
        
        setIsGameOver(true);
        setFinalJackpotBox(clickedBox);

        // Score formulas: finding it fast gives more points!
        // Base is 30 points, subtract -3 points per extra box opened. Min 10 points reward
        const calculatedBonus = Math.max(10, 30 - (newAttempts - 1) * 3);

        setTimeout(() => {
          setShowResult(true);
          addResult(
            "Mystery Box",
            `Found Jackpot in ${newAttempts} tries`,
            true,
            calculatedBonus
          );
        }, 800);

      } else {
        // Standard item clicks
        if (clickedBox.isWin) {
          playTick();
          confetti({
            particleCount: 15,
            spread: 30,
            origin: { x, y },
            colors: ["#F5B700", "#00B4A0"],
          });
        } else {
          // Dud box
          playDudSound();
        }
      }
    } catch (err) {
      console.warn(err);
    }
  };

  return (
    <div className="flex flex-col items-center max-w-lg mx-auto py-6">
      {/* Metrics Banner */}
      <div className="w-full flex items-center justify-between px-6 py-3 mb-6 bg-deep-violet/5 dark:bg-white/5 border border-deep-violet/10 dark:border-white/10 rounded-2xl select-none">
        <span className="text-xs font-extrabold uppercase tracking-widest text-deep-violet/50 dark:text-cream-soft/50">
          Boxes Opened:{" "}
          <span className="text-primary-gold font-mono text-base font-black">
            {openedIndices.length} / 9
          </span>
        </span>
        <span className="text-xs font-extrabold uppercase tracking-widest text-deep-violet/50 dark:text-cream-soft/50">
          Attempts:{" "}
          <span className="text-primary-gold font-mono text-base font-black">
            {attempts}
          </span>
        </span>
      </div>

      {/* Game board wrapper */}
      <div className="relative w-full max-w-sm bg-white dark:bg-card border-4 border-primary-gold rounded-3xl p-5 shadow-xl flex flex-col items-center select-none overflow-hidden justify-center min-h-[380px]">
        
        {/* 3x3 Grid of Gift Boxes */}
        <div className="grid grid-cols-3 gap-3.5 w-full py-4 perspective-1000">
          {boxes.map((box, index) => {
            const isOpened = openedIndices.includes(index);
            return (
              <div
                key={index}
                onClick={(e) => handleBoxClick(e, index)}
                style={{
                  transformStyle: "preserve-3d",
                }}
                className={`relative aspect-square cursor-pointer rounded-2xl flex flex-col items-center justify-center transition-all ${
                  isOpened ? "" : "hover:scale-105 active:scale-95"
                }`}
              >
                {/* BACK LAYER: The Prize (revealed inside when lid flips) */}
                <div className="absolute inset-0 bg-deep-violet/5 dark:bg-white/5 border border-dashed border-deep-violet/20 dark:border-white/20 rounded-2xl flex flex-col items-center justify-center z-0">
                  {isOpened && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 260, damping: 15 }}
                      className="text-center flex flex-col items-center"
                    >
                      <span className="text-3xl filter drop-shadow-sm mb-1">
                        {box.emoji}
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-wider text-deep-violet/50 dark:text-cream-soft/50 leading-none">
                        {box.name}
                      </span>
                    </motion.div>
                  )}
                </div>

                {/* FRONT LAYER: Gift Box Cover with Lid (Flipping Lid on click) */}
                <motion.div
                  style={{
                    transformOrigin: "top center",
                    backfaceVisibility: "hidden",
                  }}
                  animate={{
                    rotateX: isOpened ? -120 : 0,
                    z: isOpened ? 20 : 0,
                    opacity: isOpened ? 0.3 : 1,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 140,
                    damping: 15,
                  }}
                  className={`absolute inset-0 rounded-2xl border-2 ${
                    isOpened
                      ? "border-deep-violet/20 dark:border-white/10 bg-deep-violet/10 dark:bg-white/5 pointer-events-none"
                      : "border-primary-gold bg-gradient-to-br from-[#3A2385] to-[#2D1B69] dark:from-[#261556] dark:to-[#1B0F40] shadow-md hover:shadow-lg"
                  } z-10 flex flex-col items-center justify-center`}
                >
                  {!isOpened && (
                    <>
                      {/* Ribbon decoration */}
                      <div className="absolute inset-y-0 w-2.5 bg-primary-gold" />
                      <div className="absolute inset-x-0 h-2.5 bg-primary-gold" />
                      <span className="z-10 text-xl font-bold text-primary-gold drop-shadow-xs">
                        ?
                      </span>
                    </>
                  )}
                </motion.div>
              </div>
            );
          })}
        </div>

        {/* Reset button */}
        {isGameOver && (
          <button
            onClick={initializeBoxes}
            className="mt-4 py-3 px-6 rounded-xl font-bold bg-primary-gold hover:bg-[#E0A700] text-deep-violet shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            New Round 🎁
          </button>
        )}
      </div>

      {/* Popups & dialog components */}
      {finalJackpotBox && (
        <ResultCard
          isOpen={showResult}
          onClose={() => setShowResult(false)}
          gameName="Mystery Box"
          emoji={finalJackpotBox.emoji}
          title={`JACKPOT! You found the ${finalJackpotBox.name}!`}
          description={`Outstanding! You successfully discovered the mythical golden unicorn box in only ${attempts} attempts! Your fortune levels are off the charts.`}
          scoreImpact={Math.max(10, 30 - (attempts - 1) * 3)}
          isWin={true}
          onRestart={initializeBoxes}
          onShare={() => setShowShare(true)}
        />
      )}

      {finalJackpotBox && (
        <ShareModal
          isOpen={showShare}
          onClose={() => setShowShare(false)}
          score={currentScore}
          game="Mystery Box"
          prize={`Jackpot ${finalJackpotBox.emoji}`}
        />
      )}
    </div>
  );
}
