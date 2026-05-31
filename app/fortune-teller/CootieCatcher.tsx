"use client";

import { COLORS, getFortune } from "./blessings";
import { Cinzel, Caveat } from "next/font/google";
import "./fortune-teller.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  weight: ["400", "700", "900"],
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  weight: ["400", "700"],
});

interface CootieCatcherProps {
  phase: "idle" | "color-picked" | "pick-number" | "number-picked" | "reveal" | "done";
  openAxis: "x" | "y";
  chosenColor: string | null;
  chosenNumber: number | null;
  revealedFlap: "tl" | "tr" | "bl" | "br" | null;
  fortune: string;
  onPickColor: (colorName: string, index: number) => void;
  onPickNumber: (num: number) => void;
  onRevealFlap: (position: "tl" | "tr" | "bl" | "br", num: number) => void;
}

export default function CootieCatcher({
  phase,
  openAxis,
  chosenColor,
  chosenNumber,
  revealedFlap,
  fortune,
  onPickColor,
  onPickNumber,
  onRevealFlap,
}: CootieCatcherProps) {
  const isIdle = phase === "idle";
  const isPinching = phase === "color-picked" || phase === "number-picked";
  const isPickingNumber = phase === "pick-number";
  const isReveal = phase === "reveal";
  const isDone = phase === "done";

  // Determine pinch animation class based on active axis
  const pinchClass = isPinching ? (openAxis === "x" ? "pinch-x" : "pinch-y") : "";

  // Show outer flaps only when NOT picking a number from the inner layer
  const showOuterFlaps = !(isPickingNumber || phase === "number-picked");

  // Helpers to check if a specific flap was chosen for lifting
  const getFlapLiftClass = (pos: "tl" | "tr" | "bl" | "br") => {
    if ((isDone || isReveal) && revealedFlap === pos) {
      return `lift-${pos}`;
    }
    return "";
  };

  return (
    <div 
      id="cootie-wrapper" 
      className={`${cinzel.variable} ${caveat.variable}`}
    >
      <div 
        id="cootie-inner" 
        className={pinchClass}
      >
        {/* Paper Creases for Realism */}
        <div className="crease-h" />
        <div className="crease-v" />

        {/* =======================================================
            LAYER 1: FORTUNE PANELS (z-0 / z-15 once active)
           ======================================================= */}
        <div className={`fortune-panel fp-tl paper-texture ${revealedFlap === "tl" && isDone ? "reveal-active" : ""}`}>
          {revealedFlap === "tl" && (
            <p 
              className="text-gray-800 text-2xl font-bold leading-snug px-1 select-none"
              style={{ fontFamily: "var(--font-caveat)" }}
            >
              {fortune}
            </p>
          )}
        </div>
        <div className={`fortune-panel fp-tr paper-texture ${revealedFlap === "tr" && isDone ? "reveal-active" : ""}`}>
          {revealedFlap === "tr" && (
            <p 
              className="text-gray-800 text-2xl font-bold leading-snug px-1 select-none"
              style={{ fontFamily: "var(--font-caveat)" }}
            >
              {fortune}
            </p>
          )}
        </div>
        <div className={`fortune-panel fp-bl paper-texture ${revealedFlap === "bl" && isDone ? "reveal-active" : ""}`}>
          {revealedFlap === "bl" && (
            <p 
              className="text-gray-800 text-2xl font-bold leading-snug px-1 select-none"
              style={{ fontFamily: "var(--font-caveat)" }}
            >
              {fortune}
            </p>
          )}
        </div>
        <div className={`fortune-panel fp-br paper-texture ${revealedFlap === "br" && isDone ? "reveal-active" : ""}`}>
          {revealedFlap === "br" && (
            <p 
              className="text-gray-800 text-2xl font-bold leading-snug px-1 select-none"
              style={{ fontFamily: "var(--font-caveat)" }}
            >
              {fortune}
            </p>
          )}
        </div>

        {/* =======================================================
            LAYER 2: INNER NUMBER PANELS (z-10)
           ======================================================= */}
        
        {/* Top Left Inner (1) */}
        <div 
          onClick={() => isPickingNumber && onPickNumber(1)}
          className={`inner-panel ip-tl paper-texture relative ${
            isPickingNumber ? "hover:bg-amber-100/50 cursor-pointer active:scale-95" : ""
          }`}
        >
          <span 
            className={`text-3xl font-extrabold select-none transition-colors absolute left-6 top-1/2 -translate-y-1/2 ${
              isPickingNumber ? "text-amber-800 group-hover:text-amber-600" : "text-amber-900/40"
            }`}
            style={{ fontFamily: "var(--font-cinzel)" }}
          >
            1
          </span>
        </div>

        {/* Top Right Inner (2) */}
        <div 
          onClick={() => isPickingNumber && onPickNumber(2)}
          className={`inner-panel ip-tr paper-texture relative ${
            isPickingNumber ? "hover:bg-amber-100/50 cursor-pointer active:scale-95" : ""
          }`}
        >
          <span 
            className={`text-3xl font-extrabold select-none transition-colors absolute right-6 top-1/2 -translate-y-1/2 ${
              isPickingNumber ? "text-amber-800 group-hover:text-amber-600" : "text-amber-900/40"
            }`}
            style={{ fontFamily: "var(--font-cinzel)" }}
          >
            2
          </span>
        </div>

        {/* Bottom Left Inner (3) */}
        <div 
          onClick={() => isPickingNumber && onPickNumber(3)}
          className={`inner-panel ip-bl paper-texture relative ${
            isPickingNumber ? "hover:bg-amber-100/50 cursor-pointer active:scale-95" : ""
          }`}
        >
          <span 
            className={`text-3xl font-extrabold select-none transition-colors absolute left-6 top-1/2 -translate-y-1/2 ${
              isPickingNumber ? "text-amber-800 group-hover:text-amber-600" : "text-amber-900/40"
            }`}
            style={{ fontFamily: "var(--font-cinzel)" }}
          >
            3
          </span>
        </div>

        {/* Bottom Right Inner (4) */}
        <div 
          onClick={() => isPickingNumber && onPickNumber(4)}
          className={`inner-panel ip-br paper-texture relative ${
            isPickingNumber ? "hover:bg-amber-100/50 cursor-pointer active:scale-95" : ""
          }`}
        >
          <span 
            className={`text-3xl font-extrabold select-none transition-colors absolute right-6 top-1/2 -translate-y-1/2 ${
              isPickingNumber ? "text-amber-800 group-hover:text-amber-600" : "text-amber-900/40"
            }`}
            style={{ fontFamily: "var(--font-cinzel)" }}
          >
            4
          </span>
        </div>

        {/* =======================================================
            LAYER 3: OUTER COLORED/NUMBER FLAPS (z-20)
           ======================================================= */}

        {/* Top Left Flap (Crimson / 5) */}
        <div 
          onClick={() => {
            if (isIdle) onPickColor(COLORS[0].label, 0);
            if (isReveal) onRevealFlap("tl", 5);
          }}
          className={`flap flap-tl paper-texture ${getFlapLiftClass("tl")} ${
            isIdle || isReveal ? "cursor-pointer hover:brightness-105 active:scale-98" : ""
          } transition-all duration-500 ${
            showOuterFlaps ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"
          }`}
          style={{ 
            backgroundColor: isReveal || isDone ? "#faf6f0" : COLORS[0].bg,
            border: isReveal || isDone ? "2px dashed #dc2626" : "none"
          }}
        >
          <div className="absolute top-6 left-1/2 -translate-x-1/2 w-full flex flex-col items-center justify-center text-center px-2">
            {isReveal || isDone ? (
              <span 
                className="text-red-700 text-3xl font-black select-none"
                style={{ fontFamily: "var(--font-cinzel)" }}
              >
                5
              </span>
            ) : (
              <span 
                className="font-extrabold text-xs uppercase tracking-widest select-none"
                style={{ color: COLORS[0].text }}
              >
                {COLORS[0].label}
              </span>
            )}
          </div>
        </div>

        {/* Top Right Flap (Cobalt / 6) */}
        <div 
          onClick={() => {
            if (isIdle) onPickColor(COLORS[1].label, 1);
            if (isReveal) onRevealFlap("tr", 6);
          }}
          className={`flap flap-tr paper-texture ${getFlapLiftClass("tr")} ${
            isIdle || isReveal ? "cursor-pointer hover:brightness-105 active:scale-98" : ""
          } transition-all duration-500 ${
            showOuterFlaps ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"
          }`}
          style={{ 
            backgroundColor: isReveal || isDone ? "#faf6f0" : COLORS[1].bg,
            border: isReveal || isDone ? "2px dashed #1d4ed8" : "none"
          }}
        >
          <div className="absolute top-6 left-1/2 -translate-x-1/2 w-full flex flex-col items-center justify-center text-center px-2">
            {isReveal || isDone ? (
              <span 
                className="text-blue-700 text-3xl font-black select-none"
                style={{ fontFamily: "var(--font-cinzel)" }}
              >
                6
              </span>
            ) : (
              <span 
                className="font-extrabold text-xs uppercase tracking-widest select-none"
                style={{ color: COLORS[1].text }}
              >
                {COLORS[1].label}
              </span>
            )}
          </div>
        </div>

        {/* Bottom Left Flap (Emerald / 7) */}
        <div 
          onClick={() => {
            if (isIdle) onPickColor(COLORS[2].label, 2);
            if (isReveal) onRevealFlap("bl", 7);
          }}
          className={`flap flap-bl paper-texture ${getFlapLiftClass("bl")} ${
            isIdle || isReveal ? "cursor-pointer hover:brightness-105 active:scale-98" : ""
          } transition-all duration-500 ${
            showOuterFlaps ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"
          }`}
          style={{ 
            backgroundColor: isReveal || isDone ? "#faf6f0" : COLORS[2].bg,
            border: isReveal || isDone ? "2px dashed #059669" : "none"
          }}
        >
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full flex flex-col items-center justify-center text-center px-2">
            {isReveal || isDone ? (
              <span 
                className="text-emerald-700 text-3xl font-black select-none"
                style={{ fontFamily: "var(--font-cinzel)" }}
              >
                7
              </span>
            ) : (
              <span 
                className="font-extrabold text-xs uppercase tracking-widest select-none"
                style={{ color: COLORS[2].text }}
              >
                {COLORS[2].label}
              </span>
            )}
          </div>
        </div>

        {/* Bottom Right Flap (Gold / 8) */}
        <div 
          onClick={() => {
            if (isIdle) onPickColor(COLORS[3].label, 3);
            if (isReveal) onRevealFlap("br", 8);
          }}
          className={`flap flap-br paper-texture ${getFlapLiftClass("br")} ${
            isIdle || isReveal ? "cursor-pointer hover:brightness-105 active:scale-98" : ""
          } transition-all duration-500 ${
            showOuterFlaps ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"
          }`}
          style={{ 
            backgroundColor: isReveal || isDone ? "#faf6f0" : COLORS[3].bg,
            border: isReveal || isDone ? "2px dashed #d97706" : "none"
          }}
        >
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full flex flex-col items-center justify-center text-center px-2">
            {isReveal || isDone ? (
              <span 
                className="text-amber-700 text-3xl font-black select-none"
                style={{ fontFamily: "var(--font-cinzel)" }}
              >
                8
              </span>
            ) : (
              <span 
                className="font-extrabold text-xs uppercase tracking-widest select-none"
                style={{ color: COLORS[3].text }}
              >
                {COLORS[3].label}
              </span>
            )}
          </div>
        </div>

        {/* Central Auspicious Diamond Stamp (z-25) */}
        <div id="center-diamond" />

      </div>
    </div>
  );
}
