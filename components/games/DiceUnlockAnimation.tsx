"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { playLegendaryReward } from "@/lib/audio";
import Dice3DPreview from "./Dice3DPreview";

interface DroppedDice {
  id: string;
  name: string;
  rarity: "common" | "rare" | "epic" | "legendary" | "mythic";
  emoji: string;
  isDuplicate: boolean;
  fragmentsAwarded?: number;
}

interface DiceUnlockAnimationProps {
  drop: DroppedDice | null;
  isOpen: boolean;
  onClose: () => void;
  onEquip: (id: string) => void;
}

const RARITY_THEMES = {
  common: {
    glow: "shadow-[0_0_40px_rgba(255,255,255,0.25)]",
    text: "text-zinc-400",
    name: "Common Skin",
    accent: "#A1A1AA",
  },
  rare: {
    glow: "shadow-[0_0_50px_rgba(34,211,238,0.4)]",
    text: "text-cyan-400",
    name: "Rare Skin",
    accent: "#22D3EE",
  },
  epic: {
    glow: "shadow-[0_0_60px_rgba(217,70,239,0.55)]",
    text: "text-fuchsia-400",
    name: "Epic Skin",
    accent: "#D946EF",
  },
  legendary: {
    glow: "shadow-[0_0_75px_rgba(244,63,94,0.7)]",
    text: "text-rose-400",
    name: "LEGENDARY SKIN",
    accent: "#F43F5E",
  },
  mythic: {
    glow: "shadow-[0_0_90px_rgba(168,85,247,0.85)] animate-pulse",
    text: "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-indigo-500 drop-shadow-[0_2px_15px_rgba(168,85,247,0.75)]",
    name: "★ MYTHIC DISCOVERY ★",
    accent: "#A855F7",
  },
};

export default function DiceUnlockAnimation({
  drop,
  isOpen,
  onClose,
  onEquip,
}: DiceUnlockAnimationProps) {
  useEffect(() => {
    if (isOpen && drop) {
      // Play triumphant chimes
      playLegendaryReward();

      // Trigger beautiful customized particles
      const theme = RARITY_THEMES[drop.rarity];
      const color = theme ? theme.accent : "#FFD700";

      let duration = 3 * 1000;
      let end = Date.now() + duration;

      (function frame() {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.85 },
          colors: [color, "#FFD700", "#FFFFFF"],
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.85 },
          colors: [color, "#FFD700", "#FFFFFF"],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    }
  }, [isOpen, drop]);

  if (!isOpen || !drop) return null;

  const theme = RARITY_THEMES[drop.rarity] || RARITY_THEMES.common;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/90 backdrop-blur-md select-none font-fredoka">
        
        {/* Glowing spotlight halo behind the dice */}
        <div className={`absolute w-80 h-80 rounded-full blur-[80px] opacity-45 pointer-events-none z-0 bg-${drop.rarity === 'mythic' ? 'purple' : drop.rarity === 'legendary' ? 'rose' : drop.rarity === 'epic' ? 'fuchsia' : drop.rarity === 'rare' ? 'cyan' : 'yellow'}-500`} />

        {/* Cinematic Content Wrapper */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative w-full max-w-sm flex flex-col items-center text-center z-10 p-6 sm:p-8"
        >
          {/* Main Titles */}
          <motion.h3
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={`text-sm font-black uppercase tracking-widest ${theme.text} mb-1`}
          >
            {drop.isDuplicate ? "🌌 Duplicate Unlocked" : "✨ New Dice Discovered ✨"}
          </motion.h3>

          <motion.h2
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-black text-white uppercase tracking-wider drop-shadow-md mb-8 leading-none"
          >
            {drop.name}
          </motion.h2>

          {/* Large Showcase rotating dice */}
          <motion.div
            initial={{ scale: 0.3, rotate: -45, opacity: 0 }}
            animate={{ scale: [0.3, 1.2, 1], rotate: [0, 360 * 2, 360 * 2], opacity: 1 }}
            transition={{ duration: 2.2, ease: "easeOut" }}
            className={`w-36 h-36 flex items-center justify-center mb-10 rounded-full p-4 bg-black/45 border border-white/5 ${theme.glow}`}
          >
            <Dice3DPreview skinId={drop.id} size={90} rotateAnimation={true} />
          </motion.div>

          {/* Duplicate converters details or rewards */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="w-full flex flex-col items-center gap-6 mb-8"
          >
            {drop.isDuplicate ? (
              <div className="bg-gradient-to-r from-purple-500/10 via-fuchsia-500/5 to-transparent border border-purple-500/30 rounded-2xl py-3 px-6 text-center shadow-lg">
                <span className="block text-[10px] font-black uppercase tracking-widest text-purple-400">
                  Already Owned!
                </span>
                <span className="block text-xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400 mt-1">
                  +{drop.fragmentsAwarded} Fragments
                </span>
                <span className="block text-[8px] font-bold text-white/40 uppercase tracking-widest mt-1">
                  Credited to crafting balance
                </span>
              </div>
            ) : (
              <p className="text-xs sm:text-sm font-semibold text-white/70 max-w-[240px] leading-relaxed">
                Congratulations! You unlocked the <span className={theme.text}>{drop.name}</span>. Equip it now to roll with this skin style globally!
              </p>
            )}
          </motion.div>

          {/* Action triggers */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="w-full flex flex-col gap-3"
          >
            {!drop.isDuplicate && (
              <button
                onClick={() => {
                  onEquip(drop.id);
                  onClose();
                }}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 hover:from-yellow-300 hover:to-amber-500 text-amber-950 font-black tracking-wider shadow-lg active:scale-98 transition-transform cursor-pointer uppercase text-sm border-2 border-white/20"
              >
                Equip Skin Now! 🎲
              </button>
            )}

            <button
              onClick={onClose}
              className="w-full py-3.5 px-6 rounded-2xl bg-white/10 hover:bg-white/15 text-white/90 hover:text-white font-extrabold tracking-wider border border-white/10 active:scale-98 transition-all cursor-pointer uppercase text-xs"
            >
              Add to Collection
            </button>
          </motion.div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
