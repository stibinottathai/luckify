"use client";

import { motion } from "framer-motion";

interface Dice3DPreviewProps {
  skinId: string;
  size?: number; // width/height in px (defaults to 80)
  value?: number; // Settle value face 1-6 (defaults to 1)
  rotateAnimation?: boolean; // Infinite spin (useful for showcases)
}

// Visual skins mapping dictionary
export const DICE_SKINS_STYLE: Record<
  string,
  {
    bgClass: string;
    borderClass: string;
    dotColor: string;
    glowClass: string;
  }
> = {
  wooden_dice: {
    bgClass: "bg-[#8D6E63] border-[#5D4037]",
    borderClass: "border-[#5D4037]/40",
    dotColor: "fill-white",
    glowClass: "shadow-[inset_0_2px_6px_rgba(255,255,255,0.2)]",
  },
  stone_dice: {
    bgClass: "bg-[#78909C] border-[#455A64]",
    borderClass: "border-[#455A64]/40",
    dotColor: "fill-white",
    glowClass: "shadow-[inset_0_2px_6px_rgba(255,255,255,0.2)]",
  },
  bronze_dice: {
    bgClass: "bg-gradient-to-br from-[#A1887F] via-[#8D6E63] to-[#5D4037]",
    borderClass: "border-[#FFF8E1]/20",
    dotColor: "fill-[#FFF8E1]/90",
    glowClass: "shadow-[0_0_12px_rgba(141,110,99,0.3)]",
  },
  crystal_dice: {
    bgClass: "bg-gradient-to-br from-[#E0F7FA] via-[#4DD0E1] to-[#00ACC1]",
    borderClass: "border-[#26C6DA]/50",
    dotColor: "fill-[#006064]",
    glowClass: "shadow-[0_0_18px_rgba(77,208,225,0.5)]",
  },
  nature_dice: {
    bgClass: "bg-gradient-to-br from-[#E8F5E9] via-[#81C784] to-[#388E3C]",
    borderClass: "border-[#4CAF50]/50",
    dotColor: "fill-[#1B5E20]",
    glowClass: "shadow-[0_0_18px_rgba(129,199,132,0.5)]",
  },
  steel_dice: {
    bgClass: "bg-gradient-to-br from-[#ECEFF1] via-[#90A4AE] to-[#455A64]",
    borderClass: "border-[#607D8B]/50",
    dotColor: "fill-[#263238]",
    glowClass: "shadow-[0_0_15px_rgba(144,164,174,0.4)]",
  },
  rainbow_dice: {
    bgClass: "bg-gradient-to-br from-[#FF8A80] via-[#FFD54F] via-[#81C784] to-[#4FC3F7]",
    borderClass: "border-white/40",
    dotColor: "fill-white",
    glowClass: "shadow-[0_0_22px_rgba(255,255,255,0.6)]",
  },
  flame_dice: {
    bgClass: "bg-gradient-to-br from-[#FF3D00] via-[#FF9100] to-[#DD2C00]",
    borderClass: "border-[#FF3D00]/50",
    dotColor: "fill-[#3E2723]",
    glowClass: "shadow-[0_0_22px_rgba(255,61,0,0.65)]",
  },
  frost_dice: {
    bgClass: "bg-gradient-to-br from-[#E0F2F1] via-[#80CBC4] to-[#008080]",
    borderClass: "border-[#008080]/40",
    dotColor: "fill-[#E0F2F1]",
    glowClass: "shadow-[0_0_22px_rgba(128,203,196,0.6)]",
  },
  dragon_dice: {
    bgClass: "bg-gradient-to-br from-[#C62828] via-[#E53935] to-[#1A237E]",
    borderClass: "border-[#C62828]/60",
    dotColor: "fill-[#FFD700]",
    glowClass: "shadow-[0_0_28px_rgba(239,68,68,0.8)]",
  },
  royal_dice: {
    bgClass: "bg-gradient-to-br from-[#D4AF37] via-[#FFDF00] to-[#9B111E]",
    borderClass: "border-yellow-400/60",
    dotColor: "fill-[#9B111E]",
    glowClass: "shadow-[0_0_28px_rgba(245,183,0,0.75)]",
  },
  thunder_dice: {
    bgClass: "bg-gradient-to-br from-[#311B92] via-[#6200EA] to-[#FFEA00]",
    borderClass: "border-[#AA00FF]/50",
    dotColor: "fill-white",
    glowClass: "shadow-[0_0_28px_rgba(98,0,234,0.75)] animate-pulse",
  },
  cosmic_dice: {
    bgClass: "bg-gradient-to-br from-[#1A0B2E] via-[#3D1E6D] to-[#0D061A]",
    borderClass: "border-[#6366F1]/50",
    dotColor: "fill-[#E0F7FA]",
    glowClass: "shadow-[0_0_35px_rgba(99,102,241,0.85)]",
  },
  galaxy_dice: {
    bgClass: "bg-gradient-to-br from-[#4A148C] via-[#004D40] to-[#D500F9]",
    borderClass: "border-[#D500F9]/50",
    dotColor: "fill-[#FFF8E1]",
    glowClass: "shadow-[0_0_35px_rgba(240,98,146,0.8)]",
  },
  infinity_dice: {
    bgClass: "bg-gradient-to-br from-[#000000] via-[#1A237E] to-[#B388FF]",
    borderClass: "border-white/50",
    dotColor: "fill-[#00E5FF]",
    glowClass: "shadow-[0_0_40px_rgba(0,229,255,0.9)] animate-pulse",
  },
};

