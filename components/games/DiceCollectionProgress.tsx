"use client";

import { motion } from "framer-motion";

interface UnlockedDice {
  id: string;
  name: string;
  rarity: string;
  unlockedAt: string;
}

interface DiceCollectionProgressProps {
  unlockedSkins: UnlockedDice[];
  totalSkinsCount: number;
  fragmentBalance: number;
}

const RARITY_LABELS = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
  mythic: "Mythic",
};

const RARITY_COLORS = {
  common: "bg-zinc-400 dark:bg-zinc-500",
  rare: "bg-cyan-500",
  epic: "bg-fuchsia-500",
  legendary: "bg-rose-500",
  mythic: "bg-purple-500",
};

export default function DiceCollectionProgress({
  unlockedSkins,
  totalSkinsCount,
  fragmentBalance,
}: DiceCollectionProgressProps) {
  const unlockedCount = unlockedSkins.length;
  const progressPercent = Math.min(100, Math.round((unlockedCount / totalSkinsCount) * 100));

  // Calculate count for each rarity
  const rarityCounts = unlockedSkins.reduce<Record<string, number>>((acc, curr) => {
    acc[curr.rarity] = (acc[curr.rarity] || 0) + 1;
    return acc;
  }, {});

  // Total config counts for all skins
  const totalRaritiesCount = {
    common: 3,
    rare: 3,
    epic: 3,
    legendary: 3,
    mythic: 3,
  };

  return (
    <div className="w-full bg-white dark:bg-card border-2 border-deep-violet/10 dark:border-white/10 rounded-3xl p-5 shadow-xl flex flex-col gap-6 font-fredoka select-none">
      
      {/* Overview stats panel */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-deep-violet dark:text-cream-soft leading-none">
            📈 Collection Progress
          </h3>
          <p className="text-[10px] font-bold text-deep-violet/40 dark:text-cream-soft/40 uppercase tracking-wider mt-1">
            Unlocked skins and fragment balance
          </p>
        </div>
        <div className="text-right leading-none">
          <span className="text-2xl font-black text-primary-gold font-mono leading-none">
            {unlockedCount} <span className="text-xs text-deep-violet/40 dark:text-cream-soft/40">/ {totalSkinsCount}</span>
          </span>
          <span className="block text-[8px] uppercase tracking-widest font-extrabold text-deep-violet/40 dark:text-cream-soft/40 mt-1">
            Skins Owned
          </span>
        </div>
      </div>

      {/* Main progress bar */}
      <div className="w-full">
        <div className="h-3 w-full bg-deep-violet/5 dark:bg-white/5 rounded-full overflow-hidden relative border border-deep-violet/10 dark:border-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 rounded-full shadow-[0_0_8px_rgba(245,183,0,0.4)]"
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-[10px] font-bold text-deep-violet/50 dark:text-cream-soft/50 uppercase tracking-widest">
          <span>{progressPercent}% Complete</span>
          <span>{fragmentBalance} fragments owned</span>
        </div>
      </div>

      {/* Rarity-specific progress rings grid */}
      <div className="grid grid-cols-5 gap-2 border-t border-deep-violet/5 dark:border-white/5 pt-4">
        {Object.entries(RARITY_LABELS).map(([rarity, label]) => {
          const owned = rarityCounts[rarity] || 0;
          const total = totalRaritiesCount[rarity as keyof typeof totalRaritiesCount] || 3;
          const pct = Math.round((owned / total) * 100);
          const colorClass = RARITY_COLORS[rarity as keyof typeof RARITY_COLORS] || "bg-zinc-400";

          return (
            <div key={rarity} className="flex flex-col items-center text-center">
              {/* Micro Progress bar vertical */}
              <div className="w-2.5 h-12 bg-deep-violet/5 dark:bg-white/5 rounded-full overflow-hidden relative border border-deep-violet/10 dark:border-white/5 flex flex-col justify-end">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${pct}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className={`w-full rounded-full ${colorClass}`}
                />
              </div>

              <span className="text-[8px] font-black text-deep-violet dark:text-cream-soft truncate max-w-full uppercase mt-2 leading-tight">
                {label}
              </span>
              <span className="text-[10px] font-mono font-black text-deep-violet/40 dark:text-cream-soft/40 mt-0.5 leading-none">
                {owned}/{total}
              </span>
            </div>
          );
        })}
      </div>

    </div>
  );
}
