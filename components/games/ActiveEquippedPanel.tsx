"use client";

import { motion } from "framer-motion";
import Dice3DPreview from "./Dice3DPreview";
import { ALL_DICE_SKINS } from "@/app/api/dice/roll/route";
import { Sparkles, Trophy, RotateCcw, Award, Gauge } from "lucide-react";

interface ActiveEquippedPanelProps {
  equippedDice: string;
  unlockedDiceCount: number;
  totalDiceCount: number;
  fragmentBalance: number;
  totalDiceRolls: number;
  totalGoldenDiceEvents: number;
  goldenDiceRate: number;
}

const RARITY_DETAILS = {
  common: {
    name: "Common",
    badgeClass: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700",
    auraClass: "from-zinc-400/20 via-transparent to-transparent",
    glowColor: "rgba(120, 120, 120, 0.15)",
    textClass: "text-zinc-500",
    emoji: "🪵",
  },
  rare: {
    name: "Rare",
    badgeClass: "bg-cyan-100/50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800",
    auraClass: "from-cyan-400/20 via-transparent to-transparent",
    glowColor: "rgba(34, 211, 238, 0.3)",
    textClass: "text-cyan-600 dark:text-cyan-400",
    emoji: "💎",
  },
  epic: {
    name: "Epic",
    badgeClass: "bg-fuchsia-100/50 dark:bg-fuchsia-950/60 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-200 dark:border-fuchsia-800",
    auraClass: "from-fuchsia-400/25 via-transparent to-transparent",
    glowColor: "rgba(217, 70, 239, 0.4)",
    textClass: "text-fuchsia-600 dark:text-fuchsia-400",
    emoji: "🌈",
  },
  legendary: {
    name: "Legendary",
    badgeClass: "bg-rose-100/50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800",
    auraClass: "from-rose-400/30 via-transparent to-transparent",
    glowColor: "rgba(244, 63, 94, 0.55)",
    textClass: "text-rose-600 dark:text-rose-400",
    emoji: "🐉",
  },
  mythic: {
    name: "Mythic",
    badgeClass: "bg-purple-950/80 text-purple-400 border border-purple-500/30 animate-pulse",
    auraClass: "from-purple-500/35 via-indigo-500/10 to-transparent",
    glowColor: "rgba(168, 85, 247, 0.7)",
    textClass: "text-purple-400 font-extrabold animate-hue-sweep",
    emoji: "🌌",
  },
};

