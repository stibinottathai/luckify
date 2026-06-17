"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import AeoFaqSection from "@/components/ui/AeoFaqSection";
import { useLuckStore } from "@/store/luckStore";
import { playWinChime, playLegendaryReward } from "@/lib/audio";
import confetti from "canvas-confetti";
import { useAuth } from "@/components/auth/AuthProvider";

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
    question: "What is Luck ഉണ്ടോ ?",
    answer: "Luck ഉണ്ടോ ? is an interactive digital playground compiling premium, high-fidelity simulations of classic fortune-telling games, random decision makers, and luck test widgets. It features custom physics animations, HTML5 Canvas drawings, and reactive user interfaces.",
  },
  {
    question: "What games are currently available to play?",
    answer: "You can currently play the Fortune Wheel to spin for prizes, use Pendulum Divination to get answers to your queries with real physics simulations, and participate in the daily Lucky Gift Hunt to unlock mystery treasure rewards.",
  },
  {
    question: "How is the vibes score and history calculated?",
    answer: "Your vibes score acts as an aggregate rating of your current luck session. It starts at 50 points and changes dynamically based on the outcomes of your games. You can earn or spend Vibe Coins to unlock extra features or spins, and all your statistics are tracked locally in a client-side Zustand store. In the future, you will also be able to convert your accumulated Vibe Coins into real-world gifts and physical rewards!",
  },
  {
    question: "Are the game randomizers fair?",
    answer: "Yes. All games use standard secure client-side pseudorandom generation. Physical simulations (like the pendulum or custom wheel) map stopping degrees perfectly equally, guaranteeing that all wedges or outcomes carry authentic statistical distributions with zero bias.",
  },
  {
    question: "Is Luck ഉണ്ടോ ? free to use?",
    answer: "Yes, Luck ഉണ്ടോ ? is free to play and open-source. To support operations and keep the platform free for everyone, we will soon be integrating advertisements (applying for monetization). There are no registration barriers, and you are welcome to play as many times as you like.",
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
    id: "gift-hunt",
    emoji: "🎁",
    title: "Lucky Gift Hunt",
    description: "Pick 3 mystery gift boxes every day! Will you find the legendary 5000 coin jackpot?",
    href: "/gift-hunt",
    badge: "Daily Board",
    color: "from-pink-500 to-rose-600",
  },
  {
    id: "time-capsule",
    emoji: "🕰️",
    title: "Time Capsule of Hope",
    description: "Bury messages to your future self and lock Vibe Coins to earn high-yield cosmic interest!",
    href: "/time-capsule",
    badge: "Lock & Yield",
    color: "from-amber-500 to-yellow-600",
  },
  {
    id: "astro-vibes",
    emoji: "🌌",
    title: "Astro-Vibes Alignment",
    description: "Align your zodiac sign, reveal daily cosmic forecasts, and claim daily coin rewards!",
    href: "/astro-vibes",
    badge: "Daily Horoscope",
    color: "from-indigo-600 to-violet-800",
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
    id: "wishing-star",
    emoji: "🌟",
    title: "Celestial Wishing Sky",
    description: "Cast your wishes as stars into the night sky. Send positive vibes to other stars to unlock blessings!",
    href: "/wishing-star",
    badge: "Social Well",
    color: "from-emerald-500 to-teal-700",
  },
];

// Emojis pool for floating backgrounds
const PARTICLE_EMOJIS = ["⭐", "🍀", "💫", "🎁", "🍎", "🍊", "💎", "🔮"];

