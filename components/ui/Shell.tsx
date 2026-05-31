"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, History, Sparkles } from "lucide-react";
import { useLuckStore } from "@/store/luckStore";
import HistoryDrawer from "@/components/ui/HistoryDrawer";
import ShareModal from "@/components/ui/ShareModal";
import LegalModal from "@/components/ui/LegalModal";

interface ShellProps {
  children: React.ReactNode;
}

export default function Shell({ children }: ShellProps) {
  const { luckyScore } = useLuckStore();
  const [mounted, setMounted] = useState(false);
  const [dark, setDark] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<"terms" | "privacy" | "cookies">("terms");

  const openLegal = (tab: "terms" | "privacy" | "cookies") => {
    setLegalTab(tab);
    setLegalOpen(true);
  };

  // Hydration safety guard
  useEffect(() => {
    setMounted(true);
    // Initialize theme based on localstorage or document state
    const isDark = document.documentElement.classList.contains("dark") || 
      localStorage.getItem("theme") === "dark" ||
      (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches);
    
    setDark(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !dark;
    setDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  if (!mounted) {
    // Elegant clean skeleton before hydration
    return (
      <div className="min-h-screen flex flex-col bg-cream-soft text-deep-violet">
        <header className="sticky top-0 z-40 bg-cream-soft/80 backdrop-blur-md border-b border-deep-violet/10 h-16 flex items-center justify-between px-6" />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary-gold border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      {/* Sticky top navbar */}
      <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b border-deep-violet/10 dark:border-white/10 select-none">
        <div className="max-w-6xl mx-auto h-16 flex items-center justify-between px-4 sm:px-6">
          {/* Logo Brand */}
          <Link href="/" className="flex items-center gap-2 group">
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="text-2xl"
            >
              ✨
            </motion.span>
            <span className="font-fredoka text-xl sm:text-2xl font-extrabold tracking-tight text-deep-violet dark:text-cream-soft group-hover:text-primary-gold transition-colors duration-200">
              Lucky Vibes
            </span>
          </Link>

          {/* Right Navigation controls */}
          <div className="flex items-center gap-2 sm:gap-4">

            {/* Dark mode toggler */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-deep-violet/5 hover:bg-deep-violet/10 dark:bg-white/5 dark:hover:bg-white/10 text-deep-violet dark:text-cream-soft border border-deep-violet/10 dark:border-white/10 transition-all active:scale-95 cursor-pointer"
              aria-label="Toggle theme"
            >
              {dark ? <Sun className="w-4 h-4 text-primary-gold" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* History logs drawer button */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2 rounded-xl bg-deep-violet/5 hover:bg-deep-violet/10 dark:bg-white/5 dark:hover:bg-white/10 text-deep-violet dark:text-cream-soft border border-deep-violet/10 dark:border-white/10 transition-all active:scale-95 cursor-pointer flex items-center gap-1"
              aria-label="View history"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-bold font-fredoka">History</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main viewport with Framer motion animated transition wrapper */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="h-full flex flex-col"
        >
          {children}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-deep-violet/5 dark:bg-black/20 border-t border-deep-violet/10 dark:border-white/10 py-6 mt-12 select-none">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs font-bold text-deep-violet/50 dark:text-cream-soft/50 text-center md:text-left">
            © {new Date().getFullYear()} Lucky Vibes. Live beautifully, roll wisely. 🍀
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => openLegal("terms")}
              className="text-xs font-bold text-deep-violet/50 hover:text-primary-gold dark:text-cream-soft/50 dark:hover:text-primary-gold hover:underline cursor-pointer bg-transparent border-0 transition-colors"
            >
              Terms
            </button>
            <span className="text-[10px] text-deep-violet/20 dark:text-white/10">•</span>
            <button
              onClick={() => openLegal("privacy")}
              className="text-xs font-bold text-deep-violet/50 hover:text-primary-gold dark:text-cream-soft/50 dark:hover:text-primary-gold hover:underline cursor-pointer bg-transparent border-0 transition-colors"
            >
              Privacy Policy
            </button>
            <span className="text-[10px] text-deep-violet/20 dark:text-white/10">•</span>
            <button
              onClick={() => openLegal("cookies")}
              className="text-xs font-bold text-deep-violet/50 hover:text-primary-gold dark:text-cream-soft/50 dark:hover:text-primary-gold hover:underline cursor-pointer bg-transparent border-0 transition-colors"
            >
              Cookie Settings
            </button>
            <span className="text-[10px] text-deep-violet/20 dark:text-white/10">•</span>
            <button
              onClick={() => setShareOpen(true)}
              className="text-xs font-extrabold text-primary-gold hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Share website
            </button>
          </div>
        </div>
      </footer>

      {/* Global Modals / Drawers */}
      <HistoryDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} score={luckyScore} />
      <LegalModal isOpen={legalOpen} onClose={() => setLegalOpen(false)} initialTab={legalTab} />
    </div>
  );
}
