"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { TREE_FORTUNES } from "@/lib/fortunes";
import { useLuckStore } from "@/store/luckStore";
import ResultCard from "@/components/ui/ResultCard";
import ShareModal from "@/components/ui/ShareModal";
import { playDiceRoll } from "@/lib/audio";

interface TreeItem {
  id: string;
  emoji: string;
  xPercent: number; // initial branch relative X%
  yPercent: number; // initial branch relative Y%
}

const ITEMS_POOL: TreeItem[] = [
  { id: "1", emoji: "🍎", xPercent: 32, yPercent: 22 },
  { id: "2", emoji: "🍊", xPercent: 64, yPercent: 25 },
  { id: "3", emoji: "🌟", xPercent: 48, yPercent: 12 },
  { id: "4", emoji: "🎁", xPercent: 72, yPercent: 38 },
  { id: "5", emoji: "💰", xPercent: 25, yPercent: 35 },
  { id: "6", emoji: "🦋", xPercent: 55, yPercent: 30 },
  { id: "7", emoji: "🌸", xPercent: 38, yPercent: 42 },
  { id: "8", emoji: "🍀", xPercent: 46, yPercent: 28 },
  { id: "9", emoji: "💎", xPercent: 62, yPercent: 18 },
  { id: "10", emoji: "🎵", xPercent: 18, yPercent: 26 },
  { id: "11", emoji: "🌈", xPercent: 78, yPercent: 22 },
  { id: "12", emoji: "🔮", xPercent: 50, yPercent: 42 },
];

