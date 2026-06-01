"use client";

import { useEffect, useRef, useState } from "react";
import { WHEEL_PRIZES, Prize } from "@/lib/prizes";
import { playTick } from "@/lib/audio";
import { useLuckStore } from "@/store/luckStore";
import ResultCard from "@/components/ui/ResultCard";
import ShareModal from "@/components/ui/ShareModal";
import { animate } from "framer-motion";
import { Trash2, Plus, RotateCcw, XCircle } from "lucide-react";

export default function WheelGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<Prize | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showShare, setShowShare] = useState(false);

  // Dynamic segments state, defaulting to standard WHEEL_PRIZES
  const [segments, setSegments] = useState<Prize[]>(WHEEL_PRIZES);
  const [spinDuration, setSpinDuration] = useState<5 | 10 | 15>(5);

  // New segment inputs
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("✨");

  const addResult = useLuckStore((state) => state.addResult);
  const currentScore = useLuckStore((state) => state.luckyScore);

  // Redraw the canvas wheel whenever rotation or segments change
  const drawWheel = (currentRotation: number) => {
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
      
      // Determine font size based on segment count to prevent overlapping text!
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
  };

  // Redraw when rotation or segments list changes
  useEffect(() => {
    drawWheel(rotation);
  }, [rotation, segments]);

  const handleSpin = () => {
    // Check if at least 2 options exist before rotating!
    if (segments.length < 2) {
      alert("⚠️ You need at least 2 options on the wheel to spin! Please add more options in the editor.");
      return;
    }

    if (isSpinning) return;

    setIsSpinning(true);
    setShowResult(false);
    setResult(null);

    const numSegments = segments.length;
    const segmentAngle = 360 / numSegments;

    // Select random prize outcome index
    const prizeIndex = Math.floor(Math.random() * numSegments);
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
        // Log result into Zustand Store
        addResult("Fortune Wheel", `${prize.emoji} Won ${prize.name}`, prize.isWin, prize.scoreImpact);
      },
    });
  };

  const handleAddSegment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    if (segments.length >= 25) {
      alert("⚠️ You have reached the maximum limit of 25 options! Please delete some options before adding a new one.");
      return;
    }

    // Premium harmonious segment colors
    const segmentColors = [
      "#F5B700", // gold
      "#2D1B69", // violet
      "#00B4A0", // teal
      "#FF6B6B", // coral
      "#8E2DE2", // deep purple
      "#FF8C00", // hot orange
      "#00BFFF", // sky blue
      "#4A00E0", // indigo
    ];
    const color = segmentColors[segments.length % segmentColors.length];

    const newPrize: Prize = {
      id: Math.random().toString(),
      emoji: newEmoji.trim() || "✨",
      name: newName.trim(),
      color: color,
      isWin: true,
      scoreImpact: 10,
    };

    setSegments([...segments, newPrize]);
    setNewName("");
    setNewEmoji("✨");
  };

  const handleDeleteSegment = (id: string) => {
    // Allows deleting down to 0 segments!
    setSegments(segments.filter((s) => s.id !== id));
  };

  const handleClearAllSegments = () => {
    setSegments([]);
  };

  const handleResetSegments = () => {
    setSegments(WHEEL_PRIZES);
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-4">
      {/* Responsive two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start select-none">
        
        {/* LEFT COLUMN: Spinning Wheel View */}
        <div className="lg:col-span-7 flex flex-col items-center">
          {/* Game board wrapper */}
          <div className="relative mb-8 p-6 bg-white dark:bg-card border-4 border-primary-gold rounded-3xl shadow-xl flex flex-col items-center w-full max-w-md">
            
            {/* Top gold needle pointer */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-primary-gold drop-shadow-md" />

            {/* Outer Wheel boundary glow */}
            <div className="rounded-full border-8 border-deep-violet/10 dark:border-white/10 overflow-hidden shadow-inner">
              <canvas
                ref={canvasRef}
                width={340}
                height={340}
                className="w-[280px] h-[280px] sm:w-[340px] sm:h-[340px]"
              />
            </div>

            {/* Spin Duration Selector Segmented Control */}
            <div className="w-full mt-5 flex items-center justify-between border-t border-deep-violet/10 dark:border-white/10 pt-4 pb-2 px-1">
              <span className="text-xs font-bold text-deep-violet/50 dark:text-cream-soft/50 uppercase tracking-wider">
                Spin Duration:
              </span>
              <div className="flex gap-1 bg-deep-violet/5 dark:bg-white/5 border border-deep-violet/10 dark:border-white/10 p-0.5 rounded-xl">
                {([5, 10, 15] as const).map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    disabled={isSpinning}
                    onClick={() => setSpinDuration(dur)}
                    className={`py-1 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
              disabled={isSpinning}
              onClick={handleSpin}
              className={`mt-4 py-4 px-8 rounded-2xl font-extrabold text-lg select-none cursor-pointer tracking-wider shadow-lg transition-all transform active:scale-95 w-full ${
                isSpinning
                  ? "bg-deep-violet/30 dark:bg-white/10 text-deep-violet/50 dark:text-cream-soft/50 pointer-events-none cursor-not-allowed"
                  : "bg-primary-gold hover:bg-[#E0A700] text-deep-violet hover:shadow-xl"
              }`}
            >
              {isSpinning ? "Spinning..." : "SPIN THE WHEEL! 🎡"}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Custom Segments Editor */}
        <div className="lg:col-span-5 bg-white dark:bg-card border-2 border-deep-violet/10 dark:border-white/10 rounded-3xl p-6 shadow-sm flex flex-col w-full">
          <h3 className="text-xl font-extrabold font-fredoka text-deep-violet dark:text-cream-soft mb-2 border-b border-deep-violet/10 dark:border-white/10 pb-3 flex justify-between items-center">
            <span>Custom segment editor 🎨</span>
            <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${segments.length >= 25 ? "bg-alert-coral/10 text-alert-coral animate-pulse" : "bg-deep-violet/5 text-deep-violet/40 dark:bg-white/5 dark:text-cream-soft/40"}`}>
              {segments.length}/25 Limit
            </span>
          </h3>
          <p className="text-xs font-semibold text-deep-violet/50 dark:text-cream-soft/50 mb-5">
            Add custom names or options below to decide your fate dynamically!
          </p>

          {/* Add Segment Form */}
          <form onSubmit={handleAddSegment} className="flex gap-2 mb-6">
            <input
              type="text"
              placeholder="Emoji"
              value={newEmoji}
              onChange={(e) => setNewEmoji(e.target.value)}
              disabled={isSpinning || segments.length >= 25}
              className="w-16 px-2.5 py-3 rounded-xl border border-deep-violet/10 dark:border-white/10 bg-deep-violet/5 dark:bg-white/5 text-center font-bold text-sm outline-none focus:border-primary-gold dark:focus:border-primary-gold disabled:opacity-40"
              maxLength={4}
            />
            <input
              type="text"
              placeholder={segments.length >= 25 ? "Limit of 25 reached!" : "Option name (e.g. Pizza)"}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              disabled={isSpinning || segments.length >= 25}
              className="flex-1 px-4 py-3 rounded-xl border border-deep-violet/10 dark:border-white/10 bg-deep-violet/5 dark:bg-white/5 font-bold text-sm outline-none focus:border-primary-gold dark:focus:border-primary-gold text-deep-violet dark:text-cream-soft disabled:opacity-40"
              maxLength={20}
              required
            />
            <button
              type="submit"
              disabled={isSpinning || segments.length >= 25}
              className="p-3 bg-primary-gold text-deep-violet hover:bg-[#E0A700] rounded-xl font-bold flex items-center justify-center cursor-pointer disabled:opacity-40 shrink-0"
            >
              <Plus className="w-5 h-5" />
            </button>
          </form>

          {/* List of active wheel segments */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1 mb-6">
            {segments.length === 0 ? (
              <div className="py-8 text-center text-xs font-bold text-deep-violet/30 dark:text-cream-soft/30 italic">
                No active options. Add some above!
              </div>
            ) : (
              segments.map((seg) => (
                <div
                  key={seg.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-deep-violet/5 dark:border-white/5 bg-deep-violet/5 dark:bg-white/5 font-bold text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      style={{ backgroundColor: seg.color }}
                      className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-xs shrink-0"
                    />
                    <span className="text-sm font-black text-deep-violet dark:text-cream-soft">
                      {seg.emoji} {seg.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={isSpinning}
                    onClick={() => handleDeleteSegment(seg.id)}
                    className="p-1 text-alert-coral hover:bg-alert-coral/10 rounded-lg cursor-pointer disabled:opacity-40"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Actions Grid */}
          <div className="grid grid-cols-2 gap-3 w-full">
            <button
              type="button"
              disabled={isSpinning || segments.length === 0}
              onClick={handleClearAllSegments}
              className="flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold bg-alert-coral/10 hover:bg-alert-coral/20 text-alert-coral border border-alert-coral/20 transition-all active:scale-95 cursor-pointer disabled:opacity-40"
            >
              <XCircle className="w-4 h-4" />
              Clear All
            </button>
            <button
              type="button"
              disabled={isSpinning}
              onClick={handleResetSegments}
              className="flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold bg-deep-violet/5 hover:bg-deep-violet/10 dark:bg-white/5 dark:hover:bg-white/10 border border-deep-violet/10 dark:border-white/10 text-deep-violet dark:text-cream-soft transition-all active:scale-95 cursor-pointer disabled:opacity-40"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Defaults
            </button>
          </div>
        </div>
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
              ? "Wow, what a spectacular spin! Your fortune index is climbing!"
              : "Unlucky spin, but don't worry. The tides of fate are always changing!"
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
          prize={`${result.emoji} ${result.name}`}
        />
      )}
    </div>
  );
}
