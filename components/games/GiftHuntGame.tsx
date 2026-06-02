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

export default function GiftHuntGame() {
  const { user } = useAuth();
  const activeUserKey = useLuckStore((s) => s.activeUserKey);
  const currentProfile = useLuckStore((s) => s.profiles[activeUserKey]) || useLuckStore((s) => s.profiles["guest"]);

  const [board, setBoard] = useState<BoardState | null>(null);
  const [loading, setLoading] = useState(true);
  const [openingIndex, setOpeningIndex] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [justFoundReward, setJustFoundReward] = useState<{ index: number, amount: number } | null>(null);

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
      setJustFoundReward({ index, amount: data.reward });
      
      if (data.reward >= 1000) {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#F5B700", "#FFD700", "#FFFFFF"]
        });
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

      // Clear the popup after 2.5 seconds
      setTimeout(() => setJustFoundReward(null), 2500);

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
      <div className="w-full min-h-[400px] flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary-gold border-t-transparent rounded-full" />
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

    </div>
  );
}
