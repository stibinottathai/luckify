"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { playLegendaryReward } from "@/lib/audio";
import GoldenRewardCard from "./GoldenRewardCard";

interface Reward {
  id: string;
  name: string;
  emoji: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  points?: number;
  badge?: string;
  collectible?: string;
  pointsValue: number;
}

interface GoldenDiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  reward: Reward | null;
  onShare: () => void;
}

export default function GoldenDiceModal({ isOpen, onClose, reward, onShare }: GoldenDiceModalProps) {
  useEffect(() => {
    if (isOpen && reward) {
      playLegendaryReward();

      let duration = 3.5 * 1000;
      let end = Date.now() + duration;

      (function frame() {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.8 },
          colors: ["#F5B700", "#FFD700", "#FF8C00", "#FF1493", "#00FFFF"],
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.8 },
          colors: ["#F5B700", "#FFD700", "#FF8C00", "#FF1493", "#00FFFF"],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    }
  }, [isOpen, reward]);

  if (!isOpen || !reward) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none overflow-y-auto bg-black/85 backdrop-blur-sm">
        <div className="absolute w-[450px] h-[450px] rounded-full blur-[80px] bg-amber-500/25 pointer-events-none z-0" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative w-full max-w-md bg-zinc-950/95 border-3 border-primary-gold rounded-[2.5rem] p-6 sm:p-8 flex flex-col items-center shadow-[0_0_80px_rgba(245,183,0,0.35)] z-10 text-center font-fredoka overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent opacity-60 pointer-events-none" />

          <motion.h2
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-600 drop-shadow-[0_2px_15px_rgba(245,183,0,0.6)] uppercase tracking-wide mb-1"
          >
            🎉 LEGENDARY REWARD!
          </motion.h2>
          
          <p className="text-xs font-bold text-soft-cream/60 uppercase tracking-widest mb-6">
            You triggered the Golden Dice!
          </p>

          <div className="mb-8 z-10">
            <GoldenRewardCard reward={reward} />
          </div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="w-full flex flex-col gap-3 z-10"
          >
            <button
              onClick={onShare}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 hover:from-yellow-300 hover:to-amber-500 text-amber-950 font-black tracking-wider shadow-lg active:scale-98 transition-transform cursor-pointer font-fredoka uppercase text-sm border-2 border-white/20"
            >
              Share Your Luck! 💫
            </button>

            <button
              onClick={onClose}
              className="w-full py-3.5 px-6 rounded-2xl bg-white/10 hover:bg-white/15 text-white/90 hover:text-white font-extrabold tracking-wider border border-white/10 active:scale-98 transition-all cursor-pointer font-fredoka uppercase text-xs"
            >
              Return to Roller
            </button>
          </motion.div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
