"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLuckStore } from "@/store/luckStore";
import { useAuth } from "@/components/auth/AuthProvider";
import { subscribeCoinLeaderboard, LeaderboardEntry } from "@/lib/firestoreProfile";
import { playDiceRoll, playTick, playWinChime, playDudSound, playGoldenDiceTrigger } from "@/lib/audio";
import ResultCard from "@/components/ui/ResultCard";
import ShareModal from "@/components/ui/ShareModal";
import { Sparkles, Trophy, Play, BarChart2, ShieldCheck, Flame, Coins, CoinsIcon, Lock, Moon, Sun, AlertTriangle } from "lucide-react";
import confetti from "canvas-confetti";
import Image from "next/image";

// Preset bets
const PRESET_WAGERS = [1000, 2000, 3000, 4000, 5000];

export default function CoinFlipGame() {
  const { user } = useAuth();
  const activeUserKey = useLuckStore((s) => s.activeUserKey);
  const currentScore = useLuckStore((s) => s.luckyScore);
  const currentProfile = useLuckStore((s) => s.profiles[activeUserKey]) || useLuckStore((s) => s.profiles["guest"]);

  // Tabs: "arena" | "stats" | "leaderboard"
  const [activeTab, setActiveTab] = useState<"arena" | "stats" | "leaderboard">("arena");

  // Leaderboard sub-tabs: "masters" | "profit" | "winrate"
  const [leaderboardTab, setLeaderboardTab] = useState<"masters" | "profit" | "winrate">("masters");
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  // Wager and Prediction selections
  const [prediction, setPrediction] = useState<"heads" | "tails" | null>(null);
  const [wager, setWager] = useState<number | null>(null);
  const [networkLoading, setNetworkLoading] = useState(false);

  // Game gameplay states
  const [flipping, setFlipping] = useState(false);
  const [goldenPortalActive, setGoldenPortalActive] = useState(false);
  const [isGoldenCoinResult, setIsGoldenCoinResult] = useState(false);
  const [resultSide, setResultSide] = useState<"heads" | "tails" | null>(null);
  const [rotationDegrees, setRotationDegrees] = useState(0);

  // Modals & outcome banners
  const [showResultCard, setShowResultCard] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [outcomeData, setOutcomeData] = useState<{
    won: boolean;
    payout: number;
    profit: number;
    streakBonus: number;
    streakBonusMessage: string;
    goldenMultiplier: number | null;
    goldenCoinBonus: string | null;
  } | null>(null);

  // Red damage indicator on Loss
  const [showLossFlash, setShowLossFlash] = useState(false);

  // Dev tools to force Golden Coin
  const [forceGoldenForDev, setForceGoldenForDev] = useState(false);
  const isDev = process.env.NODE_ENV === "development";

  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const intervalsRef = useRef<NodeJS.Timeout[]>([]);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      timeoutsRef.current.forEach(clearTimeout);
      intervalsRef.current.forEach(clearInterval);
    };
  }, []);

  // Balance count animation helper
  const [displayedBalance, setDisplayedBalance] = useState(currentProfile.coinBalance ?? 0);

  useEffect(() => {
    // Sync animated coin balance smoothly when store balance updates
    const target = currentProfile.coinBalance ?? 0;
    if (displayedBalance === target) return;

    const diff = target - displayedBalance;
    const step = Math.sign(diff) * Math.max(1, Math.floor(Math.abs(diff) / 12));
    
    const timer = setTimeout(() => {
      setDisplayedBalance((prev) => {
        const next = prev + step;
        if ((step > 0 && next > target) || (step < 0 && next < target)) {
          return target;
        }
        return next;
      });
    }, 25);

    return () => clearTimeout(timer);
  }, [currentProfile.coinBalance, displayedBalance]);

  // Subscribe to live leaderboard entries
  useEffect(() => {
    if (activeTab !== "leaderboard") return;

    setLeaderboardLoading(true);
    const sortBy = leaderboardTab === "masters" ? "wins" : leaderboardTab === "profit" ? "profit" : "winrate";
    
    const unsubscribe = subscribeCoinLeaderboard(
      sortBy,
      (data) => {
        setLeaderboardEntries(data);
        setLeaderboardLoading(false);
      },
      () => {
        setLeaderboardLoading(false);
      }
    );

    return () => unsubscribe();
  }, [activeTab, leaderboardTab]);

  // Trigger secured Server-Side Coin Predict flip
  const handleCoinPredictFlip = async () => {
    if (!prediction) {
      alert("☀️ Please predict Heads or Tails first!");
      return;
    }
    if (!wager) {
      alert("🪙 Please select a wager amount before flipping!");
      return;
    }
    if (flipping || networkLoading) return;

    const attemptsUsed = currentProfile.coinDailyAttempts ?? 0;
    if (attemptsUsed >= 10) {
      alert("🛑 You have reached today's limit of 10 coin predictions!");
      return;
    }

    if ((currentProfile.coinBalance ?? 0) < wager) {
      alert("❌ Insufficient Coins balance!");
      return;
    }

    // Set fetching state first before the coin begins to fly
    setNetworkLoading(true);
    setResultSide(null);
    setShowResultCard(false);
    setGoldenPortalActive(false);
    setIsGoldenCoinResult(false);
    setOutcomeData(null);

    try {
      const idToken = user ? await user.getIdToken() : "";

      const res = await fetch("/api/coin/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: idToken ? `Bearer ${idToken}` : "",
        },
        body: JSON.stringify({
          isGuest: activeUserKey === "guest",
          prediction,
          wager,
          forceGoldenCoin: forceGoldenForDev,
        }),
      });

      if (!res.ok) {
        setNetworkLoading(false);
        const data = await res.json();
        alert(data.error || "Toss verification failed.");
        return;
      }

      const data = await res.json();
      const serverResult = data.result;
      
      // Stop button loading indicator
      setNetworkLoading(false);

      // ─── START COIN FLIP ANIMATION AT THE EXACT SAME MILLISECOND ───
      setFlipping(true);

      // Parabolic & rotations math
      const targetModulo = serverResult === "heads" ? 0 : 180;
      const baseSpins = 2160; // 6 full Y spins
      const candidate = rotationDegrees + baseSpins;
      const currentModulo = candidate % 360;
      let difference = targetModulo - currentModulo;
      if (difference < 0) difference += 360;
      const targetRotation = candidate + difference;
      setRotationDegrees(targetRotation);

      // Handle Golden Coin portal and audio synchronization
      if (data.goldenCoin) {
        // Slow down regular spins and initiate gold portal suspense!
        playGoldenDiceTrigger();
        setGoldenPortalActive(true);

        // Suspense delay for Golden Coin emergence (1.2 seconds)
        await new Promise((resolve) => {
          const t1 = setTimeout(resolve, 1200);
          timeoutsRef.current.push(t1);
        });
        if (!isMounted.current) return;
        setGoldenPortalActive(false);
        setIsGoldenCoinResult(true);

        // Resume gold-speed spinning sounds!
        const goldenAudioInterval = setInterval(() => {
          playDiceRoll();
        }, 80);
        intervalsRef.current.push(goldenAudioInterval);

        const t2 = setTimeout(() => {
          clearInterval(goldenAudioInterval);
          if (!isMounted.current) return;
          resolveFlipSettle(data, serverResult);
        }, 2400); // matching 2.4s Y-spin animation duration cleanly
        timeoutsRef.current.push(t2);
      } else {
        // Normal settle sequence (approx 1.6 seconds)
        const audioInterval = setInterval(() => {
          playTick();
        }, 110);
        intervalsRef.current.push(audioInterval);

        const t3 = setTimeout(() => {
          clearInterval(audioInterval);
          if (!isMounted.current) return;
          resolveFlipSettle(data, serverResult);
        }, 1600); // matching 1.6s Y-spin animation duration cleanly
        timeoutsRef.current.push(t3);
      }

    } catch (err) {
      console.error(err);
      setNetworkLoading(false);
      setFlipping(false);
      alert("Toss lost in the cosmic matrix! Check connection.");
    }
  };

  // Resolve outcome settles and trigger visuals
  const resolveFlipSettle = (data: any, serverResult: "heads" | "tails") => {
    setFlipping(false);
    setResultSide(serverResult);

    // Sync state locally to Zustand store
    if (data.profile) {
      useLuckStore.setState((state) => {
        const updated = {
          ...state.profiles[activeUserKey],
          coinBalance: data.profile.coinBalance,
          luckyScore: data.profile.luckyScore,
          history: data.profile.history,
          badges: data.profile.badges,
          mysteryBoxesCount: data.profile.mysteryBoxesCount,
          coinDailyAttempts: data.profile.coinDailyAttempts,
          coinDailyAttemptsDate: data.profile.coinDailyAttemptsDate,
          coinTotalWins: data.profile.coinTotalWins,
          coinTotalLosses: data.profile.coinTotalLosses,
          coinTotalPredictions: data.profile.coinTotalPredictions,
          coinWinStreak: data.profile.coinWinStreak,
          coinBestStreak: data.profile.coinBestStreak,
          coinLargestWin: data.profile.coinLargestWin,
          coinTotalProfit: data.profile.coinTotalProfit,
        };
        return {
          profiles: {
            ...state.profiles,
            [activeUserKey]: updated,
          },
          ...updated,
        };
      });
    }

    setOutcomeData({
      won: data.won,
      payout: data.payout,
      profit: data.profit,
      streakBonus: data.streakBonus,
      streakBonusMessage: data.streakBonusMessage,
      goldenMultiplier: data.goldenMultiplier,
      goldenCoinBonus: data.goldenCoinBonus,
    });

    if (data.won) {
      // Confetti burst
      confetti({
        particleCount: 80,
        spread: 60,
        colors: data.goldenCoin ? ["#FFD700", "#FFA500", "#FFF8DC"] : ["#F5B700", "#FFD54F"],
      });
      playWinChime();
    } else {
      setShowLossFlash(true);
      const t4 = setTimeout(() => {
        if (isMounted.current) setShowLossFlash(false);
      }, 500);
      timeoutsRef.current.push(t4);
      playDudSound();
    }

    setShowResultCard(true);
  };

  const isGuest = activeUserKey === "guest";
  const dailyAttempts = currentProfile.coinDailyAttempts ?? 0;
  const isDailyLimitReached = dailyAttempts >= 10;
  
  // Calculate win rate
  const totalPredictions = currentProfile.coinTotalPredictions ?? 0;
  const wins = currentProfile.coinTotalWins ?? 0;
  const winRate = totalPredictions > 0 ? Math.round((wins / totalPredictions) * 100) : 0;

  return (
    <div className="w-full relative select-none font-fredoka">
      
      {/* Damage overlay loss flash */}
      <AnimatePresence>
        {showLossFlash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-red-600 z-50 pointer-events-none mix-blend-overlay"
          />
        )}
      </AnimatePresence>

      {/* Golden Coin Emergence Portal */}
      <AnimatePresence>
        {goldenPortalActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-md flex flex-col items-center justify-center pointer-events-none"
          >
            <div className="relative flex flex-col items-center">
              <div className="w-40 h-40 rounded-full border-4 border-yellow-500 bg-radial from-amber-500/20 via-transparent to-transparent flex items-center justify-center animate-spin absolute" />
              <div className="w-48 h-48 rounded-full border border-yellow-400/40 animate-pulse absolute" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-32 h-32 rounded-full border-dashed border-4 border-primary-gold flex items-center justify-center"
              />
              <motion.h2
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="text-primary-gold text-3xl font-black mt-8 text-center uppercase tracking-widest filter drop-shadow-[0_2px_8px_rgba(245,183,0,0.5)]"
              >
                🌟 GOLDEN COIN APPEARS! 🌟
              </motion.h2>
              <p className="text-white/60 text-xs font-bold mt-2 uppercase tracking-wide">
                Multiplier boosts & legendary badges ahead!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Controls (Active Tabs) */}
      <div className="flex items-center justify-center gap-2 mb-8 bg-white/60 dark:bg-card/60 backdrop-blur-md rounded-2xl p-1.5 border border-deep-violet/5 dark:border-white/5 shadow-inner w-fit mx-auto">
        <button
          onClick={() => setActiveTab("arena")}
          className={`flex items-center gap-1.5 py-2.5 px-6 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "arena"
              ? "bg-[#2D1B69] text-primary-gold border border-primary-gold/30 shadow-md scale-102"
              : "text-deep-violet/60 dark:text-cream-soft/60 hover:text-deep-violet dark:hover:text-cream-soft"
          }`}
        >
          <Play className="w-3.5 h-3.5" />
          Prediction Arena
        </button>
        <button
          onClick={() => setActiveTab("stats")}
          className={`flex items-center gap-1.5 py-2.5 px-6 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "stats"
              ? "bg-[#2D1B69] text-primary-gold border border-primary-gold/30 shadow-md scale-102"
              : "text-deep-violet/60 dark:text-cream-soft/60 hover:text-deep-violet dark:hover:text-cream-soft"
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          My Stats
        </button>
        <button
          onClick={() => setActiveTab("leaderboard")}
          className={`flex items-center gap-1.5 py-2.5 px-6 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === "leaderboard"
              ? "bg-[#2D1B69] text-primary-gold border border-primary-gold/30 shadow-md scale-102"
              : "text-deep-violet/60 dark:text-cream-soft/60 hover:text-deep-violet dark:hover:text-cream-soft"
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          Leaderboards
        </button>
      </div>

      {/* Main Tab View Workspace */}
      <div className="w-full">

        {/* Tab 1: Arena Console */}
        {activeTab === "arena" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
            
            {/* Daily Lock Screen overlay */}
            {isDailyLimitReached && (
              <div className="absolute inset-0 bg-white/70 dark:bg-card/75 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-center p-6 rounded-3xl border-2 border-deep-violet/10 dark:border-white/10">
                <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mb-4 animate-bounce">
                  <Lock className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-deep-violet dark:text-rose-500 uppercase tracking-widest mb-2">
                  Daily limit reached
                </h3>
                <p className="text-xs font-bold text-deep-violet/60 dark:text-cream-soft/60 max-w-sm mb-6 normal-case">
                  You have completed your 10 Coin Predictions today. In-app luck algorithms are cooling down! Come back tomorrow.
                </p>
                <div className="flex gap-4">
                  <a href="/wheel" className="text-xs font-black uppercase bg-[#F5B700] hover:bg-[#E0A700] text-[#2D1B69] px-5 py-2.5 rounded-xl shadow-md cursor-pointer transition-all">
                    Spin Wheel 🎡
                  </a>
                  <a href="/tree" className="text-xs font-black uppercase bg-deep-violet/10 dark:bg-white/5 text-deep-violet dark:text-cream-soft px-5 py-2.5 rounded-xl border border-deep-violet/10 dark:border-white/10 hover:bg-deep-violet/20 cursor-pointer transition-all">
                    Shake Tree 🍃
                  </a>
                </div>
              </div>
            )}

            {/* Left: 3D Flipping coin arena */}
            <div className="lg:col-span-7 flex flex-col items-center">
              <div className="relative w-full max-w-sm bg-white dark:bg-card border-4 border-primary-gold rounded-3xl p-6 shadow-xl flex flex-col items-center select-none overflow-hidden h-[460px]">
                
                {/* Metallic grid cosmic mesh background */}
                <div className="absolute inset-0 bg-radial from-violet-500/5 via-transparent to-transparent pointer-events-none" />

                {/* Daily limit attempts display */}
                <div className="absolute top-4 right-4 z-20 font-fredoka flex items-center gap-1.5 select-none">
                  <span className="text-[9px] font-black uppercase tracking-wider text-deep-violet/40 dark:text-cream-soft/40">Attempts:</span>
                  <span className={`font-mono text-xs font-black px-2 py-0.5 rounded-lg ${dailyAttempts >= 9 ? 'bg-rose-500/20 text-rose-500' : 'bg-black/20 text-primary-gold'}`}>
                    {dailyAttempts} / 10
                  </span>
                </div>

                {/* 3D coin perspective box */}
                <div className="flex-1 flex items-center justify-center relative w-full h-[280px] perspective-1000">
                  
                  {/* Animating coin container */}
                  <motion.div
                    animate={
                      flipping
                        ? {
                            rotateY: rotationDegrees,
                            rotateX: [0, 25, -20, 0], 
                            rotateZ: [0, 15, -12, 0], 
                            y: [0, -110, 0], // parabolic vertical travel
                            scale: [1, 1.25, 1], // depth factor
                          }
                        : {
                            rotateY: rotationDegrees,
                            rotateX: 0,
                            rotateZ: 0,
                            y: 0,
                            scale: 1,
                          }
                    }
                    transition={{
                      rotateY: {
                        duration: flipping ? (isGoldenCoinResult ? 2.4 : 1.6) : 0,
                        ease: [0.25, 0.1, 0.25, 1], 
                      },
                      rotateX: {
                        duration: flipping ? (isGoldenCoinResult ? 2.4 : 1.6) : 0,
                        times: [0, 0.35, 0.75, 1],
                        ease: "easeInOut",
                      },
                      rotateZ: {
                        duration: flipping ? (isGoldenCoinResult ? 2.4 : 1.6) : 0,
                        times: [0, 0.35, 0.75, 1],
                        ease: "easeInOut",
                      },
                      y: {
                        duration: flipping ? (isGoldenCoinResult ? 2.4 : 1.6) : 0,
                        times: [0, 0.5, 1],
                        ease: ["easeOut", "easeIn"],
                      },
                      scale: {
                        duration: flipping ? (isGoldenCoinResult ? 2.4 : 1.6) : 0,
                        times: [0, 0.5, 1],
                        ease: ["easeOut", "easeIn"],
                      },
                    }}
                    className="w-40 h-40 relative select-none"
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    
                    {/* HEADS Face */}
                    <div
                      className={`absolute inset-0 w-full h-full rounded-full border-4 shadow-2xl flex flex-col items-center justify-center backface-hidden transition-all duration-500 ${
                        isGoldenCoinResult
                          ? "border-yellow-400 bg-gradient-to-br from-amber-300 via-yellow-500 to-yellow-800 drop-shadow-[0_0_15px_rgba(245,183,0,0.6)]"
                          : "border-primary-gold bg-gradient-to-br from-[#FFD54F] via-[#F5B700] to-[#E65100]"
                      }`}
                      style={{ transform: "rotateY(0deg)", zIndex: 2 }}
                    >
                      <svg viewBox="0 0 100 100" className="w-24 h-24 filter drop-shadow-md">
                        <circle cx="50" cy="50" r="42" fill="none" stroke={isGoldenCoinResult ? "#FFF" : "#FFF59D"} strokeWidth="2" strokeDasharray="4,4" />
                        <circle cx="50" cy="50" r="18" fill={isGoldenCoinResult ? "#FFF" : "#FFF59D"} />
                        <g stroke={isGoldenCoinResult ? "#FFF" : "#FFF59D"} strokeWidth="4" strokeLinecap="round">
                          <line x1="50" y1="12" x2="50" y2="22" />
                          <line x1="50" y1="78" x2="50" y2="88" />
                          <line x1="12" y1="50" x2="22" y2="50" />
                          <line x1="78" y1="50" x2="88" y2="50" />
                          <line x1="23" y1="23" x2="30" y2="30" />
                          <line x1="70" y1="70" x2="77" y2="77" />
                          <line x1="77" y1="23" x2="70" y2="30" />
                          <line x1="30" y1="70" x2="23" y2="77" />
                        </g>
                        <text x="50" y="54" fontSize="10" fontWeight="950" textAnchor="middle" fill={isGoldenCoinResult ? "#D48000" : "#E65100"} fontFamily="sans-serif">HEADS</text>
                      </svg>
                    </div>

                    {/* TAILS Face */}
                    <div
                      className={`absolute inset-0 w-full h-full rounded-full border-4 shadow-2xl flex flex-col items-center justify-center backface-hidden transition-all duration-500 ${
                        isGoldenCoinResult
                          ? "border-yellow-400 bg-gradient-to-br from-amber-300 via-yellow-500 to-yellow-800 drop-shadow-[0_0_15px_rgba(245,183,0,0.6)]"
                          : "border-slate-300 bg-gradient-to-br from-[#ECEFF1] via-[#90A4AE] to-[#37474F]"
                      }`}
                      style={{ transform: "rotateY(180deg)", zIndex: 1 }}
                    >
                      <svg viewBox="0 0 100 100" className="w-24 h-24 filter drop-shadow-md">
                        <circle cx="50" cy="50" r="42" fill="none" stroke={isGoldenCoinResult ? "#FFF" : "#CFD8DC"} strokeWidth="2" strokeDasharray="3,3" />
                        <path
                          d="M60,30 C40,30 30,42 30,58 C30,72 40,82 58,82 C44,82 36,74 36,58 C36,44 46,32 60,30 Z"
                          fill={isGoldenCoinResult ? "#FFF" : "#ECEFF1"}
                        />
                        <circle cx="48" cy="40" r="1.5" fill="#FFF" />
                        <circle cx="62" cy="52" r="1.5" fill="#FFF" />
                        <circle cx="56" cy="65" r="1" fill="#FFF" />
                        <text x="50" y="54" fontSize="10" fontWeight="950" textAnchor="middle" fill={isGoldenCoinResult ? "#D48000" : "#37474F"} fontFamily="sans-serif">TAILS</text>
                      </svg>
                    </div>

                  </motion.div>
                </div>

                {/* Bounce shadows and floor details */}
                <div className="absolute inset-x-0 bottom-[105px] h-3 bg-slate-300/10 border-t border-slate-300/20 dark:bg-white/5 dark:border-white/10" />

                {/* Active Prediction / Wager details tags */}
                <div className="absolute bottom-20 flex gap-4 select-none font-bold uppercase tracking-widest text-[9px]">
                  {prediction && (
                    <span className="px-3 py-1 bg-primary-gold/10 border border-primary-gold/30 text-primary-gold rounded-full flex items-center gap-1 animate-pulse">
                      Predict: {prediction === "heads" ? "☀️ HEADS" : "🌙 TAILS"}
                    </span>
                  )}
                  {wager && (
                    <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-full flex items-center gap-1">
                      Wager: {wager} 🪙
                    </span>
                  )}
                </div>

                {/* Flip control trigger button */}
                <div className="absolute bottom-4 flex items-center gap-3">
                  <button
                    disabled={networkLoading || flipping || !prediction || !wager || (currentProfile.coinBalance ?? 0) < wager}
                    onClick={handleCoinPredictFlip}
                    className={`py-3.5 px-8 rounded-2xl font-extrabold text-base select-none cursor-pointer tracking-wider shadow-lg transition-all transform active:scale-95 border-2 border-white/15 ${
                      networkLoading || flipping
                        ? "bg-slate-300/35 dark:bg-white/10 text-slate-400 pointer-events-none"
                        : !prediction || !wager
                        ? "bg-deep-violet/10 dark:bg-white/5 border-transparent text-deep-violet/30 dark:text-cream-soft/20 pointer-events-none"
                        : (currentProfile.coinBalance ?? 0) < wager
                        ? "bg-rose-500/10 dark:bg-rose-500/15 border-rose-500/20 text-rose-500 pointer-events-none"
                        : "bg-primary-gold hover:bg-[#E0A700] text-deep-violet hover:shadow-xl"
                    }`}
                  >
                    {networkLoading
                      ? "PREPARING COIN..."
                      : flipping
                      ? "FLIP IN PROGRESS..."
                      : (currentProfile.coinBalance ?? 0) < (wager || 0)
                      ? "Insufficient Coins"
                      : "FLIP THE COIN! 🪙"}
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Betting Controls Deck */}
            <div className="lg:col-span-5 flex flex-col gap-6 bg-white dark:bg-card border-4 border-primary-gold rounded-3xl p-6 shadow-xl w-full text-slate-900 dark:text-white">
              
              {/* Prediction Chooser */}
              <div>
                <h3 className="text-lg font-black font-fredoka uppercase text-slate-900 dark:text-[#FFF8E7] mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-5 h-5 text-primary-gold" />
                  1. Predict Coin Side
                </h3>
                <p className="text-[10px] font-bold text-slate-500 dark:text-cream-soft/40 uppercase tracking-wide mb-3">
                  Chooseheads or tails for this flip
                </p>

                <div className="grid grid-cols-2 gap-4">
                  {/* HEADS */}
                  <button
                    onClick={() => !flipping && setPrediction("heads")}
                    disabled={flipping}
                    className={`py-4 px-3 rounded-2xl border-4 font-black text-sm flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50 ${
                      prediction === "heads"
                        ? "border-[#F5B700] bg-amber-50 text-[#E65100] shadow-md ring-4 ring-amber-400/20 dark:bg-amber-900/10"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                    }`}
                  >
                    <span className="text-2xl">☀️</span>
                    <span className="font-fredoka tracking-wider text-xs">HEADS</span>
                  </button>

                  {/* TAILS */}
                  <button
                    onClick={() => !flipping && setPrediction("tails")}
                    disabled={flipping}
                    className={`py-4 px-3 rounded-2xl border-4 font-black text-sm flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 disabled:opacity-50 ${
                      prediction === "tails"
                        ? "border-slate-400 bg-slate-100 text-slate-800 shadow-md ring-4 ring-slate-400/20 dark:bg-white/10 dark:text-white"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                    }`}
                  >
                    <span className="text-2xl">🌙</span>
                    <span className="font-fredoka tracking-wider text-xs">TAILS</span>
                  </button>
                </div>
              </div>

              {/* Wager presets selector */}
              <div>
                <h3 className="text-lg font-black font-fredoka uppercase text-slate-900 dark:text-[#FFF8E7] mb-1.5 flex items-center gap-1.5">
                  <Coins className="w-5 h-5 text-primary-gold animate-pulse" />
                  2. Place Wager
                </h3>
                <p className="text-[10px] font-bold text-slate-500 dark:text-cream-soft/40 uppercase tracking-wide mb-3">
                  Select in-app Lucky Coin wager size
                </p>

                <div className="flex flex-col gap-2.5">
                  <div className="grid grid-cols-5 gap-1.5">
                    {PRESET_WAGERS.map((amount) => {
                      const isLowBalance = (currentProfile.coinBalance ?? 0) < amount;
                      const isSelected = wager === amount;
                      
                      return (
                        <button
                          key={amount}
                          disabled={flipping}
                          onClick={() => !flipping && setWager(amount)}
                          className={`py-2.5 px-0.5 rounded-xl font-bold font-mono text-[10px] flex items-center justify-center cursor-pointer transition-all border ${
                            isSelected
                              ? "bg-[#2D1B69] border-[#F5B700] text-primary-gold font-black shadow-md scale-105"
                              : isLowBalance
                              ? "bg-slate-100 dark:bg-white/5 text-slate-300 dark:text-slate-600 border-transparent opacity-45 cursor-not-allowed"
                              : "bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-cream-soft border-slate-200 dark:border-white/5"
                          }`}
                        >
                          {amount}
                        </button>
                      );
                    })}
                  </div>

                  {/* Active balance preview */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 mt-1">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-cream-soft/50 uppercase tracking-wide">
                      Your Coins:
                    </span>
                    <span className="flex items-center gap-1.5 text-sm font-black font-mono text-primary-gold">
                      <CoinsIcon className="w-4 h-4" />
                      {displayedBalance.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Active selection feedback display */}
              <div className="flex-1 flex flex-col justify-center items-center p-4 rounded-2xl bg-[#2D1B69]/5 dark:bg-white/5 border border-dashed border-deep-violet/10 dark:border-white/10 text-center min-h-[90px]">
                {prediction && wager ? (
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Predicted Alignment</p>
                    <h4 className="text-xs font-black font-fredoka flex items-center justify-center gap-1.5 text-primary-gold leading-none">
                      ☀️ You bet {wager} Coins on {prediction.toUpperCase()}!
                    </h4>
                    <p className="text-[9px] font-bold text-slate-400 dark:text-cream-soft/40 mt-1 normal-case leading-relaxed">
                      If correct, you win <span className="font-bold text-green-500 font-mono">+{wager * 2} Coins</span> (+{wager} Profit!)
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5 py-1">
                    <Coins className="w-7 h-7 text-slate-400 dark:text-slate-600 mx-auto" />
                    <p className="text-[10px] font-black text-slate-400 dark:text-cream-soft/40 uppercase tracking-wider italic">
                      Pick side & select wager size above!
                    </p>
                  </div>
                )}
              </div>

              {/* Dev Tools Toggles */}
              {isDev && (
                <div className="mt-1 flex flex-col items-center gap-2 border-t border-slate-100 dark:border-white/10 pt-3">
                  <button
                    onClick={() => setForceGoldenForDev(!forceGoldenForDev)}
                    className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all border cursor-pointer ${
                      forceGoldenForDev
                        ? "bg-rose-500 border-rose-400 text-white animate-pulse"
                        : "bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-500"
                    }`}
                  >
                    ⚡ Force Golden Coin: {forceGoldenForDev ? "ON" : "OFF"}
                  </button>
                  <span className="text-[8px] font-bold text-zinc-400 tracking-wider">
                    (Visible only in local development mode)
                  </span>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Tab 2: User Statistics Panel */}
        {activeTab === "stats" && (
          <div className="w-full max-w-2xl mx-auto bg-white/60 dark:bg-card/60 backdrop-blur-md rounded-3xl p-6 border border-deep-violet/5 dark:border-white/5 shadow-2xl">
            
            <div className="flex items-center gap-3 mb-6 border-b border-deep-violet/5 dark:border-white/5 pb-4">
              <span className="w-9 h-9 rounded-full bg-primary-gold/15 flex items-center justify-center text-primary-gold">
                <BarChart2 className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-black text-deep-violet dark:text-cream-soft uppercase tracking-wider">
                  📈 Arena Performance Stats
                </h2>
                <p className="text-[10px] font-bold text-deep-violet/40 dark:text-cream-soft/40 uppercase tracking-widest mt-1">
                  Track your predictions, wagers, streaks, and earnings
                </p>
              </div>
            </div>

            {/* Grid display of stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              
              <div className="p-4 rounded-2xl bg-deep-violet/5 dark:bg-white/5 border border-deep-violet/10 dark:border-white/5 flex flex-col justify-center">
                <span className="text-[8px] uppercase tracking-widest font-black text-deep-violet/45 dark:text-cream-soft/45 leading-none">Total Predictions</span>
                <span className="text-xl font-black text-deep-violet dark:text-cream-soft font-mono mt-1 leading-none">
                  {currentProfile.coinTotalPredictions ?? 0}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/15 flex flex-col justify-center">
                <span className="text-[8px] uppercase tracking-widest font-black text-green-600/70 dark:text-green-500/70 leading-none">Total Wins</span>
                <span className="text-xl font-black text-green-600 dark:text-green-500 font-mono mt-1 leading-none">
                  {currentProfile.coinTotalWins ?? 0}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/15 flex flex-col justify-center">
                <span className="text-[8px] uppercase tracking-widest font-black text-rose-600/70 dark:text-rose-500/70 leading-none">Total Losses</span>
                <span className="text-xl font-black text-rose-600 dark:text-rose-500 font-mono mt-1 leading-none">
                  {currentProfile.coinTotalLosses ?? 0}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/15 flex flex-col justify-center">
                <span className="text-[8px] uppercase tracking-widest font-black text-amber-600/70 dark:text-amber-500/70 leading-none">Win Rate %</span>
                <span className="text-xl font-black text-amber-600 dark:text-amber-500 font-mono mt-1 leading-none">
                  {winRate}%
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-deep-violet/5 dark:bg-white/5 border border-deep-violet/10 dark:border-white/5 flex flex-col justify-center col-span-2">
                <span className="text-[8px] uppercase tracking-widest font-black text-deep-violet/45 dark:text-cream-soft/45 leading-none">Total Net Profit</span>
                <span className={`text-xl font-black font-mono mt-1 leading-none flex items-center gap-1.5 ${((currentProfile.coinTotalProfit || 0) >= 0) ? 'text-green-500' : 'text-rose-500'}`}>
                  <CoinsIcon className="w-4 h-4" />
                  {((currentProfile.coinTotalProfit || 0) >= 0) ? "+" : ""}
                  {(currentProfile.coinTotalProfit ?? 0).toLocaleString()}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-deep-violet/5 dark:bg-white/5 border border-deep-violet/10 dark:border-white/5 flex flex-col justify-center">
                <span className="text-[8px] uppercase tracking-widest font-black text-deep-violet/45 dark:text-cream-soft/45 leading-none">Current Streak</span>
                <span className="text-xl font-black text-primary-gold font-mono mt-1 leading-none flex items-center gap-1">
                  <Flame className="w-4.5 h-4.5 animate-pulse" />
                  {currentProfile.coinWinStreak ?? 0}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-deep-violet/5 dark:bg-white/5 border border-deep-violet/10 dark:border-white/5 flex flex-col justify-center">
                <span className="text-[8px] uppercase tracking-widest font-black text-deep-violet/45 dark:text-cream-soft/45 leading-none">Best Streak</span>
                <span className="text-xl font-black text-orange-500 font-mono mt-1 leading-none">
                  {currentProfile.coinBestStreak ?? 0}
                </span>
              </div>

            </div>

            {/* Streak Bonus Progress Banner */}
            <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-deep-violet/10 to-amber-500/5 border border-deep-violet/10 dark:border-white/10">
              <h4 className="text-xs font-black uppercase text-primary-gold tracking-wider mb-2 leading-none flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-500" />
                Lucky Streak Milestones
              </h4>
              <p className="text-[10px] font-bold text-deep-violet/50 dark:text-cream-soft/50 leading-relaxed max-w-md">
                Accumulate wins in a row to earn massive coin multipliers and bonus prizes:
              </p>
              <div className="grid grid-cols-3 gap-3 mt-3.5">
                <div className={`p-2.5 rounded-xl border text-center ${(currentProfile.coinWinStreak ?? 0) >= 3 ? 'bg-green-500/10 border-green-500/25 text-green-500' : 'bg-black/10 border-transparent text-white/40'}`}>
                  <span className="block text-[8px] font-black uppercase tracking-wider">3 Wins</span>
                  <span className="block text-xs font-black font-mono mt-1">+500 Coins</span>
                </div>
                <div className={`p-2.5 rounded-xl border text-center ${(currentProfile.coinWinStreak ?? 0) >= 5 ? 'bg-green-500/10 border-green-500/25 text-green-500' : 'bg-black/10 border-transparent text-white/40'}`}>
                  <span className="block text-[8px] font-black uppercase tracking-wider">5 Wins</span>
                  <span className="block text-xs font-black font-mono mt-1">+1500 Coins</span>
                </div>
                <div className={`p-2.5 rounded-xl border text-center ${(currentProfile.coinWinStreak ?? 0) >= 10 ? 'bg-green-500/10 border-green-500/25 text-green-500' : 'bg-black/10 border-transparent text-white/40'}`}>
                  <span className="block text-[8px] font-black uppercase tracking-wider">10 Wins</span>
                  <span className="block text-[9px] font-black font-mono mt-1">+3K & Box 🎁</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Tab 3: Leaderboard Panel */}
        {activeTab === "leaderboard" && (
          <div className="w-full max-w-lg mx-auto bg-white dark:bg-card border-2 border-deep-violet/10 dark:border-white/10 rounded-3xl p-5 shadow-xl select-none flex flex-col gap-4 font-fredoka">
            
            <div className="flex items-center gap-2 border-b border-deep-violet/5 dark:border-white/5 pb-3">
              <span className="w-8 h-8 rounded-full bg-primary-gold/15 flex items-center justify-center text-primary-gold animate-bounce">
                <Trophy className="w-4.5 h-4.5" />
              </span>
              <div>
                <h2 className="text-lg font-black text-deep-violet dark:text-cream-soft leading-none">
                  🏆 Prediction Ledgers
                </h2>
                <p className="text-[10px] font-bold text-deep-violet/45 dark:text-cream-soft/45 mt-1 uppercase tracking-wide">
                  Top prediction masters, profit barons, and win rates
                </p>
              </div>
            </div>

            {/* Sub-tabs for Leaderboards sorting */}
            <div className="grid grid-cols-3 gap-1 bg-deep-violet/5 dark:bg-white/5 p-1 rounded-xl">
              <button
                onClick={() => setLeaderboardTab("masters")}
                className={`py-2 px-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  leaderboardTab === "masters"
                    ? "bg-[#2D1B69] text-primary-gold shadow-md"
                    : "text-deep-violet/50 dark:text-cream-soft/50 hover:text-deep-violet dark:hover:text-cream-soft"
                }`}
              >
                Wins
              </button>
              <button
                onClick={() => setLeaderboardTab("profit")}
                className={`py-2 px-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  leaderboardTab === "profit"
                    ? "bg-[#2D1B69] text-primary-gold shadow-md"
                    : "text-deep-violet/50 dark:text-cream-soft/50 hover:text-deep-violet dark:hover:text-cream-soft"
                }`}
              >
                Profit
              </button>
              <button
                onClick={() => setLeaderboardTab("winrate")}
                className={`py-2 px-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  leaderboardTab === "winrate"
                    ? "bg-[#2D1B69] text-primary-gold shadow-md"
                    : "text-deep-violet/50 dark:text-cream-soft/50 hover:text-deep-violet dark:hover:text-cream-soft"
                }`}
              >
                Win Rate %
              </button>
            </div>

            {/* List entries */}
            {leaderboardLoading ? (
              <div className="w-full flex flex-col items-center justify-center min-h-[220px] gap-3 text-deep-violet/40 dark:text-cream-soft/40 animate-pulse font-bold">
                <div className="w-8 h-8 border-3 border-primary-gold border-t-transparent rounded-full animate-spin" />
                <span className="text-xs uppercase tracking-widest font-black">Syncing ledger...</span>
              </div>
            ) : leaderboardEntries.length === 0 ? (
              <div className="text-center py-16 text-xs font-bold text-deep-violet/40 dark:text-cream-soft/40 uppercase tracking-widest leading-relaxed">
                {leaderboardTab === "winrate"
                  ? "No players satisfy the min 50 predictions rule yet!"
                  : "No predictions captured in the cosmic registers yet!"}
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
                {leaderboardEntries.map((entry, idx) => {
                  const isTop1 = idx === 0;
                  const isTop2 = idx === 1;
                  const isTop3 = idx === 2;

                  // Render metric details based on active leaderboard sort
                  let metricLabel = "";
                  let metricValue = "";

                  if (leaderboardTab === "masters") {
                    metricLabel = "Total Wins";
                    metricValue = String(entry.coinTotalWins ?? 0);
                  } else if (leaderboardTab === "profit") {
                    metricLabel = "Profits";
                    metricValue = (entry.coinTotalProfit ?? 0).toLocaleString();
                  } else if (leaderboardTab === "winrate") {
                    metricLabel = "WinRate %";
                    const predictions = entry.coinTotalPredictions || 1;
                    metricValue = `${Math.round(((entry.coinTotalWins || 0) / predictions) * 100)}%`;
                  }

                  return (
                    <div
                      key={entry.uid}
                      className={`flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all ${
                        isTop1
                          ? "bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-transparent border-yellow-500/25 shadow-md shadow-yellow-500/5"
                          : isTop2
                          ? "bg-gradient-to-r from-slate-400/10 to-transparent border-slate-400/20"
                          : isTop3
                          ? "bg-gradient-to-r from-amber-600/10 to-transparent border-amber-600/20"
                          : "bg-deep-violet/5 dark:bg-white/5 border-transparent hover:border-deep-violet/10 dark:hover:border-white/10"
                      }`}
                    >
                      {/* Identity profile metadata */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="w-6 flex-shrink-0 text-center font-mono font-black text-sm text-deep-violet/50 dark:text-cream-soft/50">
                          {isTop1 ? "👑" : isTop2 ? "🥈" : isTop3 ? "🥉" : idx + 1}
                        </span>

                        {/* Avatar */}
                        <div className="relative w-9 h-9 rounded-full bg-deep-violet/10 dark:bg-white/10 flex items-center justify-center flex-shrink-0 border-2 border-white dark:border-card">
                          {entry.photoURL ? (
                            <Image
                              src={entry.photoURL}
                              alt={entry.displayName}
                              width={36}
                              height={36}
                              className="rounded-full object-cover w-full h-full"
                              unoptimized
                            />
                          ) : (
                            <span className="text-sm font-black text-deep-violet/40 dark:text-cream-soft/40 uppercase">
                              {entry.displayName.slice(0, 2)}
                            </span>
                          )}
                          {/* VIP gold frame badge */}
                          {entry.badges?.includes("badge_golden_coin") && (
                            <div className="absolute inset-0 rounded-full border border-yellow-500 animate-pulse scale-105" />
                          )}
                        </div>

                        {/* Name and streak details */}
                        <div className="min-w-0 flex flex-col justify-center">
                          <span className="block text-xs font-black text-deep-violet dark:text-cream-soft truncate leading-tight flex items-center gap-1">
                            {entry.displayName}
                            {entry.badges?.includes("badge_golden_coin") && (
                              <span className="text-[10px]" title="Golden Predictor Master">🌟</span>
                            )}
                          </span>
                          <span className="block text-[8px] font-bold text-deep-violet/40 dark:text-cream-soft/40 uppercase truncate leading-none mt-1">
                            Plays: <span className="font-mono">{entry.coinTotalPredictions ?? 0}</span>
                            {entry.coinBestStreak && entry.coinBestStreak > 0 ? (
                              <span className="ml-2 font-mono text-orange-500 font-black">
                                🔥 Streak: {entry.coinBestStreak}
                              </span>
                            ) : null}
                          </span>
                        </div>
                      </div>

                      {/* Display metric score */}
                      <div className="flex flex-col items-end leading-none text-right flex-shrink-0">
                        <span className="text-[8px] uppercase tracking-wider font-extrabold text-deep-violet/40 dark:text-cream-soft/40 leading-none">
                          {metricLabel}
                        </span>
                        <span className="text-sm font-black text-primary-gold font-mono leading-none mt-1">
                          {metricValue}
                        </span>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

      </div>

      {/* AA popups Result Cards and share prompts */}
      {resultSide && outcomeData && (
        <ResultCard
          isOpen={showResultCard}
          onClose={() => {
            setShowResultCard(false);
            setPrediction(null);
            setWager(null);
          }}
          gameName="Flip a Coin"
          emoji="🪙"
          title={outcomeData.won ? "CORRECT PREDICTION! 🎉" : "BAD LUCK! ❌"}
          description={
            outcomeData.won
              ? `Congratulations! The cosmic coin toss settled perfectly on ${resultSide.toUpperCase()}, matching your prediction! ${
                  outcomeData.goldenCoinBonus ? `\n🌟 Golden Reward: ${outcomeData.goldenCoinBonus}` : ""
                } ${
                  outcomeData.streakBonusMessage ? `\n${outcomeData.streakBonusMessage}` : ""
                }`
              : `Alas! The coin settled on ${resultSide.toUpperCase()}, which did not match your prediction of ${prediction?.toUpperCase()}. Better luck next time!`
          }
          scoreImpact={outcomeData.won ? 5 : -3}
          isWin={outcomeData.won}
          onRestart={() => {
            setShowResultCard(false);
            setPrediction(null);
            setWager(null);
          }}
          onShare={() => setShowShareModal(true)}
          customContent={
            outcomeData.won ? (
              <div className="flex flex-col gap-1 sm:gap-2 mt-4 font-mono select-none uppercase font-black text-xs sm:text-sm tracking-wider">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Wager:</span>
                  <span>{wager} Coins</span>
                </div>
                <div className="flex justify-between items-center text-green-500">
                  <span>Reward:</span>
                  <span>+{outcomeData.payout} Coins</span>
                </div>
                <div className="flex justify-between items-center text-primary-gold border-t border-slate-700/50 pt-1.5 sm:pt-2">
                  <span>Net Profit:</span>
                  <span>+{outcomeData.profit} Coins</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1 sm:gap-2 mt-4 font-mono select-none uppercase font-black text-xs sm:text-sm tracking-wider">
                <div className="flex justify-between items-center text-slate-400">
                  <span>You lost your wager.</span>
                </div>
                <div className="flex justify-between items-center text-rose-500 border-t border-slate-700/50 pt-1.5 sm:pt-2">
                  <span>Lost:</span>
                  <span>{wager} Coins</span>
                </div>
              </div>
            )
          }
        />
      )}

      {/* Share Modals */}
      {resultSide && outcomeData && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          score={currentScore}
          game="Flip a Coin"
          prize={
            outcomeData.won
              ? `Prediction profit of +${outcomeData.profit} Coins!`
              : "Cosmic decision resolved!"
          }
        />
      )}

    </div>
  );
}
