"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useAnimate } from "framer-motion";
import { useLuckStore } from "@/store/luckStore";
import { useAuth } from "@/components/auth/AuthProvider";
import { playDiceRoll, playTick, playWinChime, playDudSound, playGoldenDiceTrigger } from "@/lib/audio";
import ResultCard from "@/components/ui/ResultCard";
import ShareModal from "@/components/ui/ShareModal";
import { Sparkles, Flame, Coins, CoinsIcon, Lock } from "lucide-react";
import confetti from "canvas-confetti";
import Image from "next/image";

// Preset bets
const PRESET_WAGERS = [1000, 2000, 3000, 4000, 5000];

export default function CoinFlipGame() {
  const { user } = useAuth();
  const activeUserKey = useLuckStore((s) => s.activeUserKey);
  const currentScore = useLuckStore((s) => s.luckyScore);
  const currentProfile = useLuckStore((s) => s.profiles[activeUserKey]) || useLuckStore((s) => s.profiles["guest"]);

  // Wager and Prediction selections
  const [prediction, setPrediction] = useState<"heads" | "tails" | null>(null);
  const [wager, setWager] = useState<number | null>(null);

  // Network / UI loading states
  const [networkLoading, setNetworkLoading] = useState(false);
  const [flipping, setFlipping] = useState(false);

  // Golden coin effects
  const [goldenPortalActive, setGoldenPortalActive] = useState(false);
  const [isGoldenCoinResult, setIsGoldenCoinResult] = useState(false);

  // Which side the coin settled on (for result display)
  const [resultSide, setResultSide] = useState<"heads" | "tails" | null>(null);

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

  // Red damage flash on loss
  const [showLossFlash, setShowLossFlash] = useState(false);

  // Dev tools
  const [forceGoldenForDev, setForceGoldenForDev] = useState(false);
  const isDev = process.env.NODE_ENV === "development";

  // Refs for cleanup
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const intervalsRef = useRef<NodeJS.Timeout[]>([]);
  const isMounted = useRef(true);

  // Imperative animation control — avoids ALL stale-closure / state-sync issues
  const [coinScope, animateCoin] = useAnimate();

  // Track cumulative rotation so each flip continues from where the last ended
  const totalRotationRef = useRef(0);

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
    const target = currentProfile.coinBalance ?? 0;
    if (displayedBalance === target) return;
    const diff = target - displayedBalance;
    const step = Math.sign(diff) * Math.max(1, Math.floor(Math.abs(diff) / 12));
    const timer = setTimeout(() => {
      setDisplayedBalance((prev) => {
        const next = prev + step;
        if ((step > 0 && next > target) || (step < 0 && next < target)) return target;
        return next;
      });
    }, 25);
    return () => clearTimeout(timer);
  }, [currentProfile.coinBalance, displayedBalance]);

  // The settle callback — defined with useCallback so timeouts always call the latest version
  const resolveFlipSettle = useCallback((data: any, serverResult: "heads" | "tails") => {
    setFlipping(false);
    setResultSide(serverResult);

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
          profiles: { ...state.profiles, [activeUserKey]: updated },
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
      confetti({
        particleCount: 80,
        spread: 60,
        colors: data.goldenCoin ? ["#FFD700", "#FFA500", "#FFF8DC"] : ["#F5B700", "#FFD54F"],
      });
      playWinChime();
    } else {
      setShowLossFlash(true);
      const t = setTimeout(() => {
        if (isMounted.current) setShowLossFlash(false);
      }, 500);
      timeoutsRef.current.push(t);
      playDudSound();
    }

    setShowResultCard(true);
  }, [activeUserKey]);

  // Main flip handler
  const handleCoinPredictFlip = async () => {
    if (!prediction) { alert("☀️ Please predict Heads or Tails first!"); return; }
    if (!wager) { alert("🪙 Please select a wager amount before flipping!"); return; }
    if (flipping || networkLoading) return;

    const attemptsUsed = currentProfile.coinDailyAttempts ?? 0;
    if (attemptsUsed >= 10) { alert("🛑 You have reached today's limit of 10 coin predictions!"); return; }
    if ((currentProfile.coinBalance ?? 0) < wager) { alert("❌ Insufficient Coins balance!"); return; }

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
        const errData = await res.json();
        alert(errData.error || "Toss verification failed.");
        return;
      }

      const data = await res.json();
      const serverResult: "heads" | "tails" = data.result;

      setNetworkLoading(false);
      setFlipping(true);

      // ── IMPERATIVE ANIMATION via useAnimate ──────────────────────────────
      // Compute the final Y rotation so the coin face lands correctly.
      // Heads = 0° mod 360, Tails = 180° mod 360
      const targetFace = serverResult === "heads" ? 0 : 180;
      const spins = 6 * 360; // 6 full spins
      const current = totalRotationRef.current;
      const currentMod = ((current % 360) + 360) % 360;
      let delta = targetFace - currentMod;
      if (delta < 0) delta += 360;
      const finalRotation = current + spins + delta;
      totalRotationRef.current = finalRotation;

      const duration = data.goldenCoin ? 2.4 : 1.6;

      if (data.goldenCoin) {
        playGoldenDiceTrigger();
        setGoldenPortalActive(true);

        // Golden portal suspense (1.2s), then coin spin
        const portalTimer = setTimeout(async () => {
          if (!isMounted.current) return;
          setGoldenPortalActive(false);
          setIsGoldenCoinResult(true);

          // Start audio ticks
          const audioInterval = setInterval(() => playDiceRoll(), 80);
          intervalsRef.current.push(audioInterval);

          // Run the animation imperatively
          await animateCoin(coinScope.current, {
            rotateY: finalRotation,
            y: [0, -110, 0],
            scale: [1, 1.25, 1],
          }, {
            duration,
            ease: [0.22, 1, 0.36, 1],
          });

          clearInterval(audioInterval);
          if (!isMounted.current) return;
          resolveFlipSettle(data, serverResult);
        }, 1200);
        timeoutsRef.current.push(portalTimer);

      } else {
        // Normal flip
        const audioInterval = setInterval(() => playTick(), 110);
        intervalsRef.current.push(audioInterval);

        // Run the animation imperatively — awaiting it means it ALWAYS resolves
        await animateCoin(coinScope.current, {
          rotateY: finalRotation,
          y: [0, -110, 0],
          scale: [1, 1.25, 1],
        }, {
          duration,
          ease: [0.22, 1, 0.36, 1],
        });

        clearInterval(audioInterval);
        if (!isMounted.current) return;
        resolveFlipSettle(data, serverResult);
      }

    } catch (err) {
      console.error(err);
      setNetworkLoading(false);
      setFlipping(false);
    }
  };

  const dailyAttempts = currentProfile.coinDailyAttempts ?? 0;
  const isDailyLimitReached = dailyAttempts >= 10;

  return (
    <div className="w-full relative select-none font-fredoka">

      {/* Loss flash overlay */}
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
              <div className="w-40 h-40 rounded-full border-4 border-yellow-500 flex items-center justify-center animate-spin absolute" />
              <div className="w-48 h-48 rounded-full border border-yellow-400/40 animate-pulse absolute" />
              <motion.h2
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="text-primary-gold text-3xl font-black mt-8 text-center uppercase tracking-widest filter drop-shadow-[0_2px_8px_rgba(245,183,0,0.5)]"
              >
                🌟 GOLDEN COIN APPEARS! 🌟
              </motion.h2>
              <p className="text-white/60 text-xs font-bold mt-2 uppercase tracking-wide">
                Multiplier boosts &amp; legendary badges ahead!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Arena */}
      <div className="w-full">
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
                You have completed your 10 Coin Predictions today. Come back tomorrow!
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

          {/* Left: Coin arena */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="relative w-full max-w-sm bg-white dark:bg-card border-4 border-primary-gold rounded-3xl p-6 shadow-xl flex flex-col items-center select-none overflow-hidden h-[460px]">

              <div className="absolute inset-0 bg-radial from-violet-500/5 via-transparent to-transparent pointer-events-none" />

              {/* Attempts counter */}
              <div className="absolute top-4 right-4 z-20 font-fredoka flex items-center gap-1.5 select-none">
                <span className="text-[9px] font-black uppercase tracking-wider text-deep-violet/40 dark:text-cream-soft/40">Attempts:</span>
                <span className={`font-mono text-xs font-black px-2 py-0.5 rounded-lg ${dailyAttempts >= 9 ? "bg-rose-500/20 text-rose-500" : "bg-black/20 text-primary-gold"}`}>
                  {dailyAttempts} / 10
                </span>
              </div>

              {/* Coin */}
              <div className="flex-1 flex items-center justify-center relative w-full h-[280px]" style={{ perspective: "1000px" }}>
                {/* useAnimate scope — the div that gets imperatively animated */}
                <div
                  ref={coinScope}
                  className="w-40 h-40 relative select-none"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* HEADS face */}
                  <div
                    className={`absolute inset-0 w-full h-full rounded-full border-4 shadow-2xl flex flex-col items-center justify-center transition-all duration-500 ${
                      isGoldenCoinResult
                        ? "border-yellow-400 bg-gradient-to-br from-amber-300 via-yellow-500 to-yellow-800 drop-shadow-[0_0_15px_rgba(245,183,0,0.6)]"
                        : "border-primary-gold bg-gradient-to-br from-[#FFD54F] via-[#F5B700] to-[#E65100]"
                    }`}
                    style={{ transform: "rotateY(0deg)", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
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

                  {/* TAILS face */}
                  <div
                    className={`absolute inset-0 w-full h-full rounded-full border-4 shadow-2xl flex flex-col items-center justify-center transition-all duration-500 ${
                      isGoldenCoinResult
                        ? "border-yellow-400 bg-gradient-to-br from-amber-300 via-yellow-500 to-yellow-800 drop-shadow-[0_0_15px_rgba(245,183,0,0.6)]"
                        : "border-slate-300 bg-gradient-to-br from-[#ECEFF1] via-[#90A4AE] to-[#37474F]"
                    }`}
                    style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                  >
                    <svg viewBox="0 0 100 100" className="w-24 h-24 filter drop-shadow-md">
                      <circle cx="50" cy="50" r="42" fill="none" stroke={isGoldenCoinResult ? "#FFF" : "#CFD8DC"} strokeWidth="2" strokeDasharray="3,3" />
                      <path d="M60,30 C40,30 30,42 30,58 C30,72 40,82 58,82 C44,82 36,74 36,58 C36,44 46,32 60,30 Z" fill={isGoldenCoinResult ? "#FFF" : "#ECEFF1"} />
                      <circle cx="48" cy="40" r="1.5" fill="#FFF" />
                      <circle cx="62" cy="52" r="1.5" fill="#FFF" />
                      <circle cx="56" cy="65" r="1" fill="#FFF" />
                      <text x="50" y="54" fontSize="10" fontWeight="950" textAnchor="middle" fill={isGoldenCoinResult ? "#D48000" : "#37474F"} fontFamily="sans-serif">TAILS</text>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Floor shadow */}
              <div className="absolute inset-x-0 bottom-[105px] h-3 bg-slate-300/10 border-t border-slate-300/20 dark:bg-white/5 dark:border-white/10" />

              {/* Active prediction/wager tags */}
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

              {/* Flip button */}
              <div className="absolute bottom-4 flex items-center gap-3">
                <button
                  disabled={networkLoading || flipping || !prediction || !wager || (currentProfile.coinBalance ?? 0) < (wager ?? 0)}
                  onClick={handleCoinPredictFlip}
                  className={`py-3.5 px-8 rounded-2xl font-extrabold text-base select-none cursor-pointer tracking-wider shadow-lg transition-all transform active:scale-95 border-2 border-white/15 ${
                    networkLoading || flipping
                      ? "bg-slate-300/35 dark:bg-white/10 text-slate-400 pointer-events-none"
                      : !prediction || !wager
                      ? "bg-deep-violet/10 dark:bg-white/5 border-transparent text-deep-violet/30 dark:text-cream-soft/20 pointer-events-none"
                      : (currentProfile.coinBalance ?? 0) < (wager ?? 0)
                      ? "bg-rose-500/10 dark:bg-rose-500/15 border-rose-500/20 text-rose-500 pointer-events-none"
                      : "bg-primary-gold hover:bg-[#E0A700] text-deep-violet hover:shadow-xl"
                  }`}
                >
                  {networkLoading
                    ? "PREPARING COIN..."
                    : flipping
                    ? "🪙 FLIPPING..."
                    : (currentProfile.coinBalance ?? 0) < (wager ?? 0)
                    ? "Insufficient Coins"
                    : "FLIP THE COIN! 🪙"}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Betting Controls */}
          <div className="lg:col-span-5 flex flex-col gap-6 bg-white dark:bg-card border-4 border-primary-gold rounded-3xl p-6 shadow-xl w-full text-slate-900 dark:text-white">

            {/* Prediction Chooser */}
            <div>
              <h3 className="text-lg font-black font-fredoka uppercase text-slate-900 dark:text-[#FFF8E7] mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-primary-gold" />
                1. Predict Coin Side
              </h3>
              <p className="text-[10px] font-bold text-slate-500 dark:text-cream-soft/40 uppercase tracking-wide mb-3">
                Choose heads or tails for this flip
              </p>

              <div className="grid grid-cols-2 gap-4">
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

            {/* Wager Selector */}
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

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 mt-1">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-cream-soft/50 uppercase tracking-wide">Your Coins:</span>
                  <span className="flex items-center gap-1.5 text-sm font-black font-mono text-primary-gold">
                    <CoinsIcon className="w-4 h-4" />
                    {displayedBalance.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Selection feedback */}
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
                    Pick side &amp; select wager size above!
                  </p>
                </div>
              )}
            </div>

            {/* Dev Tools */}
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
                <span className="text-[8px] font-bold text-zinc-400 tracking-wider">(Visible only in local development mode)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Result Card */}
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
              ? `The coin settled on ${resultSide.toUpperCase()}, matching your prediction!${outcomeData.goldenCoinBonus ? ` 🌟 Golden Reward: ${outcomeData.goldenCoinBonus}` : ""}${outcomeData.streakBonusMessage ? ` ${outcomeData.streakBonusMessage}` : ""}`
              : `The coin settled on ${resultSide.toUpperCase()}, not matching your prediction of ${prediction?.toUpperCase()}. Better luck next time!`
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
                  <span>Wager:</span><span>{wager} Coins</span>
                </div>
                <div className="flex justify-between items-center text-green-500">
                  <span>Reward:</span><span>+{outcomeData.payout} Coins</span>
                </div>
                <div className="flex justify-between items-center text-primary-gold border-t border-slate-700/50 pt-1.5 sm:pt-2">
                  <span>Net Profit:</span><span>+{outcomeData.profit} Coins</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1 sm:gap-2 mt-4 font-mono select-none uppercase font-black text-xs sm:text-sm tracking-wider">
                <div className="flex justify-between items-center text-slate-400">
                  <span>You lost your wager.</span>
                </div>
                <div className="flex justify-between items-center text-rose-500 border-t border-slate-700/50 pt-1.5 sm:pt-2">
                  <span>Lost:</span><span>{wager} Coins</span>
                </div>
              </div>
            )
          }
        />
      )}

      {/* Share Modal */}
      {resultSide && outcomeData && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          score={currentScore}
          game="Flip a Coin"
          prize={outcomeData.won ? `Prediction profit of +${outcomeData.profit} Coins!` : "Cosmic decision resolved!"}
        />
      )}

    </div>
  );
}
