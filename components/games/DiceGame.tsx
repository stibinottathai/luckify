"use client";

import { useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { playDiceRoll } from "@/lib/audio";
import { useLuckStore } from "@/store/luckStore";
import ResultCard from "@/components/ui/ResultCard";
import ShareModal from "@/components/ui/ShareModal";

// Map each die face 1-6 to exact 3D cube rotation angles
const FACE_ROTATIONS: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  6: { x: 0, y: 180 },
  2: { x: -90, y: 0 },
  5: { x: 90, y: 0 },
  3: { x: 0, y: -90 },
  4: { x: 0, y: 90 },
};

// Render dots on each face as simple SVGs
function DieFace({ value }: { value: number }) {
  const dots: Record<number, [number, number][]> = {
    1: [[50, 50]],
    2: [[25, 25], [75, 75]],
    3: [[25, 25], [50, 50], [75, 75]],
    4: [[25, 25], [25, 75], [75, 25], [75, 75]],
    5: [[25, 25], [25, 75], [50, 50], [75, 25], [75, 75]],
    6: [[25, 25], [25, 50], [25, 75], [75, 25], [75, 50], [75, 75]],
  };

  return (
    <svg className="w-full h-full p-2" viewBox="0 0 100 100">
      {dots[value]?.map(([cx, cy], i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r="8"
          className="fill-white"
        />
      ))}
    </svg>
  );
}