export default function HomeClient() {
  const [particles, setParticles] = useState<{ id: number; emoji: string; x: number; delay: number; duration: number }[]>([]);
  const [streakClaimPopup, setStreakClaimPopup] = useState<{ amount: number; day: number } | null>(null);
  
  const { user, loading, profileLoaded } = useAuth();
  const activeUserKey = useLuckStore((s) => s.activeUserKey);
  const currentProfile = useLuckStore((s) => s.profiles[activeUserKey]) || useLuckStore((s) => s.profiles["guest"]);
  const claimDailyVisit = useLuckStore((s) => s.claimDailyVisit);

  useEffect(() => {
    // Gate 1: Only run for real logged-in users
    if (loading || !user || activeUserKey === "guest") return;
    // Gate 2: Only run after Firestore data has been fully loaded into the store.
    // This prevents claiming against stale empty-string lastVisitDate values
    // that exist before the Firestore fetch completes.
    if (!profileLoaded) return;

    const todayStr = new Date().toISOString().slice(0, 10);
    const lastVisit = currentProfile?.lastVisitDate || "";

    // Already claimed today — nothing to do
    if (lastVisit === todayStr) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    let newStreak = 1;
    if (lastVisit === yesterdayStr) {
      newStreak = (currentProfile?.visitStreak || 0) + 1;
    } else {
      newStreak = 1;
    }

    const nextRecord = Math.max(currentProfile?.visitStreakRecord || 0, newStreak);

    // Determine reward amount
    const rewardAmount = (newStreak % 7 === 0 && newStreak > 0) ? 5000 : 500;

    // Show popup
    setStreakClaimPopup({ amount: rewardAmount, day: newStreak });

    // Play sound & Confetti
    if (rewardAmount === 5000) {
      playLegendaryReward();
      const duration = 3.5 * 1000;
      const end = Date.now() + duration;
      (function frame() {
        confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ["#F5B700", "#FFD700", "#FFFFFF"] });
        confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ["#F5B700", "#FFD700", "#FFFFFF"] });
        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
    } else {
      playWinChime();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 }, colors: ["#F5B700", "#FFD700", "#FFFFFF"] });
    }

    // Persist claim to store (writes lastVisitDate = today, preventing re-fire)
    claimDailyVisit(todayStr, newStreak, nextRecord, rewardAmount);
  }, [profileLoaded, activeUserKey, currentProfile?.lastVisitDate, loading, user]);

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

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": LOBBY_FAQS.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Luck ഉണ്ടോ ?",
    "url": "https://www.luckundo.xyz",
    "applicationCategory": "EntertainmentApplication",
    "operatingSystem": "All",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "An interactive digital playground compiling premium, high-fidelity simulations of classic fortune-telling games, random decision makers, and luck test widgets."
  };

  return (
    <div className="flex-1 flex flex-col items-center">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
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
            Luck ഉണ്ടോ ? ✨ Virtual Garden of Luck & Fortunes
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-soft-cream/80 max-w-xl">
            Step into the ultimate digital playground of classic fortune-telling and random decision-makers! Spin custom prize wheels, flip cosmic golden coins, and test your vibes score today.
          </p>

          {/* Glittering Giveaway Teaser Box */}
          <div className="animate-glitter border border-primary-gold/45 bg-white/5 backdrop-blur-md rounded-2xl p-3.5 my-3.5 space-y-1 max-w-2xl select-none">
            <div className="flex items-center gap-2 justify-center md:justify-start text-xs font-black uppercase tracking-wider">
              <span className="text-base">🎁</span>
              <span className="shimmer-text font-fredoka text-sm">Future Giveaways & Gifts!</span>
              <span className="bg-primary-gold/25 border border-primary-gold/30 text-primary-gold text-[9px] px-1.5 py-0.5 rounded font-fredoka animate-pulse">Coming Soon</span>
            </div>
            <p className="text-[11px] sm:text-xs font-bold text-soft-cream/90 leading-relaxed text-center md:text-left">
              Stay tuned! We are planning daily, weekly, and monthly gifts for the top coin collectors. Accumulate as many Vibe Coins as you can to climb the ranks and win real rewards!
            </p>
          </div>

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

      {/* Daily Visit Streak Widget */}
      {loading ? (
        <section className="relative w-full max-w-4xl mb-6 bg-white/70 dark:bg-[#1B103E]/70 backdrop-blur-xl border-2 border-deep-violet/10 dark:border-white/10 rounded-[2rem] p-6 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden z-10 animate-pulse">
          <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left w-full md:w-auto">
            <div className="w-14 h-14 bg-deep-violet/10 dark:bg-white/10 rounded-2xl" />
            <div className="space-y-2">
              <div className="h-5 w-36 bg-deep-violet/10 dark:bg-white/10 rounded-lg" />
              <div className="h-3.5 w-56 bg-deep-violet/10 dark:bg-white/10 rounded-md" />
            </div>
          </div>
          <div className="flex flex-col items-center md:items-end gap-2 w-full md:w-auto">
            <div className="flex items-center gap-1.5">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="w-9 h-9 bg-deep-violet/10 dark:bg-white/10 rounded-xl" />
              ))}
            </div>
            <div className="h-3.5 w-24 bg-deep-violet/10 dark:bg-white/10 rounded-md" />
          </div>
        </section>
      ) : (
        <section className="relative w-full max-w-4xl mb-6 bg-white/70 dark:bg-[#1B103E]/70 backdrop-blur-xl border-2 border-deep-violet/10 dark:border-white/10 rounded-[2rem] p-6 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden z-10 font-fredoka">
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 via-transparent to-transparent pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-3xl shadow-md border border-white/20 select-none animate-pulse">
              🔥
            </div>
            <div>
              <h3 className="text-lg font-black text-deep-violet dark:text-soft-cream leading-none">
                Daily Visit Streak
              </h3>
              <p className="text-xs font-bold text-deep-violet/60 dark:text-soft-cream/60 mt-1">
                Visit every day to keep your lucky streak alive! Max record: <span className="text-primary-gold font-bold">{currentProfile?.visitStreakRecord || 0} days</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-end gap-2">
            <div className="flex items-center gap-1.5">
              {Array.from({ length: 7 }).map((_, i) => {
                const dayNum = i + 1;
                const currentStreak = currentProfile?.visitStreak || 0;
                const isClaimed = (currentStreak % 7 === 0 && currentStreak > 0) ? true : (currentStreak % 7 >= dayNum);
                const isCurrent = (currentStreak % 7 === dayNum - 1);
                
                return (
                  <div
                    key={i}
                    className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center font-black text-[10px] border transition-all duration-300 ${
                      isClaimed
                        ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white border-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                        : isCurrent
                        ? "bg-primary-gold/15 border-primary-gold text-primary-gold animate-pulse"
                        : "bg-deep-violet/5 dark:bg-white/[0.02] border-deep-violet/10 dark:border-white/10 text-deep-violet/30 dark:text-soft-cream/20"
                    }`}
                  >
                    <span className="text-[7px] opacity-40 uppercase">D{dayNum}</span>
                    <span>{isClaimed ? "✓" : dayNum}</span>
                  </div>
                );
              })}
            </div>
            <span className="text-xs font-extrabold text-primary-gold uppercase tracking-wider">
              Current Streak: {currentProfile?.visitStreak || 0} Days
            </span>
          </div>
        </section>
      )}

      {/* Interactive Lobby Games Grid */}
      <section className="w-full max-w-4xl z-10 select-none">
        <h2 className="text-xl font-extrabold font-fredoka text-deep-violet dark:text-soft-cream mb-6 uppercase tracking-wider text-center md:text-left">
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
                  <span className="text-[10px] font-extrabold font-fredoka px-2.5 py-1 rounded-lg uppercase tracking-wider bg-deep-violet/5 dark:bg-white/5 text-deep-violet/70 dark:text-soft-cream/70 border border-deep-violet/5 dark:border-white/5">
                    {game.badge}
                  </span>
                </div>

                {/* Game Title */}
                <h3 className="text-xl font-black font-fredoka text-deep-violet dark:text-soft-cream group-hover:text-primary-gold transition-colors mb-2.5 relative z-10">
                  {game.title}
                </h3>

                {/* Game Description */}
                <p className="text-xs font-bold text-deep-violet/60 dark:text-soft-cream/60 leading-relaxed flex-1 mb-6 relative z-10">
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
      <div className="w-full max-w-4xl border-t border-deep-violet/10 dark:border-white/10 pt-6 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] sm:text-xs font-semibold text-deep-violet/40 dark:text-soft-cream/40 select-none">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
          <span>
            Last Updated: <span className="font-bold text-deep-violet/60 dark:text-soft-cream/60">June 1, 2026</span>
          </span>
          <span className="hidden sm:inline">•</span>
          <span>
            Verified by: <span className="font-bold text-deep-violet/60 dark:text-soft-cream/60">Luck ഉണ്ടോ ? Editorial Board</span>
          </span>
        </div>
      </div>
      {/* Daily Visit Streak Celebration Overlay */}
      <AnimatePresence>
        {streakClaimPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: -50, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.25 }}
              className="relative max-w-sm w-full bg-gradient-to-b from-[#2E1A68] to-[#120734] border-4 border-primary-gold rounded-[2.5rem] p-8 shadow-2xl text-center flex flex-col items-center justify-center overflow-hidden font-fredoka"
            >
              {/* Background glows */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-primary-gold/15 via-transparent to-transparent pointer-events-none -z-10 animate-pulse" />
              
              <span className="text-[10px] font-black uppercase tracking-widest text-primary-gold/80 px-4 py-1.5 bg-white/5 rounded-full border border-white/5">
                {streakClaimPopup.day % 7 === 0 ? "🏆 Mega Streak Bonus 🏆" : "📅 Daily Visit Bonus"}
              </span>

              <motion.div
                animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                className="text-7xl my-6 filter drop-shadow-[0_8px_16px_rgba(245,183,0,0.5)] select-none pointer-events-none"
              >
                {streakClaimPopup.day % 7 === 0 ? "👑" : "🎁"}
              </motion.div>

              <h3 className="text-5xl font-black text-white filter drop-shadow-[0_4px_15px_rgba(255,255,255,0.25)]">
                +{streakClaimPopup.amount.toLocaleString()}
              </h3>
              <span className="text-xs font-bold text-soft-cream/60 uppercase tracking-widest mt-1">
                Vibe Coins Claimed
              </span>

              <p className="text-sm font-bold text-soft-cream/85 mt-4 leading-relaxed px-2">
                {streakClaimPopup.day % 7 === 0
                  ? `Outstanding! You successfully completed a ${streakClaimPopup.day} day daily visit streak! Claim your mega reward!`
                  : `Day ${streakClaimPopup.day} visit claimed! Keep visiting everyday to secure the 5,000 coin jackpot on Day 7.`}
              </p>

              <button
                onClick={() => setStreakClaimPopup(null)}
                className="mt-6 py-3.5 px-8 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-deep-violet font-black text-sm tracking-wider uppercase shadow-[0_0_20px_rgba(245,183,0,0.3)] transition-all cursor-pointer pointer-events-auto"
              >
                Awesome! 🪙
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