// SVG Dot coordinates maps 1 to 6
function PreviewDieFace({ value, dotColor }: { value: number; dotColor: string }) {
  const dots: Record<number, [number, number][]> = {
    1: [[50, 50]],
    2: [[25, 25], [75, 75]],
    3: [[25, 25], [50, 50], [75, 75]],
    4: [[25, 25], [25, 75], [75, 25], [75, 75]],
    5: [[25, 25], [25, 75], [50, 50], [75, 25], [75, 75]],
    6: [[25, 25], [25, 50], [25, 75], [75, 25], [75, 50], [75, 75]],
  };

  return (
    <svg className="w-full h-full p-2.5" viewBox="0 0 100 100">
      {dots[value]?.map(([cx, cy], i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r="8"
          className={`${dotColor} filter drop-shadow-[0_0.5px_1px_rgba(0,0,0,0.15)]`}
        />
      ))}
    </svg>
  );
}

export default function Dice3DPreview({
  skinId,
  size = 80,
  value = 1,
  rotateAnimation = false,
}: Dice3DPreviewProps) {
  const style = DICE_SKINS_STYLE[skinId] || DICE_SKINS_STYLE.wooden_dice;

  const halfSize = size / 2;
  const translateZValue = `${halfSize}px`;

  // Cube rotations for 1 to 6
  const rotations: Record<number, { x: number; y: number }> = {
    1: { x: 20, y: -25 },
    2: { x: -70, y: -25 },
    3: { x: 20, y: -115 },
    4: { x: 20, y: 65 },
    5: { x: 110, y: -25 },
    6: { x: 20, y: 155 },
  };

  const currentRotation = rotations[value] || rotations[1];

  const animateProps = rotateAnimation
    ? {
        rotateX: [20, 380],
        rotateY: [-25, 335],
      }
    : {
        rotateX: currentRotation.x,
        rotateY: currentRotation.y,
      };

  const transitionProps = rotateAnimation
    ? {
        repeat: Infinity,
        duration: 8,
        ease: "linear" as const,
      }
    : {
        duration: 0.8,
        ease: "easeOut" as const,
      };

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        perspective: "500px",
      }}
      className="flex items-center justify-center select-none"
    >
      <motion.div
        animate={animateProps}
        transition={transitionProps}
        style={{
          transformStyle: "preserve-3d",
          width: `${size}px`,
          height: `${size}px`,
        }}
        className={`relative ${style.glowClass}`}
      >
        {/* 1. FRONT FACE (Val 1) */}
        <div
          style={{
            transform: `rotateY(0deg) translateZ(${translateZValue})`,
            width: `${size}px`,
            height: `${size}px`,
          }}
          className={`absolute inset-0 border rounded-xl flex items-center justify-center shadow-md backface-hidden ${style.bgClass} ${style.borderClass}`}
        >
          <PreviewDieFace value={1} dotColor={style.dotColor} />
        </div>

        {/* 2. BACK FACE (Val 6) */}
        <div
          style={{
            transform: `rotateY(180deg) translateZ(${translateZValue})`,
            width: `${size}px`,
            height: `${size}px`,
          }}
          className={`absolute inset-0 border rounded-xl flex items-center justify-center shadow-md backface-hidden ${style.bgClass} ${style.borderClass}`}
        >
          <PreviewDieFace value={6} dotColor={style.dotColor} />
        </div>

        {/* 3. RIGHT FACE (Val 3) */}
        <div
          style={{
            transform: `rotateY(90deg) translateZ(${translateZValue})`,
            width: `${size}px`,
            height: `${size}px`,
          }}
          className={`absolute inset-0 border rounded-xl flex items-center justify-center shadow-md backface-hidden ${style.bgClass} ${style.borderClass}`}
        >
          <PreviewDieFace value={3} dotColor={style.dotColor} />
        </div>

        {/* 4. LEFT FACE (Val 4) */}
        <div
          style={{
            transform: `rotateY(-90deg) translateZ(${translateZValue})`,
            width: `${size}px`,
            height: `${size}px`,
          }}
          className={`absolute inset-0 border rounded-xl flex items-center justify-center shadow-md backface-hidden ${style.bgClass} ${style.borderClass}`}
        >
          <PreviewDieFace value={4} dotColor={style.dotColor} />
        </div>

        {/* 5. TOP FACE (Val 2) */}
        <div
          style={{
            transform: `rotateX(90deg) translateZ(${translateZValue})`,
            width: `${size}px`,
            height: `${size}px`,
          }}
          className={`absolute inset-0 border rounded-xl flex items-center justify-center shadow-md backface-hidden ${style.bgClass} ${style.borderClass}`}
        >
          <PreviewDieFace value={2} dotColor={style.dotColor} />
        </div>

        {/* 6. BOTTOM FACE (Val 5) */}
        <div
          style={{
            transform: `rotateX(-90deg) translateZ(${translateZValue})`,
            width: `${size}px`,
            height: `${size}px`,
          }}
          className={`absolute inset-0 border rounded-xl flex items-center justify-center shadow-md backface-hidden ${style.bgClass} ${style.borderClass}`}
        >
          <PreviewDieFace value={5} dotColor={style.dotColor} />
        </div>
      </motion.div>
    </div>
  );
}