export default function ActiveEquippedPanel({
  equippedDice,
  unlockedDiceCount,
  totalDiceCount = 15,
  fragmentBalance,
  totalDiceRolls = 0,
  totalGoldenDiceEvents = 0,
  goldenDiceRate = 0,
}: ActiveEquippedPanelProps) {
  const skin = ALL_DICE_SKINS[equippedDice] || ALL_DICE_SKINS.wooden_dice;
  const detail = RARITY_DETAILS[skin.rarity] || RARITY_DETAILS.common;

  // Rate formatted
  const formattedRate = (goldenDiceRate * 100).toFixed(1);

  return (
    <div className="w-full bg-white dark:bg-card border-2 border-deep-violet/10 dark:border-white/10 rounded-[2.5rem] p-6 shadow-2xl flex flex-col gap-6 font-fredoka select-none relative overflow-hidden">
      
      {/* Dynamic aura matching rarity */}
      <div className={`absolute top-0 right-0 w-64 h-64 bg-radial ${detail.auraClass} pointer-events-none z-0`} />

      {/* Header panel */}
      <div className="flex items-center justify-between border-b border-deep-violet/5 dark:border-white/5 pb-4 relative z-10">
        <div>
          <h3 className="text-base font-black text-deep-violet dark:text-cream-soft leading-none">
            🎮 Equipped Loadout
          </h3>
          <p className="text-[10px] font-bold text-deep-violet/40 dark:text-cream-soft/40 uppercase tracking-wider mt-1">
            Active 3D Skin & Live Stats
          </p>
        </div>
        <div className="px-3 py-1 rounded-full bg-deep-violet/5 dark:bg-white/5 border border-deep-violet/10 dark:border-white/10 text-[10px] font-black text-deep-violet/60 dark:text-cream-soft/60 uppercase tracking-widest flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-primary-gold" />
          <span>{unlockedDiceCount} / {totalDiceCount} Unlock</span>
        </div>
      </div>

      {/* Rotating Showcase Portal */}
      <div className="flex flex-col items-center py-4 relative z-10">
        
        {/* Glow backdrop ring */}
        <div 
          style={{ boxShadow: `0 0 50px 10px ${detail.glowColor}` }}
          className="w-36 h-36 rounded-full bg-white/5 dark:bg-black/20 flex items-center justify-center border-2 border-dashed border-deep-violet/10 dark:border-white/15 relative"
        >
          {/* Inner animated ring */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" as const }}
            className="absolute inset-2 rounded-full border border-dashed border-primary-gold/30 pointer-events-none"
          />

          <Dice3DPreview skinId={skin.id} size={90} rotateAnimation={true} value={1} />
        </div>

        {/* Name and Rarity details */}
        <div className="text-center mt-5">
          <div className="flex items-center justify-center gap-2">
            <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md border ${detail.badgeClass}`}>
              {detail.name}
            </span>
            <span className="text-lg filter drop-shadow-sm">{skin.emoji}</span>
          </div>
          <h4 className={`text-xl font-black mt-1 ${skin.rarity === "mythic" ? "bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500 bg-clip-text text-transparent" : "text-deep-violet dark:text-cream-soft"}`}>
            {skin.name}
          </h4>
        </div>
      </div>

      {/* Live Stats Dashboard Grid */}
      <div className="grid grid-cols-2 gap-3 border-t border-deep-violet/5 dark:border-white/5 pt-5 relative z-10">
        
        {/* Stat 1: Rolls */}
        <div className="bg-deep-violet/5 dark:bg-white/5 border border-deep-violet/5 dark:border-white/5 rounded-2xl p-3 flex flex-col">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-deep-violet/40 dark:text-cream-soft/40 uppercase tracking-widest mb-1">
            <RotateCcw className="w-3.5 h-3.5 text-[#2D1B69] dark:text-cream-soft/60" />
            <span>Total Rolls</span>
          </div>
          <span className="text-lg font-black text-deep-violet dark:text-cream-soft font-mono">
            {totalDiceRolls}
          </span>
        </div>

        {/* Stat 2: Golden Events */}
        <div className="bg-deep-violet/5 dark:bg-white/5 border border-deep-violet/5 dark:border-white/5 rounded-2xl p-3 flex flex-col">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-deep-violet/40 dark:text-cream-soft/40 uppercase tracking-widest mb-1">
            <Trophy className="w-3.5 h-3.5 text-primary-gold" />
            <span>Golden Events</span>
          </div>
          <span className="text-lg font-black text-primary-gold font-mono">
            {totalGoldenDiceEvents}
          </span>
        </div>

        {/* Stat 3: Golden Rate */}
        <div className="bg-deep-violet/5 dark:bg-white/5 border border-deep-violet/5 dark:border-white/5 rounded-2xl p-3 flex flex-col">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-deep-violet/40 dark:text-cream-soft/40 uppercase tracking-widest mb-1">
            <Gauge className="w-3.5 h-3.5 text-cyan-500" />
            <span>Golden Rate</span>
          </div>
          <span className="text-lg font-black text-cyan-500 font-mono">
            {formattedRate}%
          </span>
        </div>

        {/* Stat 4: Fragments */}
        <div className="bg-deep-violet/5 dark:bg-white/5 border border-deep-violet/5 dark:border-white/5 rounded-2xl p-3 flex flex-col">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-deep-violet/40 dark:text-cream-soft/40 uppercase tracking-widest mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>Fragments</span>
          </div>
          <span className="text-lg font-black text-amber-500 font-mono">
            {fragmentBalance}
          </span>
        </div>

      </div>

    </div>
  );
}
