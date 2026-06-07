"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useLuckStore } from "@/store/luckStore";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  Sparkles, 
  Coins, 
  PlusCircle, 
  Clock, 
  Heart, 
  Lock, 
  AlertCircle, 
  ChevronRight, 
  X,
  MessageCircle,
  TrendingUp,
  RotateCw,
  Trash2,
  ArrowLeft
} from "lucide-react";
import { playWinChime, playTick, playCoinDeducted } from "@/lib/audio";
import { db, auth, googleProvider } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { signInWithPopup } from "firebase/auth";
import { createWish, toggleVibeWish, deleteWish, Wish } from "@/lib/wishes";

// Star coordinate points relative to the sky container (percentage)
const getStarCoordinate = (index: number) => {
  // Deterministic pseudo-random generator for sky coordinates
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };
  const x = Math.round(seededRandom(index * 12.34) * 90 + 5); // 5% to 95% width
  const y = Math.round(seededRandom(index * 56.78) * 80 + 10); // 10% to 90% height
  return { x, y };
};

export default function WishingTreeClient() {
  const { user, loading: authLoading } = useAuth();

  const handleSignIn = async () => {
    if (!auth) return;
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Firebase Google Sign-in failed:", error);
    }
  };

  const activeUserKey = useLuckStore((s) => s.activeUserKey);
  const currentProfile = useLuckStore((s) => s.profiles[activeUserKey]) || useLuckStore((s) => s.profiles["guest"]);
  const spendCoins = useLuckStore((s) => s.spendCoins);
  const addResult = useLuckStore((s) => s.addResult);
  const registerWishToday = useLuckStore((s) => s.registerWishToday);

  const todayStr = new Date().toISOString().slice(0, 10);
  const dailyWishesUsed = currentProfile?.wishDailyCountUsed ?? 0;
  const isLimitReached = dailyWishesUsed >= 5;

  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"recent" | "trending">("recent");
  const [visibleCount, setVisibleCount] = useState(9);

  // Selection & Write states
  const [activeWish, setActiveWish] = useState<Wish | null>(null);
  const [writeOpen, setWriteOpen] = useState(false);
  const [wishText, setWishText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const coinBalance = currentProfile?.coinBalance ?? 0;

  // Real-time Firestore synchronizer for wishes
  useEffect(() => {
    if (!db) {
      // Offline fallback: load mock wishes
      const baseTime = Date.now();
      const mockList: Wish[] = [
        {
          id: "mock-1",
          userId: "mock-user-1",
          displayName: "Luna Spark",
          photoURL: null,
          wishText: "I wish for infinite joy and harmony for all living beings in the universe. ✨",
          vibesCount: 14,
          vibesUsers: [],
          isAnonymous: false,
          timestamp: new Date(baseTime - 1000 * 60 * 30).toISOString()
        },
        {
          id: "mock-2",
          userId: "mock-user-2",
          displayName: "Anonymous",
          photoURL: null,
          wishText: "Hoping to pass my exams and get that internship I worked so hard for! 🍀",
          vibesCount: 8,
          vibesUsers: [],
          isAnonymous: true,
          timestamp: new Date(baseTime - 1000 * 60 * 120).toISOString()
        },
        {
          id: "mock-3",
          userId: "mock-user-3",
          displayName: "VibeMaster",
          photoURL: null,
          wishText: "May your dice roll gold and your wheels spin jackpot today! Sending blessings to all! 👑",
          vibesCount: 22,
          vibesUsers: [],
          isAnonymous: false,
          timestamp: new Date(baseTime - 1000 * 60 * 300).toISOString()
        },
        {
          id: "mock-4",
          userId: "mock-user-4",
          displayName: "Anonymous",
          photoURL: null,
          wishText: "I wish to find peace of mind and learn to live in the present moment. 🌸",
          vibesCount: 5,
          vibesUsers: [],
          isAnonymous: true,
          timestamp: new Date(baseTime - 1000 * 60 * 600).toISOString()
        }
      ];
      // Filter out wishes older than 24 hours
      const now = new Date();
      const activeMockList = mockList.filter((wish) => {
        const wishTime = new Date(wish.timestamp).getTime();
        return now.getTime() - wishTime < 24 * 60 * 60 * 1000;
      });
      // Sort offline list based on sorting mode
      const sorted = [...activeMockList].sort((a, b) => {
        if (sortBy === "trending") return b.vibesCount - a.vibesCount;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
      setWishes(sorted);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, "wishes"),
      orderBy(sortBy === "trending" ? "vibesCount" : "timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const now = new Date();
      const list = snap.docs.map((d) => {
        const data = d.data();
        let isoDate = new Date().toISOString();
        if (data.timestamp) {
          if (typeof data.timestamp.toDate === "function") {
            isoDate = data.timestamp.toDate().toISOString();
          } else if (data.timestamp.seconds) {
            isoDate = new Date(data.timestamp.seconds * 1000).toISOString();
          } else {
            isoDate = new Date(data.timestamp).toISOString();
          }
        }
        return {
          id: d.id,
          userId: data.userId || "",
          displayName: data.displayName || "Anonymous",
          photoURL: data.photoURL ?? null,
          wishText: data.wishText || "",
          vibesCount: data.vibesCount ?? 0,
          vibesUsers: data.vibesUsers || [],
          isAnonymous: !!data.isAnonymous,
          timestamp: isoDate
        };
      });

      // Filter out wishes older than 24 hours in the client UI
      const activeWishes = list.filter((wish) => {
        const wishTime = new Date(wish.timestamp).getTime();
        return now.getTime() - wishTime < 24 * 60 * 60 * 1000;
      });

      setWishes(activeWishes);
      setLoading(false);

      // Clean up expired wishes from Firestore database in the background
      const expiredWishes = list.filter((wish) => {
        const wishTime = new Date(wish.timestamp).getTime();
        return now.getTime() - wishTime >= 24 * 60 * 60 * 1000;
      });

      if (expiredWishes.length > 0 && user && user.uid !== "guest") {
        expiredWishes.forEach((wish) => {
          deleteWish(wish.id).catch((err) => {
            console.warn(`[Firestore] Clean up of expired wish ${wish.id} failed:`, err);
          });
        });
      }
    }, (err) => {
      console.error("[Firestore] Realtime wishes subscription error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [sortBy]);

  // Handle submitting a new wish
  const handleSubmitWish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.uid === "guest") {
      setErrorMsg("Please sign in above to cast a star!");
      return;
    }

    if (wishText.trim().length === 0) {
      setErrorMsg("Wish text cannot be blank.");
      return;
    }

    if (wishText.length > 120) {
      setErrorMsg("Wish must be 120 characters or less.");
      return;
    }

    if (isLimitReached) {
      setErrorMsg("You have reached your limit of 5 daily wishes! Come back tomorrow.");
      return;
    }

    if (coinBalance < 500) {
      setErrorMsg("Not enough coins! Casting a star costs 500 Vibe Coins.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    // Deduct coins locally
    const spendSuccess = spendCoins(500);
    if (!spendSuccess) {
      setErrorMsg("Deduction failed. Please verify coin balance.");
      setSubmitting(false);
      return;
    }
    playCoinDeducted();

    // Write to Firestore DB
    const wishId = await createWish(
      user.uid,
      user.displayName || "Lucky Player",
      user.photoURL,
      wishText.trim(),
      isAnonymous
    );

    if (wishId) {
      // Success! Play sound & add history
      playWinChime();
      addResult("Wishing Sky", "Cast a star into the sky 🌟", true, 0);
      registerWishToday();
      setWishText("");
      setWriteOpen(false);
      setIsAnonymous(false);
    } else {
      setErrorMsg("Failed to cast star. Please check network connection.");
    }
    setSubmitting(false);
  };

  // Upvote / Toggle Vibes on a wish (Optimistic Update)
  const handleVibeToggle = async (wish: Wish) => {
    if (!user || user.uid === "guest") {
      alert("Please sign in to send positive vibes!");
      return;
    }

    const voterUid = user.uid;
    const isLiking = !wish.vibesUsers.includes(voterUid);

    // Play feedback sound instantly
    playTick();
    if (isLiking) {
      playWinChime();
    }

    // Capture current states for rollback on server failure
    const originalWishes = [...wishes];
    const originalActiveWish = activeWish ? { ...activeWish } : null;

    // Calculate optimistic state values
    const nextVibesUsers = isLiking
      ? [...wish.vibesUsers, voterUid]
      : wish.vibesUsers.filter((uid) => uid !== voterUid);
    const nextVibesCount = wish.vibesCount + (isLiking ? 1 : -1);

    // 1. Update wishes list state instantly
    setWishes((prev) =>
      prev.map((w) =>
        w.id === wish.id
          ? { ...w, vibesCount: nextVibesCount, vibesUsers: nextVibesUsers }
          : w
      )
    );

    // 2. Update active selected wish state instantly
    if (activeWish?.id === wish.id) {
      setActiveWish((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          vibesCount: nextVibesCount,
          vibesUsers: nextVibesUsers,
        };
      });
    }

    // 3. Dispatch the network write asynchronously in the background
    try {
      const result = await toggleVibeWish(wish.id, voterUid);
      if (!result.success) {
        // Rollback on failure
        setWishes(originalWishes);
        if (originalActiveWish) setActiveWish(originalActiveWish);
        console.error("Vibe update transaction failed on server.");
      }
    } catch (err) {
      // Rollback on network exception
      setWishes(originalWishes);
      if (originalActiveWish) setActiveWish(originalActiveWish);
      console.error("Failed to sync vibe update:", err);
    }
  };

  // Get the latest 30 wishes for the visual sky visualization, regardless of sorting
  const hangingWishes = [...wishes]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 30);

  return (
    <div className="w-full max-w-4xl mx-auto font-fredoka py-2 select-none relative">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-5px) scale(1.05); }
        }
        .float-orb {
          animation: float 4s ease-in-out infinite;
        }
        .parchment-glow {
          box-shadow: 0 4px 20px rgba(245, 183, 0, 0.12), 0 0 10px rgba(255, 255, 255, 0.05);
        }
      ` }} />

      {/* Back to Lobby link */}
      <div className="w-full mb-6 flex flex-col items-start select-none px-1">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-deep-violet/40 hover:text-deep-violet dark:text-soft-cream/40 dark:hover:text-soft-cream transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Lobby
        </Link>
      </div>

      {/* Header Area */}
      <div className="bg-white/70 dark:bg-[#1B103E]/70 backdrop-blur-xl border border-deep-violet/10 dark:border-white/10 rounded-[2rem] p-5 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/15 border border-emerald-500 text-emerald-500 rounded-xl flex items-center justify-center text-xl animate-pulse">
            🌟
          </div>
          <div>
            <h3 className="text-base font-black text-deep-violet dark:text-soft-cream leading-none">
              Celestial Wishing Sky
            </h3>
            <p className="text-[10px] font-bold text-deep-violet/60 dark:text-soft-cream/60 mt-1">
              Spend 500 coins to cast a star. Upvote others to grant them +3 luckyScore!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {user && user.uid !== "guest" ? (
            isLimitReached ? (
              <div className="py-2.5 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center gap-2 text-xs font-bold select-none">
                <span>🌟 5 Daily Stars Cast ✓</span>
              </div>
            ) : (
              <button
                onClick={() => { playTick(); setWriteOpen(true); }}
                className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs tracking-wider uppercase shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Cast a Star ({5 - dailyWishesUsed} left)</span>
              </button>
            )
          ) : (
            <button
              onClick={handleSignIn}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white border border-emerald-500/30 flex items-center gap-2 text-[10px] font-bold transition-all duration-300 cursor-pointer shadow-md hover:scale-[1.02] active:scale-95"
            >
              <Lock className="w-3.5 h-3.5 text-primary-gold animate-pulse" />
              <span>Sign In to Cast Stars</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Sky Section */}
      <div className="w-full aspect-square sm:aspect-[4/3] md:aspect-[16/10] bg-gradient-to-b from-[#0B021C] via-[#1A0B3B] to-[#090314] dark:from-[#06010F] dark:via-[#0F0524] dark:to-[#030108] border-4 border-indigo-500/30 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden flex items-end justify-center mb-8">
        
        {/* Milky Way Band & Space Dust */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent opacity-60 transform -rotate-12 scale-150 blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent opacity-50 transform rotate-45 scale-150 blur-2xl pointer-events-none" />
        
        {/* Twinkling background stars */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjE1KSIvPjxjaXJjbGUgY3g9IjEwIiBjeT0iMTAiIHI9IjAuNSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjIpIi8+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMS41IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3N2Zz4=')] opacity-50 pointer-events-none mix-blend-screen" />
        
        <div className="absolute top-8 left-10 w-1.5 h-1.5 rounded-full bg-white opacity-70 animate-ping duration-1000" />
        <div className="absolute top-20 right-20 w-1 h-1 rounded-full bg-blue-300 opacity-80 animate-pulse duration-700" />
        <div className="absolute top-1/3 left-1/4 w-1.5 h-1.5 rounded-full bg-indigo-300 opacity-60 animate-ping duration-1500" />
        <div className="absolute top-1/2 right-1/3 w-2 h-2 rounded-full bg-purple-200/40 opacity-50 animate-pulse" />

        {/* Tap Instruction */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full shadow-lg z-30 pointer-events-none flex items-center gap-2 animate-pulse">
          <Sparkles className="w-4 h-4 text-primary-gold" />
          <span className="text-xs font-black text-white tracking-widest uppercase shadow-black drop-shadow-md">Tap the stars to read wishes!</span>
        </div>

        {/* Dynamic Star Constellations */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
          <line x1="20%" y1="15%" x2="28%" y2="25%" stroke="#fff" strokeWidth="1" strokeDasharray="3,3" />
          <line x1="28%" y1="25%" x2="35%" y2="20%" stroke="#fff" strokeWidth="1" strokeDasharray="3,3" />
          <line x1="65%" y1="10%" x2="72%" y2="18%" stroke="#fff" strokeWidth="1" strokeDasharray="3,3" />
          <line x1="72%" y1="18%" x2="80%" y2="15%" stroke="#fff" strokeWidth="1" strokeDasharray="3,3" />
          <line x1="10%" y1="60%" x2="15%" y2="70%" stroke="#fff" strokeWidth="1" strokeDasharray="3,3" />
          <line x1="15%" y1="70%" x2="25%" y2="65%" stroke="#fff" strokeWidth="1" strokeDasharray="3,3" />
          <line x1="80%" y1="80%" x2="85%" y2="65%" stroke="#fff" strokeWidth="1" strokeDasharray="3,3" />
        </svg>

        {/* Real-time Hanging Wishes Tags */}
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-transparent z-20">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : hangingWishes.length === 0 ? (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-xs font-semibold text-soft-cream/40 z-20 space-y-1">
            <p className="text-xl">🌟</p>
            <p>No stars in the sky yet.</p>
            <p>Be the first to cast a wish!</p>
          </div>
        ) : (
          hangingWishes.map((wish, index) => {
            const coord = getStarCoordinate(index);
            const hasVibed = user ? wish.vibesUsers.includes(user.uid) : false;
            const isMyStar = user ? wish.userId === user.uid : false;

            const starColors = [
              "text-cyan-200 drop-shadow-[0_0_10px_rgba(165,243,252,0.6)]",
              "text-fuchsia-300 drop-shadow-[0_0_10px_rgba(240,171,252,0.6)]",
              "text-emerald-300 drop-shadow-[0_0_10px_rgba(110,231,183,0.6)]",
              "text-purple-300 drop-shadow-[0_0_10px_rgba(216,180,254,0.6)]"
            ];
            const auraColors = [
              "bg-cyan-400",
              "bg-fuchsia-400",
              "bg-emerald-400",
              "bg-purple-400"
            ];

            let colorClass = "";
            let auraClass = "";

            if (isMyStar) {
              colorClass = "text-white drop-shadow-[0_0_20px_rgba(255,255,255,1)]";
              auraClass = "bg-white";
            } else if (hasVibed) {
              colorClass = "text-amber-300 drop-shadow-[0_0_15px_rgba(252,211,77,0.8)]";
              auraClass = "bg-amber-400";
            } else {
              colorClass = starColors[index % starColors.length];
              auraClass = auraColors[index % auraColors.length];
            }

            return (
              <motion.button
                key={wish.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", delay: Math.min(1.2, index * 0.02) }}
                onClick={() => { playTick(); setActiveWish(wish); }}
                style={{
                  left: `${coord.x}%`,
                  top: `${coord.y}%`,
                  animationDelay: `${index * 0.1}s`,
                }}
                className="absolute float-orb z-20 group -translate-x-1/2 -translate-y-1/2 cursor-pointer flex flex-col items-center justify-center select-none pointer-events-auto"
              >
                <div className="relative flex items-center justify-center">
                  {/* Glowing aura */}
                  <div className={`absolute inset-0 rounded-full blur-md opacity-60 group-hover:opacity-100 transition-opacity duration-300 ${auraClass}`} />
                  
                  {isMyStar && (
                    <div className="absolute inset-[-8px] rounded-full border border-white/50 border-dashed animate-[spin_4s_linear_infinite]" />
                  )}
                  {isMyStar && (
                    <div className="absolute -top-6 whitespace-nowrap text-[8px] font-black uppercase text-white bg-white/20 px-1.5 py-0.5 rounded backdrop-blur-sm pointer-events-none">
                      Your Star
                    </div>
                  )}

                  {/* The Star Shape */}
                  <div className={`relative flex items-center justify-center transition-all duration-300 transform group-hover:scale-125 group-hover:z-30 ${colorClass}`}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-7 sm:h-7 animate-pulse" style={{ animationDuration: `${2 + Math.random() * 2}s` }}>
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                  
                  {/* Tooltip on hover (desktop only) */}
                  <div className="absolute top-full mt-2 hidden sm:group-hover:flex px-2.5 py-1.5 rounded-lg bg-[#2D1F5B]/90 backdrop-blur-md border border-amber-500/40 shadow-xl text-[10px] font-black text-white whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-col items-center gap-1">
                    <span className="flex items-center gap-1.5">
                      <span className="max-w-[80px] truncate">
                        {wish.isAnonymous ? "Anonymous" : wish.displayName.split(" ")[0]}
                      </span>
                      <span className="text-amber-400 flex items-center gap-0.5">
                        <Heart className="w-2.5 h-2.5 fill-amber-400" />
                        {wish.vibesCount}
                      </span>
                    </span>
                  </div>
                </div>
              </motion.button>
            );
          })
        )}

      </div>

      {/* Wishes Browser Feed */}
      <div className="w-full z-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 border-b border-deep-violet/10 dark:border-white/10 pb-4">
          <h2 className="text-lg font-black text-deep-violet dark:text-soft-cream uppercase tracking-wider flex items-center gap-2">
            <span>Cosmic Star Feed</span>
            <span className="text-xs bg-deep-violet/5 dark:bg-white/5 border border-deep-violet/10 dark:border-white/10 text-deep-violet/60 dark:text-soft-cream/60 px-2 py-0.5 rounded-full font-bold normal-case">
              {wishes.length} stars
            </span>
          </h2>

          <div className="flex items-center rounded-xl bg-deep-violet/5 dark:bg-white/5 border border-deep-violet/10 dark:border-white/10 p-1 select-none">
            <button
              onClick={() => { playTick(); setSortBy("recent"); setVisibleCount(9); }}
              className={`py-1.5 px-3 rounded-lg font-black text-xs uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                sortBy === "recent"
                  ? "bg-white dark:bg-[#1B103E] text-deep-violet dark:text-soft-cream shadow-sm"
                  : "text-deep-violet/40 dark:text-soft-cream/40 hover:text-deep-violet dark:hover:text-soft-cream"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Recent</span>
            </button>
            <button
              onClick={() => { playTick(); setSortBy("trending"); setVisibleCount(9); }}
              className={`py-1.5 px-3 rounded-lg font-black text-xs uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                sortBy === "trending"
                  ? "bg-white dark:bg-[#1B103E] text-deep-violet dark:text-soft-cream shadow-sm"
                  : "text-deep-violet/40 dark:text-soft-cream/40 hover:text-deep-violet dark:hover:text-soft-cream"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Trending</span>
            </button>
          </div>
        </div>

        {/* Wishes List/Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 bg-white/40 dark:bg-[#1B103E]/40 border border-deep-violet/10 dark:border-white/5 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : wishes.length === 0 ? (
          <div className="bg-white/40 dark:bg-[#1B103E]/40 border border-dashed border-deep-violet/10 dark:border-white/10 rounded-3xl p-12 text-center text-xs font-semibold text-deep-violet/40 dark:text-soft-cream/40 space-y-1">
            <p className="text-3xl">📭</p>
            <p>The sky is empty.</p>
            <p>Cast your star above to start the collection!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {wishes.slice(0, visibleCount).map((wish) => {
                const hasVibed = user ? wish.vibesUsers.includes(user.uid) : false;
                return (
                  <motion.div
                    layoutId={`wish-card-${wish.id}`}
                    key={wish.id}
                    className="bg-white/60 dark:bg-[#1B103E]/60 backdrop-blur-md border border-deep-violet/10 dark:border-white/10 hover:border-amber-500/40 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 cursor-pointer"
                    onClick={() => { playTick(); setActiveWish(wish); }}
                  >
                    <p className="text-xs font-medium text-deep-violet/85 dark:text-soft-cream/90 leading-relaxed italic line-clamp-3">
                      "{wish.wishText}"
                    </p>

                    <div className="flex items-center justify-between gap-2 border-t border-deep-violet/5 dark:border-white/5 pt-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 text-white font-black text-[10px] flex items-center justify-center select-none shadow-sm overflow-hidden">
                          {wish.isAnonymous || !wish.photoURL ? (
                            "🌟"
                          ) : (
                            <img src={wish.photoURL} alt={wish.displayName} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <span className="text-[10px] font-black text-deep-violet/60 dark:text-soft-cream/60">
                          {wish.isAnonymous ? "Anonymous" : wish.displayName.split(" ")[0]}
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // prevent opening details card
                          handleVibeToggle(wish);
                        }}
                        className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-wider py-1 px-2.5 rounded-full border transition-all cursor-pointer ${
                          hasVibed
                            ? "bg-gradient-to-br from-amber-400 to-amber-500 text-deep-violet border-yellow-300 shadow-[0_0_8px_rgba(245,183,0,0.3)]"
                            : "bg-deep-violet/5 dark:bg-white/5 border-deep-violet/10 dark:border-white/10 hover:border-amber-500/35 text-deep-violet/60 dark:text-soft-cream/60"
                        }`}
                      >
                        <Heart className={`w-3 h-3 ${hasVibed ? "fill-deep-violet text-deep-violet" : "text-amber-500"}`} />
                        <span>{wish.vibesCount}</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {wishes.length > visibleCount && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => { playTick(); setVisibleCount((prev) => prev + 9); }}
                  className="py-3 px-8 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs tracking-widest uppercase shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <span>Load More Stars</span>
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal: Hang a New Wish Popup Scroll Form */}
      <AnimatePresence>
        {writeOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: -30, opacity: 0 }}
              className="relative max-w-md w-full bg-gradient-to-b from-[#2E1A68] to-[#120734] border-4 border-emerald-500 rounded-[2.5rem] p-6 shadow-2xl overflow-hidden text-white"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-5">
                <h3 className="text-lg font-black text-emerald-400 uppercase tracking-wider leading-none flex items-center gap-2">
                  <span>Cast a Star</span>
                  <span className="text-[10px] py-0.5 px-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-black">
                    🌟 Cosmic
                  </span>
                </h3>
                <button
                  onClick={() => { playTick(); setWriteOpen(false); setErrorMsg(""); }}
                  className="w-7 h-7 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmitWish} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-soft-cream/60">
                    Your Deepest Wish ({120 - wishText.length} characters left)
                  </label>
                  <textarea
                    rows={4}
                    maxLength={120}
                    value={wishText}
                    onChange={(e) => setWishText(e.target.value)}
                    placeholder="E.g. I wish for happiness, good fortune, and success in all my upcoming journeys..."
                    className="w-full rounded-2xl bg-white/5 border border-white/10 focus:border-emerald-500 p-4 text-xs font-bold text-white placeholder-white/30 focus:outline-none resize-none"
                  />
                </div>

                {/* Anonymous Checkbox */}
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/5 border border-white/5 select-none">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="anonymous" className="text-xs font-bold text-soft-cream/80 cursor-pointer">
                    Cast anonymously (hides your photo & name)
                  </label>
                </div>

                {/* Spend Notice */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                    <Coins className="w-4 h-4" />
                    <span>Writing Cost:</span>
                  </div>
                  <span className="font-black text-emerald-400">500 Vibe Coins</span>
                </div>

                {/* Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs tracking-widest uppercase shadow-md hover:shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4.5 h-4.5" />
                  <span>{submitting ? "CASTING STAR..." : "CAST INTO COSMOS"}</span>
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: View Wish Detail Card */}
      <AnimatePresence>
        {activeWish && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div
              layoutId={`wish-card-${activeWish.id}`}
              className="relative max-w-sm w-full bg-gradient-to-b from-[#2E1A68] to-[#120734] border-4 border-amber-500/40 rounded-[2.5rem] p-8 shadow-2xl text-center flex flex-col items-center justify-center overflow-hidden font-fredoka text-white"
            >
              {/* Background glows */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[radial-gradient(circle,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none -z-10 animate-pulse" />
              
              <button
                onClick={() => { playTick(); setActiveWish(null); }}
                className="absolute top-4 right-4 w-7 h-7 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <span className="text-[10px] font-black uppercase tracking-widest text-primary-gold px-4 py-1.5 bg-white/5 rounded-full border border-white/5">
                🌟 Cosmic Wish
              </span>

              {/* Avatar of Creator */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 text-white font-black text-2xl flex items-center justify-center shadow-lg overflow-hidden my-5 border-2 border-amber-500/30">
                {activeWish.isAnonymous || !activeWish.photoURL ? (
                  "🌟"
                ) : (
                  <img src={activeWish.photoURL} alt={activeWish.displayName} className="w-full h-full object-cover" />
                )}
              </div>

              {/* Name */}
              <h4 className="text-base font-black text-white leading-none">
                {activeWish.displayName}
              </h4>
              <span className="text-[9px] font-bold text-soft-cream/40 uppercase tracking-widest mt-1 block">
                Cast {new Date(activeWish.timestamp).toLocaleDateString()} at {new Date(activeWish.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>

              {/* Text */}
              <p className="text-sm font-bold text-soft-cream/95 mt-5 leading-relaxed px-2 border-y border-white/5 py-4 italic">
                "{activeWish.wishText}"
              </p>

              {/* Vibes count info */}
              <div className="flex items-center gap-1.5 mt-5 text-xs text-soft-cream/70">
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>Currently has <b>{activeWish.vibesCount}</b> positive vibes</span>
              </div>

              {/* Action Upvote Button */}
              {user && user.uid !== "guest" ? (
                <button
                  onClick={() => handleVibeToggle(activeWish)}
                  className={`mt-6 w-full py-3 px-6 rounded-full font-black text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer border ${
                    activeWish.vibesUsers.includes(user.uid)
                      ? "bg-gradient-to-r from-amber-400 to-amber-500 text-deep-violet border-yellow-300 shadow-[0_0_15px_rgba(245,183,0,0.4)]"
                      : "bg-white/5 border-white/10 hover:border-amber-500/50 hover:bg-white/10 text-white"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${activeWish.vibesUsers.includes(user.uid) ? "fill-deep-violet text-deep-violet" : "text-amber-500"}`} />
                  <span>{activeWish.vibesUsers.includes(user.uid) ? "VIBES SENT ✓" : "SEND POSITIVE VIBES"}</span>
                </button>
              ) : (
                <button
                  onClick={handleSignIn}
                  className="mt-6 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#2D1B69] to-[#1E1145] hover:from-primary-gold hover:to-[#dfa72b] hover:text-deep-violet text-white border border-primary-gold/30 w-full flex items-center justify-center gap-2 text-[10px] font-bold transition-all duration-300 cursor-pointer shadow-md hover:scale-[1.02] active:scale-95"
                >
                  <Lock className="w-3.5 h-3.5 text-primary-gold animate-pulse" />
                  <span>Sign In to Send Positive Vibes</span>
                </button>
              )}

              {/* Option to Delete Wish if user is the creator */}
              {user && user.uid !== "guest" && activeWish.userId === user.uid && (
                <button
                  onClick={async () => {
                    if (confirm("Are you sure you want to delete your wish from the sky?")) {
                      playTick();
                      const success = await deleteWish(activeWish.id);
                      if (success) {
                        setActiveWish(null);
                        setWishes((prev) => prev.filter((w) => w.id !== activeWish.id));
                      } else {
                        alert("Failed to delete wish. Please check permissions or connection.");
                      }
                    }
                  }}
                  className="mt-3 w-full py-2.5 px-6 rounded-full font-black text-xs tracking-wider uppercase bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/35 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete My Star</span>
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
