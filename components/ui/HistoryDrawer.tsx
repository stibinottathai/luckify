"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Trash2, HelpCircle } from "lucide-react";
import { useLuckStore, HistoryItem } from "@/store/luckStore";

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HistoryDrawer({ isOpen, onClose }: HistoryDrawerProps) {
  const { history, resetToday } = useLuckStore();

  const handleReset = () => {
    if (confirm("Are you sure you want to reset your play history today?")) {
      resetToday();
    }
  };

  const getGameIcon = (game: string) => {
    switch (game.toLowerCase()) {
      case "fortune wheel":
        return "🎡";
      case "shaking tree":
        return "🌳";
      case "lucky dice":
        return "🎲";
      case "mystery box":
        return "🎁";
      case "scratch card":
        return "🪙";
      case "number picker":
        return "🎰";
      default:
        return "✨";
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch (e) {
      return "Just now";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-deep-violet/40 dark:bg-black/60 backdrop-blur-xs pointer-events-auto"
          />

          {/* Right Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="relative w-full max-w-sm h-full bg-white dark:bg-card border-l-2 border-deep-violet/10 dark:border-white/10 shadow-2xl z-50 flex flex-col pointer-events-auto select-none"
          >
            {/* Header */}
            <div className="p-5 border-b border-deep-violet/10 dark:border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-extrabold font-fredoka text-deep-violet dark:text-cream-soft">
                  Play History 📜
                </h3>
                <p className="text-xs font-semibold text-deep-violet/40 dark:text-cream-soft/40 mt-0.5">
                  Your last 20 fortune encounters
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-deep-violet/5 dark:hover:bg-cream-soft/5 text-deep-violet/40 dark:text-cream-soft/40 hover:text-deep-violet dark:hover:text-cream-soft transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-deep-violet/40 dark:text-cream-soft/40">
                  <HelpCircle className="w-12 h-12 mb-3 stroke-[1.5]" />
                  <p className="font-extrabold font-fredoka text-base">No fortunes logged yet</p>
                  <p className="text-xs font-semibold mt-1 max-w-[200px]">
                    Go play some games on the homepage to find your fortunes!
                  </p>
                </div>
              ) : (
                <div className="relative border-l border-deep-violet/10 dark:border-white/10 pl-5 ml-3 space-y-6">
                  {history.map((item, index) => (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      key={index}
                      className="relative"
                    >
                      {/* Timeline dot */}
                      <span className="absolute -left-[31px] top-0.5 w-5 h-5 rounded-full bg-white dark:bg-card border-2 border-primary-gold flex items-center justify-center text-xs shadow-xs">
                        {getGameIcon(item.game)}
                      </span>

                      {/* Item Details */}
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-sm text-deep-violet dark:text-cream-soft">
                            {item.game}
                          </span>
                          <span className="text-[10px] font-bold text-deep-violet/40 dark:text-cream-soft/40 flex items-center gap-1 font-mono">
                            <Calendar className="w-2.5 h-2.5" />
                            {formatTime(item.timestamp)}
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-deep-violet/70 dark:text-cream-soft/70 mt-1">
                          {item.result}
                        </p>

                        {/* Tag details */}
                        <div className="flex items-center gap-2 mt-1.5">
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${
                              item.isWin
                                ? "bg-accent-teal/10 text-accent-teal"
                                : "bg-alert-coral/10 text-alert-coral"
                            }`}
                          >
                            {item.isWin ? "Win" : "Loss"}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer containing reset action */}
            {history.length > 0 && (
              <div className="p-5 border-t border-deep-violet/10 dark:border-white/10 bg-deep-violet/5 dark:bg-white/5">
                <button
                  onClick={handleReset}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-alert-coral/10 hover:bg-alert-coral/20 text-alert-coral border border-alert-coral/20 transition-all active:scale-95 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Reset Play History
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
