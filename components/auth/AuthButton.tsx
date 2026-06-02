"use client";

import React, { useState, useRef, useEffect } from "react";
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useAuth } from "@/components/auth/AuthProvider";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, History, ArrowRight } from "lucide-react";
import { useLuckStore } from "@/store/luckStore";

export default function AuthButton() {
  const { user, loading } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { luckyScore, totalPlays, coinBalance } = useLuckStore();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Firebase Google Sign-in failed:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Firebase Sign-out failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full border-2 border-primary-gold/30 border-t-primary-gold animate-spin" />
    );
  }

  if (user) {
    return (
      <div className="relative" ref={dropdownRef}>
        {/* User Profile Avatar Trigger */}
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 p-1 rounded-full border-2 border-primary-gold/50 hover:border-primary-gold bg-cream-soft dark:bg-deep-violet/40 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer focus:outline-none"
        >
          {user.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.photoURL}
              alt={user.displayName || "User"}
              className="w-7 h-7 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-primary-gold/20 flex items-center justify-center text-primary-gold font-bold text-sm">
              {user.displayName ? user.displayName[0].toUpperCase() : "U"}
            </div>
          )}
        </button>

        {/* Premium Profile Dropdown */}
        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute right-0 mt-3 w-72 bg-white dark:bg-[#130b2f] border border-deep-violet/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
            >
              {/* Header Info */}
              <div className="p-4 border-b border-deep-violet/5 dark:border-white/5 bg-gradient-to-br from-deep-violet/5 via-transparent to-primary-gold/5 dark:from-white/5 dark:to-transparent">
                <div className="flex items-center gap-3">
                  {user.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "User"}
                      className="w-12 h-12 rounded-full border-2 border-primary-gold object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary-gold/20 border-2 border-primary-gold flex items-center justify-center text-primary-gold font-bold text-lg">
                      {user.displayName ? user.displayName[0].toUpperCase() : "U"}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <h4 className="font-fredoka text-sm font-bold text-deep-violet dark:text-cream-soft truncate">
                      {user.displayName}
                    </h4>
                    <p className="text-xs text-deep-violet/60 dark:text-cream-soft/60 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Personalized Luck Stats */}
              <div className="px-4 py-3 bg-deep-violet/5 dark:bg-white/10 border-b border-deep-violet/5 dark:border-white/10 grid grid-cols-3 gap-2 text-center select-none">
                <div className="p-2 rounded-xl bg-white dark:bg-[#21164a] border border-deep-violet/8 dark:border-white/10">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-deep-violet/40 dark:text-cream-soft/40 block">
                    Points
                  </span>
                  <span className="font-fredoka text-lg font-extrabold text-primary-gold">
                    {coinBalance.toLocaleString()}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-[#21164a] border border-deep-violet/8 dark:border-white/10">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-deep-violet/40 dark:text-cream-soft/40 block">
                    Vibe Score
                  </span>
                  <span className="font-fredoka text-lg font-extrabold text-deep-violet dark:text-cream-soft">
                    {luckyScore}%
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white dark:bg-[#21164a] border border-deep-violet/8 dark:border-white/10">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-deep-violet/40 dark:text-cream-soft/40 block">
                    Total Plays
                  </span>
                  <span className="font-fredoka text-lg font-extrabold text-deep-violet dark:text-cream-soft">
                    {totalPlays}
                  </span>
                </div>
              </div>

              {/* Action Links */}
              <div className="p-2">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    const historySection = document.getElementById("history-section");
                    if (historySection) {
                      historySection.scrollIntoView({ behavior: "smooth" });
                    } else {
                      window.location.href = "/#history-section";
                    }
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-deep-violet/5 dark:hover:bg-white/5 text-deep-violet dark:text-cream-soft text-xs font-bold transition-colors cursor-pointer text-left"
                >
                  <span className="flex items-center gap-2">
                    <History className="w-4 h-4 text-primary-gold" />
                    My Vibes History
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                </button>
              </div>

              {/* Footer / Sign Out */}
              <div className="p-2 bg-deep-violet/5 dark:bg-white/5 border-t border-deep-violet/5 dark:border-white/5">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    handleSignOut();
                  }}
                  className="w-full flex items-center gap-2 p-2.5 rounded-xl hover:bg-rose-500/10 hover:text-rose-500 text-deep-violet/70 dark:text-cream-soft/70 text-xs font-bold transition-all duration-200 cursor-pointer text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Not signed in: Renders premium, visually stunning Google sign-in button
  return (
    <button
      onClick={handleSignIn}
      className="relative flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-fredoka font-extrabold rounded-full bg-gradient-to-r from-deep-violet to-[#4f3583] hover:from-primary-gold hover:to-[#dfa72b] text-white hover:text-deep-violet border border-primary-gold/30 hover:scale-105 active:scale-95 shadow-md hover:shadow-primary-gold/20 transition-all duration-300 group cursor-pointer focus:outline-none overflow-hidden"
    >
      {/* Light glow effects */}
      <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Google SVG Icon */}
      <svg className="w-4 h-4 flex-shrink-0 bg-white p-0.5 rounded-full" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        />
      </svg>
      <span className="tracking-wide">Sign In</span>
    </button>
  );
}
