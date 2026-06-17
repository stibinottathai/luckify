"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Sparkles, Trophy, X, LogOut } from "lucide-react";
import { useLuckStore } from "@/store/luckStore";
import ShareModal from "@/components/ui/ShareModal";
import LegalModal from "@/components/ui/LegalModal";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { AuthProvider, useAuth } from "@/components/auth/AuthProvider";
import AuthButton from "@/components/auth/AuthButton";
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

function PointsHeaderDisplay() {
  const { user } = useAuth();
  const coinBalance = useLuckStore((s) => s.coinBalance);

  if (!user) return null;

  return (
    <div
      aria-label={`${coinBalance.toLocaleString()} points`}
      className="h-10 px-2.5 sm:px-3 rounded-full border border-primary-gold/35 bg-primary-gold/10 dark:bg-primary-gold/15 shadow-[0_8px_24px_rgba(245,183,0,0.16)] flex items-center gap-2"
    >
      <span className="w-7 h-7 rounded-full bg-primary-gold text-deep-violet flex items-center justify-center shadow-inner">
        <Coins className="w-4 h-4" />
      </span>
      <span className="min-w-0 text-left leading-none">
        <span className="block font-fredoka text-sm sm:text-base font-black text-deep-violet dark:text-soft-cream tabular-nums">
          {coinBalance.toLocaleString()}
        </span>
        <span className="hidden sm:block text-[9px] uppercase tracking-wider font-extrabold text-deep-violet/45 dark:text-soft-cream/45">
          Points
        </span>
      </span>
    </div>
  );
}

interface ShellProps {
  children: React.ReactNode;
}

export default function Shell({ children }: ShellProps) {
  return (
    <AuthProvider>
      <ShellInner>{children}</ShellInner>
    </AuthProvider>
  );
}

