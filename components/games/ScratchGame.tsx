"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { SCRATCH_PRIZES, ScratchPrize } from "@/lib/prizes";
import { playScratch } from "@/lib/audio";
import { useLuckStore } from "@/store/luckStore";
import { useAuth } from "@/components/auth/AuthProvider";
import ResultCard from "@/components/ui/ResultCard";
import ShareModal from "@/components/ui/ShareModal";

export default function ScratchGame() {
  const { user } = useAuth();
  const activeUserKey = useLuckStore((state) => state.activeUserKey);
  const profile = useLuckStore((state) => state.profiles[activeUserKey]) || useLuckStore((state) => state.profiles["guest"]);
  const claimScratchCard = useLuckStore((state) => state.claimScratchCard);
  const currentScore = useLuckStore((state) => state.luckyScore);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const scratchCountRef = useRef(0);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const [outcome, setOutcome] = useState<ScratchPrize | null>(null);
  const [scratchedPercent, setScratchedPercent] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);

  const [showResult, setShowResult] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  const isScratchUsed = profile?.scratchUsed ?? false;

  // Ticking countdown until midnight local time
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const diff = tomorrow.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft("00h 00m 00s");
        return;
      }
      const hrs = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, "0");
      const mins = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, "0");
      const secs = String(Math.floor((diff / 1000) % 60)).padStart(2, "0");

      setTimeLeft(`${hrs}h ${mins}m ${secs}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // Weight-based probability selector
  const getWeightedPrize = () => {
    const totalWeight = SCRATCH_PRIZES.reduce((sum, prize) => sum + prize.weight, 0);
    let ticket = Math.random() * totalWeight;

    for (let i = 0; i < SCRATCH_PRIZES.length; i++) {
      ticket -= SCRATCH_PRIZES[i].weight;
      if (ticket <= 0) {
        return SCRATCH_PRIZES[i];
      }
    }

    return SCRATCH_PRIZES[SCRATCH_PRIZES.length - 1];
  };

  const initializeScratcher = () => {
    if (isScratchUsed) return;

    // 1. Pick a weighted prize outcome
    const randomPick = getWeightedPrize();
    setOutcome(randomPick);
    setScratchedPercent(0);
    setIsRevealed(false);
    setShowResult(false);

    // 2. Initialize Canvas Cover
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Silver metallic gradient
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, "#D1D5DB");
    grad.addColorStop(0.3, "#E5E7EB");
    grad.addColorStop(0.5, "#F3F4F6");
    grad.addColorStop(0.7, "#9CA3AF");
    grad.addColorStop(1, "#6B7280");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add gold speckles pattern for a luxury scratch experience
    ctx.fillStyle = "rgba(245, 183, 0, 0.25)";
    for (let i = 0; i < 250; i++) {
      const sx = Math.random() * canvas.width;
      const sy = Math.random() * canvas.height;
      ctx.fillRect(sx, sy, 2, 2);
    }

    // Add silver speckles
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    for (let i = 0; i < 200; i++) {
      const sx = Math.random() * canvas.width;
      const sy = Math.random() * canvas.height;
      ctx.beginPath();
      ctx.arc(sx, sy, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Centered cover text
    ctx.fillStyle = "#2D1B69";
    ctx.font = "bold 13px var(--font-fredoka), sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SCRATCH WITH MOUSE OR TOUCH! 🪙", canvas.width / 2, canvas.height / 2);
  };

  useEffect(() => {
    initializeScratcher();
  }, [isScratchUsed]);

  const getCoordinates = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ("touches" in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Scale coordinates accurately back to match Canvas resolution
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  };

  const startScratching = () => {
    if (isRevealed || isScratchUsed) return;
    isDrawingRef.current = true;
  };

  const scratch = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current || isRevealed || isScratchUsed) return;

    const coords = getCoordinates(e.nativeEvent);
    if (!coords) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    // Erase canvas pixels
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(coords.x, coords.y, 18, 0, Math.PI * 2);
    ctx.fill();

    // Procedural sound synthesis sweeps
    playScratch();

    // Performance throttled: only inspect percentage every 12 operations to avoid main thread delays!
    scratchCountRef.current++;
    if (scratchCountRef.current % 12 === 0) {
      checkScratchedPercent(ctx, canvas.width, canvas.height);
    }
  };

  const stopScratching = () => {
    isDrawingRef.current = false;
  };

  const checkScratchedPercent = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    let transparentCount = 0;

    // Step index skip inspection: high performance sampling!
    const step = 32; // Skip 32 bytes (8 pixels) per cycle
    let totalChecks = 0;

    for (let i = 3; i < data.length; i += step) {
      totalChecks++;
      if (data[i] === 0) {
        transparentCount++;
      }
    }

    const percent = (transparentCount / totalChecks) * 100;
    setScratchedPercent(percent);

    if (percent > 55) {
      revealCard(ctx, w, h);
    }
  };

  const revealCard = (ctx?: CanvasRenderingContext2D, w?: number, h?: number) => {
    setIsRevealed(true);
    isDrawingRef.current = false;
    setScratchedPercent(100);

    const canvas = canvasRef.current;
    const activeCtx = ctx || canvas?.getContext("2d");
    if (canvas && activeCtx) {
      activeCtx.clearRect(0, 0, w || canvas.width, h || canvas.height);
    }

    // Trigger Result Popup and update store
    setTimeout(() => {
      if (!isMounted.current) return;
      if (outcome) {
        setShowResult(true);
        claimScratchCard(outcome.coinReward, outcome.name, outcome.isWin, outcome.scoreImpact);
      }
    }, 600);
  };

  // If the user has already scratched today, render the gorgeous used-ticket view
  if (isScratchUsed) {
    return (
      <div className="w-full max-w-md mx-auto p-6 bg-[radial-gradient(circle_at_50%_0%,rgba(245,183,0,0.24),transparent_40%),linear-gradient(145deg,rgba(255,255,255,0.96),rgba(255,248,231,0.78))] dark:bg-[radial-gradient(circle_at_50%_0%,rgba(245,183,0,0.22),transparent_40%),linear-gradient(145deg,rgba(27,16,62,0.98),rgba(8,5,20,0.96))] border border-primary-gold/45 rounded-[2.5rem] shadow-[0_22px_60px_rgba(45,27,105,0.18)] dark:shadow-[0_22px_60px_rgba(0,0,0,0.45)] flex flex-col items-center justify-center text-center overflow-hidden min-h-[420px] select-none relative font-fredoka">
        
        {/* Mesh magical backdrop */}
        <div className="absolute inset-0 bg-radial from-violet-500/5 via-transparent to-transparent pointer-events-none animate-hue-sweep" />
        
        {/* Ticket Graphic Icon */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full bg-deep-violet/5 dark:bg-white/5 flex items-center justify-center border border-deep-violet/10 dark:border-white/10 shadow-inner">
            <span className="text-6xl animate-pulse select-none">🎟️</span>
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-black border-2 border-white dark:border-card shadow-md animate-scale-up">
            ✓
          </div>
        </div>

        <h3 className="text-2xl font-black uppercase tracking-wider text-deep-violet dark:text-cream-soft leading-none">
          Daily Card Claimed!
        </h3>
        
        <p className="mt-2 text-xs font-bold text-deep-violet/50 dark:text-cream-soft/50 max-w-[260px] leading-relaxed">
          You've completed your daily scratch session. Keep earning coins by spinning the wheel!
        </p>
        
        <div className="mt-5 px-6 py-4 rounded-3xl bg-primary-gold/10 border border-primary-gold/20 flex flex-col items-center shadow-inner min-w-[240px]">
          <p className="text-[10px] font-black uppercase tracking-widest text-deep-violet/40 dark:text-cream-soft/40">
            Coins Won Today
          </p>
          <p className="mt-1.5 font-mono text-3xl font-black text-primary-gold flex items-center gap-2 drop-shadow-sm select-none">
            {profile.scratchPrizeWon && profile.scratchPrizeWon > 0 ? (
              <>
                <span className="text-3xl select-none">🪙</span>
                <span>+{profile.scratchPrizeWon}</span>
              </>
            ) : (
              <>
                <span className="text-3xl select-none">🌧️</span>
                <span className="text-2xl font-black font-fredoka uppercase tracking-wider">Try Again</span>
              </>
            )}
          </p>
        </div>

        {/* Live ticking countdown timer */}
        <div className="mt-8 w-full flex flex-col items-center">
          <span className="text-[10px] font-black uppercase tracking-widest text-deep-violet/40 dark:text-cream-soft/40">
            Next Ticket Available In:
          </span>
          <span className="mt-2 font-mono text-3xl font-black text-[#2D1B69] dark:text-primary-gold bg-deep-violet/5 dark:bg-white/5 py-2.5 px-7 rounded-2xl border border-deep-violet/10 dark:border-white/10 tracking-wider shadow-inner min-w-[210px] select-none">
            {timeLeft}
          </span>
        </div>

        {/* Guest prompt banner */}
        {!user && (
          <div className="mt-6 p-4 bg-primary-gold/10 border border-primary-gold/20 rounded-2xl text-center max-w-sm animate-pulse">
            <p className="text-[10px] font-black text-primary-gold uppercase tracking-widest leading-relaxed">
              🎮 Playing as Guest
            </p>
            <p className="text-[9px] font-bold text-deep-violet/60 dark:text-cream-soft/60 mt-1 normal-case leading-relaxed">
              Your guest coins are stored locally. Sign in using Google at the top to sync your coins permanently to the cloud and compete in the leaderboards!
            </p>
          </div>
        )}

        <p className="mt-6 text-[9px] font-black text-deep-violet/30 dark:text-cream-soft/30 uppercase tracking-widest max-w-[260px] leading-relaxed">
          ★ Maximum reward up to 1000 Coins daily ★
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center max-w-lg mx-auto py-8">
      {/* Percentage Gauge bar */}
      <div className="w-full max-w-xs mb-4 flex items-center justify-between font-bold text-xs select-none">
        <span className="text-deep-violet/40 dark:text-cream-soft/40 uppercase tracking-widest">
          Scratched:
        </span>
        <span className="text-primary-gold font-mono font-black text-sm">
          {Math.round(scratchedPercent)}%
        </span>
      </div>
      <div className="w-full max-w-xs h-2 bg-deep-violet/10 dark:bg-white/10 rounded-full overflow-hidden mb-6">
        <motion.div
          animate={{ width: `${scratchedPercent}%` }}
          className="h-full bg-primary-gold rounded-full"
        />
      </div>

      {/* Scratch Container Card */}
      <div className="relative w-[320px] h-[200px] bg-white dark:bg-card border-4 border-primary-gold rounded-3xl shadow-xl flex items-center justify-center select-none overflow-hidden touch-none">
        
        {/* UNDERNEATH LAYER: The Reveal Message */}
        {outcome && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center select-none bg-gradient-to-b from-white to-primary-gold/5 dark:from-card dark:to-primary-gold/5">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={isRevealed ? { scale: 1, opacity: 1 } : {}}
              className="flex flex-col items-center"
            >
              <span className="text-5xl filter drop-shadow-sm mb-2 select-none">
                {outcome.emoji}
              </span>
              <h4 className="text-2xl font-black font-fredoka text-deep-violet dark:text-cream-soft leading-tight">
                {outcome.name}
              </h4>
              {outcome.coinReward > 0 && (
                <span className="text-xs font-black uppercase tracking-widest text-[#E0A700] mt-1 select-none animate-pulse">
                  ★ Reward Earned! ★
                </span>
              )}
              <p className="text-[10px] font-bold text-deep-violet/60 dark:text-cream-soft/60 max-w-[220px] mt-2 italic leading-relaxed">
                "{outcome.fortune}"
              </p>
            </motion.div>
          </div>
        )}

        {/* OVERLAY CANVAS: Scratch cover */}
        <canvas
          ref={canvasRef}
          width={312}
          height={192}
          onMouseDown={startScratching}
          onMouseMove={scratch}
          onMouseUp={stopScratching}
          onMouseLeave={stopScratching}
          onTouchStart={startScratching}
          onTouchMove={scratch}
          onTouchEnd={stopScratching}
          className="absolute z-10 w-full h-full cursor-crosshair active:scale-[0.99] transition-transform"
        />
      </div>

      {/* Auto-reveal button */}
      {!isRevealed && (
        <button
          onClick={() => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext("2d");
            revealCard(ctx || undefined, canvas?.width, canvas?.height);
          }}
          className="mt-6 py-2 px-4 rounded-xl text-xs font-bold bg-deep-violet/5 dark:bg-white/5 border border-deep-violet/10 dark:border-white/10 text-deep-violet dark:text-cream-soft hover:bg-deep-violet/10 dark:hover:bg-white/10 cursor-pointer active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-gold focus-visible:border-transparent"
        >
          Auto-Reveal Card 🪙
        </button>
      )}

      {/* Guest Warning Hint Banner */}
      {!user && (
        <div className="mt-8 p-4 bg-primary-gold/10 border border-primary-gold/20 rounded-2xl text-center max-w-xs animate-pulse">
          <p className="text-[10px] font-black text-primary-gold uppercase tracking-widest leading-relaxed">
            🎮 Playing as Guest
          </p>
          <p className="text-[9px] font-bold text-deep-violet/60 dark:text-cream-soft/60 mt-1 normal-case leading-relaxed">
            Guests are limited to 1 free daily scratch. To secure your rewards, unlock leaderboards, and save your coin balance permanently, please Sign In!
          </p>
        </div>
      )}

      {/* Popups & dialog triggers */}
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
