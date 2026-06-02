"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import AeoFaqSection from "@/components/ui/AeoFaqSection";

interface GameCard {
  id: string;
  emoji: string;
  title: string;
  description: string;
  href: string;
  badge: string;
  color: string;
}

const LOBBY_FAQS = [
  {
    question: "What is Lucky Vibes?",
    answer: "Lucky Vibes is an interactive digital playground compiling premium, high-fidelity simulations of classic fortune-telling games, random decision makers, and luck test widgets. It features tactile physical animations, Canvas sand particle physics, and 3D CSS rendering.",
  },
  {
    question: "How is the vibes score and history calculated?",
    answer: "Your vibes score acts as an aggregate rating of your current luck session. Wins on the scratch card, correct predictions on the coin toss, and positive 8-ball draws increment your score. Daily red envelopes and marine scroll bottle mail also boost your luck score. All stats are tracked locally in a client-side Zustand store.",
  },
  {
    question: "Are the game randomizers fair?",
    answer: "Yes. All games use standard secure client-side pseudorandom generation. Physical simulations (like the pendulum or custom wheel) map stopping degrees perfectly equally, guaranteeing that all wedges or outcomes carry authentic statistical distributions with zero bias.",
  },
  {
    question: "Is Lucky Vibes free to use?",
    answer: "Yes, Lucky Vibes is 100% free and open-source. There are no registration barriers, token ceilings, advertisement interruptions, cookie popups, or hidden transaction prompts. You are welcome to play as many times as you like.",
  },
];

const GAMES: GameCard[] = [
  {
    id: "wheel",
    emoji: "🎡",
    title: "Fortune Wheel",
    description: "Use 3 daily spins, unlock extras with points, and chase rewards up to the rare 1000-point prize.",
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
    id: "coin",
    emoji: "🪙",
    title: "Flip a Coin",
    description: "Toss a beautiful golden cosmic coin to decide your path: Heads or Tails!",
    href: "/coin",
    badge: "3D Spin",
    color: "from-amber-400 to-yellow-500",
  },
  {
    id: "scratch",
    emoji: "🎟️",
    title: "Scratch Card",
    description: "Rub off the silver glitter layer with your cursor to reveal hidden fortunes and wins!",
    href: "/scratch",
    badge: "Tactile Canvas",
    color: "from-gray-300 to-slate-400",
  },
  {
    id: "pendulum",
    emoji: "🔮",
    title: "Pendulum Divination",
    description: "Submit a question, release the cosmic silver pendulum, and let physical forces reveal the truth!",
    href: "/pendulum",
    badge: "Physics Simulation",
    color: "from-slate-400 to-zinc-600",
  },
  {
    id: "gift-hunt",
    emoji: "🎁",
    title: "Lucky Gift Hunt",
    description: "Pick 3 mystery gift boxes every day! Will you find the legendary 5000 coin jackpot?",
    href: "/gift-hunt",
    badge: "Daily Board",
    color: "from-pink-500 to-rose-600",
  },
];

// Emojis pool for floating backgrounds
const PARTICLE_EMOJIS = ["⭐", "🍀", "💫", "🎁", "🍎", "🍊", "💎", "🔮"];