function ShellInner({ children }: ShellProps) {
  const pathname = usePathname();
  const { coinBalance, luckyScore, totalPlays } = useLuckStore();
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [dark, setDark] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<"terms" | "privacy" | "cookies">("terms");
  const [menuOpen, setMenuOpen] = useState(false);

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

  const handleSignIn = async () => {
    if (!auth) return;
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Firebase Google Sign-in failed:", error);
    }
  };

  const handleSignOut = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Firebase Sign-out failed:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      {/* Sticky top navbar */}
      <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b border-deep-violet/10 dark:border-white/10 select-none">
        <div className="max-w-6xl mx-auto h-16 flex items-center justify-between px-4 sm:px-6">
          {/* Logo Brand */}
          <Link href="/" className="flex items-center gap-2 group min-w-0 flex-shrink-0">
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="text-2xl"
            >
              ✨
            </motion.span>
            <span className="font-fredoka text-xl sm:text-2xl font-extrabold tracking-tight text-deep-violet dark:text-soft-cream group-hover:text-primary-gold transition-colors duration-200 truncate">
              Luck ഉണ്ടോ ?
            </span>
          </Link>

          {/* Leaderboard nav link */}
          <Link
            href="/leaderboard"
            aria-label="Leaderboard"
            className={`ml-3 sm:ml-5 h-9 px-2 sm:px-3 rounded-full border flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider shadow-sm transition-all group flex-shrink-0 ${
              pathname === "/leaderboard"
                ? "bg-primary-gold border-primary-gold text-deep-violet"
                : "border-deep-violet/10 dark:border-white/10 bg-white/70 dark:bg-white/10 hover:bg-primary-gold hover:text-deep-violet text-deep-violet/70 dark:text-soft-cream/75"
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span className="hidden min-[520px]:inline">Leaderboard</span>
          </Link>

          {/* Spacer to push controls to the right */}
          <div className="flex-grow" />

          {/* Right Navigation controls */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            {mounted && <PointsHeaderDisplay />}

            {/* Google Authentication Control - Desktop */}
            <div className="hidden md:block">
              {mounted && <AuthButton />}
            </div>

            {/* Redesigned Premium Theme Switcher - Desktop */}
            <div className="hidden md:block">
              {mounted && <ThemeToggle dark={dark} toggleTheme={toggleTheme} />}
            </div>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMenuOpen(true)}
              className="md:hidden p-2 rounded-xl bg-deep-violet/5 dark:bg-white/5 border border-deep-violet/10 dark:border-white/10 text-deep-violet dark:text-soft-cream hover:bg-deep-violet/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Open menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Side Menu Drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 bg-black z-50 md:hidden"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-[#130b2f] border-l border-deep-violet/10 dark:border-white/10 z-50 p-6 flex flex-col justify-between shadow-2xl md:hidden text-deep-violet dark:text-soft-cream font-fredoka overflow-y-auto"
            >
              <div className="space-y-8">
                {/* Header of Drawer */}
                <div className="flex items-center justify-between border-b border-deep-violet/5 dark:border-white/5 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">✨</span>
                    <span className="font-extrabold text-lg">Menu</span>
                  </div>
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="h-8 w-8 rounded-full bg-deep-violet/5 dark:bg-white/5 border border-deep-violet/10 dark:border-white/10 flex items-center justify-center hover:bg-deep-violet/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Account Section */}
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest font-black text-deep-violet/45 dark:text-soft-cream/40 mb-3">
                    Account Profile
                  </h4>
                  {loading ? (
                    <div className="flex justify-center py-4">
                      <div className="w-6 h-6 border-2 border-primary-gold/30 border-t-primary-gold animate-spin rounded-full" />
                    </div>
                  ) : user ? (
                    <div className="space-y-4">
                      {/* Signed-in User Info */}
                      <div className="p-4 rounded-2xl bg-deep-violet/5 dark:bg-white/5 border border-deep-violet/10 dark:border-white/10 flex items-center gap-3">
                        {user.photoURL ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={user.photoURL}
                            alt={user.displayName || "User"}
                            className="w-11 h-11 rounded-full border-2 border-primary-gold object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-primary-gold/20 border-2 border-primary-gold flex items-center justify-center text-primary-gold font-bold text-base">
                            {user.displayName ? user.displayName[0].toUpperCase() : "U"}
                          </div>
                        )}
                        <div className="overflow-hidden">
                          <h5 className="text-sm font-bold truncate">{user.displayName}</h5>
                          <p className="text-[10px] opacity-60 truncate">{user.email}</p>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded-xl bg-deep-violet/5 dark:bg-white/5 border border-deep-violet/5 dark:border-white/10">
                          <span className="text-[8px] uppercase tracking-wider font-extrabold text-deep-violet/40 dark:text-soft-cream/40 block">
                            Points
                          </span>
                          <span className="text-xs font-black text-primary-gold">
                            {coinBalance.toLocaleString()}
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-deep-violet/5 dark:bg-white/5 border border-deep-violet/5 dark:border-white/10">
                          <span className="text-[8px] uppercase tracking-wider font-extrabold text-deep-violet/40 dark:text-soft-cream/40 block">
                            Vibe Score
                          </span>
                          <span className="text-xs font-black text-deep-violet dark:text-soft-cream">
                            {luckyScore}%
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-deep-violet/5 dark:bg-white/5 border border-deep-violet/5 dark:border-white/10">
                          <span className="text-[8px] uppercase tracking-wider font-extrabold text-deep-violet/40 dark:text-soft-cream/40 block">
                            Plays
                          </span>
                          <span className="text-xs font-black text-deep-violet dark:text-soft-cream">
                            {totalPlays}
                          </span>
                        </div>
                      </div>

                      {/* Sign Out Button */}
                      <button
                        onClick={async () => {
                          setMenuOpen(false);
                          await handleSignOut();
                        }}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-red-500 text-xs font-black transition-all duration-200 cursor-pointer uppercase tracking-wider"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    /* Sign In Button */
                    <button
                      onClick={async () => {
                        setMenuOpen(false);
                        await handleSignIn();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-deep-violet to-[#4f3583] hover:from-primary-gold hover:to-[#dfa72b] text-white hover:text-deep-violet border border-primary-gold/30 font-black text-xs transition-all duration-300 cursor-pointer uppercase tracking-wider"
                    >
                      <svg className="w-4 h-4 flex-shrink-0 bg-white p-0.5 rounded-full" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Sign In</span>
                    </button>
                  )}
                </div>

                {/* Night / Light Mode Toggle */}
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest font-black text-deep-violet/45 dark:text-soft-cream/40 mb-3">
                    Theme Settings
                  </h4>
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-deep-violet/5 dark:bg-white/5 border border-deep-violet/10 dark:border-white/10 select-none">
                    <span className="text-xs font-bold">Night Mode</span>
                    <button
                      onClick={toggleTheme}
                      className={`relative w-12 h-7 rounded-full p-1 transition-colors duration-300 focus:outline-none cursor-pointer flex items-center ${
                        dark ? "bg-primary-gold justify-end" : "bg-deep-violet/20 justify-start"
                      }`}
                    >
                      <motion.div
                        layout
                        className="w-5 h-5 rounded-full bg-white dark:bg-deep-violet shadow-md flex items-center justify-center text-[10px]"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        {dark ? "🌙" : "☀️"}
                      </motion.div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Nav Links or Legal in Menu */}
              <div className="border-t border-deep-violet/5 dark:border-white/5 pt-4 flex flex-col gap-2">
                <Link
                  href="/leaderboard"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 py-2 px-3 rounded-xl hover:bg-deep-violet/5 dark:hover:bg-white/5 font-extrabold text-xs uppercase tracking-wider"
                >
                  <Trophy className="w-4 h-4 text-primary-gold" />
                  <span>Leaderboard</span>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
          <p className="text-xs font-bold text-deep-violet/50 dark:text-soft-cream/50 text-center md:text-left">
            © {new Date().getFullYear()} Luck ഉണ്ടോ ?. Live beautifully, roll wisely. 🍀
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => openLegal("terms")}
              className="text-xs font-bold text-deep-violet/50 hover:text-primary-gold dark:text-soft-cream/50 dark:hover:text-primary-gold hover:underline cursor-pointer bg-transparent border-0 transition-colors"
            >
              Terms
            </button>
            <span className="text-[10px] text-deep-violet/20 dark:text-white/10">•</span>
            <button
              onClick={() => openLegal("privacy")}
              className="text-xs font-bold text-deep-violet/50 hover:text-primary-gold dark:text-soft-cream/50 dark:hover:text-primary-gold hover:underline cursor-pointer bg-transparent border-0 transition-colors"
            >
              Privacy Policy
            </button>
            <span className="text-[10px] text-deep-violet/20 dark:text-white/10">•</span>
            <button
              onClick={() => openLegal("cookies")}
              className="text-xs font-bold text-deep-violet/50 hover:text-primary-gold dark:text-soft-cream/50 dark:hover:text-primary-gold hover:underline cursor-pointer bg-transparent border-0 transition-colors"
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
      <ShareModal isOpen={shareOpen} onClose={() => setShareOpen(false)} score={luckyScore} />
      <LegalModal isOpen={legalOpen} onClose={() => setLegalOpen(false)} initialTab={legalTab} />
    </div>
  );
}
