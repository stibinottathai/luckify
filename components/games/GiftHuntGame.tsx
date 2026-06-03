"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/auth/AuthProvider";
import { useLuckStore } from "@/store/luckStore";
import confetti from "canvas-confetti";
import { Gift, Coins, Lock, Sparkles } from "lucide-react";
import Link from "next/link";

interface BoardState {
  openedIndexes: number[];
  openedRewards: number[];
  rewards: number[] | null; // Only available if game over
}

const LOADING_MESSAGES = [
  "Polishing the golden ribbons... 🎁",
  "Scattering rare treasure boxes... 💎",
  "Checking the lock integrity... 🔒",
  "Feeding the lucky garden gnomes... 🍄",
  "Whispering secrets to the fortune oracle... 🔮",
  "Stashing the 5000 jackpot in a sneaky corner... 👑",
  "Shuffling the board with extra magic... ✨"
];

function playJackpotChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    // Play a sequence of rising notes (a major arpeggio)
    const freqs = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00];
    
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = "triangle";
      osc.frequency.value = freq;
      
      const start = now + idx * 0.07;
      const duration = 0.45;
      
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.15, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration - 0.05);
      
      osc.start(start);
      osc.stop(start + duration);
    });

    // Add a sparkling high-pitched sine layer
    const sparkles = [1046.50, 1567.98, 2093.00, 3135.96];
    sparkles.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = "sine";
      osc.frequency.value = freq;
      
      const start = now + 0.35 + idx * 0.05;
      const duration = 0.3;
      
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.08, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      
      osc.start(start);
      osc.stop(start + duration);
    });
  } catch (err) {
    console.warn("Failed to play synthesized jackpot sound:", err);
  }
}

function playMediumChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = "sine";
      osc.frequency.value = freq;
      
      const start = now + idx * 0.08;
      const duration = 0.35;
      
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.1, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      
      osc.start(start);
      osc.stop(start + duration);
    });
  } catch (err) {
    console.warn("Failed to play medium chime:", err);
  }
}

