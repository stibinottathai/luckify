"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock } from "lucide-react";
import Link from "next/link";
import type { ScratchPrize } from "@/lib/prizes";
import { playScratch } from "@/lib/audio";
import { useLuckStore } from "@/store/luckStore";
import { useAuth } from "@/components/auth/AuthProvider";
import ResultCard from "@/components/ui/ResultCard";
import ShareModal from "@/components/ui/ShareModal";

const DAILY_SCRATCH_LIMIT = 3;

// Floating particle for ambient effect
function Particle({ delay }: { delay: number }) {
  return (
    <motion.div
      className="absolute w-1 h-1 rounded-full bg-primary-gold/60 pointer-events-none"
      initial={{ opacity: 0, scale: 0, x: `${Math.random() * 100}%`, y: "100%" }}
      animate={{
        opacity: [0, 1, 0],
        scale: [0, 1.5, 0],
        y: ["100%", "-10%"],
        x: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
      }}
      transition={{
        duration: 3 + Math.random() * 2,
        delay,
        repeat: Infinity,
        ease: "easeOut",
      }}
    />
  );
}

export default function ScratchGame() {
  const { user } = useAuth();
  const activeUserKey = useLuckStore((state) => state.activeUserKey);
  const profile =
    useLuckStore((state) => state.profiles[activeUserKey]) ||
    useLuckStore((state) => state.profiles["guest"]);
  const claimScratchCard = useLuckStore((state) => state.claimScratchCard);
  const currentScore = useLuckStore((state) => state.luckyScore);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const scratchCountRef = useRef(0);
  const isMounted = useRef(true);
  const revealTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRevealingRef = useRef(false);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (revealTimeoutRef.current) {
        clearTimeout(revealTimeoutRef.current);
      }
    };
  }, []);

  const [outcome, setOutcome] = useState<ScratchPrize | null>(null);
  // Ref so revealCard's async path always reads the latest outcome.
  const outcomeRef = useRef<ScratchPrize | null>(null);
  const setOutcomeWithRef = (prize: ScratchPrize | null) => {
    outcomeRef.current = prize;
    setOutcome(prize);
  };
  const [scratchedPercent, setScratchedPercent] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false); // API in-flight
  const [showResult, setShowResult] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [isScratching, setIsScratching] = useState(false);
  const [showWinBurst, setShowWinBurst] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const attemptsUsed = profile?.scratchAttemptsUsed ?? 0;
  const allUsed = attemptsUsed >= DAILY_SCRATCH_LIMIT;
  const remaining = DAILY_SCRATCH_LIMIT - attemptsUsed;

  // Countdown timer
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      if (diff <= 0) { setTimeLeft("00:00:00"); return; }
      const hrs = String(Math.floor(diff / 3600000)).padStart(2, "0");
      const mins = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
      const secs = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
      setTimeLeft(`${hrs}:${mins}:${secs}`);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);


  const drawCover = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Deep layered gradient — dark luxury look
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, "#1e1145");
    grad.addColorStop(0.3, "#2d1b69");
    grad.addColorStop(0.6, "#1a0f40");
    grad.addColorStop(1, "#0d0824");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Metallic sheen overlay
    const sheen = ctx.createLinearGradient(0, 0, canvas.width, 0);
    sheen.addColorStop(0, "rgba(255,255,255,0)");
    sheen.addColorStop(0.4, "rgba(255,255,255,0.06)");
    sheen.addColorStop(0.6, "rgba(255,255,255,0.1)");
    sheen.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Gold dust particles
    for (let i = 0; i < 300; i++) {
      const alpha = Math.random() * 0.6 + 0.2;
      ctx.fillStyle = `rgba(245,183,0,${alpha})`;
      ctx.beginPath();
      ctx.arc(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        Math.random() * 1.5,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // Decorative coin pattern grid
    ctx.globalAlpha = 0.07;
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 6; col++) {
        const cx = col * 70 + 35;
        const cy = row * 65 + 32;
        ctx.beginPath();
        ctx.arc(cx, cy, 18, 0, Math.PI * 2);
        ctx.strokeStyle = "#F5B700";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, 10, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    // Diamond border frame
    ctx.strokeStyle = "rgba(245,183,0,0.5)";
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
    ctx.strokeStyle = "rgba(245,183,0,0.2)";
    ctx.lineWidth = 1;
    ctx.strokeRect(14, 14, canvas.width - 28, canvas.height - 28);

    // Central star burst
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    for (let i = 0; i < 8; i++) {
      ctx.rotate(Math.PI / 4);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 28);
      ctx.strokeStyle = "rgba(245,183,0,0.12)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();

    // Main label with glow
    ctx.shadowColor = "rgba(245,183,0,0.8)";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#F5B700";
    ctx.font = "bold 16px Fredoka, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✦ SCRATCH TO REVEAL ✦", canvas.width / 2, canvas.height / 2 - 10);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "11px Fredoka, sans-serif";
    ctx.fillText("Drag or swipe across the card", canvas.width / 2, canvas.height / 2 + 14);
  }, []);

  // initCard only resets UI state — prize is fetched from the server on reveal.
  const initCard = useCallback(() => {
    setOutcomeWithRef(null);  // unknown until API responds
    setScratchedPercent(0);
    setIsRevealed(false);
    setIsRevealing(false);
    isRevealingRef.current = false;
    setShowResult(false);
    setShowWinBurst(false);
    setApiError(null);
    scratchCountRef.current = 0;
    isDrawingRef.current = false;
    if (revealTimeoutRef.current) {
      clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }
    setTimeout(() => drawCover(), 60);
  }, [drawCover]);

  useEffect(() => {
    if (!allUsed) initCard();
  }, [attemptsUsed, allUsed, initCard]);

  const getCoords = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    let cx = 0, cy = 0;
    if ("touches" in e) {
      if (!e.touches.length) return null;
      cx = e.touches[0].clientX;
      cy = e.touches[0].clientY;
    } else {
      cx = (e as MouseEvent).clientX;
      cy = (e as MouseEvent).clientY;
    }
    return {
      x: ((cx - rect.left) / rect.width) * canvas.width,
      y: ((cy - rect.top) / rect.height) * canvas.height,
    };
  };

  const startScratching = () => {
    if (isRevealed || allUsed) return;
    isDrawingRef.current = true;
    setIsScratching(true);
  };

  const scratch = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current || isRevealed || allUsed) return;
    const coords = getCoords(e.nativeEvent);
    if (!coords) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(coords.x, coords.y, 22, 0, Math.PI * 2);
    ctx.fill();
    playScratch();
    scratchCountRef.current++;

    // Start auto-reveal timeout on the very first scratch stroke
    if (scratchCountRef.current === 1) {
      revealTimeoutRef.current = setTimeout(() => {
        if (!isRevealed && !isRevealing && canvas) {
          revealCard(ctx, canvas.width, canvas.height);
        }
      }, 1500); // reveals after 1.5s of scratching
    }

    // Check every 5 operations for a smooth, responsive percentage display
    if (scratchCountRef.current % 5 === 0) checkPercent(ctx, canvas.width, canvas.height);
  };

  const stopScratching = () => {
    isDrawingRef.current = false;
    setIsScratching(false);
  };

  const checkPercent = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const data = ctx.getImageData(0, 0, w, h).data;
    let transparent = 0, total = 0;
    // Sample every pixel's alpha channel (i+=4 = one RGBA pixel at a time)
    // This gives accurate coverage with no blind spots.
    for (let i = 3; i < data.length; i += 4) {
      total++;
      if (data[i] === 0) transparent++;
    }
    const pct = (transparent / total) * 100;
    setScratchedPercent(pct);
    if (pct > 20) revealCard(ctx, w, h);
  };

  // revealCard: clears canvas then calls the server to get the authoritative prize.
  const revealCard = async (ctx?: CanvasRenderingContext2D, w?: number, h?: number) => {
    if (isRevealed || isRevealing || isRevealingRef.current) return; // prevent double-firing
    isRevealingRef.current = true;

    if (revealTimeoutRef.current) {
      clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }

    // 1. Clear the canvas immediately so the user sees the "loading" reveal
    setIsRevealed(true);
    isDrawingRef.current = false;
    setIsScratching(false);
    setScratchedPercent(100);
    setIsRevealing(true);
    const canvas = canvasRef.current;
    const activeCtx = ctx || canvas?.getContext("2d");
    if (canvas && activeCtx) activeCtx.clearRect(0, 0, w || canvas.width, h || canvas.height);

    try {
      // 2. Call the server — prize is determined server-side
      const idToken = user ? await user.getIdToken() : "";
      const res = await fetch("/api/scratch/reveal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ isGuest: activeUserKey === "guest" }),
      });

      if (!isMounted.current) return;

      if (!res.ok) {
        const errData = await res.json();
        setApiError(errData.error || "Something went wrong. Please try again.");
        setIsRevealing(false);
        isRevealingRef.current = false;
        // Roll back so user can try again (unless it's a 403 daily limit)
        if (res.status === 403) {
          // Update local store to reflect full usage so UI shows "all used"
          useLuckStore.setState((state) => {
            const p = state.profiles[activeUserKey];
            if (!p) return {};
            return {
              profiles: {
                ...state.profiles,
                [activeUserKey]: { ...p, scratchAttemptsUsed: DAILY_SCRATCH_LIMIT },
              },
            };
          });
        } else {
          // Non-limit error: reset UI so user can try again
          setIsRevealed(false);
          setScratchedPercent(0);
          scratchCountRef.current = 0;
          setTimeout(() => drawCover(), 60);
        }
        return;
      }

      const data = await res.json();
      const prize: ScratchPrize = data.prize;

      // 3. Set the prize (now from server)
      setOutcomeWithRef(prize);
      setIsRevealing(false);

      // 4. Sync store from server profile (logged-in users) or local claim (guests)
      if (data.profile) {
        // Authoritative server state — overwrite local store
        useLuckStore.setState((state) => {
          const existing = state.profiles[activeUserKey] || {};
          const updated = {
            ...existing,
            coinBalance: data.profile.coinBalance,
            luckyScore: data.profile.luckyScore,
            totalPlays: data.profile.totalPlays,
            winStreak: data.profile.winStreak,
            history: data.profile.history,
            scratchDate: data.profile.scratchDate,
            scratchAttemptsUsed: data.profile.scratchAttemptsUsed,
            scratchPrizeWon: data.profile.scratchPrizeWon,
          };
          return {
            profiles: { ...state.profiles, [activeUserKey]: updated },
            coinBalance: updated.coinBalance,
            luckyScore: updated.luckyScore,
          };
        });
      } else {
        // Guest: use local claimScratchCard to update Zustand
        claimScratchCard(prize.coinReward, prize.name, prize.isWin, prize.scoreImpact);
      }

      // 5. Trigger celebratory effects
      if (prize.isWin) setShowWinBurst(true);
      setTimeout(() => {
        if (isMounted.current) setShowResult(true);
      }, 400);

    } catch (err) {
      console.error("[ScratchGame] reveal error:", err);
      if (isMounted.current) {
        setApiError("Network error. Please try again.");
        setIsRevealing(false);
        isRevealingRef.current = false;
        setIsRevealed(false);
        setScratchedPercent(0);
        scratchCountRef.current = 0;
        setTimeout(() => drawCover(), 60);
      }
    }
  };

  // ─── LOGIN REQUIRED FOR GUEST ──────────────────────────────────────────────
  if (!user || activeUserKey === "guest") {
    return (
      <div className="w-full max-w-sm mx-auto flex flex-col items-center justify-center min-h-[350px] text-center p-8 bg-white/5 dark:bg-black/20 rounded-3xl backdrop-blur-md border border-white/10 font-fredoka">
        <Lock className="w-16 h-16 text-primary-gold mb-6 opacity-80 animate-pulse" />
        <h2 className="text-2xl font-black text-deep-violet dark:text-white uppercase tracking-wider mb-3">
          Login Required
        </h2>
        <p className="text-deep-violet/70 dark:text-white/60 text-xs font-bold leading-relaxed mb-6">
          To play Scratch Cards and secure your daily rewards, please sign in to your account.
        </p>
        <Link
          href="/auth"
          className="py-3 px-8 rounded-full bg-primary-gold hover:bg-[#e0a700] text-deep-violet font-black text-xs tracking-wider uppercase active:scale-95 transition-all shadow-lg shadow-primary-gold/20"
        >
          Sign In to Play
        </Link>
      </div>
    );
  }

  // ─── ALL USED STATE ──────────────────────────────────────────────────────────
  if (allUsed) {
    return (
      <div className="w-full max-w-sm mx-auto font-fredoka select-none">
        {/* Completed banner card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[2rem] border-2 border-primary-gold/30 shadow-[0_0_60px_rgba(245,183,0,0.12)] bg-gradient-to-b from-[#1a0f40] to-[#0d0824]"
        >
          {/* Ambient particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 8 }).map((_, i) => <Particle key={i} delay={i * 0.4} />)}
          </div>

          {/* Gold shimmer top */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-gold/60 to-transparent" />

          <div className="relative z-10 flex flex-col items-center px-8 py-10 text-center gap-6">
            {/* Trophy */}
            <motion.div
              animate={{ rotate: [-3, 3, -3] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="text-7xl"
            >
              🏆
            </motion.div>

            <div>
              <h2 className="text-3xl font-black text-white uppercase tracking-widest leading-none">
                All Cards Scratched!
              </h2>
              <p className="mt-2 text-sm text-white/50 font-bold normal-case leading-relaxed max-w-xs mx-auto">
                You've used all 3 daily scratch cards. Come back tomorrow for a fresh set!
              </p>
            </div>

            {/* Cards completed row */}
            <div className="flex gap-3">
              {Array.from({ length: DAILY_SCRATCH_LIMIT }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: i * 0.1, type: "spring" }}
                  className="w-16 h-20 rounded-xl border-2 border-emerald-400/40 bg-emerald-500/10 flex flex-col items-center justify-center gap-1"
                >
                  <span className="text-2xl">✅</span>
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider">Card {i + 1}</span>
                </motion.div>
              ))}
            </div>

            {/* Today's earnings */}
            <div className="w-full rounded-2xl bg-white/5 border border-white/10 px-6 py-5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">
                Total Earned Today
              </p>
              {(profile.scratchPrizeWon ?? 0) > 0 ? (
                <motion.p
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="text-4xl font-black text-primary-gold flex items-center justify-center gap-2"
                >
                  <span>🪙</span>
                  <span>+{profile.scratchPrizeWon?.toLocaleString()}</span>
                </motion.p>
              ) : (
                <p className="text-2xl font-black text-white/40">No wins today 🌧️</p>
              )}
            </div>

            {/* Countdown */}
            <div className="w-full flex flex-col items-center gap-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                Next cards refresh in
              </p>
              <div className="font-mono text-4xl font-black text-primary-gold tracking-[0.1em] bg-white/5 px-8 py-3 rounded-2xl border border-white/10">
                {timeLeft}
              </div>
            </div>

            {/* Bottom shimmer */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-gold/40 to-transparent" />
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── ACTIVE SCRATCH VIEW ─────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-sm mx-auto font-fredoka select-none">

      {/* Win burst overlay */}
      <AnimatePresence>
        {showWinBurst && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center"
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-2xl"
                initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                animate={{
                  scale: [0, 1.5, 0],
                  x: Math.cos((i / 12) * Math.PI * 2) * 120,
                  y: Math.sin((i / 12) * Math.PI * 2) * 120,
                  opacity: [1, 1, 0],
                }}
                transition={{ duration: 1, delay: i * 0.05 }}
              >
                {["⭐", "🪙", "✨", "💫"][i % 4]}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header: Card tracker */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-black text-deep-violet dark:text-white uppercase tracking-wider">
            🎟️ Daily Scratch Cards
          </h2>
          <span className="text-xs font-black text-deep-violet/50 dark:text-white/40 uppercase tracking-wider bg-deep-violet/5 dark:bg-white/5 px-3 py-1 rounded-full border border-deep-violet/10 dark:border-white/10">
            {remaining} left today
          </span>
        </div>

        {/* 3-slot card progress indicator */}
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: DAILY_SCRATCH_LIMIT }).map((_, i) => {
            const isDone = i < attemptsUsed;
            const isCurrent = i === attemptsUsed;
            return (
              <motion.div
                key={i}
                animate={isCurrent ? { y: [0, -3, 0] } : {}}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className={`relative overflow-hidden rounded-2xl border-2 py-3 px-2 flex flex-col items-center gap-1.5 transition-all duration-300 ${
                  isDone
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : isCurrent
                    ? "border-primary-gold/60 bg-primary-gold/5 shadow-lg shadow-primary-gold/10"
                    : "border-deep-violet/10 dark:border-white/10 bg-deep-violet/3 dark:bg-white/3"
                }`}
              >
                {isCurrent && (
                  <div className="absolute inset-0 bg-gradient-to-b from-primary-gold/8 to-transparent pointer-events-none" />
                )}
                <span className="text-xl">
                  {isDone ? "✅" : isCurrent ? "🎟️" : "🔒"}
                </span>
                <span className={`text-[9px] font-black uppercase tracking-wider ${
                  isDone ? "text-emerald-500" : isCurrent ? "text-primary-gold" : "text-deep-violet/25 dark:text-white/20"
                }`}>
                  {isDone ? "Scratched" : isCurrent ? "Active" : `Card ${i + 1}`}
                </span>
                {isCurrent && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary-gold animate-pulse" />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Main scratch card container */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className={`relative overflow-hidden rounded-[1.75rem] shadow-2xl transition-all duration-300 ${
          isScratching ? "scale-[1.01]" : "scale-100"
        }`}
        style={{
          boxShadow: isScratching
            ? "0 0 0 3px rgba(245,183,0,0.5), 0 20px 60px rgba(245,183,0,0.2)"
            : isRevealed && outcome?.isWin
            ? "0 0 0 3px rgba(16,185,129,0.5), 0 20px 60px rgba(16,185,129,0.2)"
            : "0 20px 60px rgba(45,27,105,0.2)",
        }}
      >
        {/* Card inner background */}
        <div className={`relative w-full bg-gradient-to-br ${
          isRevealed && outcome?.isWin
            ? "from-amber-50 via-yellow-50 to-amber-100 dark:from-amber-950/80 dark:via-yellow-950/60 dark:to-amber-900/80"
            : isRevealed
            ? "from-slate-50 to-white dark:from-card dark:to-card"
            : "from-[#140a35] to-[#0d0824]"
        }`} style={{ minHeight: "210px" }}>

          {/* Ambient particles on dark cover */}
          {!isRevealed && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {Array.from({ length: 6 }).map((_, i) => <Particle key={i} delay={i * 0.5} />)}
            </div>
          )}

          {/* Prize reveal / loading layer */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            <AnimatePresence mode="wait">
              {isRevealed && isRevealing && !outcome && (
                // Loading: canvas cleared but API hasn't responded yet
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-3"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                    className="w-10 h-10 rounded-full border-4 border-primary-gold/20 border-t-primary-gold"
                  />
                  <p className="text-xs font-black text-deep-violet/50 dark:text-white/40 uppercase tracking-wider">
                    Revealing your prize...
                  </p>
                </motion.div>
              )}
              {isRevealed && outcome && (
                // Prize loaded from server
                <motion.div
                  key="prize"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="flex flex-col items-center gap-3"
                >
                  <motion.span
                    animate={outcome.isWin ? { rotate: [0, -5, 5, -5, 0], scale: [1, 1.1, 1] } : {}}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="text-7xl filter drop-shadow-lg"
                  >
                    {outcome.emoji}
                  </motion.span>

                  <div>
                    <h3 className={`text-3xl font-black leading-none ${
                      outcome.isWin ? "text-amber-600 dark:text-primary-gold" : "text-slate-600 dark:text-slate-400"
                    }`}>
                      {outcome.name}
                    </h3>
                    {outcome.coinReward > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="mt-2 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary-gold/15 border border-primary-gold/30"
                      >
                        <span className="text-base">🪙</span>
                        <span className="text-sm font-black text-amber-600 dark:text-primary-gold">
                          +{outcome.coinReward} Coins Earned!
                        </span>
                      </motion.div>
                    )}
                  </div>

                  <p className="text-xs font-bold text-slate-500 dark:text-white/50 max-w-[240px] italic leading-relaxed">
                    &ldquo;{outcome.fortune}&rdquo;
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Canvas scratch overlay */}
          <canvas
            ref={canvasRef}
            width={340}
            height={210}
            onMouseDown={startScratching}
            onMouseMove={scratch}
            onMouseUp={stopScratching}
            onMouseLeave={stopScratching}
            onTouchStart={startScratching}
            onTouchMove={scratch}
            onTouchEnd={stopScratching}
            className="absolute inset-0 z-10 w-full h-full touch-none"
            style={{ cursor: isRevealed ? "default" : isScratching ? "none" : "crosshair" }}
          />

        </div>
      </motion.div>

      {/* Scratch hint */}
      <AnimatePresence>
        {!isRevealed && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center text-[11px] font-bold text-deep-violet/40 dark:text-white/30 uppercase tracking-widest mt-3"
          >
            ☝️ Drag your finger or mouse across the card
          </motion.p>
        )}
      </AnimatePresence>

      {/* Action row */}
      <div className="mt-5 flex items-center justify-center gap-3">
        <AnimatePresence mode="wait">
          {!isRevealed ? (
                    <motion.button
              key="auto-reveal"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              disabled={isRevealing}
              onClick={() => {
                const canvas = canvasRef.current;
                const ctx = canvas?.getContext("2d");
                revealCard(ctx || undefined, canvas?.width, canvas?.height);
              }}
              className="flex items-center gap-2 py-2.5 px-5 rounded-2xl text-xs font-black bg-deep-violet/8 dark:bg-white/8 border border-deep-violet/15 dark:border-white/15 text-deep-violet/70 dark:text-white/60 hover:bg-deep-violet/15 dark:hover:bg-white/15 disabled:opacity-40 cursor-pointer active:scale-95 transition-all uppercase tracking-wider"
            >
              {isRevealing ? (
                <><motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.6, ease: "linear" }}>⏳</motion.span> Fetching prize...</>
              ) : (
                <><span>⚡</span> Auto-Reveal Card</>
              )}
            </motion.button>
          ) : (
            attemptsUsed < DAILY_SCRATCH_LIMIT && (
              <motion.button
                key="next-card"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                onClick={initCard}
                className="flex items-center gap-2 py-3.5 px-8 rounded-2xl text-sm font-black bg-primary-gold hover:bg-[#e0a700] text-deep-violet shadow-xl shadow-primary-gold/30 cursor-pointer active:scale-95 transition-all uppercase tracking-wider"
              >
                <span>🎟️</span>
                Next Card — {attemptsUsed}/{DAILY_SCRATCH_LIMIT} used
                <span>→</span>
              </motion.button>
            )
          )}
        </AnimatePresence>
      </div>

      {/* Today's running total */}
      {(profile.scratchPrizeWon ?? 0) > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-primary-gold/8 border border-primary-gold/20"
        >
          <span className="text-lg">🪙</span>
          <span className="text-sm font-black text-amber-600 dark:text-primary-gold uppercase tracking-wider">
            Total today: +{(profile.scratchPrizeWon ?? 0).toLocaleString()} Coins
          </span>
        </motion.div>
      )}

      {/* Result popup */}
      {outcome && (
        <ResultCard
          isOpen={showResult}
          onClose={() => setShowResult(false)}
          gameName="Scratch Card"
          emoji={outcome.emoji}
          title={`Card Revealed: ${outcome.name}`}
          description={outcome.fortune}
          scoreImpact={outcome.scoreImpact}
          isWin={outcome.isWin}
          onShare={() => setShowShare(true)}
        />
      )}

      {outcome && (
        <ShareModal
          isOpen={showShare}
          onClose={() => setShowShare(false)}
          score={currentScore}
          game="Scratch Card"
          prize={`Scratched ${outcome.name}`}
        />
      )}
    </div>
  );
}
