"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import confetti from "canvas-confetti";

interface ConfettiButtonProps extends HTMLMotionProps<"button"> {
  isWin?: boolean;
}

export default function ConfettiButton({
  children,
  isWin = true,
  onClick,
  className = "",
  ...props
}: ConfettiButtonProps) {
  
  const handleTrigger = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Run normal click handler
    if (onClick) {
      onClick(e);
    }

    try {
      // Calculate coordinates normalized from 0 to 1
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;

      if (isWin) {
        // High fidelity jackpot explosion
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { x, y },
          colors: ["#F5B700", "#2D1B69", "#00B4A0", "#FF6B6B", "#ffffff"],
        });
      } else {
        // Smaller dud splash
        confetti({
          particleCount: 15,
          spread: 30,
          origin: { x, y },
          colors: ["#A0AEC0", "#718096"],
        });
      }
    } catch (err) {
      console.warn("Confetti triggered unsuccessfully:", err);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={handleTrigger}
      className={`relative inline-flex items-center justify-center font-bold overflow-hidden rounded-xl cursor-pointer select-none transition-all duration-200 ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
