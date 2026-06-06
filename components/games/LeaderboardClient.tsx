"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchLeaderboard, fetchVips, LeaderboardEntry } from "@/lib/firestoreProfile";
import { useAuth } from "@/components/auth/AuthProvider";
import { useLuckStore } from "@/store/luckStore";
import Image from "next/image";

// ─── Badge config ─────────────────────────────────────────────────────────────

function getBadge(coinBalance: number): { label: string; emoji: string; color: string } {
  if (coinBalance >= 10000) return { label: "Legendary", emoji: "👑", color: "#F5B700" };
  if (coinBalance >= 5000)  return { label: "Diamond",   emoji: "💎", color: "#00BFFF" };
  if (coinBalance >= 2500)  return { label: "Platinum",  emoji: "⚡", color: "#A855F7" };
  if (coinBalance >= 1000)  return { label: "Gold",      emoji: "🥇", color: "#F59E0B" };
  if (coinBalance >= 500)   return { label: "Silver",    emoji: "🥈", color: "#94A3B8" };
  return                           { label: "Bronze",    emoji: "🥉", color: "#CD7F32" };
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({
  photoURL,
  displayName,
  size = 44,
  ring,
}: {
  photoURL: string | null;
  displayName: string;
  size?: number;
  ring?: string;
}) {
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const ringStyle = ring
    ? { boxShadow: `0 0 0 3px ${ring}, 0 0 18px ${ring}55` }
    : {};

  return (
    <div
      className="relative rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-fredoka font-black text-white"
      style={{ width: size, height: size, background: "rgba(45,27,105,0.25)", ...ringStyle }}
    >
      {photoURL ? (
        <Image
          src={photoURL}
          alt={displayName}
          width={size}
          height={size}
          className="w-full h-full object-cover"
          unoptimized={photoURL.includes('googleusercontent') || photoURL.includes('githubusercontent')}
        />
      ) : (
        <span style={{ fontSize: size * 0.38 }}>{initials || "?"}</span>
      )}
    </div>
  );
}

// ─── Podium card (top 3) ──────────────────────────────────────────────────────

const PODIUM_CONFIG = [
  { rank: 1, label: "1st", ring: "#F5B700", bg: "from-amber-400/30 via-yellow-300/10 to-transparent", crown: "👑", height: "h-24" },
  { rank: 2, label: "2nd", ring: "#CBD5E1", bg: "from-slate-400/25 via-slate-300/10 to-transparent", crown: "🥈", height: "h-16" },
  { rank: 3, label: "3rd", ring: "#CD7F32", bg: "from-orange-700/25 via-amber-800/10 to-transparent", crown: "🥉", height: "h-12" },
];

function PodiumCard({
  entry,
  rank,
  delay,
  isCurrentUser,
}: {
  entry: LeaderboardEntry;
  rank: number;
  delay: number;
  isCurrentUser: boolean;
}) {
  const cfg = PODIUM_CONFIG[rank - 1];
  const badge = getBadge(entry.coinBalance);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center gap-1"
    >
      {/* Crown / medal */}
      <span className="text-3xl sm:text-4xl leading-none mb-1 drop-shadow-lg">
        {cfg.crown}
      </span>

      {/* Avatar + glow */}
      <div className="relative">
        {rank === 1 && (
          <div className="absolute inset-0 rounded-full blur-xl bg-amber-400/40 scale-125 pointer-events-none" />
        )}
        <Avatar
          photoURL={entry.photoURL}
          displayName={entry.displayName}
          size={rank === 1 ? 72 : 56}
          ring={cfg.ring}
        />
        {isCurrentUser && (
          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-accent-teal border-2 border-background flex items-center justify-center text-[9px] font-black text-white">
            YOU
          </span>
        )}
      </div>

      {/* Name */}
      <p
        className="font-fredoka font-black text-deep-violet dark:text-soft-cream text-center max-w-[90px] sm:max-w-[110px] truncate"
        style={{ fontSize: rank === 1 ? 15 : 13 }}
      >
        {entry.displayName}
      </p>

      {/* Points */}
      <span
        className="font-fredoka font-extrabold tabular-nums"
        style={{ color: cfg.ring, fontSize: rank === 1 ? 18 : 15 }}
      >
        {entry.coinBalance.toLocaleString()} pts
      </span>

      {/* Badge */}
      <span
        className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full"
        style={{
          background: `${badge.color}22`,
          color: badge.color,
          border: `1px solid ${badge.color}55`,
        }}
      >
        {badge.emoji} {badge.label}
      </span>

      {/* Podium base */}
      <div
        className={`w-full mt-2 rounded-t-xl bg-gradient-to-b ${cfg.bg} border border-white/10 dark:border-white/5 ${cfg.height} flex items-end justify-center pb-2`}
      >
        <span className="font-fredoka text-xs font-black text-deep-violet/40 dark:text-soft-cream/30">
          #{rank}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Table row ────────────────────────────────────────────────────────────────

function LeaderRow({
  entry,
  rank,
  index,
  isCurrentUser,
  isVipTab,
}: {
  entry: LeaderboardEntry;
  rank: number;
  index: number;
  isCurrentUser: boolean;
  isVipTab?: boolean;
}) {
  const badge = getBadge(entry.coinBalance);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.03, ease: "easeOut" }}
      className={`group flex items-center gap-3 sm:gap-4 px-4 py-3 rounded-2xl border transition-all duration-200 ${
        isCurrentUser
          ? "bg-accent-teal/10 border-accent-teal/40 shadow-[0_0_16px_rgba(0,180,160,0.15)]"
          : isVipTab
          ? "bg-[#FFDD00]/5 hover:bg-[#FFDD00]/10 border-primary-gold/25 hover:border-primary-gold/45 shadow-[0_0_8px_rgba(245,183,0,0.05)]"
          : "bg-white/50 dark:bg-white/[0.03] border-white/60 dark:border-white/8 hover:bg-primary-gold/5 hover:border-primary-gold/25"
      }`}
    >
      {/* Rank number */}
      <div className="w-8 text-center flex-shrink-0">
        <span
          className="font-fredoka font-black tabular-nums"
          style={{
            fontSize: 15,
            color:
              rank <= 3
                ? ["#F5B700", "#94A3B8", "#CD7F32"][rank - 1]
                : "rgba(45,27,105,0.4)",
          }}
        >
          {rank === 1 ? "👑" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : isVipTab ? `☕${rank}` : rank}
        </span>
      </div>

      {/* Avatar */}
      <Avatar
        photoURL={entry.photoURL}
        displayName={entry.displayName}
        size={36}
        ring={isCurrentUser ? "#00B4A0" : isVipTab ? "#FFDD00" : undefined}
      />

      {/* Name + badge */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="font-fredoka font-black text-deep-violet dark:text-soft-cream text-sm truncate">
            {entry.displayName}
            {isCurrentUser && (
              <span className="ml-1 text-[10px] font-extrabold text-accent-teal">
                (you)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {isVipTab ? (
            <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary-gold/15 text-primary-gold border border-primary-gold/30">
              🌟 Cosmic Patron
            </span>
          ) : (
            <span
              className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
              style={{
                background: `${badge.color}18`,
                color: badge.color,
              }}
            >
              {badge.emoji} {badge.label}
            </span>
          )}
          {entry.winStreak > 0 && !isVipTab && (
            <span className="text-[10px] font-bold text-deep-violet/50 dark:text-soft-cream/40">
              🔥 {entry.winStreak}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 sm:gap-5 flex-shrink-0">
        <div className="hidden sm:flex flex-col items-center">
          <span className="text-[9px] font-black uppercase tracking-widest text-deep-violet/35 dark:text-soft-cream/30">
            {isVipTab ? "Donations" : "Plays"}
          </span>
          <span className="font-fredoka font-extrabold text-sm text-deep-violet dark:text-soft-cream tabular-nums">
            {isVipTab ? `${entry.coffeesDonated || 0} ☕` : entry.totalPlays}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[9px] font-black uppercase tracking-widest text-deep-violet/35 dark:text-soft-cream/30">
            Points
          </span>
          <span className="font-fredoka font-extrabold text-sm text-primary-gold tabular-nums">
            {entry.coinBalance.toLocaleString()}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function SkeletonRow({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.04 }}
      className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/40 dark:border-white/5 bg-white/40 dark:bg-white/[0.02]"
    >
      <div className="w-8 h-4 rounded bg-deep-violet/10 dark:bg-white/10 animate-pulse" />
      <div className="w-9 h-9 rounded-full bg-deep-violet/10 dark:bg-white/10 animate-pulse" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 w-28 rounded bg-deep-violet/10 dark:bg-white/10 animate-pulse" />
        <div className="h-2 w-16 rounded bg-deep-violet/8 dark:bg-white/8 animate-pulse" />
      </div>
      <div className="w-14 h-4 rounded bg-primary-gold/15 animate-pulse" />
    </motion.div>
  );
}

// ─── Main Leaderboard Client ──────────────────────────────────────────────────

export default function LeaderboardClient() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"global" | "vip">("global");

  const activeUserKey = useLuckStore((s) => s.activeUserKey);
  const currentProfile = useLuckStore((s) => s.profiles[activeUserKey]);
  const coffeesDonated = currentProfile?.coffeesDonated || 0;
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [vipEntries, setVipEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [permError, setPermError] = useState(false);
  const [search, setSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Wait for auth to resolve first
    if (authLoading) return;

    // Not signed in — clear state, don't subscribe
    if (!user) {
      setLoading(false);
      setEntries([]);
      setVipEntries([]);
      return;
    }

    setLoading(true);
    setPermError(false);

    let isMounted = true;

    Promise.all([
      fetchLeaderboard(),
      fetchVips()
    ])
      .then(([leaderboardData, vipData]) => {
        if (!isMounted) return;
        setEntries(leaderboardData);
        setVipEntries(vipData);
        setLoading(false);
        setPermError(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error(err);
        setLoading(false);
        setPermError(true);
      });

    return () => {
      isMounted = false;
    };
  }, [user, authLoading]);

  const activeList = activeTab === "global" ? entries : vipEntries;

  const filtered = search.trim()
    ? activeList.filter((e) =>
        e.displayName.toLowerCase().includes(search.toLowerCase())
      )
    : activeList;

  const top3 = filtered.slice(0, 3);
  const rest = filtered.slice(3);

  // Find current user's rank
  const currentUserRank = user
    ? activeList.findIndex((e) => e.uid === user.uid) + 1
    : 0;

  const podiumOrder = top3.length === 3
    ? [top3[1], top3[0], top3[2]] // 2nd, 1st, 3rd for visual podium
    : top3;

  return (
    <div className="w-full max-w-2xl mx-auto">

      {/* ── Not signed in gate ── */}
      {!authLoading && !user && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-20 text-center flex flex-col items-center gap-4"
        >
          <span className="text-6xl">🔒</span>
          <h2 className="font-fredoka text-2xl font-black text-deep-violet dark:text-soft-cream">
            Sign in to view the Leaderboard
          </h2>
          <p className="text-sm text-deep-violet/50 dark:text-soft-cream/50 max-w-xs">
            The leaderboard is available to signed-in players only. Sign in with Google to see where you rank!
          </p>
        </motion.div>
      )}

      {/* ── Permission error ── */}
      {permError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-16 text-center flex flex-col items-center gap-3"
        >
          <span className="text-5xl">⚠️</span>
          <p className="font-fredoka text-lg font-black text-deep-violet/60 dark:text-soft-cream/50">
            Leaderboard unavailable
          </p>
          <p className="text-xs text-deep-violet/40 dark:text-soft-cream/35 max-w-xs">
            Firestore rules need updating. Make sure you&apos;ve published the latest security rules in your Firebase console.
          </p>
        </motion.div>
      )}

      {/* ── Main content — only when signed in and no error ── */}
      {(user || authLoading) && !permError && (
        <>

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 text-center"
      >
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-4 ${
          activeTab === "vip" 
            ? "bg-[#FFDD00]/15 border-primary-gold/30 text-primary-gold" 
            : "bg-[#2D1B69]/10 border-[#2D1B69]/20 dark:bg-white/5 dark:border-white/10 text-deep-violet dark:text-soft-cream"
        }`}>
          <span className="text-sm">{activeTab === "vip" ? "🌟" : "🏆"}</span>
          <span className="text-xs font-extrabold uppercase tracking-widest">
            {activeTab === "vip" ? "VIP Supporters" : "Live Leaderboard"}
          </span>
        </div>
        
        <h2 className="font-fredoka text-3xl sm:text-4xl font-black text-deep-violet dark:text-soft-cream">
          {activeTab === "vip" ? "Cosmic Patrons ☕" : "Top Lucky Players"}
        </h2>
        
        <p className="text-sm font-semibold text-deep-violet/50 dark:text-soft-cream/50 mt-1 max-w-md mx-auto leading-relaxed">
          {activeTab === "vip" 
            ? "Meet the amazing supporters keeping our lucky garden free & ad-free!" 
            : "Ranked by total Lucky Points • Updates in real-time"}
        </p>

        {/* Current user's rank pill */}
        {currentUserRank > 0 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className={`inline-flex items-center gap-2 mt-3 px-4 py-1.5 rounded-full border ${
              activeTab === "vip"
                ? "bg-primary-gold/10 border-primary-gold/30 text-primary-gold"
                : "bg-accent-teal/15 border-accent-teal/35 text-accent-teal"
            }`}
          >
            <span className="text-xs font-extrabold">
              {activeTab === "vip" 
                ? `Your VIP ranking: #${currentUserRank} of ${vipEntries.length}`
                : `Your rank: #${currentUserRank} of ${entries.length}`
              }
            </span>
          </motion.div>
        )}

        {activeTab === "vip" && coffeesDonated > 0 && (
          <div className="text-xs font-black text-[#FFDD00] mt-3">
            ✨ You have contributed {coffeesDonated} {coffeesDonated === 1 ? "coffee" : "coffees"} to this garden!
          </div>
        )}
      </motion.div>

      {/* Tab Switcher */}
      <div className="flex justify-center gap-3 mb-6">
        <button
          onClick={() => setActiveTab("global")}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider border transition-all cursor-pointer ${
            activeTab === "global"
              ? "bg-[#2D1B69] border-[#2D1B69] text-white dark:bg-white dark:border-white dark:text-deep-violet shadow-sm"
              : "bg-deep-violet/5 dark:bg-white/5 border-deep-violet/10 dark:border-white/10 text-deep-violet/70 dark:text-soft-cream/70 hover:bg-deep-violet/10 dark:hover:bg-white/10"
          }`}
        >
          🏆 Global Leaders
        </button>
        <button
          onClick={() => setActiveTab("vip")}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider border transition-all cursor-pointer ${
            activeTab === "vip"
              ? "bg-gradient-to-r from-yellow-400 to-amber-500 border-amber-500 text-deep-violet shadow-[0_0_15px_rgba(245,183,0,0.25)]"
              : "bg-deep-violet/5 dark:bg-white/5 border-deep-violet/10 dark:border-white/10 text-deep-violet/70 dark:text-soft-cream/70 hover:bg-deep-violet/10 dark:hover:bg-white/10"
          }`}
        >
          🌟 VIP Supporters
        </button>
      </div>

      {/* ── Podium (top 3) ── */}
      {!loading && top3.length > 0 && !search && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-8 px-2 sm:px-6"
        >
          <div
            className="relative rounded-3xl overflow-hidden border border-primary-gold/20 dark:border-primary-gold/10 shadow-[0_16px_60px_rgba(245,183,0,0.12)]"
            style={{
              background:
                activeTab === "vip"
                  ? "radial-gradient(ellipse at 50% 0%, rgba(245,183,0,0.18) 0%, transparent 65%), linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,248,231,0.7) 100%)"
                  : "radial-gradient(ellipse at 50% 0%, rgba(245,183,0,0.12) 0%, transparent 65%), linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,248,231,0.7) 100%)",
            }}
          >
            <div className="dark:hidden absolute inset-0 pointer-events-none" />
            <div
              className="hidden dark:block absolute inset-0 pointer-events-none"
              style={{
                background:
                  activeTab === "vip"
                    ? "radial-gradient(ellipse at 50% 0%, rgba(245,183,0,0.16) 0%, transparent 65%), linear-gradient(180deg, rgba(27,16,62,0.97) 0%, rgba(8,5,20,0.95) 100%)"
                    : "radial-gradient(ellipse at 50% 0%, rgba(245,183,0,0.10) 0%, transparent 65%), linear-gradient(180deg, rgba(27,16,62,0.97) 0%, rgba(8,5,20,0.95) 100%)",
              }}
            />
            {/* Decorative sparkle dots */}
            <div className="absolute top-4 left-8 w-1.5 h-1.5 rounded-full bg-primary-gold/40 animate-pulse" />
            <div className="absolute top-8 right-12 w-1 h-1 rounded-full bg-primary-gold/30 animate-pulse" style={{ animationDelay: "0.7s" }} />
            <div className="absolute bottom-12 left-16 w-1 h-1 rounded-full bg-primary-gold/25 animate-pulse" style={{ animationDelay: "1.2s" }} />

            <div className="relative z-10 px-4 py-6 sm:px-8">
              {/* Podium layout: 2nd | 1st | 3rd */}
              <div
                className={`grid gap-3 sm:gap-6 items-end ${
                  podiumOrder.length === 3
                    ? "grid-cols-3"
                    : podiumOrder.length === 2
                    ? "grid-cols-2"
                    : "grid-cols-1 place-items-center"
                }`}
              >
                {podiumOrder.map((entry, i) => {
                  // Remap: visual order [2nd, 1st, 3rd] back to actual ranks
                  const actualRank =
                    podiumOrder.length === 3
                      ? [2, 1, 3][i]
                      : i + 1;
                  return (
                    <PodiumCard
                      key={entry.uid}
                      entry={entry}
                      rank={actualRank}
                      delay={0.2 + i * 0.1}
                      isCurrentUser={user?.uid === entry.uid}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Search bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-4 relative"
      >
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <span className="text-deep-violet/35 dark:text-soft-cream/35 text-sm">🔍</span>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={activeTab === "vip" ? "Search VIP supporters..." : "Search players..."}
          className="w-full pl-10 pr-4 py-3 rounded-2xl border border-deep-violet/15 dark:border-white/10 bg-white/75 dark:bg-white/[0.04] text-deep-violet dark:text-soft-cream placeholder-deep-violet/35 dark:placeholder-soft-cream/30 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-primary-gold/40 focus:border-primary-gold/50 transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute inset-y-0 right-4 flex items-center text-deep-violet/40 hover:text-deep-violet dark:text-soft-cream/40 dark:hover:text-soft-cream transition-colors cursor-pointer"
          >
            ✕
          </button>
        )}
      </motion.div>

      {/* ── Results count ── */}
      {!loading && (
        <div className="mb-3 px-1">
          <span className="text-xs font-bold text-deep-violet/40 dark:text-soft-cream/35">
            {search
              ? `${filtered.length} result${filtered.length !== 1 ? "s" : ""} for "${search}"`
              : activeTab === "global"
              ? `${entries.length} players ranked`
              : `${vipEntries.length} VIP supporters`}
          </span>
        </div>
      )}

      {/* ── Table header ── */}
      {!loading && filtered.length > 0 && (
        <div className="flex items-center gap-3 sm:gap-4 px-4 py-2 mb-1">
          <div className="w-8 text-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-deep-violet/30 dark:text-soft-cream/25">
              #
            </span>
          </div>
          <div className="w-9" />
          <div className="flex-1">
            <span className="text-[9px] font-black uppercase tracking-widest text-deep-violet/30 dark:text-soft-cream/25">
              Player
            </span>
          </div>
          <div className="hidden sm:block">
            <span className="text-[9px] font-black uppercase tracking-widest text-deep-violet/30 dark:text-soft-cream/25">
              {activeTab === "vip" ? "Donations" : "Plays"}
            </span>
          </div>
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-deep-violet/30 dark:text-soft-cream/25">
              Points
            </span>
          </div>
        </div>
      )}

      {/* ── Player list ── */}
      <div ref={scrollRef} className="space-y-2">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} index={i} />)
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-16 text-center flex flex-col items-center"
          >
            <p className="text-5xl mb-3">{activeTab === "vip" ? "☕" : "🌀"}</p>
            <p className="font-fredoka text-lg font-black text-deep-violet/50 dark:text-soft-cream/40">
              {activeTab === "global" 
                ? (search ? "No players found" : "No players yet")
                : (search ? "No VIPs found" : "No Cosmic Patrons yet")
              }
            </p>
            <p className="text-sm text-deep-violet/35 dark:text-soft-cream/30 mt-1 max-w-xs mx-auto mb-6">
              {activeTab === "global"
                ? (search ? "Try a different name" : "Be the first to play!")
                : (search ? "Try a different name" : "Support Luckify by buying us a coffee and get your name listed as a VIP Patron!")
              }
            </p>
            {activeTab === "vip" && !search && (
              <button
                onClick={() => window.dispatchEvent(new CustomEvent("open-buy-me-coffee-modal"))}
                className="py-3 px-6 rounded-2xl font-black text-xs select-none cursor-pointer tracking-wider shadow-md bg-primary-gold hover:bg-amber-300 text-[#1E1145] hover:shadow-lg active:scale-95 transition-all font-fredoka uppercase"
              >
                Become a VIP Patron ☕
              </button>
            )}
          </motion.div>
        ) : (
          <AnimatePresence>
            {/* Top 3 rows (only shown when searching) */}
            {search &&
              filtered.slice(0, 3).map((entry, i) => (
                <LeaderRow
                  key={entry.uid}
                  entry={entry}
                  rank={activeList.indexOf(entry) + 1}
                  index={i}
                  isCurrentUser={user?.uid === entry.uid}
                  isVipTab={activeTab === "vip"}
                />
              ))}
            {/* Rank 4+ rows (always shown); top 3 shown only when not searching */}
            {!search
              ? rest.map((entry, i) => (
                  <LeaderRow
                    key={entry.uid}
                    entry={entry}
                    rank={i + 4}
                    index={i}
                    isCurrentUser={user?.uid === entry.uid}
                    isVipTab={activeTab === "vip"}
                  />
                ))
              : filtered.slice(3).map((entry, i) => (
                  <LeaderRow
                    key={entry.uid}
                    entry={entry}
                    rank={activeList.indexOf(entry) + 1}
                    index={i + 3}
                    isCurrentUser={user?.uid === entry.uid}
                    isVipTab={activeTab === "vip"}
                  />
                ))}
          </AnimatePresence>
        )}
      </div>

      {/* ── Scroll hint ── */}
      {!loading && activeList.length > 10 && !search && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-xs font-bold text-deep-violet/30 dark:text-soft-cream/25 mt-6 pb-2"
        >
          {activeTab === "global"
            ? `Showing top ${entries.length} players`
            : `Showing top ${vipEntries.length} supporters`
          }
        </motion.p>
      )}
        </>
      )}
    </div>
  );
}