export default function GiftHuntGame() {
  const { user } = useAuth();
  const activeUserKey = useLuckStore((s) => s.activeUserKey);
  const currentProfile = useLuckStore((s) => s.profiles[activeUserKey]) || useLuckStore((s) => s.profiles["guest"]);

  const [board, setBoard] = useState<BoardState | null>(null);
  const [loading, setLoading] = useState(true);
  const [openingIndex, setOpeningIndex] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [justFoundReward, setJustFoundReward] = useState<{ index: number, amount: number } | null>(null);
  const [showJackpotOverlay, setShowJackpotOverlay] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    let isMounted = true;

    async function loadBoard() {
      if (!user || user.uid === "guest") {
        setLoading(false);
        return;
      }

      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/gifts/board", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!isMounted) return;

        if (res.ok) {
          const data = await res.json();
          setBoard({
            openedIndexes: data.openedIndexes || [],
            openedRewards: data.openedRewards || [],
            rewards: data.rewards
          });
        }
      } catch (err) {
        console.error("Failed to load board", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadBoard();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleOpenGift = async (index: number) => {
    if (!user || user.uid === "guest") {
      setErrorMsg("You must be logged in to play Lucky Gift Hunt!");
      return;
    }

    if (board?.openedIndexes.includes(index) || (board?.openedIndexes.length || 0) >= 3 || openingIndex !== null) {
      return;
    }

    setOpeningIndex(index);
    setErrorMsg("");

    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/gifts/open", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ boxIndex: index })
      });

      if (!res.ok) {
        const errorData = await res.json();
        setErrorMsg(errorData.error || "Failed to open gift");
        setOpeningIndex(null);
        return;
      }

      const data = await res.json();
      
      // Trigger animations
      if (data.reward === 5000) {
        setShowJackpotOverlay(true);
        playJackpotChime();
        // Start continuous confetti loop for 4 seconds
        const duration = 4 * 1000;
        const end = Date.now() + duration;
        (function frame() {
          confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ["#F5B700", "#FFD700", "#FFFFFF"] });
          confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ["#F5B700", "#FFD700", "#FFFFFF"] });
          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        }());
      } else {
        setJustFoundReward({ index, amount: data.reward });
        if (data.reward >= 500) {
          playMediumChime();
        }
        if (data.reward >= 1000) {
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            colors: ["#F5B700", "#FFD700", "#FFFFFF"]
          });
        }
        // Clear the popup after 2.5 seconds
        setTimeout(() => setJustFoundReward(null), 2500);
      }

      // Update Zustand local store with the new balance
      if (data.updatedProfile) {
        useLuckStore.setState((state) => {
          const p = state.profiles[activeUserKey];
          const updated = {
            ...p,
            coinBalance: data.updatedProfile.coinBalance,
            giftHuntTotalOpened: data.updatedProfile.giftHuntTotalOpened,
            giftHuntHighestGift: data.updatedProfile.giftHuntHighestGift,
            giftHuntTimes1000: data.updatedProfile.giftHuntTimes1000,
            giftHuntTimes5000: data.updatedProfile.giftHuntTimes5000,
          };
          return {
            profiles: {
              ...state.profiles,
              [activeUserKey]: updated
            },
            ...updated
          };
        });
      }

      // Update board visually
      setBoard(prev => {
        if (!prev) return prev;
        return {
          openedIndexes: data.openedIndexes,
          openedRewards: data.openedRewards,
          rewards: data.rewards // Will be populated if game is over
        };
      });

    } catch (err) {
      console.error(err);
      setErrorMsg("Network error occurred.");
    } finally {
      setOpeningIndex(null);
    }
  };

  if (!user || user.uid === "guest") {
    return (
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white/5 dark:bg-black/20 rounded-3xl backdrop-blur-md border border-white/10">
        <Lock className="w-16 h-16 text-primary-gold mb-6 opacity-80" />
        <h2 className="text-3xl font-black font-fredoka text-deep-violet dark:text-cream-soft mb-4">
          Login Required
        </h2>
        <p className="text-deep-violet/70 dark:text-cream-soft/70 max-w-md mb-8">
          The Lucky Gift Hunt generates a unique cryptographic board just for you every day. Please log in to secure your daily rewards!
        </p>
        <Link
          href="/auth"
          className="py-3 px-8 rounded-full bg-primary-gold text-[#1E1145] font-black text-sm tracking-wider uppercase hover:bg-amber-300 transition-colors shadow-lg"
        >
          Sign In to Play
        </Link>
      </div>
    );
  }

  if (loading || !board) {
    return (
      <div className="w-full min-h-[450px] flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white/70 dark:bg-[#1B103E]/70 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl flex flex-col items-center justify-center text-center gap-6 relative overflow-hidden min-h-[350px]">
          {/* Animated decorative glows */}
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-transparent to-amber-500/10 pointer-events-none" />
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary-gold/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Orbiting element 1 */}
          <motion.div
            animate={{ 
              y: [0, 12, 0],
              x: [0, -8, 0],
              rotate: 360 
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            className="absolute top-12 left-16 text-3xl pointer-events-none select-none filter drop-shadow-md"
          >
            🪙
          </motion.div>

          {/* Orbiting element 2 */}
          <motion.div
            animate={{ 
              y: [0, -12, 0],
              x: [0, 8, 0],
              rotate: -360 
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-16 right-16 text-2xl pointer-events-none select-none filter drop-shadow-md"
          >
            ✨
          </motion.div>

          {/* Orbiting element 3 */}
          <motion.div
            animate={{ 
              y: [0, -10, 0],
              x: [0, -10, 0],
            }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-28 right-20 text-3xl pointer-events-none select-none filter drop-shadow-md"
          >
            💎
          </motion.div>

          {/* Main animated Gift Box */}
          <motion.div
            animate={{ 
              y: [0, -15, 0],
              rotate: [0, -10, 10, -10, 0],
              scale: [1, 1.08, 1]
            }}
            transition={{ 
              duration: 2.2, 
              repeat: Infinity,
              ease: "easeInOut" 
            }}
            className="text-7xl filter drop-shadow-[0_10px_20px_rgba(245,183,0,0.5)] z-10 select-none pointer-events-none cursor-default"
          >
            🎁
          </motion.div>

          {/* Title */}
          <div className="flex flex-col gap-2 z-10">
            <h3 className="text-2xl font-black text-deep-violet dark:text-cream-soft font-fredoka">
              Preparing Your Gifts
            </h3>
            <p className="text-xs font-bold text-deep-violet/40 dark:text-cream-soft/40 uppercase tracking-widest">
              Securing daily fortune board...
            </p>
          </div>

          {/* Shimmering Progress Bar */}
          <div className="w-48 h-2 bg-deep-violet/10 dark:bg-white/10 rounded-full overflow-hidden relative z-10">
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
              className="w-1/2 h-full bg-gradient-to-r from-transparent via-primary-gold to-transparent rounded-full"
            />
          </div>

          {/* Cycling Loading Messages */}
          <div className="h-10 flex items-center justify-center z-10 px-4">
            <AnimatePresence mode="wait">
              <motion.p
                key={loadingMsgIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="text-sm font-bold text-deep-violet/70 dark:text-cream-soft/70"
              >
                {LOADING_MESSAGES[loadingMsgIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  const opensLeft = 3 - board.openedIndexes.length;
  const isGameOver = opensLeft <= 0;

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-8 font-fredoka select-none relative">
      
      {/* Header and Stats */}
      <div className="w-full flex flex-col md:flex-row items-center justify-between bg-white/70 dark:bg-[#1B103E]/70 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-3xl p-6 shadow-xl gap-6">
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <h1 className="text-3xl font-black text-deep-violet dark:text-cream-soft flex items-center gap-3">
            Lucky Gift Hunt <Gift className="text-primary-gold" />
          </h1>
          <p className="text-sm font-bold text-deep-violet/60 dark:text-cream-soft/60 mt-2">
            Pick 3 mystery boxes. Find up to <span className="text-primary-gold">5000</span> coins!
          </p>
        </div>

        <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-deep-violet/5 dark:bg-black/20 border border-deep-violet/10 dark:border-white/5 min-w-[200px]">
          <span className="text-[10px] font-black uppercase tracking-widest text-deep-violet/50 dark:text-cream-soft/50 mb-1">
            Daily Opens Remaining
          </span>
          {isGameOver ? (
            <span className="text-xl font-black text-red-500">
              No More Gifts Available Today
            </span>
          ) : (
            <span className="text-3xl font-black text-primary-gold drop-shadow-sm">
              {opensLeft} <span className="text-lg opacity-50">/ 3</span>
            </span>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="w-full max-w-md p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm font-bold text-center">
          {errorMsg}
        </div>
      )}

      {isGameOver && (
        <div className="text-center animate-fade-in-up">
          <p className="text-xl font-black text-deep-violet dark:text-cream-soft">
            Come Back Tomorrow!
          </p>
          <p className="text-sm font-bold text-deep-violet/60 dark:text-cream-soft/60 mt-1">
            Here's what you won vs what you missed...
          </p>
        </div>
      )}

      {/* Grid of 20 Boxes */}
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 w-full max-w-4xl perspective-1000">
        {Array.from({ length: 20 }).map((_, i) => {
          const isOpened = board.openedIndexes.includes(i);
          const openOrderIndex = board.openedIndexes.indexOf(i);
          let rewardValue: number | null = null;
          
          if (isOpened) {
            rewardValue = board.openedRewards[openOrderIndex];
          } else if (isGameOver && board.rewards) {
            rewardValue = board.rewards[i];
          }

          const isRevealedMiss = !isOpened && isGameOver;
          const isCurrentlyOpening = openingIndex === i;
          
          const isLegendary = rewardValue === 5000;
          const isEpic = rewardValue === 1000;
          const isRare = rewardValue && rewardValue >= 500 && rewardValue < 1000;

          return (
            <motion.button
              key={i}
              whileHover={!isOpened && !isGameOver && !isCurrentlyOpening ? { scale: 1.05, y: -5 } : {}}
              whileTap={!isOpened && !isGameOver && !isCurrentlyOpening ? { scale: 0.95 } : {}}
              animate={isCurrentlyOpening ? { rotate: [0, -10, 10, -10, 10, 0], scale: 1.1 } : {}}
              transition={{ duration: 0.4 }}
              onClick={() => handleOpenGift(i)}
              disabled={isOpened || isGameOver || isCurrentlyOpening}
              className={`
                relative aspect-square rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center shadow-lg transition-all duration-500 transform-gpu
                ${isOpened ? "bg-white/90 dark:bg-white/10 backdrop-blur-md border border-primary-gold shadow-[0_0_15px_rgba(245,183,0,0.3)]" : "bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-800 border-2 border-white/20 hover:border-primary-gold/50 cursor-pointer"}
                ${isRevealedMiss ? "opacity-60 grayscale-[50%] bg-white/50 dark:bg-white/5 border-transparent shadow-none" : ""}
                ${isLegendary && isOpened ? "ring-4 ring-yellow-400 shadow-[0_0_40px_rgba(250,204,21,0.8)]" : ""}
              `}
            >
              {isCurrentlyOpening ? (
                <div className="flex flex-col items-center">
                  <span className="text-3xl sm:text-4xl filter drop-shadow-md">🎁</span>
                  <span className="absolute -bottom-6 text-[10px] font-black text-primary-gold uppercase tracking-widest whitespace-nowrap">Opening...</span>
                </div>
              ) : rewardValue !== null ? (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                  className="flex flex-col items-center justify-center gap-1 sm:gap-2"
                >
                  {isLegendary && <Sparkles className="absolute -top-3 -right-3 text-yellow-400 w-8 h-8 animate-pulse" />}
                  <span className={`text-xl sm:text-2xl md:text-3xl filter drop-shadow-sm ${isLegendary ? 'text-yellow-500' : isEpic ? 'text-purple-500' : isRare ? 'text-blue-500' : 'text-gray-400'}`}>
                    {isLegendary ? "👑" : isEpic ? "💎" : isRare ? "💰" : "🪙"}
                  </span>
                  <span className={`text-sm sm:text-lg md:text-xl font-black ${
                    isOpened ? "text-deep-violet dark:text-cream-soft" : "text-deep-violet/70 dark:text-cream-soft/70"
                  }`}>
                    {rewardValue}
                  </span>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center">
                  <span className="text-3xl sm:text-4xl filter drop-shadow-md transition-transform group-hover:scale-110">🎁</span>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Floating Celebration Popup */}
      <AnimatePresence>
        {justFoundReward && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
          >
            <div className="bg-gradient-to-r from-amber-500 to-yellow-400 dark:from-amber-600 dark:to-yellow-500 p-8 rounded-[3rem] shadow-2xl flex flex-col items-center gap-4 border-4 border-white/20">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-950/70 bg-white/20 px-4 py-1.5 rounded-full">
                🎉 You Found 🎉
              </span>
              <div className="flex items-center gap-4">
                <Coins className="w-12 h-12 text-amber-950" />
                <span className="text-6xl font-black text-amber-950 drop-shadow-md">
                  {justFoundReward.amount}
                </span>
              </div>
              <span className="text-lg font-bold text-amber-950/80">Coins Added to Balance!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Jackpot Celebration Overlay */}
      <AnimatePresence>
        {showJackpotOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-2xl p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: -50, opacity: 0 }}
              transition={{ type: "spring", duration: 0.6, bounce: 0.3 }}
              className="relative max-w-lg w-full bg-gradient-to-b from-[#2E1A68] to-[#120734] border-4 border-primary-gold rounded-[3.5rem] p-8 md:p-12 shadow-[0_0_80px_rgba(245,183,0,0.4)] text-center flex flex-col items-center justify-center overflow-hidden"
            >
              {/* Background glows */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-primary-gold/20 via-transparent to-transparent pointer-events-none -z-10 animate-pulse" />
              
              <motion.div
                initial={{ scale: 0.5, rotate: -5 }}
                animate={{ scale: [1, 1.05, 1], rotate: [-5, 5, -5] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-primary-gold to-amber-500 uppercase tracking-widest filter drop-shadow-[0_2px_15px_rgba(245,183,0,0.6)] font-fredoka"
              >
                🏆 JACKPOT! 🏆
              </motion.div>

              {/* Glowing, spinning crown illustration */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 120, damping: 12, delay: 0.2 }}
                className="relative my-8 select-none pointer-events-none"
              >
                <div className="absolute inset-0 w-36 h-36 bg-primary-gold/30 rounded-full blur-3xl animate-pulse" />
                <motion.div
                  animate={{ y: [0, -12, 0], rotate: [0, 6, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }}
                  className="text-8xl relative z-10 filter drop-shadow-[0_10px_25px_rgba(245,183,0,0.6)]"
                >
                  👑
                </motion.div>
                <motion.div
                  animate={{ opacity: [1, 0, 1], scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1.8 }}
                  className="absolute -top-4 -right-4 text-4xl"
                >
                  ✨
                </motion.div>
                <motion.div
                  animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
                  transition={{ repeat: Infinity, duration: 2.2, delay: 0.6 }}
                  className="absolute -bottom-4 -left-4 text-3xl"
                >
                  ⭐
                </motion.div>
              </motion.div>

              {/* Reward detail */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col items-center gap-1"
              >
                <span className="text-[11px] font-black tracking-widest text-primary-gold/80 uppercase">
                  You Have Grabbed The Jackpot
                </span>
                <span className="text-7xl font-black text-white filter drop-shadow-[0_4px_20px_rgba(245,183,0,0.5)] mt-2">
                  5,000
                </span>
                <span className="text-sm font-bold text-cream-soft/60 tracking-widest uppercase mt-1">
                  Vibe Coins
                </span>
              </motion.div>

              <p className="text-sm md:text-base font-bold text-cream-soft/85 max-w-sm mt-6 leading-relaxed font-fredoka">
                Incredible! You hit the highest reward on the board. The lucky garden spirits are celebrating your ultimate luck! 🎉
              </p>

              {/* Dismiss / Claim Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowJackpotOverlay(false)}
                className="mt-8 py-4 px-10 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-deep-violet font-black text-base tracking-wider uppercase shadow-[0_0_40px_rgba(245,183,0,0.5)] hover:shadow-[0_0_50px_rgba(245,183,0,0.7)] transition-all duration-300 pointer-events-auto"
              >
                Claim Jackpot 🪙
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
