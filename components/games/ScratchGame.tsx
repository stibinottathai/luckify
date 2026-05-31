"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SCRATCH_OUTCOMES } from "@/lib/prizes";
import { playScratch } from "@/lib/audio";
import { useLuckStore } from "@/store/luckStore";
import ResultCard from "@/components/ui/ResultCard";
import ShareModal from "@/components/ui/ShareModal";

interface Outcome {
  id: string;
  emoji: string;
  name: string;
  isWin: boolean;
  scoreImpact: number;
  fortune: string;
}

export default function ScratchGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const scratchCountRef = useRef(0);

  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [scratchedPercent, setScratchedPercent] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);

  const [showResult, setShowResult] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const addResult = useLuckStore((state) => state.addResult);
  const currentScore = useLuckStore((state) => state.luckyScore);

  const initializeScratcher = () => {
    // 1. Pick a random outcome
    const randomPick = SCRATCH_OUTCOMES[Math.floor(Math.random() * SCRATCH_OUTCOMES.length)];
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
  }, []);

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
    if (isRevealed) return;
    isDrawingRef.current = true;
  };

  const scratch = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current || isRevealed) return;

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

    // Trigger Result Popup after short slide animation delay
    setTimeout(() => {
      if (outcome) {
        setShowResult(true);
        addResult("Scratch Card", outcome.name, outcome.isWin, outcome.scoreImpact);
      }
    }, 600);
  };

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
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center select-none">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={isRevealed ? { scale: 1, opacity: 1 } : {}}
              className="flex flex-col items-center"
            >
              <span className="text-5xl filter drop-shadow-sm mb-2 select-none">
                {outcome.emoji}
              </span>
              <h4 className="text-xl font-black font-fredoka text-deep-violet dark:text-cream-soft leading-tight">
                {outcome.name}
              </h4>
              <p className="text-[10px] font-bold text-deep-violet/50 dark:text-cream-soft/50 max-w-[200px] mt-1 italic">
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
      {!isRevealed && scratchedPercent > 5 && (
        <button
          onClick={() => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext("2d");
            revealCard(ctx || undefined, canvas?.width, canvas?.height);
          }}
          className="mt-6 py-2 px-4 rounded-xl text-xs font-bold bg-deep-violet/5 dark:bg-white/5 border border-deep-violet/10 dark:border-white/10 text-deep-violet dark:text-cream-soft hover:bg-deep-violet/10 dark:hover:bg-white/10 cursor-pointer active:scale-95 transition-all"
        >
          Auto-Reveal Card 🪙
        </button>
      )}

      {/* New Card button */}
      {isRevealed && (
        <button
          onClick={initializeScratcher}
          className="mt-6 py-3.5 px-8 rounded-2xl font-extrabold text-base bg-primary-gold hover:bg-[#E0A700] text-deep-violet shadow-lg hover:shadow-xl transition-all cursor-pointer active:scale-95"
        >
          GET A NEW CARD 🪙
        </button>
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
          onRestart={initializeScratcher}
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
