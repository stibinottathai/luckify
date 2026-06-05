"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useLuckStore } from "@/store/luckStore";
import { motion, AnimatePresence } from "framer-motion";
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
  Trash2
} from "lucide-react";
import { playWinChime, playTick } from "@/lib/audio";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { createWish, toggleVibeWish, deleteWish, Wish } from "@/lib/wishes";

// Twinkle branch coordinate points relative to the tree container (percentage)
const BRANCH_COORDINATES = [
  { x: 30, y: 38 },
  { x: 38, y: 22 },
  { x: 48, y: 14 },
  { x: 58, y: 20 },
  { x: 68, y: 32 },
  { x: 74, y: 46 },
  { x: 62, y: 38 },
  { x: 48, y: 34 },
  { x: 34, y: 46 },
  { x: 50, y: 24 },
  { x: 22, y: 50 },
  { x: 78, y: 56 },
];

export default function WishingTreeClient() {
  const { user, loading: authLoading } = useAuth();
  const activeUserKey = useLuckStore((s) => s.activeUserKey);
  const currentProfile = useLuckStore((s) => s.profiles[activeUserKey]) || useLuckStore((s) => s.profiles["guest"]);
  const spendCoins = useLuckStore((s) => s.spendCoins);
  const addResult = useLuckStore((s) => s.addResult);
  const registerWishToday = useLuckStore((s) => s.registerWishToday);

  const todayStr = new Date().toISOString().slice(0, 10);
  const hasWishedToday = currentProfile?.lastWishDate === todayStr;

  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"recent" | "trending">("recent");

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
      orderBy(sortBy === "trending" ? "vibesCount" : "timestamp", "desc"),
      limit(40)
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
      setErrorMsg("Please sign in above to hang a wish!");
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

    if (hasWishedToday) {
      setErrorMsg("You have already hanged a wish today! Come back tomorrow.");
      return;
    }

    if (coinBalance < 200) {
      setErrorMsg("Not enough coins! Hang a wish costs 200 Vibe Coins.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    // Deduct coins locally
    const spendSuccess = spendCoins(200);
    if (!spendSuccess) {
      setErrorMsg("Deduction failed. Please verify coin balance.");
      setSubmitting(false);
      return;
    }

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
      addResult("Wishing Tree", "Hanged a wish on the tree 🎋", true, 0);
      registerWishToday();
      setWishText("");
      setWriteOpen(false);
      setIsAnonymous(false);
    } else {
      setErrorMsg("Failed to hang wish. Please check network connection.");
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

  // Maps first wishes to branches, the rest will list in the feed
  const hangingWishes = wishes.slice(0, BRANCH_COORDINATES.length);

  return (
    <div className="w-full max-w-4xl mx-auto font-fredoka py-2 select-none relative">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes sway {
          0% { transform: rotate(-2.5deg); }
          100% { transform: rotate(2.5deg); }
        }
        .sway-tag {
          animation: sway 5s ease-in-out infinite alternate;
          transform-origin: top center;
        }
        .glowing-tree-trunk {
          filter: drop-shadow(0 0 10px rgba(16, 185, 129, 0.25));
        }
        .glowing-tree-leaves {
          filter: drop-shadow(0 0 18px rgba(16, 185, 129, 0.4));
        }
        .parchment-glow {
          box-shadow: 0 4px 20px rgba(245, 183, 0, 0.12), 0 0 10px rgba(255, 255, 255, 0.05);
        }
      ` }} />

      {/* Header Area */}
      <div className="bg-white/70 dark:bg-[#1B103E]/70 backdrop-blur-xl border border-deep-violet/10 dark:border-white/10 rounded-[2rem] p-5 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/15 border border-emerald-500 text-emerald-500 rounded-xl flex items-center justify-center text-xl animate-pulse">
            🎋
          </div>
          <div>
            <h3 className="text-base font-black text-deep-violet dark:text-cream-soft leading-none">
              Celestial Wishing Tree
            </h3>
            <p className="text-[10px] font-bold text-deep-violet/60 dark:text-cream-soft/60 mt-1">
              Spend 200 coins to write a wish. Upvote others to grant them +3 luckyScore!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {user && user.uid !== "guest" ? (
            hasWishedToday ? (
              <div className="py-2.5 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center gap-2 text-xs font-bold select-none">
                <span>🎋 Hanged Today ✓</span>
              </div>
            ) : (
              <button
                onClick={() => { playTick(); setWriteOpen(true); }}
                className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs tracking-wider uppercase shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Hang a New Wish</span>
              </button>
            )
          ) : (
            <div className="py-2.5 px-4 rounded-xl bg-deep-violet/5 dark:bg-white/5 border border-deep-violet/10 dark:border-white/10 flex items-center gap-2 text-[10px] font-bold text-deep-violet/60 dark:text-cream-soft/60">
              <Lock className="w-3.5 h-3.5 text-primary-gold" />
              <span>Sign in above to write wishes</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Interactive Tree Section */}
      <div className="w-full aspect-[4/3] sm:aspect-[16/10] bg-gradient-to-b from-[#1E1145] to-[#0D0725] dark:from-[#0B051D] dark:to-[#04020C] border-4 border-emerald-500/30 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden flex items-end justify-center mb-8">
        
        {/* Magic Space dust particles in background */}
        <div className="absolute inset-0 bg-radial from-emerald-500/5 via-transparent to-transparent pointer-events-none opacity-50" />
        <div className="absolute top-8 left-10 w-2 h-2 rounded-full bg-white opacity-40 animate-ping duration-1000" />
        <div className="absolute top-20 right-20 w-1.5 h-1.5 rounded-full bg-yellow-300 opacity-60 animate-pulse duration-700" />
        <div className="absolute top-1/3 left-1/4 w-1 h-1 rounded-full bg-emerald-300 opacity-50 animate-ping duration-1500" />
        <div className="absolute top-1/2 right-1/3 w-2.5 h-2.5 rounded-full bg-white/20 opacity-30 animate-pulse" />

        {/* Dynamic Star Constellations */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
          <line x1="20%" y1="15%" x2="28%" y2="25%" stroke="#fff" strokeWidth="1" strokeDasharray="3,3" />
          <line x1="28%" y1="25%" x2="35%" y2="20%" stroke="#fff" strokeWidth="1" strokeDasharray="3,3" />
          <line x1="65%" y1="10%" x2="72%" y2="18%" stroke="#fff" strokeWidth="1" strokeDasharray="3,3" />
          <line x1="72%" y1="18%" x2="80%" y2="15%" stroke="#fff" strokeWidth="1" strokeDasharray="3,3" />
        </svg>

        {/* Tree SVG Illustration */}
        <div className="w-full max-w-[580px] aspect-[16/10] absolute bottom-0 select-none pointer-events-none z-10 flex items-end justify-center">
          <svg
            viewBox="0 0 600 400"
            className="w-full h-full"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Roots */}
            <path d="M260 380 C 270 382, 290 395, 260 400 C 250 400, 270 375, 280 380 Z" fill="#152618" />
            <path d="M340 380 C 330 382, 310 395, 340 400 C 350 400, 330 375, 320 380 Z" fill="#152618" />

            {/* Main Trunk */}
            <path
              className="glowing-tree-trunk"
              d="M270 390 C 280 340, 260 280, 250 220 C 240 180, 220 150, 180 130 C 170 125, 175 120, 185 122 C 220 140, 250 170, 265 210 C 275 250, 290 310, 300 390 Z"
              fill="#1F3D24"
            />
            <path
              className="glowing-tree-trunk"
              d="M330 390 C 320 340, 340 280, 350 220 C 360 180, 380 150, 420 130 C 430 125, 425 120, 415 122 C 380 140, 350 170, 335 210 C 325 250, 310 310, 300 390 Z"
              fill="#172F1B"
            />

            {/* Glowing Branches */}
            <path d="M250 220 C 230 180, 170 170, 140 190 C 135 193, 130 185, 140 180 C 180 160, 235 170, 255 210 Z" fill="#2E5C36" />
            <path d="M350 220 C 370 180, 430 170, 460 190 C 465 193, 470 185, 460 180 C 420 160, 365 170, 345 210 Z" fill="#24472A" />
            <path d="M260 260 C 230 220, 200 220, 160 240 C 155 242, 150 235, 160 230 C 200 210, 235 210, 265 250 Z" fill="#1F3D24" />
            <path d="M340 260 C 370 220, 400 220, 440 240 C 445 242, 450 235, 440 230 C 400 210, 365 210, 335 250 Z" fill="#172F1B" />
            <path d="M275 180 C 265 140, 220 110, 190 90 C 182 85, 188 78, 196 82 C 230 100, 265 130, 280 170 Z" fill="#2E5C36" />
            <path d="M325 180 C 335 140, 380 110, 410 90 C 418 85, 412 78, 404 82 C 370 100, 335 130, 320 170 Z" fill="#24472A" />

            {/* Glowing Leaves & Canopy Mesh */}
            <circle className="glowing-tree-leaves opacity-40" cx="300" cy="140" r="100" fill="url(#leaves-grad)" />
            <circle className="glowing-tree-leaves opacity-30" cx="200" cy="160" r="80" fill="url(#leaves-grad)" />
            <circle className="glowing-tree-leaves opacity-30" cx="400" cy="160" r="80" fill="url(#leaves-grad)" />
            <circle className="glowing-tree-leaves opacity-20" cx="150" cy="220" r="65" fill="url(#leaves-grad)" />
            <circle className="glowing-tree-leaves opacity-20" cx="450" cy="220" r="65" fill="url(#leaves-grad)" />

            <defs>
              <radialGradient id="leaves-grad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="70%" stopColor="#047857" />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
          </svg>
        </div>

        {/* Real-time Hanging Wishes Tags */}
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-transparent z-20">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : hangingWishes.length === 0 ? (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-xs font-semibold text-cream-soft/40 z-20 space-y-1">
            <p className="text-xl">🎋</p>
            <p>No wishes hanging on the branches yet.</p>
            <p>Be the first to hang a wish!</p>
          </div>
        ) : (
          hangingWishes.map((wish, index) => {
            const coord = BRANCH_COORDINATES[index % BRANCH_COORDINATES.length];
            const hasVibed = user ? wish.vibesUsers.includes(user.uid) : false;

            return (
              <motion.button
                key={wish.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", delay: index * 0.08 }}
                onClick={() => { playTick(); setActiveWish(wish); }}
                style={{
                  left: `${coord.x}%`,
                  top: `${coord.y}%`,
                }}
                className="absolute sway-tag z-20 group -translate-x-1/2 cursor-pointer flex flex-col items-center gap-1 select-none pointer-events-auto"
              >
                {/* Visual String Hanger */}
                <div className="w-0.5 h-6 bg-gradient-to-b from-emerald-600/30 to-amber-500/60 pointer-events-none" />

                {/* Shimmering Tag Card */}
                <div className={`px-2.5 py-1.5 rounded-lg border text-[9px] font-black text-center flex items-center gap-1.5 transition-all duration-300 transform group-hover:scale-110 group-hover:z-30 select-none ${
                  hasVibed
                    ? "bg-gradient-to-br from-amber-400 to-amber-500 text-deep-violet border-yellow-300 shadow-[0_0_12px_rgba(245,183,0,0.5)] font-black"
                    : "bg-[#FFF8E7] dark:bg-[#2D1F5B] text-deep-violet dark:text-[#FFF8E7] border-amber-500/40 hover:border-amber-400/90 shadow-md hover:shadow-yellow-500/25"
                }`}>
                  <span>🎋</span>
                  <span className="max-w-[50px] truncate">
                    {wish.isAnonymous ? "Anonymous" : wish.displayName.split(" ")[0]}
                  </span>
                  <span className="flex items-center gap-0.5 text-[8px] font-bold opacity-80">
                    <Heart className={`w-2 h-2 ${hasVibed ? "fill-deep-violet text-deep-violet" : "text-amber-500"}`} />
                    {wish.vibesCount}
                  </span>
                </div>
              </motion.button>
            );
          })
        )}

        {/* Glowing Garden Grass overlay */}
        <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-[#0A041A] to-transparent pointer-events-none z-10" />
      </div>

      {/* Wishes Browser Feed */}
      <div className="w-full z-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 border-b border-deep-violet/10 dark:border-white/10 pb-4">
          <h2 className="text-lg font-black text-deep-violet dark:text-cream-soft uppercase tracking-wider flex items-center gap-2">
            <span>Wishing Garden Feed</span>
            <span className="text-xs bg-deep-violet/5 dark:bg-white/5 border border-deep-violet/10 dark:border-white/10 text-deep-violet/60 dark:text-cream-soft/60 px-2 py-0.5 rounded-full font-bold normal-case">
              {wishes.length} wishes
            </span>
          </h2>

          <div className="flex items-center rounded-xl bg-deep-violet/5 dark:bg-white/5 border border-deep-violet/10 dark:border-white/10 p-1 select-none">
            <button
              onClick={() => { playTick(); setSortBy("recent"); }}
              className={`py-1.5 px-3 rounded-lg font-black text-xs uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                sortBy === "recent"
                  ? "bg-white dark:bg-[#1B103E] text-deep-violet dark:text-cream-soft shadow-sm"
                  : "text-deep-violet/40 dark:text-cream-soft/40 hover:text-deep-violet dark:hover:text-cream-soft"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Recent</span>
            </button>
            <button
              onClick={() => { playTick(); setSortBy("trending"); }}
              className={`py-1.5 px-3 rounded-lg font-black text-xs uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                sortBy === "trending"
                  ? "bg-white dark:bg-[#1B103E] text-deep-violet dark:text-cream-soft shadow-sm"
                  : "text-deep-violet/40 dark:text-cream-soft/40 hover:text-deep-violet dark:hover:text-cream-soft"
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
          <div className="bg-white/40 dark:bg-[#1B103E]/40 border border-dashed border-deep-violet/10 dark:border-white/10 rounded-3xl p-12 text-center text-xs font-semibold text-deep-violet/40 dark:text-cream-soft/40 space-y-1">
            <p className="text-3xl">📭</p>
            <p>The garden feed is empty.</p>
            <p>Hang your wish above to start the collection!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {wishes.map((wish) => {
              const hasVibed = user ? wish.vibesUsers.includes(user.uid) : false;
              return (
                <motion.div
                  layoutId={`wish-card-${wish.id}`}
                  key={wish.id}
                  className="bg-white/60 dark:bg-[#1B103E]/60 backdrop-blur-md border border-deep-violet/10 dark:border-white/10 hover:border-amber-500/40 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 cursor-pointer"
                  onClick={() => { playTick(); setActiveWish(wish); }}
                >
                  <p className="text-xs font-medium text-deep-violet/85 dark:text-cream-soft/90 leading-relaxed italic line-clamp-3">
                    "{wish.wishText}"
                  </p>

                  <div className="flex items-center justify-between gap-2 border-t border-deep-violet/5 dark:border-white/5 pt-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 text-white font-black text-[10px] flex items-center justify-center select-none shadow-sm overflow-hidden">
                        {wish.isAnonymous || !wish.photoURL ? (
                          "🎋"
                        ) : (
                          <img src={wish.photoURL} alt={wish.displayName} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <span className="text-[10px] font-black text-deep-violet/60 dark:text-cream-soft/60">
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
                          : "bg-deep-violet/5 dark:bg-white/5 border-deep-violet/10 dark:border-white/10 hover:border-amber-500/35 text-deep-violet/60 dark:text-cream-soft/60"
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
                  <span>Hang a Wish</span>
                  <span className="text-[10px] py-0.5 px-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-black">
                    🎋 Scroll
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
                  <label className="text-[11px] font-black uppercase tracking-wider text-cream-soft/60">
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
                  <label htmlFor="anonymous" className="text-xs font-bold text-cream-soft/80 cursor-pointer">
                    Hang anonymously (hides your photo & name)
                  </label>
                </div>

                {/* Spend Notice */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                    <Coins className="w-4 h-4" />
                    <span>Writing Cost:</span>
                  </div>
                  <span className="font-black text-emerald-400">200 Vibe Coins</span>
                </div>

                {/* Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs tracking-widest uppercase shadow-md hover:shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4.5 h-4.5" />
                  <span>{submitting ? "HANGING WISH..." : "HANG ON BRANCH"}</span>
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
                🎋 Paper Scroll Wish
              </span>

              {/* Avatar of Creator */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 text-white font-black text-2xl flex items-center justify-center shadow-lg overflow-hidden my-5 border-2 border-amber-500/30">
                {activeWish.isAnonymous || !activeWish.photoURL ? (
                  "🎋"
                ) : (
                  <img src={activeWish.photoURL} alt={activeWish.displayName} className="w-full h-full object-cover" />
                )}
              </div>

              {/* Name */}
              <h4 className="text-base font-black text-white leading-none">
                {activeWish.displayName}
              </h4>
              <span className="text-[9px] font-bold text-cream-soft/40 uppercase tracking-widest mt-1 block">
                Hanged {new Date(activeWish.timestamp).toLocaleDateString()} at {new Date(activeWish.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>

              {/* Text */}
              <p className="text-sm font-bold text-cream-soft/95 mt-5 leading-relaxed px-2 border-y border-white/5 py-4 italic">
                "{activeWish.wishText}"
              </p>

              {/* Vibes count info */}
              <div className="flex items-center gap-1.5 mt-5 text-xs text-cream-soft/70">
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
                <div className="mt-6 py-2.5 px-4 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-cream-soft/50 w-full flex items-center justify-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-primary-gold" />
                  <span>Sign in above to send positive vibes</span>
                </div>
              )}

              {/* Option to Delete Wish if user is the creator */}
              {user && user.uid !== "guest" && activeWish.userId === user.uid && (
                <button
                  onClick={async () => {
                    if (confirm("Are you sure you want to delete your wish from the tree?")) {
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
                  <span>Delete My Wish</span>
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
