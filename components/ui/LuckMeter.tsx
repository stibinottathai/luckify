"use client";

import { useEffect, useState } from "react";
import { motion, animate } from "framer-motion";

interface LuckMeterProps {
  score: number;
  size?: number;
}

export default function LuckMeter({ score, size = 180 }: LuckMeterProps) {
  const [displayScore, setDisplayScore] = useState(score);

  useEffect(() => {
    // Animate the text counter alongside the gauge fill
    const controls = animate(displayScore, score, {
      duration: 1.2,
      ease: "easeOut",
      onUpdate: (latest) => setDisplayScore(Math.round(latest)),
    });
    return () => controls.stop();
  }, [score]);

  // Gauge colors based on ranges
  let strokeColor = "#FF6B6B"; // red (<40)
  let statusText = "Unlucky 🌧️";
  let statusColorClass = "text-alert-coral";

  if (score >= 70) {
    strokeColor = "#00B4A0"; // teal/green (>70)
    statusText = "Super Lucky! 🌟";
    statusColorClass = "text-accent-teal";
  } else if (score >= 40) {
    strokeColor = "#F5B700"; // gold/amber (40-70)
    statusText = "Feeling Lucky! ✨";
    statusColorClass = "text-primary-gold";
  }

  // Circular gauge mathematics
  const radius = 70;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="w-full h-full transform -rotate-90"
          viewBox="0 0 160 160"
        >
          {/* Background circle track */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            className="stroke-deep-violet/10 dark:stroke-white/10"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated score circle segment */}
          <motion.circle
            cx="80"
            cy="80"
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>

        {/* Center label and content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <motion.span
            key={score}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl font-extrabold font-fredoka tracking-tight text-deep-violet dark:text-cream-soft"
          >
            {displayScore}%
          </motion.span>
          <span className="text-xs uppercase tracking-widest font-semibold text-deep-violet/40 dark:text-cream-soft/40 mt-0.5">
            Luck Score
          </span>
        </div>
      </div>

      <motion.p
        key={statusText}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mt-3 font-bold text-sm ${statusColorClass} font-fredoka uppercase tracking-wider`}
      >
        {statusText}
      </motion.p>
    </div>
  );
}
