"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchAnnouncements, GoldenDiceAnnouncement } from "@/lib/firestoreProfile";
import { Sparkles, X } from "lucide-react";

export default function GoldenDiceBanner() {
  const [activeAnnouncement, setActiveAnnouncement] = useState<GoldenDiceAnnouncement | null>(null);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let isMounted = true;
    let interval: NodeJS.Timeout;

    const checkForAnnouncements = async () => {
      try {
        const list = await fetchAnnouncements(3);
        if (!isMounted || list.length === 0) return;
        
        const latest = list[0];
        const ageMs = Date.now() - new Date(latest.timestamp).getTime();
        const isFresh = ageMs < 45 * 1000;

        if (isFresh && !seenIds.has(latest.id)) {
          setSeenIds((prev) => new Set([...prev, latest.id]));
          setActiveAnnouncement(latest);

          setTimeout(() => {
            if (isMounted) {
              setActiveAnnouncement((current) => current?.id === latest.id ? null : current);
            }
          }, 6500);
        }
      } catch (err) {
        console.error("Error fetching announcements:", err);
      }
    };

    checkForAnnouncements();
    interval = setInterval(checkForAnnouncements, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [seenIds]);

  if (!mounted || !activeAnnouncement) return null;

  return (
    <div className="fixed top-20 left-4 right-4 z-40 flex justify-center pointer-events-none select-none">
      <div
        className="pointer-events-auto w-full max-w-xl bg-gradient-to-r from-amber-500/90 via-yellow-400/90 to-amber-600/90 dark:from-amber-600/95 dark:via-yellow-500/95 dark:to-amber-700/95 backdrop-blur-md rounded-2xl py-3 px-4 border border-yellow-300/40 shadow-[0_8px_32px_rgba(245,183,0,0.35)] flex items-center justify-between gap-3 text-amber-950 dark:text-cream-soft relative overflow-hidden"
      >
        <div className="absolute inset-0 w-[200%] bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-hue-sweep pointer-events-none" />

        <div className="flex items-center gap-2.5 z-10 flex-1 min-w-0">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-950/20 flex items-center justify-center animate-pulse">
            <Sparkles className="w-4 h-4 text-amber-950 dark:text-primary-gold" />
          </span>
          <p className="text-xs sm:text-sm font-black font-fredoka truncate leading-tight tracking-wide">
            {activeAnnouncement.text}
          </p>
        </div>

        <button
          onClick={() => setActiveAnnouncement(null)}
          className="flex-shrink-0 w-6 h-6 rounded-full hover:bg-black/10 flex items-center justify-center cursor-pointer transition-colors z-10"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