export default function DiceGame() {
  const diceCount = 1;
  const [isRolling, setIsRolling] = useState(false);
  const [hasRolled, setHasRolled] = useState(false);
  const [diceValues, setDiceValues] = useState<number[]>([4]);
  
  // Custom controls for 3D rotations
  const rollControls = [useAnimation()];

  const [showResult, setShowResult] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [outcomeData, setOutcomeData] = useState<{
    sum: number;
    title: string;
    description: string;
    isWin: boolean;
    scoreImpact: number;
    emoji: string;
  } | null>(null);

  const addResult = useLuckStore((state) => state.addResult);
  const currentScore = useLuckStore((state) => state.luckyScore);

  const handleRoll = async () => {
    if (isRolling) return;
    setIsRolling(true);
    setHasRolled(true);
    setShowResult(false);

    // Roll audio synthesis intervals
    const soundTimer = setInterval(() => {
      playDiceRoll();
    }, 100);

    const newValues = [Math.floor(Math.random() * 6) + 1];

    // Roll animations
    const animationPromises = newValues.map(async (val, index) => {
      const targetRot = FACE_ROTATIONS[val];
      
      // Calculate random tumbling rotations
      const spinX = 360 * 3 + targetRot.x;
      const spinY = 360 * 3 + targetRot.y;

      await rollControls[index].start({
        rotateX: [0, spinX],
        rotateY: [0, spinY],
        z: [0, 40, 0], // Slight launch pop towards screen
        transition: {
          duration: 1.2,
          ease: "easeOut",
        },
      });
      // Lock rotation on target
      rollControls[index].set({
        rotateX: targetRot.x,
        rotateY: targetRot.y,
      });
    });

    await Promise.all(animationPromises);

    clearInterval(soundTimer);
    setDiceValues(newValues);
    setIsRolling(false);

    // Calculate outcomes for single die (1-6)
    const val = newValues[0];
    let scoreImpact = 5;
    let isWin = true;
    let title = `You rolled a ${val}!`;
    let emoji = "🎲";
    let description = "";

    if (val === 6) {
      scoreImpact = 30;
      isWin = true;
      title = "MAX LUCK 6! 🎰";
      emoji = "🔥";
      description = "Absolute maximum rolling power! You have unlocked cosmic abundance!";
    } else if (val === 5) {
      scoreImpact = 15;
      isWin = true;
      title = "High 5! 💥";
      emoji = "💥";
      description = "Adventure and change! A new path or opportunity is opening up for you.";
    } else if (val === 4) {
      scoreImpact = 12;
      isWin = true;
      title = "Solid 4! 🍀";
      emoji = "🍀";
      description = "Solid foundation! Strong support and steady progress are coming your way.";
    } else if (val === 3) {
      scoreImpact = 10;
      isWin = true;
      title = "Lucky 3! ✨";
      emoji = "✨";
      description = "Growth and creativity! Good news or inspiration will reach you soon.";
    } else if (val === 2) {
      scoreImpact = 5;
      isWin = true;
      title = "Rolled a 2 ⚖️";
      emoji = "⚖️";
      description = "Balance and duality. A great time to partner up or seek harmony.";
    } else { // val === 1
      scoreImpact = -5;
      isWin = false;
      title = "Rolled a 1 🌧️";
      emoji = "🌧️";
      description = "A fresh start! Every journey begins with a single step. Let's shake it up again!";
    }

    setOutcomeData({ sum: val, title, description, isWin, scoreImpact, emoji });
    setShowResult(true);

    addResult(
      "Lucky Dice",
      `Rolled a ${val}`,
      isWin,
      scoreImpact
    );
  };

  return (
    <div className="flex flex-col items-center max-w-lg mx-auto py-8">
      {/* Game board wrapper */}
      <div className="relative w-[320px] sm:w-[360px] bg-white dark:bg-card border-4 border-primary-gold rounded-3xl p-6 shadow-xl flex flex-col items-center select-none overflow-hidden min-h-[340px] justify-center">
        
        {/* Row container of 3D cubes */}
        <div className="flex items-center justify-center gap-8 py-8 perspective-1000">
          {Array.from({ length: diceCount }).map((_, i) => {
            const currentVal = diceValues[i] || 1;
            return (
              <motion.div
                key={i}
                initial={{
                  rotateX: FACE_ROTATIONS[currentVal]?.x || 0,
                  rotateY: FACE_ROTATIONS[currentVal]?.y || 0,
                }}
                animate={rollControls[i]}
                style={{
                  transformStyle: "preserve-3d",
                  width: "80px",
                  height: "80px",
                }}
                className="relative"
              >
                {/* 1. FRONT FACE (Val 1) */}
                <div
                  style={{
                    transform: "rotateY(0deg) translateZ(40px)",
                  }}
                  className="absolute inset-0 bg-[#2D1B69] border-2 border-white/20 rounded-xl flex items-center justify-center shadow-md backface-hidden"
                >
                  <DieFace value={1} />
                </div>

                {/* 2. BACK FACE (Val 6) */}
                <div
                  style={{
                    transform: "rotateY(180deg) translateZ(40px)",
                  }}
                  className="absolute inset-0 bg-[#2D1B69] border-2 border-white/20 rounded-xl flex items-center justify-center shadow-md backface-hidden"
                >
                  <DieFace value={6} />
                </div>

                {/* 3. RIGHT FACE (Val 3) */}
                <div
                  style={{
                    transform: "rotateY(90deg) translateZ(40px)",
                  }}
                  className="absolute inset-0 bg-[#2D1B69] border-2 border-white/20 rounded-xl flex items-center justify-center shadow-md backface-hidden"
                >
                  <DieFace value={3} />
                </div>

                {/* 4. LEFT FACE (Val 4) */}
                <div
                  style={{
                    transform: "rotateY(-90deg) translateZ(40px)",
                  }}
                  className="absolute inset-0 bg-[#2D1B69] border-2 border-white/20 rounded-xl flex items-center justify-center shadow-md backface-hidden"
                >
                  <DieFace value={4} />
                </div>

                {/* 5. TOP FACE (Val 2) */}
                <div
                  style={{
                    transform: "rotateX(90deg) translateZ(40px)",
                  }}
                  className="absolute inset-0 bg-[#2D1B69] border-2 border-white/20 rounded-xl flex items-center justify-center shadow-md backface-hidden"
                >
                  <DieFace value={2} />
                </div>

                {/* 6. BOTTOM FACE (Val 5) */}
                <div
                  style={{
                    transform: "rotateX(-90deg) translateZ(40px)",
                  }}
                  className="absolute inset-0 bg-[#2D1B69] border-2 border-white/20 rounded-xl flex items-center justify-center shadow-md backface-hidden"
                >
                  <DieFace value={5} />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Display Current Value */}
        <div
          className={`mb-4 text-sm font-extrabold uppercase tracking-widest text-deep-violet/50 dark:text-cream-soft/50 transition-all duration-300 ${
            !hasRolled || isRolling ? "opacity-0 scale-90 pointer-events-none" : "opacity-100 scale-100"
          }`}
        >
          You Rolled:{" "}
          <span className="text-primary-gold text-lg font-black font-mono">
            {diceValues[0]}
          </span>
        </div>

        {/* Action Trigger */}
        <button
          disabled={isRolling}
          onClick={handleRoll}
          className={`w-64 py-3.5 px-8 rounded-2xl font-extrabold text-base select-none cursor-pointer tracking-wider shadow-lg transition-all transform active:scale-95 ${
            isRolling
              ? "bg-deep-violet/30 dark:bg-white/10 text-deep-violet/50 dark:text-cream-soft/50 pointer-events-none"
              : "bg-primary-gold hover:bg-[#E0A700] text-deep-violet hover:shadow-xl"
          }`}
        >
          {isRolling ? "Rolling..." : "ROLL THE DICE! 🎲"}
        </button>
      </div>

      {/* Popups & sharing notifications */}
      {outcomeData && (
        <ResultCard
          isOpen={showResult}
          onClose={() => setShowResult(false)}
          gameName="Lucky Dice"
          emoji={outcomeData.emoji}
          title={String(outcomeData.sum)}
          description={outcomeData.description}
          scoreImpact={outcomeData.scoreImpact}
          isWin={outcomeData.isWin}
          onRestart={handleRoll}
          onShare={() => setShowShare(true)}
          justNumber={true}
        />
      )}

      {outcomeData && (
        <ShareModal
          isOpen={showShare}
          onClose={() => setShowShare(false)}
          score={currentScore}
          game="Lucky Dice"
          prize={`Roll Sum of ${outcomeData.sum}`}
        />
      )}
    </div>
  );
}
