"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share2, RotateCcw } from "lucide-react";
import confetti from "canvas-confetti";
import { playWinChime, playDudSound } from "@/lib/audio";

interface ResultCardProps {
  isOpen: boolean;
  onClose: () => void;
  gameName: string;
  emoji: string;
  title: string;
  description: string;
  scoreImpact: number;
  isWin: boolean;
  onRestart?: () => void;
  onShare?: () => void;
}

export default function ResultCard({
  isOpen,
  onClose,
  gameName,
  emoji,
  title,
  description,
  scoreImpact,
  isWin,
  onRestart,
  onShare,
}: ResultCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Play synthesis sounds on open
      if (isWin) {
        playWinChime();
        // Fire celebration confetti!
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
      } else {
        playDudSound();
      }
    }
  }, [isOpen, isWin]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-8 sm:pb-16 pointer-events-none">
          {/* Background backdrop blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-deep-violet/40 dark:bg-black/60 backdrop-blur-xs pointer-events-auto"
          />

          {/* Bottom Card content */}
          <motion.div
            ref={containerRef}
            drag="y"
            dragConstraints={{ top: 0, bottom: 250 }}
            dragElastic={{ top: 0, bottom: 0.8 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) {
                onClose();
              }
            }}
            initial={{ y: "100%", opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className={`relative w-full max-w-md bg-white dark:bg-card border-2 ${
              isWin ? "border-primary-gold" : "border-alert-coral"
            } rounded-3xl p-6 shadow-2xl pointer-events-auto text-center flex flex-col items-center select-none`}
          >
            {/* Gesture handle for swiping down */}
            <div className="w-12 h-1.5 bg-deep-violet/10 dark:bg-cream-soft/10 rounded-full mb-3 cursor-grab active:cursor-grabbing" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-deep-violet/5 dark:hover:bg-cream-soft/5 text-deep-violet/40 dark:text-cream-soft/40 hover:text-deep-violet dark:hover:text-cream-soft transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Game Badge */}
            <span className="text-xs font-extrabold uppercase tracking-widest text-deep-violet/40 dark:text-cream-soft/40 mb-2">
              {gameName}
            </span>

            {/* Animated Emoji */}
            <motion.div
              initial={{ scale: 0, rotate: 0 }}
              animate={{ scale: 1, rotate: [0, -10, 10, -5, 5, 0] }}
              transition={{
                delay: 0.15,
                scale: { type: "spring", stiffness: 260, damping: 12 },
                rotate: { type: "keyframes", duration: 0.6, ease: "easeInOut" },
              }}
              className="text-7xl mb-4"
            >
              {emoji}
            </motion.div>

            {/* Title */}
            <h3 className="text-2xl font-extrabold font-fredoka text-deep-violet dark:text-cream-soft mb-2 leading-tight">
              {title}
            </h3>

            {/* Description */}
            <p className="text-sm font-semibold text-deep-violet/70 dark:text-cream-soft/70 mb-5 leading-relaxed max-w-sm">
              {description}
            </p>

            {/* Interactive Actions Grid */}
            <div className="w-full grid grid-cols-2 gap-3 mt-2">
              {onRestart && (
                <button
                  onClick={onRestart}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold bg-deep-violet/5 hover:bg-deep-violet/10 dark:bg-white/5 dark:hover:bg-white/10 text-deep-violet dark:text-cream-soft border border-deep-violet/10 dark:border-white/10 transition-all active:scale-95 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Try Again
                </button>
              )}
              <button
                onClick={onShare}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold bg-primary-gold hover:bg-[#E0A700] text-deep-violet shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer col-span-1"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
