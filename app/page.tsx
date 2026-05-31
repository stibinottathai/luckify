"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Activity, Award } from "lucide-react";
import { useLuckStore } from "@/store/luckStore";
import { DAILY_HOROSCOPES } from "@/lib/fortunes";

interface GameCard {
  id: string;
  emoji: string;
  title: string;
  description: string;
  href: string;
  badge: string;
  color: string;
}

const GAMES: GameCard[] = [
  {
    id: "wheel",
    emoji: "🎡",
    title: "Fortune Wheel",
    description: "Spin the wheel of fortune to claim your daily random blessing or hit the massive Jackpot!",
    href: "/wheel",
    badge: "Canvas Spin",
    color: "from-amber-400 to-orange-500",
  },
  {
    id: "tree",
    emoji: "🌳",
    title: "Shaking Tree",
    description: "Shake the magical SVG forest tree and catch whichever glowing fruit falls to earth!",
    href: "/tree",
    badge: "SVG Physics",
    color: "from-green-400 to-emerald-500",
  },
  {
    id: "dice",
    emoji: "🎲",
    title: "Lucky Dice",
    description: "Roll up to three fully interactive 3D CSS dice to find your current numbers alignment!",
    href: "/dice",
    badge: "3D Cubes",
    color: "from-indigo-400 to-violet-500",
  },
  {
    id: "mystery",
    emoji: "🎁",
    title: "Mystery Box",
    description: "Open beautiful gift boxes on a 3x3 grid to hunt down the hidden jackpot unicorn!",
    href: "/mystery",
    badge: "Lid Flip",
    color: "from-pink-400 to-rose-500",
  },
  {
    id: "scratch",
    emoji: "🪙",
    title: "Scratch Card",
    description: "Rub off the silver glitter layer with your cursor to reveal hidden fortunes and wins!",
    href: "/scratch",
    badge: "Tactile Canvas",
    color: "from-gray-300 to-slate-400",
  },
  {
    id: "picker",
    emoji: "🎰",
    title: "Number Picker",
    description: "Pick 6 lottery balls, run the staggered drop machine, and check your matches frequency!",
    href: "/picker",
    badge: "Lotto Stats",
    color: "from-teal-400 to-cyan-500",
  },
];

// Emojis pool for floating backgrounds
const PARTICLE_EMOJIS = ["⭐", "🍀", "💫", "🎁", "🍎", "🍊", "💎", "🔮"];

export default function Home() {
  const [horoscope, setHoroscope] = useState("");
  const [particles, setParticles] = useState<{ id: number; emoji: string; x: number; delay: number; duration: number }[]>([]);

  const { totalPlays, winStreak } = useLuckStore();

  useEffect(() => {
    // 1. Load random Daily Horoscope on mount
    const randomHoroscope = DAILY_HOROSCOPES[Math.floor(Math.random() * DAILY_HOROSCOPES.length)];
    setHoroscope(randomHoroscope);

    // 2. Generate floating background particles safely
    const initialParticles = Array.from({ length: 22 }).map((_, i) => ({
      id: i,
      emoji: PARTICLE_EMOJIS[Math.floor(Math.random() * PARTICLE_EMOJIS.length)],
      x: Math.random() * 100, // horizontal starting percentage
      delay: Math.random() * 10,
      duration: 12 + Math.random() * 8, // float speed
    }));
    setParticles(initialParticles);
  }, []);

  return (
    <div className="relative flex-1 flex flex-col items-center">
      {/* 1. Floating particles background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {particles.map((p) => (
          <span
            key={p.id}
            style={{
              left: `${p.x}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              "--float-x": `${Math.random() * 80 - 40}px`,
              "--float-r": `${Math.random() * 360 + 180}deg`,
            } as React.CSSProperties}
            className="floating-particle text-xl opacity-0"
          >
            {p.emoji}
          </span>
        ))}
      </div>

      {/* 2. Top horoscope alert banner */}
      {horoscope && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl bg-primary-gold/15 dark:bg-primary-gold/10 border-2 border-primary-gold/30 rounded-2xl p-3.5 mb-8 flex items-center justify-center gap-2.5 text-center text-xs sm:text-sm font-extrabold text-deep-violet dark:text-cream-soft select-none"
        >
          <Sparkles className="w-4 h-4 text-primary-gold animate-bounce shrink-0" />
          <span>{horoscope}</span>
        </motion.div>
      )}

      {/* 3. Hero Introduction */}
      <section className="relative w-full max-w-4xl mb-12 select-none z-10 flex flex-col md:flex-row items-center justify-between gap-8 bg-gradient-to-br from-[#2D1B69] to-[#1E1145] dark:from-[#1B0F40] dark:to-[#0D0725] border-4 border-primary-gold rounded-3xl p-6 sm:p-8 shadow-xl text-white overflow-hidden">
        
        {/* Hue-rotating mesh gradient background */}
        <div className="absolute inset-0 bg-radial from-violet-500/10 via-transparent to-transparent pointer-events-none animate-hue-sweep opacity-50" />

        <div className="flex-1 text-center md:text-left space-y-4 z-10">
          <h1 className="text-4xl sm:text-5xl font-black font-fredoka leading-none tracking-tight text-primary-gold drop-shadow-md">
            Lucky Vibes ✨
          </h1>
          <p className="text-sm sm:text-base font-bold text-cream-soft/80 max-w-xl">
            Step into the garden of fortunes! Shake the SVG tree, roll 3D dice, spin the wheel, scratch cards, and claim your mystical daily fortunes!
          </p>

          {/* Miniature Player Stats Dashboard */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-cream-soft/70">
              <Activity className="w-3.5 h-3.5 text-accent-teal" />
              Total Plays:{" "}
              <span className="text-primary-gold font-mono font-black">{totalPlays}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-cream-soft/70">
              <Award className="w-3.5 h-3.5 text-alert-coral" />
              Win Streak:{" "}
              <span className="text-primary-gold font-mono font-black">{winStreak}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Interactive Lobby Games Grid */}
      <section className="w-full max-w-4xl z-10 select-none">
        <h2 className="text-xl font-extrabold font-fredoka text-deep-violet dark:text-cream-soft mb-6 uppercase tracking-wider text-center md:text-left">
          Select Your Game 🔮
        </h2>

        {/* 2 columns mobile, 3 columns tablet/desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {GAMES.map((game, index) => (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={game.id}
            >
              <Link
                href={game.href}
                className="group flex flex-col h-full bg-white dark:bg-card border-2 border-deep-violet/10 dark:border-white/10 rounded-3xl p-5 hover:border-primary-gold dark:hover:border-primary-gold card-glow"
              >
                {/* Header card details */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-3xl filter drop-shadow-sm group-hover:scale-110 transition-transform duration-200">
                    {game.emoji}
                  </span>
                  <span className="text-[9px] font-extrabold font-fredoka px-2 py-0.5 rounded-md uppercase tracking-wider bg-deep-violet/5 dark:bg-white/5 text-deep-violet/60 dark:text-cream-soft/60">
                    {game.badge}
                  </span>
                </div>

                {/* Game Title */}
                <h3 className="text-lg font-black font-fredoka text-deep-violet dark:text-cream-soft group-hover:text-primary-gold transition-colors mb-2">
                  {game.title}
                </h3>

                {/* Game Description */}
                <p className="text-xs font-semibold text-deep-violet/60 dark:text-cream-soft/60 leading-relaxed flex-1 mb-5">
                  {game.description}
                </p>

                {/* Entry Action */}
                <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-primary-gold group-hover:underline">
                  Let's Play
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
