"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coffee, X, Plus, Minus, Heart, Sparkles, CheckCircle, Gift } from "lucide-react";
import { useLuckStore } from "@/store/luckStore";
import { playWinChime, playLegendaryReward } from "@/lib/audio";
import confetti from "canvas-confetti";

export default function BuyMeCoffeeWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [coffees, setCoffees] = useState(3);
  const [showBlessing, setShowBlessing] = useState(false);
  const [mounted, setMounted] = useState(false);

  const addCoins = useLuckStore((s) => s.addCoins);

  const username = process.env.NEXT_PUBLIC_BUY_ME_A_COFFEE_USERNAME || "luckify";
  const costPerCoffee = 5;
  const totalCost = coffees * costPerCoffee;

  // Hydration safety and custom trigger listener
  useEffect(() => {
    setMounted(true);

    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-buy-me-coffee-modal", handleOpen);
    return () => {
      window.removeEventListener("open-buy-me-coffee-modal", handleOpen);
    };
  }, []);

  if (!mounted) return null;

  // Calculate coffee liquid height based on quantity
  // 0 coffees = 0 height
  // 1 coffee = 25px
  // 2 coffees = 42px
  // 3 coffees = 58px
  // 4 coffees = 70px
  // 5+ coffees = 80px (full)
  const getLiquidHeight = () => {
    if (coffees <= 0) return 0;
    if (coffees === 1) return 25;
    if (coffees === 2) return 42;
    if (coffees === 3) return 58;
    if (coffees === 4) return 70;
    return 80;
  };

  const handleSupport = () => {
    // Open BMC checkout in a new window
    const bmcUrl = `https://www.buymeacoffee.com/${username}`;
    window.open(bmcUrl, "_blank", "noopener,noreferrer");
    
    // Shift to reward confirmation state
    setShowBlessing(true);
  };

  const handleClaimReward = () => {
    // Award coins
    addCoins(5000);
    
    // Play celebratory sound
    playLegendaryReward();

    // Trigger massive confetti shower
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;
    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#F5B700", "#FFD700", "#FFFFFF", "#FF5F5F"],
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#F5B700", "#FFD700", "#FFFFFF", "#FF5F5F"],
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();

    // Close modal and reset state
    setIsOpen(false);
    setShowBlessing(false);
  };

  const handleQuickSelect = (count: number) => {
    setCoffees(count);
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-6 right-6 z-40 select-none">
        <motion.button
          onClick={() => setIsOpen(true)}
          animate={{
            rotate: [0, -8, 8, -8, 8, 0],
            scale: [1, 1.05, 1.05, 1.05, 1.05, 1],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            repeatDelay: 5.2,
            ease: "easeInOut",
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="relative h-14 w-14 rounded-full bg-[#FFDD00] hover:bg-[#FFE54D] text-black shadow-[0_8px_30px_rgb(255,221,0,0.35)] hover:shadow-[0_12px_40px_rgb(255,221,0,0.5)] border border-yellow-400 flex items-center justify-center cursor-pointer group transition-all duration-300"
          aria-label="Support the project - Buy me a coffee"
        >
          {/* Coffee Icon */}
          <Coffee className="w-6 h-6 stroke-[2.5] text-deep-violet group-hover:scale-110 transition-transform" />

          {/* Badge Alert */}
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5F5F] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-[#FF5F5F] text-[9px] font-black text-white items-center justify-center font-fredoka">
              🎁
            </span>
          </span>

          {/* Tooltip on Hover */}
          <span className="absolute right-16 bg-[#1b103e]/90 text-soft-cream border border-primary-gold/35 px-3 py-1.5 rounded-xl text-xs font-bold font-fredoka whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-300 shadow-md">
            Support Luckify ☕
          </span>
        </motion.button>
      </div>

      {/* Immersive Modal Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
          >
            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: -30, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
              className="relative max-w-md w-full bg-gradient-to-b from-white to-neutral-50 dark:from-[#1E1145] dark:to-[#0D0725] border-2 border-deep-violet/10 dark:border-primary-gold/35 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl overflow-hidden font-fredoka text-deep-violet dark:text-soft-cream"
            >
              {/* Decorative Mesh Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-radial from-primary-gold/15 to-transparent pointer-events-none -z-10 animate-pulse" />

              {/* Close Button */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowBlessing(false);
                }}
                className="absolute top-4 right-4 h-9 w-9 rounded-full bg-deep-violet/5 dark:bg-white/5 border border-deep-violet/10 dark:border-white/10 flex items-center justify-center hover:bg-deep-violet/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {!showBlessing ? (
                // Step 1: Coffee Count Selector Flow
                <div className="flex flex-col items-center text-center">
                  <div className="flex items-center gap-2 mb-2 text-primary-gold font-extrabold uppercase tracking-widest text-xs">
                    <Heart className="w-3.5 h-3.5 fill-current animate-pulse text-[#FF5F5F] stroke-[#FF5F5F]" />
                    <span>Support the Garden</span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black mb-3">
                    Buy Us a Coffee ☕
                  </h3>

                  <p className="text-xs sm:text-sm text-deep-violet/70 dark:text-soft-cream/70 mb-6 leading-relaxed max-w-sm">
                    Luckify is completely free and ad-free! Your support keeps our servers running and supports new gamified features. Get a <span className="text-primary-gold font-bold">cosmic reward</span> for your kindness!
                  </p>

                  {/* Interactive Coffee Cup Visualizer Container */}
                  <div className="relative w-36 h-36 flex items-center justify-center mb-6">
                    {/* Floating Steam Particles */}
                    {coffees >= 3 && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 flex gap-1.5 justify-center z-10 pointer-events-none">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            animate={{
                              y: [0, -28],
                              opacity: [0, 0.8, 0],
                              scaleX: [0.7, 1.3, 0.7],
                            }}
                            transition={{
                              duration: 2.2,
                              repeat: Infinity,
                              delay: i * 0.7,
                              ease: "easeInOut",
                            }}
                            className="w-1.5 h-8 bg-amber-400/35 dark:bg-amber-100/30 rounded-full blur-[1px]"
                            style={{ transformOrigin: "bottom center" }}
                          />
                        ))}
                      </div>
                    )}

                    {/* SVG Mug */}
                    <svg viewBox="0 0 100 120" className="w-28 h-32 drop-shadow-xl text-deep-violet dark:text-[#EAE5FF]">
                      <defs>
                        <linearGradient id="coffeeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#C48E56" />
                          <stop offset="50%" stopColor="#7E5130" />
                          <stop offset="100%" stopColor="#4A2E1A" />
                        </linearGradient>
                      </defs>

                      {/* Mug Handle */}
                      <path
                        d="M 68 45 A 18 18 0 0 1 68 85"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeLinecap="round"
                        className="opacity-90 text-[#3A2285] dark:text-[#C5B5FC]"
                      />

                      {/* Inner Cup Background (Empty space color) */}
                      <path
                        d="M 28 35 L 68 35 L 64 95 C 64 103, 32 103, 32 95 Z"
                        fill="currentColor"
                        className="opacity-5 text-deep-violet dark:text-white"
                      />

                      {/* Rising Coffee Liquid */}
                      <path
                        d={`M 29.5 ${105 - getLiquidHeight()} L 66.5 ${105 - getLiquidHeight()} L 63.5 94 C 63.5 101.5, 32.5 101.5, 32.5 94 Z`}
                        fill="url(#coffeeGrad)"
                        className="transition-all duration-500 ease-in-out"
                        style={{ opacity: coffees > 0 ? 1 : 0 }}
                      />

                      {/* Froth Ellipse */}
                      {coffees > 0 && (
                        <ellipse
                          cx="48"
                          cy={105 - getLiquidHeight()}
                          rx={18.5}
                          ry="3.5"
                          fill="#E7C5A3"
                          className="transition-all duration-500 ease-in-out"
                        />
                      )}

                      {/* Mug Front Contour Outline */}
                      <path
                        d="M 28 35 L 68 35 L 64 95 C 64 103, 32 103, 32 95 Z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-[#3A2285] dark:text-[#EAE5FF]"
                      />
                    </svg>

                    {/* Mug Face details for personality */}
                    <div className="absolute bottom-6 flex items-center justify-center gap-1.5 opacity-60 dark:opacity-85 text-[#3A2285] dark:text-[#EAE5FF]">
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      <span className="text-[10px] leading-none -mt-1">◡</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                    </div>
                  </div>

                  {/* Quantity Adjustment Controls */}
                  <div className="flex items-center gap-6 mb-6">
                    <button
                      onClick={() => setCoffees((c) => Math.max(1, c - 1))}
                      className="w-11 h-11 rounded-2xl bg-deep-violet/5 hover:bg-deep-violet/10 dark:bg-white/5 dark:hover:bg-white/10 border border-deep-violet/15 dark:border-white/15 flex items-center justify-center text-lg font-black transition-colors cursor-pointer"
                      aria-label="Decrease coffees"
                    >
                      <Minus className="w-4 h-4 stroke-[3]" />
                    </button>

                    <div className="flex flex-col items-center">
                      <span className="text-3xl font-black tracking-tight select-none">
                        {coffees}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-deep-violet/40 dark:text-soft-cream/40">
                        {coffees === 1 ? "Coffee" : "Coffees"}
                      </span>
                    </div>

                    <button
                      onClick={() => setCoffees((c) => Math.min(20, c + 1))}
                      className="w-11 h-11 rounded-2xl bg-deep-violet/5 hover:bg-deep-violet/10 dark:bg-white/5 dark:hover:bg-white/10 border border-deep-violet/15 dark:border-white/15 flex items-center justify-center text-lg font-black transition-colors cursor-pointer"
                      aria-label="Increase coffees"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="grid grid-cols-3 gap-2 w-full mb-6">
                    {[1, 3, 5].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => handleQuickSelect(preset)}
                        className={`py-2 px-3 rounded-2xl text-xs font-black tracking-wider uppercase border transition-all cursor-pointer ${
                          coffees === preset
                            ? "bg-primary-gold border-primary-gold text-deep-violet shadow-sm"
                            : "bg-deep-violet/5 dark:bg-white/5 border-deep-violet/10 dark:border-white/10 text-deep-violet/70 dark:text-soft-cream/70 hover:bg-deep-violet/10 dark:hover:bg-white/10"
                        }`}
                      >
                        {preset === 1 ? "☕ 1 Cup" : preset === 3 ? "🔥 3 Cups" : "👑 5 Cups"}
                      </button>
                    ))}
                  </div>

                  {/* Cosmic Reward Teaser Badge */}
                  <div className="w-full bg-[#FFDD00]/10 border border-[#FFDD00]/30 rounded-2xl p-3 mb-6 flex items-center gap-3 text-left">
                    <span className="w-10 h-10 rounded-xl bg-[#FFDD00] text-black flex items-center justify-center text-xl flex-shrink-0 shadow-inner">
                      🎁
                    </span>
                    <div>
                      <h4 className="text-xs font-black text-primary-gold leading-tight">
                        Includes Cosmic Blessing!
                      </h4>
                      <p className="text-[10px] font-bold text-deep-violet/60 dark:text-soft-cream/60 leading-normal mt-0.5">
                        Get 5,000 Vibe Coins & a legendary confetti shower upon checking out.
                      </p>
                    </div>
                  </div>

                  {/* Primary Call to Action */}
                  <button
                    onClick={handleSupport}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 hover:from-yellow-300 hover:to-amber-400 text-deep-violet font-black text-sm uppercase tracking-wider shadow-[0_8px_25px_rgba(245,183,0,0.35)] active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Support with {coffees} {coffees === 1 ? "Coffee" : "Coffees"} (${totalCost})</span>
                    <Sparkles className="w-4 h-4 fill-deep-violet text-deep-violet" />
                  </button>
                </div>
              ) : (
                // Step 2: Reward Confirmation Flow
                <div className="flex flex-col items-center text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center text-3xl mb-4 select-none animate-pulse">
                    ✓
                  </div>

                  <h3 className="text-2xl font-black mb-3">
                    Thank You So Much! 💖
                  </h3>

                  <p className="text-xs sm:text-sm text-deep-violet/70 dark:text-soft-cream/70 mb-6 leading-relaxed max-w-xs">
                    Your generosity keeps our virtual garden vibrant and free. As a token of our cosmic appreciation, please claim your reward!
                  </p>

                  {/* Reward Card */}
                  <div className="w-full bg-gradient-to-b from-[#2E1A68] to-[#120734] border-2 border-primary-gold rounded-3xl p-6 mb-6 flex flex-col items-center justify-center shadow-lg relative overflow-hidden">
                    <div className="absolute inset-0 bg-radial from-primary-gold/10 to-transparent pointer-events-none animate-pulse" />
                    
                    <motion.div
                      animate={{ y: [0, -6, 0] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                      className="text-5xl mb-3 select-none"
                    >
                      👑
                    </motion.div>

                    <h4 className="text-4xl font-black text-white filter drop-shadow-md">
                      +5,000
                    </h4>
                    <span className="text-[10px] font-bold text-soft-cream/60 uppercase tracking-widest mt-1">
                      Vibe Coins
                    </span>
                  </div>

                  {/* Claim Button */}
                  <button
                    onClick={handleClaimReward}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-600 hover:from-emerald-300 hover:to-emerald-500 text-white font-black text-sm uppercase tracking-wider shadow-[0_8px_25px_rgba(16,185,129,0.35)] active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Gift className="w-4 h-4 fill-white" />
                    <span>Claim Coins & Blessings 🪙</span>
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
