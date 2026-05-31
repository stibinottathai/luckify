"use client";

import React from "react";
import { motion } from "framer-motion";

interface ThemeToggleProps {
  dark: boolean;
  toggleTheme: () => void;
}

export default function ThemeToggle({ dark, toggleTheme }: ThemeToggleProps) {
  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center justify-between w-[72px] h-[36px] rounded-full p-[3px] cursor-pointer overflow-hidden border border-deep-violet/10 dark:border-white/15 bg-slate-100 dark:bg-[#0b0c16] transition-colors duration-500 shadow-inner select-none active:scale-95 active:duration-75"
      aria-label="Toggle celestial alignment theme"
    >
      {/* Dynamic Cosmic Background Layer */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        animate={{
          background: dark
            ? "radial-gradient(circle at 10% 20%, #0d0e23 0%, #151838 100%)"
            : "radial-gradient(circle at 90% 80%, #ffecd2 0%, #fcb69f 100%)",
        }}
        transition={{ duration: 0.5 }}
      />

      {/* Twinkling stars in Dark Mode */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {dark && (
          <>
            <motion.span
              initial={{ opacity: 0, scale: 0.2 }}
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.6, 1.1, 0.6] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
              className="absolute text-[8px] top-1.5 left-3 text-amber-200"
            >
              ✦
            </motion.span>
            <motion.span
              initial={{ opacity: 0, scale: 0.2 }}
              animate={{ opacity: [0.2, 0.9, 0.2], scale: [0.5, 0.9, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.8, delay: 0.4, ease: "easeInOut" }}
              className="absolute text-[6px] top-5 left-7 text-white"
            >
              ★
            </motion.span>
            <motion.span
              initial={{ opacity: 0, scale: 0.2 }}
              animate={{ opacity: [0.4, 1, 0.4], scale: [0.7, 1.2, 0.7] }}
              transition={{ repeat: Infinity, duration: 2.6, delay: 0.2, ease: "easeInOut" }}
              className="absolute text-[7px] top-2 right-4 text-purple-200"
            >
              ✦
            </motion.span>
          </>
        )}

        {/* Fluffy clouds in Light Mode */}
        {!dark && (
          <>
            <motion.div
              animate={{ x: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute w-6 h-2 bg-white/60 rounded-full blur-[0.6px] bottom-1 left-2"
            />
            <motion.div
              animate={{ x: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 5, delay: 0.5, ease: "easeInOut" }}
              className="absolute w-8 h-2.5 bg-white/80 rounded-full blur-[0.4px] top-1.5 right-2"
            />
          </>
        )}
      </div>

      {/* Decorative inner indicators (Labels) */}
      <span className="z-10 pl-2 text-xs select-none pointer-events-none font-bold text-amber-600/60 dark:text-transparent transition-colors duration-300">
        ☀️
      </span>
      <span className="z-10 pr-2.5 text-xs select-none pointer-events-none font-bold text-transparent dark:text-indigo-200/50 transition-colors duration-300">
        🌙
      </span>

      {/* Redesigned Floating Celestial Handle */}
      <motion.div
        className="absolute top-[3px] left-[3px] w-[28px] h-[28px] rounded-full flex items-center justify-center z-20 cursor-pointer shadow-md overflow-visible"
        animate={{
          x: dark ? 39 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 24,
        }}
      >
        {/* Dynamic Inner Globe */}
        <motion.div
          className="relative w-full h-full rounded-full flex items-center justify-center"
          animate={{
            background: dark
              ? "radial-gradient(circle at 30% 30%, #e2e8f0 0%, #cbd5e1 50%, #94a3b8 100%)"
              : "radial-gradient(circle at 30% 30%, #fef08a 0%, #facc15 55%, #ca8a04 100%)",
            boxShadow: dark
              ? "0 0 10px rgba(148, 163, 184, 0.4), inset -2px -2px 4px rgba(0, 0, 0, 0.2)"
              : "0 0 14px rgba(234, 179, 8, 0.6), inset -2px -2px 4px rgba(0, 0, 0, 0.15)",
          }}
          transition={{ duration: 0.3 }}
        >
          {/* Moon Details (Craters) */}
          {dark && (
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
              <div className="absolute w-2 h-2 rounded-full bg-slate-400/50 top-1.5 left-2" />
              <div className="absolute w-1.5 h-1.5 rounded-full bg-slate-400/50 bottom-1.5 left-3.5" />
              <div className="absolute w-1 h-1 rounded-full bg-slate-400/50 top-3 right-1.5" />
            </div>
          )}

          {/* Sun Details (Rotating Ray Ring) */}
          {!dark && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
              className="absolute inset-0 w-full h-full flex items-center justify-center"
            >
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                <div
                  key={angle}
                  className="absolute w-1 h-[32px] rounded-full bg-amber-400/40"
                  style={{
                    transform: `rotate(${angle}deg)`,
                  }}
                />
              ))}
            </motion.div>
          )}

          {/* Core Symbol inside globe (Micro scale and rotation when flipped) */}
          <motion.div
            key={dark ? "moon" : "sun"}
            initial={{ scale: 0.3, rotate: -45, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.3, rotate: 45, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="z-10 font-bold text-sm pointer-events-none"
          >
            {dark ? (
              <span className="text-[11px] drop-shadow-[0_1px_1px_rgba(255,255,255,0.3)]">🌑</span>
            ) : (
              <span className="text-[11px] drop-shadow-[0_1px_1px_rgba(0,0,0,0.1)]">☀️</span>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </button>
  );
}
