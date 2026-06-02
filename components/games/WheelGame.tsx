"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { WHEEL_PRIZES, WHEEL_SPIN_COST, Prize } from "@/lib/prizes";
import { playTick } from "@/lib/audio";
import { useLuckStore } from "@/store/luckStore";
import ResultCard from "@/components/ui/ResultCard";
import ShareModal from "@/components/ui/ShareModal";
import { animate } from "framer-motion";

export default function WheelGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<Prize | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [walletMessage, setWalletMessage] = useState<string | null>(null);

  // Use the standard WHEEL_PRIZES segments
  const segments = WHEEL_PRIZES;
  const [spinDuration, setSpinDuration] = useState<5 | 10 | 15>(5);

  const addResult = useLuckStore((state) => state.addResult);
  const addCoins = useLuckStore((state) => state.addCoins);
  const spendCoins = useLuckStore((state) => state.spendCoins);
  const coinBalance = useLuckStore((state) => state.coinBalance);
  const currentScore = useLuckStore((state) => state.luckyScore);

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

      // Wedge background
      ctx.fillStyle = prize.color;
      ctx.fill();

      // Wedges border divider
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#FFF8E7";
      ctx.stroke();

      // Draw prize text radially
      ctx.save();
      ctx.rotate(angle + arcSize / 2);
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      
      // Determine font size based on segment count to prevent overlapping text
      const fontSize = numSegments > 10 ? "11px" : "13px";
      ctx.font = `bold ${fontSize} var(--font-fredoka), sans-serif`;
      
      // Draw text offset from center
      ctx.fillText(`${prize.emoji} ${prize.name}`, radius - 20, 0);
      ctx.restore();
    }

    ctx.restore();

    // Draw central golden peg hub
    ctx.beginPath();
    ctx.arc(center, center, 18, 0, 2 * Math.PI);
    ctx.fillStyle = "#F5B700";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#FFF8E7";
    ctx.stroke();

    // Hub core decoration
    ctx.beginPath();
    ctx.arc(center, center, 8, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
  }, [segments]);

  // Redraw when rotation or segments list changes
  useEffect(() => {
    drawWheel(rotation);
  }, [drawWheel, rotation]);

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
    // Check if at least 2 options exist before rotating!
    if (segments.length < 2) {
      setWalletMessage("You need at least 2 sections on the wheel to spin.");
      return;
    }

    if (isSpinning) return;

    if (!spendCoins(WHEEL_SPIN_COST)) {
      setWalletMessage(`You need ${WHEEL_SPIN_COST} coins to spin the wheel.`);
      return;
    }

    setWalletMessage(null);
    setIsSpinning(true);
    setShowResult(false);
    setResult(null);

    const numSegments = segments.length;
    const segmentAngle = 360 / numSegments;

    // Select weighted prize outcome index. The 1000-coin segment is visible,
    // but intentionally has the lowest selection weight.
    const prizeIndex = getWeightedPrizeIndex();
    const prize = segments[prizeIndex];

    // Pointer is at the TOP (270 degrees in canvas math, which is -90 degrees)
    // To make a segment land at the top pointer, we need to calculate:
    // targetAngle = 270 - (segmentMidpointAngle)
    const segmentCenterAngle = (prizeIndex * segmentAngle) + (segmentAngle / 2);
    const targetAngle = 270 - segmentCenterAngle;
    
    // Normalize target angle and calculate the delta required from current rotation
    const normalizedTarget = ((targetAngle % 360) + 360) % 360;
    const rotationDelta = ((rotation - normalizedTarget) % 360 + 360) % 360;
    const finalRotation = rotation - rotationDelta - (360 * 5);

    let lastTickAngle = rotation;

    // Animate rotation using framer motion controls
    animate(rotation, finalRotation, {
      duration: spinDuration, // Dynamic spin duration
      ease: [0.1, 0.8, 0.1, 1], // Perfect fast spin to deceleration curve
      onUpdate: (latest) => {
        setRotation(latest);
        drawWheel(latest);

        // Sound Ticking synthesis logic
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
        // Log result into Zustand Store
        addResult(
          "Fortune Wheel",
          prize.isWin
            ? `${prize.emoji} Won ${prize.coinReward} coins`
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
      <div className="relative mb-4 sm:mb-8 p-3 sm:p-6 bg-white dark:bg-card border-4 border-primary-gold rounded-3xl shadow-xl flex flex-col items-center w-full">
        <div className="w-full mb-3 sm:mb-5 grid grid-cols-2 gap-2 sm:gap-3">
          <div className="rounded-xl sm:rounded-2xl border border-deep-violet/10 dark:border-white/10 bg-deep-violet/5 dark:bg-white/5 p-2 sm:p-3 text-center">
            <span className="block text-[10px] font-black uppercase tracking-widest text-deep-violet/40 dark:text-cream-soft/40">
              Coin Balance
            </span>
            <span className="font-fredoka text-xl sm:text-2xl font-black text-primary-gold leading-none">
              {coinBalance.toLocaleString()}
            </span>
          </div>
          <div className="rounded-xl sm:rounded-2xl border border-deep-violet/10 dark:border-white/10 bg-deep-violet/5 dark:bg-white/5 p-2 sm:p-3 text-center">
            <span className="block text-[10px] font-black uppercase tracking-widest text-deep-violet/40 dark:text-cream-soft/40">
              Spin Cost
            </span>
            <span className="font-fredoka text-xl sm:text-2xl font-black text-deep-violet dark:text-cream-soft leading-none">
              {WHEEL_SPIN_COST}
            </span>
          </div>
        </div>
        
        {/* Top gold needle pointer */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-primary-gold drop-shadow-md" />

        {/* Outer Wheel boundary glow */}
        <div className="rounded-full border-[6px] sm:border-8 border-deep-violet/10 dark:border-white/10 overflow-hidden shadow-inner">
          <canvas
            ref={canvasRef}
            width={340}
            height={340}
            className="w-[230px] h-[230px] min-[390px]:w-[250px] min-[390px]:h-[250px] sm:w-[340px] sm:h-[340px]"
          />
        </div>

        {/* Spin Duration Selector Segmented Control */}
        <div className="w-full mt-3 sm:mt-5 flex items-center justify-between border-t border-deep-violet/10 dark:border-white/10 pt-3 sm:pt-4 pb-1 sm:pb-2 px-1">
          <span className="text-xs font-bold text-deep-violet/50 dark:text-cream-soft/50 uppercase tracking-wider">
            Duration:
          </span>
          <div className="flex gap-1 bg-deep-violet/5 dark:bg-white/5 border border-deep-violet/10 dark:border-white/10 p-0.5 rounded-xl">
            {([5, 10, 15] as const).map((dur) => (
              <button
                key={dur}
                type="button"
                disabled={isSpinning}
                onClick={() => setSpinDuration(dur)}
                className={`py-1 px-2.5 sm:px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  spinDuration === dur
                    ? "bg-primary-gold text-deep-violet shadow-xs font-black"
                    : "text-deep-violet/60 dark:text-cream-soft/60 hover:bg-deep-violet/5 dark:hover:bg-white/5"
                }`}
              >
                {dur}s
              </button>
            ))}
          </div>
        </div>

        {/* Play Action button */}
        <button
          disabled={isSpinning || coinBalance < WHEEL_SPIN_COST}
          onClick={handleSpin}
          className={`mt-3 sm:mt-4 py-3 sm:py-4 px-6 sm:px-8 rounded-xl sm:rounded-2xl font-extrabold text-base sm:text-lg select-none cursor-pointer tracking-wider shadow-lg transition-all transform active:scale-95 w-full ${
            isSpinning || coinBalance < WHEEL_SPIN_COST
              ? "bg-deep-violet/30 dark:bg-white/10 text-deep-violet/50 dark:text-cream-soft/50 pointer-events-none cursor-not-allowed"
              : "bg-primary-gold hover:bg-[#E0A700] text-deep-violet hover:shadow-xl"
          }`}
        >
          {isSpinning ? "Spinning..." : `SPIN FOR ${WHEEL_SPIN_COST} COINS`}
        </button>
        {walletMessage && (
          <p className="mt-3 text-xs font-bold text-alert-coral text-center">
            {walletMessage}
          </p>
        )}
        {!walletMessage && coinBalance < WHEEL_SPIN_COST && (
          <p className="mt-3 text-xs font-bold text-alert-coral text-center">
            You need {WHEEL_SPIN_COST} coins to spin the wheel.
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
              ? `You spent ${WHEEL_SPIN_COST} coins and won ${result.coinReward.toLocaleString()} coins.`
              : `You spent ${WHEEL_SPIN_COST} coins. Try again when you are ready.`
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
          prize={result.isWin ? `${result.emoji} ${result.coinReward} coins` : `${result.emoji} Try Again`}
        />
      )}
    </div>
  );
}

