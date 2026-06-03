"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  WHEEL_FREE_DAILY_SPINS,
  WHEEL_MAX_PAID_SPINS,
  WHEEL_PAID_SPIN_COST,
  WHEEL_PRIZES,
  Prize,
} from "@/lib/prizes";
import { playTick } from "@/lib/audio";
import { useLuckStore } from "@/store/luckStore";
import { useAuth } from "@/components/auth/AuthProvider";
import ResultCard from "@/components/ui/ResultCard";
import ShareModal from "@/components/ui/ShareModal";
import { animate } from "framer-motion";

const SPIN_DURATION_SECONDS = 7.5;

function shadeHexColor(hex: string, amount: number) {
  const normalizedHex = hex.replace("#", "");
  const color = Number.parseInt(normalizedHex, 16);
  const r = Math.max(0, Math.min(255, (color >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((color >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (color & 0xff) + amount));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export default function WheelGame() {
  const { user } = useAuth();
  const isGuest = !user;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<Prize | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [walletMessage, setWalletMessage] = useState<string | null>(null);

  // Use the standard WHEEL_PRIZES segments
  const segments = WHEEL_PRIZES;

  const addResult = useLuckStore((state) => state.addResult);
  const addCoins = useLuckStore((state) => state.addCoins);
  const coinBalance = useLuckStore((state) => state.coinBalance);
  const currentScore = useLuckStore((state) => state.luckyScore);
  const wheelDailySpinsUsed = useLuckStore((state) => state.wheelDailySpinsUsed);
  const wheelPaidSpinsUsed = useLuckStore((state) => state.wheelPaidSpinsUsed);
  const refreshWheelSpins = useLuckStore((state) => state.refreshWheelSpins);
  const consumeWheelSpin = useLuckStore((state) => state.consumeWheelSpin);

  // Spin availability
  const hasUsedFreeSpinToday = wheelDailySpinsUsed >= WHEEL_FREE_DAILY_SPINS;
  const freeSpinAvailable = !hasUsedFreeSpinToday;
  const paidSpinsLeft = Math.max(0, WHEEL_MAX_PAID_SPINS - wheelPaidSpinsUsed);
  const totalSpinsLeft = (freeSpinAvailable ? 1 : 0) + paidSpinsLeft;
  const isDailyLimitReached = totalSpinsLeft === 0;
  const canAffordPaidSpin = coinBalance >= WHEEL_PAID_SPIN_COST;
  // Can spin if: signed in AND (has free spin, OR has paid spins left and enough coins)
  const canSpin = !isGuest && (freeSpinAvailable || (paidSpinsLeft > 0 && canAffordPaidSpin));

  // Redraw the canvas wheel whenever rotation changes
  const drawWheel = useCallback((currentRotation: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const center = width / 2;
    const radius = width / 2 - 15;

    ctx.clearRect(0, 0, width, height);

    const numSegments = segments.length;

    // Robust canvas fallback for empty wheel
    if (numSegments === 0) {
      const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");

      // Draw outer gold ring
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, 2 * Math.PI);
      ctx.fillStyle = isDark ? "rgba(255, 248, 231, 0.05)" : "rgba(45, 27, 105, 0.05)";
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#F5B700";
      ctx.stroke();

      // Placeholder indicator text
      ctx.fillStyle = isDark ? "#FFF8E7" : "#2D1B69";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "bold 13px var(--font-fredoka), sans-serif";
      ctx.fillText("Empty Wheel 🎡", center, center - 10);
      ctx.font = "bold 10px var(--font-nunito), sans-serif";
      ctx.fillStyle = isDark ? "rgba(255, 248, 231, 0.4)" : "rgba(45, 27, 105, 0.4)";
      ctx.fillText("Add 2+ options to start", center, center + 12);
      return;
    }

    const arcSize = (2 * Math.PI) / numSegments;

    const wheelBase = ctx.createRadialGradient(center, center, radius * 0.1, center, center, radius + 10);
    wheelBase.addColorStop(0, "#FFF8E7");
    wheelBase.addColorStop(0.72, "#F5B700");
    wheelBase.addColorStop(1, "#7C4A12");

    ctx.save();
    ctx.shadowColor = "rgba(45, 27, 105, 0.28)";
    ctx.shadowBlur = 22;
    ctx.shadowOffsetY = 12;
    ctx.beginPath();
    ctx.arc(center, center, radius + 8, 0, 2 * Math.PI);
    ctx.fillStyle = wheelBase;
    ctx.fill();
    ctx.restore();

    // Save state for global rotation
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate((currentRotation * Math.PI) / 180);

    // Draw segment wedges
    for (let i = 0; i < numSegments; i++) {
      const angle = i * arcSize;
      const prize = segments[i];

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, angle, angle + arcSize);
      ctx.closePath();

      const wedgeGradient = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius);
      wedgeGradient.addColorStop(0, shadeHexColor(prize.color, 38));
      wedgeGradient.addColorStop(0.62, prize.color);
      wedgeGradient.addColorStop(1, shadeHexColor(prize.color, -38));
      ctx.fillStyle = wedgeGradient;
      ctx.fill();

      // Wedges border divider
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(255, 248, 231, 0.92)";
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, radius - 14, angle + 0.015, angle + arcSize - 0.015);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
      ctx.stroke();

      // Draw prize text radially
      ctx.save();
      ctx.rotate(angle + arcSize / 2);
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(45, 27, 105, 0.45)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 2;
      
      // Determine font size based on segment count to prevent overlapping text
      const fontSize = numSegments > 10 ? "11px" : "13px";
      ctx.font = `bold ${fontSize} var(--font-fredoka), sans-serif`;
      
      // Draw text offset from center
      ctx.fillText(`${prize.emoji} ${prize.name}`, radius - 20, 0);
      ctx.restore();
    }

    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, radius + 5, 0, 2 * Math.PI);
    ctx.lineWidth = 10;
    ctx.strokeStyle = "#F5B700";
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(center, center, radius - 2, 0, 2 * Math.PI);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(255, 248, 231, 0.85)";
    ctx.stroke();

    const rivetCount = 16;
    for (let i = 0; i < rivetCount; i++) {
      const angle = (i / rivetCount) * Math.PI * 2;
      const x = center + Math.cos(angle) * (radius + 6);
      const y = center + Math.sin(angle) * (radius + 6);
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fillStyle = i % 2 === 0 ? "#FFF8E7" : "#2D1B69";
      ctx.globalAlpha = 0.78;
      ctx.fill();
    }
    ctx.restore();

    // Draw central golden peg hub
    const hubGradient = ctx.createRadialGradient(center - 6, center - 8, 4, center, center, 24);
    hubGradient.addColorStop(0, "#FFF8E7");
    hubGradient.addColorStop(0.4, "#F5B700");
    hubGradient.addColorStop(1, "#9C6518");
    ctx.beginPath();
    ctx.arc(center, center, 24, 0, 2 * Math.PI);
    ctx.fillStyle = hubGradient;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#FFF8E7";
    ctx.stroke();

    // Hub core decoration
    ctx.beginPath();
    ctx.arc(center, center, 9, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
  }, [segments]);

  // Redraw when rotation or segments list changes
  useEffect(() => {
    drawWheel(rotation);
  }, [drawWheel, rotation]);

  useEffect(() => {
    refreshWheelSpins();
  }, [refreshWheelSpins]);

  const getWeightedPrizeIndex = () => {
    const totalWeight = segments.reduce((sum, prize) => sum + prize.weight, 0);
    let ticket = Math.random() * totalWeight;

    for (let i = 0; i < segments.length; i++) {
      ticket -= segments[i].weight;
      if (ticket <= 0) {
        return i;
      }
    }

    return segments.length - 1;
  };

  const handleSpin = () => {
    if (segments.length < 2) {
      setWalletMessage("You need at least 2 sections on the wheel to spin.");
      return;
    }

    if (isSpinning) return;

    if (isDailyLimitReached) {
      setWalletMessage("Daily spin limit reached (1 free + 5 paid). Come back tomorrow!");
      return;
    }

    // Paid spin check: free spin already used and no coins
    if (hasUsedFreeSpinToday && !canAffordPaidSpin) {
      setWalletMessage(`You need ${WHEEL_PAID_SPIN_COST} points to spin again.`);
      return;
    }

    if (!consumeWheelSpin()) {
      setWalletMessage("Unable to spin. Check your points or daily limit.");
      return;
    }

    setWalletMessage(null);
    setIsSpinning(true);
    setShowResult(false);
    setResult(null);

    const numSegments = segments.length;
    const segmentAngle = 360 / numSegments;
    const prizeIndex = getWeightedPrizeIndex();
    const prize = segments[prizeIndex];
    const segmentCenterAngle = (prizeIndex * segmentAngle) + (segmentAngle / 2);
    const targetAngle = 270 - segmentCenterAngle;
    const normalizedTarget = ((targetAngle % 360) + 360) % 360;
    const rotationDelta = ((rotation - normalizedTarget) % 360 + 360) % 360;
    const finalRotation = rotation - rotationDelta - (360 * 7);

    let lastTickAngle = rotation;

    animate(rotation, finalRotation, {
      duration: SPIN_DURATION_SECONDS,
      ease: [0.1, 0.8, 0.1, 1],
      onUpdate: (latest) => {
        setRotation(latest);
        drawWheel(latest);
        const delta = Math.abs(latest - lastTickAngle);
        if (delta >= segmentAngle) {
          playTick();
          lastTickAngle = latest;
        }
      },
      onComplete: () => {
        setIsSpinning(false);
        setResult(prize);
        setShowResult(true);
        addCoins(prize.coinReward);
        addResult(
          "Fortune Wheel",
          prize.isWin
            ? `${prize.emoji} Won ${prize.coinReward} points`
            : `${prize.emoji} Try again`,
          prize.isWin,
          prize.scoreImpact
        );
      },
    });
  };

  return (
    <div className="w-full max-w-md mx-auto py-0 sm:py-4 flex flex-col items-center select-none">
      {/* Game board wrapper */}
      <div className="relative mb-4 sm:mb-8 p-4 sm:p-6 bg-[radial-gradient(circle_at_50%_0%,rgba(245,183,0,0.24),transparent_38%),linear-gradient(145deg,rgba(255,255,255,0.96),rgba(255,248,231,0.78))] dark:bg-[radial-gradient(circle_at_50%_0%,rgba(245,183,0,0.22),transparent_40%),linear-gradient(145deg,rgba(27,16,62,0.98),rgba(8,5,20,0.96))] border border-primary-gold/45 rounded-[28px] shadow-[0_22px_60px_rgba(45,27,105,0.18)] dark:shadow-[0_22px_60px_rgba(0,0,0,0.45)] flex flex-col items-center w-full overflow-hidden">
        <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
        <div className="absolute -left-10 top-16 w-28 h-28 rounded-full border border-accent-teal/20" />
        <div className="absolute -right-8 bottom-20 w-24 h-24 rounded-full border border-primary-gold/25" />
        
        {/* Top gold needle pointer */}
        <div className="absolute top-5 sm:top-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center drop-shadow-lg">
          <div className="w-9 h-9 rounded-full bg-deep-violet dark:bg-cream-soft border-[5px] border-primary-gold" />
          <div className="-mt-2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[34px] border-t-primary-gold" />
        </div>

        {/* Outer Wheel boundary glow */}
        <div className="relative mt-7 sm:mt-8 rounded-full p-2 sm:p-3 bg-deep-violet/10 dark:bg-white/10 border border-white/70 dark:border-white/10 shadow-[inset_0_0_28px_rgba(45,27,105,0.12),0_18px_40px_rgba(45,27,105,0.16)]">
          <div className="absolute inset-1 rounded-full border border-primary-gold/45 pointer-events-none" />
          <canvas
            ref={canvasRef}
            width={340}
            height={340}
            className="relative w-[240px] h-[240px] min-[390px]:w-[260px] min-[390px]:h-[260px] sm:w-[340px] sm:h-[340px]"
          />
        </div>

        {/* Spin status cards: free spin + paid spins */}
        <div className="relative z-[1] mt-4 w-full grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-white/60 dark:border-white/10 bg-white/75 dark:bg-black/35 px-3 py-2 text-center shadow-sm">
            <span className="block text-[9px] font-black uppercase tracking-widest text-deep-violet/45 dark:text-cream-soft/45">
              Free Spin
            </span>
            <span className={`font-fredoka text-lg font-black ${freeSpinAvailable ? "text-emerald-500" : "text-deep-violet/40 dark:text-cream-soft/30 line-through"}`}>
              {freeSpinAvailable ? "✓ Available" : "Used"}
            </span>
          </div>
          <div className="rounded-xl border border-white/60 dark:border-white/10 bg-white/75 dark:bg-black/35 px-3 py-2 text-center shadow-sm">
            <span className="block text-[9px] font-black uppercase tracking-widest text-deep-violet/45 dark:text-cream-soft/45">
              Paid Spins Left
            </span>
            <span className="font-fredoka text-lg font-black text-primary-gold">
              {paidSpinsLeft}/{WHEEL_MAX_PAID_SPINS}
            </span>
          </div>
        </div>

        {/* Play Action button */}
        <button
          disabled={isSpinning || !canSpin}
          onClick={handleSpin}
          className={`mt-5 sm:mt-6 py-3.5 sm:py-4 px-6 sm:px-8 rounded-xl sm:rounded-2xl font-extrabold text-base sm:text-lg select-none cursor-pointer tracking-wider shadow-lg transition-all transform active:scale-95 w-full border ${
            isSpinning || !canSpin
              ? "bg-[#2D1B69]/10 dark:bg-white/5 text-[#2D1B69]/40 dark:text-soft-cream/30 border-[#2D1B69]/10 dark:border-white/5 pointer-events-none cursor-not-allowed"
              : "bg-[#2D1B69] hover:bg-primary-gold text-soft-cream hover:text-[#2D1B69] border-[#2D1B69] hover:border-primary-gold dark:bg-primary-gold dark:text-[#1E1145] dark:border-primary-gold dark:hover:bg-[#E0A700] dark:hover:border-[#E0A700] hover:shadow-xl"
          }`}
        >
          {isSpinning
            ? "Spinning..."
            : isGuest
              ? "SIGN IN TO SPIN"
              : isDailyLimitReached
                ? "SPINS EXHAUSTED FOR TODAY"
                : freeSpinAvailable
                  ? "SPIN THE WHEEL — FREE"
                  : canAffordPaidSpin
                    ? `SPIN — ${WHEEL_PAID_SPIN_COST} PTS`
                    : `NEED ${WHEEL_PAID_SPIN_COST} PTS TO SPIN`}
        </button>
        {isGuest && (
          <p className="mt-3 text-xs font-bold text-[#F5B700] text-center animate-pulse">
            ✨ Sign in using Google at the top to spin the wheel and claim rewards!
          </p>
        )}
        {walletMessage && !isGuest && (
          <p className="mt-3 text-xs font-bold text-alert-coral text-center">
            {walletMessage}
          </p>
        )}
        {!walletMessage && !isGuest && isDailyLimitReached && (
          <p className="mt-3 text-xs font-bold text-alert-coral text-center">
            Daily limit: 1 free + 5 paid spins. Come back tomorrow!
          </p>
        )}
        {!walletMessage && !isGuest && !isDailyLimitReached && !freeSpinAvailable && !canAffordPaidSpin && (
          <p className="mt-3 text-xs font-bold text-alert-coral text-center">
            You need {WHEEL_PAID_SPIN_COST} points to spin again.
          </p>
        )}
      </div>

      {/* Popups & Dialogs */}
      {result && (
        <ResultCard
          isOpen={showResult}
          onClose={() => setShowResult(false)}
          gameName="Fortune Wheel"
          emoji={result.emoji}
          title={`Wheel selected: ${result.name}!`}
          description={
            result.isWin
              ? `You won ${result.coinReward.toLocaleString()} points.`
              : "Try again when you are ready."
          }
          scoreImpact={result.scoreImpact}
          isWin={result.isWin}
          onRestart={handleSpin}
          onShare={() => setShowShare(true)}
        />
      )}

      {result && (
        <ShareModal
          isOpen={showShare}
          onClose={() => setShowShare(false)}
          score={currentScore}
          game="Fortune Wheel"
          prize={result.isWin ? `${result.emoji} ${result.coinReward} points` : `${result.emoji} Try Again`}
        />
      )}
    </div>
  );
}