export default function TreeGame() {
  const [shaking, setShaking] = useState(false);
  const [hasShaken, setHasShaken] = useState(false);
  const [fallingItems, setFallingItems] = useState<{ id: string; x: number; y: number; rotate: number }[]>([]);
  const [luckyItem, setLuckyItem] = useState<TreeItem | null>(null);
  
  const [showResult, setShowResult] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const addResult = useLuckStore((state) => state.addResult);
  const currentScore = useLuckStore((state) => state.luckyScore);

  const handleShake = () => {
    if (shaking) return;
    
    setShaking(true);
    setHasShaken(true);
    setLuckyItem(null);
    setShowResult(false);
    
    // Procedural roll sound synthesis during shake
    const soundInterval = setInterval(() => {
      playDiceRoll();
    }, 150);

    setTimeout(() => {
      clearInterval(soundInterval);
      setShaking(false);

      // Select one lucky fruit outcome randomly
      const luckyIndex = Math.floor(Math.random() * ITEMS_POOL.length);
      const chosenItem = ITEMS_POOL[luckyIndex];
      setLuckyItem(chosenItem);

      // Calculate stagger flying physics trajectories for all fruits
      const calculatedFalls = ITEMS_POOL.map((item) => {
        const isLucky = item.id === chosenItem.id;
        
        // Random spreads: landing on ground below the tree
        const randomX = (Math.random() * 260 - 130) + (isLucky ? 0 : Math.random() * 60 - 30);
        // Landing heights: bounce floor
        const randomY = 240 + Math.random() * 40;
        const randomRotate = Math.random() * 360 - 180;

        return {
          id: item.id,
          x: randomX,
          y: randomY,
          rotate: randomRotate,
        };
      });

      setFallingItems(calculatedFalls);

      // Slide up outcome card
      setTimeout(() => {
        setShowResult(true);
        const fortuneObj = TREE_FORTUNES[chosenItem.emoji];
        addResult("Shaking Tree", `Found ${chosenItem.emoji}`, fortuneObj.isWin, fortuneObj.scoreImpact);
      }, 1000);

    }, 800); // 800ms shaking sequence
  };

  const handleReset = () => {
    setHasShaken(false);
    setFallingItems([]);
    setLuckyItem(null);
    setShowResult(false);
  };

  return (
    <div className="flex flex-col items-center max-w-lg mx-auto py-8">
      {/* Game board relative card container */}
      <div className="relative w-full max-w-sm bg-white dark:bg-card border-4 border-primary-gold rounded-3xl p-6 shadow-xl flex flex-col items-center select-none overflow-hidden h-[460px]">
        
        {/* Large illustrated SVG tree */}
        <div className={`relative w-[280px] h-[260px] transition-transform ${shaking ? "animate-shake" : ""}`}>
          <svg viewBox="0 0 200 180" className="w-full h-full drop-shadow-lg">
            <defs>
              <radialGradient id="leaves-grad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#00E676" />
                <stop offset="100%" stopColor="#00B4A0" />
              </radialGradient>
              <linearGradient id="trunk-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#5D4037" />
                <stop offset="100%" stopColor="#3E2723" />
              </linearGradient>
            </defs>

            {/* Tree trunk */}
            <path
              d="M90,170 Q100,120 100,100 Q100,70 120,60 M110,170 Q100,120 100,100 M95,110 Q80,80 75,70"
              stroke="url(#trunk-grad)"
              strokeWidth="10"
              strokeLinecap="round"
              fill="none"
            />
            {/* Trunk flare base */}
            <path
              d="M75,175 C85,170 115,170 125,175 L115,160 C105,160 95,160 85,160 Z"
              fill="url(#trunk-grad)"
            />

            {/* Foliage Leaf clusters */}
            <circle cx="100" cy="50" r="35" fill="url(#leaves-grad)" />
            <circle cx="70" cy="65" r="30" fill="url(#leaves-grad)" opacity="0.95" />
            <circle cx="130" cy="65" r="30" fill="url(#leaves-grad)" opacity="0.95" />
            <circle cx="100" cy="80" r="28" fill="url(#leaves-grad)" opacity="0.9" />
            <circle cx="60" cy="90" r="22" fill="url(#leaves-grad)" opacity="0.85" />
            <circle cx="140" cy="90" r="22" fill="url(#leaves-grad)" opacity="0.85" />
          </svg>

          {/* Absolute overlaying emoji fruits (Initial State hidden) */}
          {!hasShaken &&
            ITEMS_POOL.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 0.9, scale: 1 }}
                style={{
                  position: "absolute",
                  left: `${item.xPercent}%`,
                  top: `${item.yPercent}%`,
                }}
                className="text-lg pointer-events-none drop-shadow-sm select-none"
              >
                {item.emoji}
              </motion.div>
            ))}
        </div>

        {/* Dynamic Fall & Landing area */}
        <div className="absolute inset-x-0 bottom-[80px] h-[150px] pointer-events-none">
          {hasShaken &&
            ITEMS_POOL.map((item) => {
              const fallData = fallingItems.find((f) => f.id === item.id);
              const isLucky = luckyItem?.id === item.id;
              
              if (!fallData) return null;

              return (
                <motion.div
                  key={item.id}
                  initial={{ x: 0, y: -180, scale: 1, rotate: 0 }}
                  animate={{
                    x: fallData.x,
                    y: fallData.y - 120, // offset
                    rotate: fallData.rotate,
                    scale: isLucky ? 1.4 : 1,
                  }}
                  transition={{
                    type: "spring",
                    damping: 10,
                    stiffness: 85,
                    delay: Math.random() * 0.25, // Stagger effect
                  }}
                  style={{
                    position: "absolute",
                    left: "50%",
                    marginLeft: "-12px",
                  }}
                  className={`text-2xl rounded-full p-1 flex items-center justify-center ${
                    isLucky
                      ? "ring-4 ring-primary-gold bg-white dark:bg-deep-violet z-20 shadow-lg animate-pulse"
                      : "z-10"
                  }`}
                >
                  {item.emoji}
                </motion.div>
              );
            })}
        </div>

        {/* Forest floor ground barrier */}
        <div className="absolute inset-x-0 bottom-[75px] h-3 bg-accent-teal/20 border-t border-accent-teal/40 dark:bg-white/5 dark:border-white/10" />

        {/* Action Button Controls */}
        <div className="absolute bottom-6 flex items-center gap-3">
          {hasShaken && !shaking ? (
            <button
              onClick={handleReset}
              className="py-3 px-6 rounded-2xl font-extrabold text-sm border border-deep-violet/10 dark:border-white/10 bg-deep-violet/5 hover:bg-deep-violet/10 dark:bg-white/5 dark:hover:bg-white/10 text-deep-violet dark:text-cream-soft transition-all cursor-pointer active:scale-95"
            >
              Reset Fruits 🌳
            </button>
          ) : (
            <button
              disabled={shaking}
              onClick={handleShake}
              className={`py-3.5 px-8 rounded-2xl font-extrabold text-base select-none cursor-pointer tracking-wider shadow-lg transition-all transform active:scale-95 ${
                shaking
                  ? "bg-deep-violet/30 dark:bg-white/10 text-deep-violet/50 dark:text-cream-soft/50 pointer-events-none"
                  : "bg-primary-gold hover:bg-[#E0A700] text-deep-violet hover:shadow-xl"
              }`}
            >
              {shaking ? "Shaking..." : "SHAKE THE TREE! 🌳"}
            </button>
          )}
        </div>
      </div>

      {/* Outcome Cards and sharing modalls */}
      {luckyItem && (
        <ResultCard
          isOpen={showResult}
          onClose={() => setShowResult(false)}
          gameName="Shaking Tree"
          emoji={luckyItem.emoji}
          title={`You found: ${luckyItem.emoji}!`}
          description={TREE_FORTUNES[luckyItem.emoji].message}
          scoreImpact={TREE_FORTUNES[luckyItem.emoji].scoreImpact}
          isWin={TREE_FORTUNES[luckyItem.emoji].isWin}
          onRestart={handleShake}
          onShare={() => setShowShare(true)}
        />
      )}

      {luckyItem && (
        <ShareModal
          isOpen={showShare}
          onClose={() => setShowShare(false)}
          score={currentScore}
          game="Shaking Tree"
          prize={`${luckyItem.emoji} Fortune`}
        />
      )}
    </div>
  );
}