export default function HomeClient() {
  const [particles, setParticles] = useState<{ id: number; emoji: string; x: number; delay: number; duration: number }[]>([]);

  useEffect(() => {
    // Generate floating background particles safely
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
    <div className="flex-1 flex flex-col items-center">
      {/* Floating particles background */}
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

      {/* Hero Introduction */}
      <section className="relative w-full max-w-4xl mb-6 select-none z-10 flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-br from-[#2D1B69] to-[#1E1145] dark:from-[#1B0F40] dark:to-[#0D0725] border-4 border-primary-gold rounded-3xl p-4 sm:py-5 sm:px-6 shadow-xl text-white overflow-hidden">
        {/* Hue-rotating mesh gradient background */}
        <div className="absolute inset-0 bg-radial from-violet-500/10 via-transparent to-transparent pointer-events-none animate-hue-sweep opacity-50" />

        <div className="flex-1 text-center md:text-left space-y-2.5 z-10">
          <h1 className="text-2xl sm:text-3xl font-black font-fredoka leading-none tracking-tight text-primary-gold drop-shadow-md">
            Lucky Vibes ✨ Virtual Garden of Luck & Fortunes
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-cream-soft/80 max-w-xl">
            Step into the ultimate digital playground of classic fortune-telling and random decision-makers! Spin custom prize wheels, scratch card covers, and test your vibes score today.
          </p>

          {/* Core Call to Actions (CTAs) above the fold */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1.5 pb-2">
            <Link
              href="/wheel"
              className="py-2.5 px-5 rounded-2xl font-black text-xs select-none cursor-pointer tracking-wider shadow-md bg-primary-gold hover:bg-amber-300 text-[#1E1145] hover:shadow-lg active:scale-95 transition-all flex items-center gap-2 group font-fredoka uppercase"
            >
              <span>Spin the Fortune Wheel 🎡</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/gift-hunt"
              className="py-2.5 px-4 rounded-2xl font-black text-xs select-none cursor-pointer tracking-wider border border-white/20 hover:bg-white/5 text-white active:scale-95 transition-all flex items-center gap-2 font-fredoka uppercase"
            >
              Play Gift Hunt 🎁
            </Link>
          </div>


        </div>
      </section>

      {/* Interactive Lobby Games Grid */}
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
                className="relative group flex flex-col h-full bg-white/70 dark:bg-[#1B103E]/70 backdrop-blur-xl border-2 border-deep-violet/10 dark:border-white/10 rounded-[2rem] p-6 hover:border-primary-gold/50 dark:hover:border-primary-gold/50 transition-all duration-300 shadow-lg hover:shadow-2xl overflow-hidden"
              >
                {/* Dynamic hover gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none`} />
                
                {/* Header card details */}
                <div className="flex items-center justify-between gap-2 mb-4 relative z-10">
                  <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-[#120A2C] shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                    <span className="text-2xl filter drop-shadow-sm">
                      {game.emoji}
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold font-fredoka px-2.5 py-1 rounded-lg uppercase tracking-wider bg-deep-violet/5 dark:bg-white/5 text-deep-violet/70 dark:text-cream-soft/70 border border-deep-violet/5 dark:border-white/5">
                    {game.badge}
                  </span>
                </div>

                {/* Game Title */}
                <h3 className="text-xl font-black font-fredoka text-deep-violet dark:text-cream-soft group-hover:text-primary-gold transition-colors mb-2.5 relative z-10">
                  {game.title}
                </h3>

                {/* Game Description */}
                <p className="text-xs font-bold text-deep-violet/60 dark:text-cream-soft/60 leading-relaxed flex-1 mb-6 relative z-10">
                  {game.description}
                </p>

                {/* Entry Action */}
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-primary-gold group-hover:text-[#E0A700] relative z-10">
                  Let's Play
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  >
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </motion.div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* AEO FAQ Section */}
      <AeoFaqSection items={LOBBY_FAQS} />

      {/* Structured Authority & Sourcing Block (AEO / E-E-A-T) */}
      <div className="w-full max-w-4xl border-t border-deep-violet/10 dark:border-white/10 pt-6 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] sm:text-xs font-semibold text-deep-violet/40 dark:text-cream-soft/40 select-none">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
          <span>
            Last Updated: <span className="font-bold text-deep-violet/60 dark:text-cream-soft/60">June 1, 2026</span>
          </span>
          <span className="hidden sm:inline">•</span>
          <span>
            Verified by: <span className="font-bold text-deep-violet/60 dark:text-cream-soft/60">Lucky Vibes Editorial Board</span>
          </span>
        </div>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/llms.txt"
            target="_blank"
            className="hover:text-primary-gold underline transition-colors"
          >
            AI Context (llms.txt)
          </Link>
          <span>•</span>
          <Link
            href="/pricing.md"
            target="_blank"
            className="hover:text-primary-gold underline transition-colors"
          >
            Agent Specs (pricing.md)
          </Link>
        </div>
      </div>
    </div>
  );
}
