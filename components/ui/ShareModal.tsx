"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, Share2 } from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  score: number;
  game?: string;
  prize?: string;
}

export default function ShareModal({
  isOpen,
  onClose,
  score,
  game,
  prize,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  // Custom sharing content formulation
  let shareText = `I just tested my luck on Lucky Vibes! 🍀✨ Try your luck too:`;
  if (game && prize) {
    shareText = `I just played ${game} on Lucky Vibes and won "${prize}"! 🎰✨ Try your luck too:`;
  }
  const shareUrl = typeof window !== "undefined" ? window.location.origin : "https://luckyvibes.app";
  const fullMessage = `${shareText}\n${shareUrl}`;

  const handleWebShare = async () => {
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: "Lucky Vibes ✨",
          text: shareText,
          url: shareUrl,
        });
        onClose();
      } catch (err) {
        console.warn("Error sharing via Web Share API:", err);
      }
    } else {
      handleCopy();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(fullMessage);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      onClose();
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-deep-violet/40 dark:bg-black/60 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-sm bg-white dark:bg-card border-2 border-primary-gold rounded-3xl p-6 shadow-2xl z-50 text-center select-none"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-deep-violet/5 dark:hover:bg-soft-cream/5 text-deep-violet/40 dark:text-soft-cream/40 hover:text-deep-violet dark:hover:text-soft-cream transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <h3 className="text-xl font-extrabold font-fredoka text-deep-violet dark:text-soft-cream mb-2 mt-2">
              Share Your Fortune! ✨
            </h3>
            <p className="text-xs font-semibold text-deep-violet/50 dark:text-soft-cream/50 mb-5">
              Let the world know how lucky you are today.
            </p>

            {/* Preview Area */}
            <div className="bg-deep-violet/5 dark:bg-white/5 border border-deep-violet/10 dark:border-white/10 rounded-2xl p-4 text-left mb-6 text-sm font-bold text-deep-violet/80 dark:text-soft-cream/80 leading-relaxed break-words whitespace-pre-wrap font-sans">
              {shareText}
              <span className="block text-primary-gold hover:underline mt-1 font-semibold">
                {shareUrl}
              </span>
            </div>

            {/* Share / Copy Action buttons */}
            <div className="flex flex-col gap-2">
              {typeof navigator !== "undefined" && (navigator as any).share && (
                <button
                  onClick={handleWebShare}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-primary-gold hover:bg-[#E0A700] text-deep-violet transition-all active:scale-95 shadow-md cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  Share to Socials
                </button>
              )}
              <button
                onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-deep-violet/5 hover:bg-deep-violet/10 dark:bg-white/5 dark:hover:bg-white/10 text-deep-violet dark:text-soft-cream border border-deep-violet/10 dark:border-white/10 transition-all active:scale-95 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-accent-teal" />
                    <span className="text-accent-teal">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Share Link
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
