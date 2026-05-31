"use client";

import { useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { DICE_MEANINGS } from "@/lib/prizes";
import { playDiceRoll } from "@/lib/audio";
import { useLuckStore } from "@/store/luckStore";
import ResultCard from "@/components/ui/ResultCard";
import ShareModal from "@/components/ui/ShareModal";

// Map each die face 1-6 to exact 3D cube rotation angles
const FACE_ROTATIONS: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  6: { x: 180, y: 0 },
  2: { x: 90, y: 0 },
  5: { x: -90, y: 0 },
  3: { x: 0, y: -90 },
  4: { x: 0, y: 95 }, // slight offset looks more organic
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
          className="fill-deep-violet dark:fill-cream-soft"
        />
      ))}
    </svg>
  );
}

export default function DiceGame() {
  const [diceCount, setDiceCount] = useState<1 | 2 | 3>(2);
  const [isRolling, setIsRolling] = useState(false);
  const [diceValues, setDiceValues] = useState<number[]>([3, 4]);
  
  // Custom controls for independent 3D rotations
  const rollControls = [useAnimation(), useAnimation(), useAnimation()];

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
    setShowResult(false);

    // Roll audio synthesis intervals
    const soundTimer = setInterval(() => {
      playDiceRoll();
    }, 100);

    const newValues = Array.from({ length: diceCount }, () =>
      Math.floor(Math.random() * 6) + 1
    );

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

    // Calculate outcomes
    const sum = newValues.reduce((a, b) => a + b, 0);
    const isSnakeEyes = diceCount === 2 && sum === 2;
    const isMaxLuck = sum === diceCount * 6; // All sixes!
    const isLucky7 = sum === 7;

    let scoreImpact = 5;
    let isWin = true;
    let title = `You rolled a ${sum}!`;
    let emoji = "🎲";

    if (isSnakeEyes) {
      scoreImpact = 25; // Snake eyes is highly rewarding!
      title = "Snake Eyes! 🐍👀";
      emoji = "🐍";
    } else if (isMaxLuck) {
      scoreImpact = 30; // Max luck!
      title = "MAX LUCK ROLL! 🎰";
      emoji = "🔥";
    } else if (isLucky7) {
      scoreImpact = 15;
      title = "Classic Lucky 7! ✨";
      emoji = "🍀";
    } else if (sum < diceCount * 3) {
      scoreImpact = -5;
      isWin = false;
      title = `Rolled a ${sum}`;
      emoji = "🌧️";
    }

    const description = isSnakeEyes
      ? "Double ones! Incredibly rare and highly suspicious luck is aligning in your favor!"
      : isMaxLuck
      ? "Absolute maximum rolling power! You have unlocked cosmic abundance!"
      : DICE_MEANINGS[sum] || "A solid roll of the dice. Keep shaking up your vibes!";

    setOutcomeData({ sum, title, description, isWin, scoreImpact, emoji });
    setShowResult(true);

    addResult(
      "Lucky Dice",
      `Rolled ${newValues.join(" + ")} = ${sum}`,
      isWin,
      scoreImpact
    );
  };

  return (
    <div className="flex flex-col items-center max-w-lg mx-auto py-8">
      {/* Selector tab controls */}
      <div className="flex items-center gap-2 mb-6 bg-deep-violet/5 dark:bg-white/5 border border-deep-violet/10 dark:border-white/10 p-1 rounded-2xl select-none">
        {([1, 2, 3] as const).map((cnt) => (
          <button
            key={cnt}
            disabled={isRolling}
            onClick={() => {
              setDiceCount(cnt);
              setDiceValues(Array.from({ length: cnt }, () => 4));
            }}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              diceCount === cnt
                ? "bg-primary-gold text-deep-violet shadow-xs"
                : "text-deep-violet/60 dark:text-cream-soft/60 hover:bg-deep-violet/5 dark:hover:bg-white/5"
            }`}
          >
            {cnt} {cnt === 1 ? "Die" : "Dice"}
          </button>
        ))}
      </div>

      {/* Game board wrapper */}
      <div className="relative w-full max-w-sm bg-white dark:bg-card border-4 border-primary-gold rounded-3xl p-6 shadow-xl flex flex-col items-center select-none overflow-hidden min-h-[340px] justify-center">
        
        {/* Row container of 3D cubes */}
        <div className="flex items-center justify-center gap-8 py-8 perspective-1000">
          {Array.from({ length: diceCount }).map((_, i) => {
            const currentVal = diceValues[i] || 1;
            return (
              <motion.div
                key={i}
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
                  className="absolute inset-0 bg-cream-soft dark:bg-deep-violet border-2 border-deep-violet/20 dark:border-white/20 rounded-xl flex items-center justify-center shadow-md backface-hidden"
                >
                  <DieFace value={1} />
                </div>

                {/* 2. BACK FACE (Val 6) */}
                <div
                  style={{
                    transform: "rotateY(180deg) translateZ(40px)",
                  }}
                  className="absolute inset-0 bg-cream-soft dark:bg-deep-violet border-2 border-deep-violet/20 dark:border-white/20 rounded-xl flex items-center justify-center shadow-md backface-hidden"
                >
                  <DieFace value={6} />
                </div>

                {/* 3. RIGHT FACE (Val 3) */}
                <div
                  style={{
                    transform: "rotateY(90deg) translateZ(40px)",
                  }}
                  className="absolute inset-0 bg-cream-soft dark:bg-deep-violet border-2 border-deep-violet/20 dark:border-white/20 rounded-xl flex items-center justify-center shadow-md backface-hidden"
                >
                  <DieFace value={3} />
                </div>

                {/* 4. LEFT FACE (Val 4) */}
                <div
                  style={{
                    transform: "rotateY(-90deg) translateZ(40px)",
                  }}
                  className="absolute inset-0 bg-cream-soft dark:bg-deep-violet border-2 border-deep-violet/20 dark:border-white/20 rounded-xl flex items-center justify-center shadow-md backface-hidden"
                >
                  <DieFace value={4} />
                </div>

                {/* 5. TOP FACE (Val 2) */}
                <div
                  style={{
                    transform: "rotateX(90deg) translateZ(40px)",
                  }}
                  className="absolute inset-0 bg-cream-soft dark:bg-deep-violet border-2 border-deep-violet/20 dark:border-white/20 rounded-xl flex items-center justify-center shadow-md backface-hidden"
                >
                  <DieFace value={2} />
                </div>

                {/* 6. BOTTOM FACE (Val 5) */}
                <div
                  style={{
                    transform: "rotateX(-90deg) translateZ(40px)",
                  }}
                  className="absolute inset-0 bg-cream-soft dark:bg-deep-violet border-2 border-deep-violet/20 dark:border-white/20 rounded-xl flex items-center justify-center shadow-md backface-hidden"
                >
                  <DieFace value={5} />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Display Current Sum */}
        {!isRolling && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-4 text-sm font-extrabold uppercase tracking-widest text-deep-violet/50 dark:text-cream-soft/50"
          >
            Total Rolled:{" "}
            <span className="text-primary-gold text-lg font-black font-mono">
              {diceValues.reduce((a, b) => a + b, 0)}
            </span>
          </motion.div>
        )}

        {/* Action Trigger */}
        <button
          disabled={isRolling}
          onClick={handleRoll}
          className={`py-3.5 px-8 rounded-2xl font-extrabold text-base select-none cursor-pointer tracking-wider shadow-lg transition-all transform active:scale-95 ${
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
          title={outcomeData.title}
          description={outcomeData.description}
          scoreImpact={outcomeData.scoreImpact}
          isWin={outcomeData.isWin}
          onRestart={handleRoll}
          onShare={() => setShowShare(true)}
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
