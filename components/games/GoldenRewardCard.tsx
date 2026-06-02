"use client";

import { motion } from "framer-motion";

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

interface GoldenRewardCardProps {
  reward: Reward;
}

const RARITY_CONFIG = {
  common: {
    bg: "from-amber-400/20 via-yellow-500/10 to-amber-600/20",
    border: "border-yellow-400/50",
    text: "text-yellow-400",
    glow: "shadow-[0_0_30px_rgba(234,179,8,0.25)]",
    displayName: "Common Golden",
  },
  rare: {
    bg: "from-cyan-400/20 via-blue-500/10 to-indigo-600/20",
    border: "border-cyan-400/50",
    text: "text-cyan-400",
    glow: "shadow-[0_0_30px_rgba(34,211,238,0.3)]",
    displayName: "Rare Reward",
  },
  epic: {
    bg: "from-fuchsia-50/20 via-purple-600/10 to-violet-800/20",
    border: "border-fuchsia-400/50",
    text: "text-fuchsia-400",
    glow: "shadow-[0_0_40px_rgba(217,70,239,0.4)]",
    displayName: "Epic Drop",
  },
  legendary: {
    bg: "from-rose-50/25 via-red-600/15 to-amber-50/20",
    border: "border-rose-500/60",
    text: "text-rose-400",
    glow: "shadow-[0_0_55px_rgba(244,63,94,0.6)] animate-pulse",
    displayName: "LEGENDARY ACQUISITION",
  },
};

export default function GoldenRewardCard({ reward }: GoldenRewardCardProps) {
  const config = RARITY_CONFIG[reward.rarity] || RARITY_CONFIG.common;

  return (
    <motion.div
      initial={{ scale: 0.3, y: 50, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 110,
        damping: 15,
        delay: 0.2,
      }}
      className={`relative w-[280px] sm:w-[320px] bg-gradient-to-br ${config.bg} backdrop-blur-md border-3 ${config.border} rounded-3xl p-6 ${config.glow} flex flex-col items-center select-none overflow-hidden group`}
    >
      <div className="absolute inset-0 bg-radial from-white/5 via-transparent to-transparent pointer-events-none opacity-40" />

      <motion.span
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-black/40 border border-white/10 ${config.text} mb-6`}
      >
        {config.displayName}
      </motion.span>

      <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-black/35 border-2 border-white/5 flex items-center justify-center mb-6 shadow-inner group-hover:scale-105 transition-transform duration-300">
        <motion.span
          animate={{
            scale: [1, 1.08, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 3,
            ease: "easeInOut",
          }}
          className="text-6xl sm:text-7xl filter drop-shadow-md z-10 relative"
        >
          {reward.emoji}
        </motion.span>
      </div>

      <h3 className="text-xl sm:text-2xl font-black font-fredoka text-white text-center tracking-wide leading-tight px-2 mb-2 group-hover:text-primary-gold transition-colors duration-300">
        {reward.name}
      </h3>

      <p className="text-[11px] sm:text-xs font-bold text-white/55 text-center leading-relaxed max-w-[200px] mb-4">
        {reward.points
          ? `Instant points load credited to coin balance.`
          : `Unlocked successfully! Added to collections and badges.`}
      </p>

      <div className="w-full bg-black/35 border border-white/5 rounded-2xl py-2.5 px-4 flex items-center justify-between text-xs font-fredoka font-bold text-white/80">
        <span className="opacity-50">Score Boost</span>
        <span className={`${config.text} font-mono font-black tracking-wider`}>
          +{reward.pointsValue} XP
        </span>
      </div>
    </motion.div>
  );
}
