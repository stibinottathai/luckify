"use client";

import { motion } from "framer-motion";
import Dice3DPreview from "./Dice3DPreview";
import { Sparkles, Check, Lock, Flame } from "lucide-react";

interface DiceSkin {
  id: string;
  name: string;
  rarity: "common" | "rare" | "epic" | "legendary" | "mythic";
  emoji: string;
  cost: number;
  fragmentsValue: number;
}

interface DiceCardProps {
  skin: DiceSkin;
  isUnlocked: boolean;
  isEquipped: boolean;
  unlockedAt: string | null;
  fragmentBalance: number;
  onEquip: (id: string) => void;
  onCraft: (id: string) => void;
  craftingLoading: boolean;
}

const RARITY_THEMES = {
  common: {
    bg: "from-zinc-100 to-zinc-200 dark:from-zinc-800/30 dark:to-zinc-900/30 border-zinc-200 dark:border-zinc-800",
    text: "text-zinc-500 dark:text-zinc-400",
    badgeBg: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300",
    name: "Common",
    glow: "",
  },
  rare: {
    bg: "from-cyan-50/30 to-blue-50/10 dark:from-cyan-950/20 dark:to-blue-950/10 border-cyan-100 dark:border-cyan-900/50",
    text: "text-cyan-600 dark:text-cyan-400",
    badgeBg: "bg-cyan-100/50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400",
    name: "Rare",
    glow: "shadow-[0_0_15px_rgba(34,211,238,0.1)]",
  },
  epic: {
    bg: "from-fuchsia-50/30 to-purple-50/10 dark:from-fuchsia-950/20 dark:to-purple-950/10 border-fuchsia-100 dark:border-fuchsia-900/50",
    text: "text-fuchsia-600 dark:text-fuchsia-400",
    badgeBg: "bg-fuchsia-100/50 dark:bg-fuchsia-950/60 text-fuchsia-600 dark:text-fuchsia-400",
    name: "Epic",
    glow: "shadow-[0_0_20px_rgba(217,70,239,0.15)]",
  },
  legendary: {
    bg: "from-rose-50/35 to-amber-50/10 dark:from-rose-950/25 dark:to-amber-950/10 border-rose-100 dark:border-rose-900/50",
    text: "text-rose-600 dark:text-rose-400",
    badgeBg: "bg-rose-100/50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400",
    name: "Legendary",
    glow: "shadow-[0_0_25px_rgba(244,63,94,0.25)]",
  },
  mythic: {
    bg: "from-purple-950/15 via-black/30 to-indigo-950/15 border-purple-500/25 dark:border-purple-500/40",
    text: "text-purple-400",
    badgeBg: "bg-purple-950/65 text-purple-400 border border-purple-500/20 animate-pulse",
    name: "MYTHIC",
    glow: "shadow-[0_0_30px_rgba(168,85,247,0.35)]",
  },
};

export default function DiceCard({
  skin,
  isUnlocked,
  isEquipped,
  unlockedAt,
  fragmentBalance,
  onEquip,
  onCraft,
  craftingLoading,
}: DiceCardProps) {
  const theme = RARITY_THEMES[skin.rarity] || RARITY_THEMES.common;
  const canCraft = fragmentBalance >= skin.cost;

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Unlocked";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={`relative w-full rounded-3xl border-2 p-5 bg-gradient-to-br ${theme.bg} ${theme.glow} flex flex-col items-center select-none group transition-all duration-300`}
    >
      {/* Equipped shimmer overlay */}
      {isEquipped && (
        <div className="absolute inset-0 rounded-[22px] border-2 border-primary-gold pointer-events-none z-20 shadow-[0_0_15px_rgba(245,183,0,0.15)] animate-pulse" />
      )}

      {/* Rarity and Emoji tag */}
      <div className="w-full flex items-center justify-between gap-2 mb-3 text-xs">
        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-md ${theme.badgeBg}`}>
          {theme.name}
        </span>
        <span className="text-lg filter drop-shadow-sm">{skin.emoji}</span>
      </div>

      {/* 3D Rotational preview */}
      <div className="relative w-28 h-28 flex items-center justify-center mb-4 mt-2">
        <Dice3DPreview skinId={skin.id} size={70} rotateAnimation={isUnlocked} value={1} />
        {!isUnlocked && (
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60 rounded-full flex items-center justify-center z-10 backdrop-blur-[1px]">
            <Lock className="w-5 h-5 text-white/55" />
          </div>
        )}
      </div>

      {/* Skin details */}
      <div className="text-center w-full flex flex-col items-center flex-1">
        <h4 className="text-sm font-black font-fredoka text-deep-violet dark:text-cream-soft group-hover:text-primary-gold transition-colors truncate max-w-full">
          {skin.name}
        </h4>
        <p className="text-[10px] font-semibold text-deep-violet/40 dark:text-cream-soft/40 mt-0.5 min-h-[14px]">
          {isUnlocked && unlockedAt ? `Unlocked: ${formatDate(unlockedAt)}` : "Locked"}
        </p>
      </div>

      {/* Action triggers */}
      <div className="w-full mt-4 z-10">
        {isUnlocked ? (
          isEquipped ? (
            <div className="w-full py-2 px-4 rounded-xl bg-primary-gold/15 border border-primary-gold/30 flex items-center justify-center gap-1.5 text-[10px] font-black text-primary-gold uppercase tracking-wider">
              <Check className="w-3.5 h-3.5" /> Equipped
            </div>
          ) : (
            <button
              onClick={() => onEquip(skin.id)}
              className="w-full py-2 px-4 rounded-xl bg-deep-violet dark:bg-white hover:bg-primary-gold dark:hover:bg-primary-gold hover:text-deep-violet dark:hover:text-deep-violet text-white dark:text-deep-violet text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
            >
              Equip Skin
            </button>
          )
        ) : skin.cost > 0 ? (
          <button
            disabled={!canCraft || craftingLoading}
            onClick={() => onCraft(skin.id)}
            className={`w-full py-2 px-3 rounded-xl border flex items-center justify-center gap-1 text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
              canCraft
                ? "bg-primary-gold/10 border-primary-gold/30 hover:bg-primary-gold text-primary-gold hover:text-deep-violet"
                : "bg-deep-violet/5 dark:bg-white/5 border-transparent text-deep-violet/40 dark:text-cream-soft/30 pointer-events-none"
            }`}
          >
            <Sparkles className="w-3 h-3 flex-shrink-0" /> Craft: {skin.cost} Frags
          </button>
        ) : (
          <div className="w-full py-2 px-4 rounded-xl bg-deep-violet/5 dark:bg-white/5 flex items-center justify-center text-[9px] font-bold text-deep-violet/40 dark:text-cream-soft/40 uppercase tracking-widest">
            Roll to Unlock
          </div>
        )}
      </div>

    </motion.div>
  );
}
