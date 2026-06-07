"use client";

import { Fortune } from "./blessings";
import { Cinzel, Cormorant_Garamond } from "next/font/google";

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  weight: ["400", "700", "900"],
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

interface EnvelopeCardProps {
  phase: "idle" | "opening" | "revealing" | "done";
  fortune: Fortune | null;
  onClick: () => void;
}

export default function EnvelopeCard({ phase, fortune, onClick }: EnvelopeCardProps) {
  const isIdle = phase === "idle";
  const isOpening = phase === "opening";
  const isRevealing = phase === "revealing";
  const isDone = phase === "done";
  
  // The golden card should rise if we are revealing or done
  const showCard = isRevealing || isDone;

  return (
    <div className={`relative select-none ${cinzel.variable} ${cormorant.variable}`}>
      {/* Dynamic Scoped Keyframes */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes flapOpen {
          0% {
            transform: rotateX(0deg);
          }
          100% {
            transform: rotateX(-180deg);
            z-index: 5; /* Lower z-index so card rises in front of it */
          }
        }
        @keyframes cardRise {
          0% {
            transform: translateY(120px) scale(0.95);
            opacity: 0;
          }
          100% {
            transform: translateY(-135px) scale(1);
            opacity: 1;
          }
        }
        @keyframes floatPulse {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-6px);
          }
        }
        @keyframes subtleGlow {
          0%, 100% {
            box-shadow: 0 10px 25px -5px rgba(220, 38, 38, 0.4), 0 8px 10px -6px rgba(245, 183, 0, 0.2);
          }
          50% {
            box-shadow: 0 20px 35px -5px rgba(220, 38, 38, 0.6), 0 12px 16px -4px rgba(245, 183, 0, 0.35);
          }
        }
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
      `}} />

      {/* Outer wrapper with float animation when idle */}
      <div 
        role="button"
        tabIndex={isIdle ? 0 : -1}
        onClick={isIdle ? onClick : undefined}
        onKeyDown={(e) => {
          if (isIdle && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onClick();
          }
        }}
        className={`w-[290px] h-[370px] relative perspective-1000 cursor-pointer transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:ring-offset-4 focus-visible:ring-offset-[#250b0b] rounded-2xl ${
          isIdle ? "hover:scale-[1.03] focus-visible:scale-[1.03] pulse-animated" : ""
        }`}
        style={{
          animation: isIdle ? "floatPulse 3s ease-in-out infinite" : "none"
        }}
      >
        {/* Envelope Body Container */}
        <div 
          className="w-full h-full relative preserve-3d rounded-2xl transition-shadow duration-300"
          style={{
            animation: isIdle ? "subtleGlow 3s ease-in-out infinite" : "none",
            boxShadow: !isIdle ? "0 15px 30px rgba(0, 0, 0, 0.3)" : undefined
          }}
        >
          
          {/* 1. BACK PANEL: Deep background of the envelope pocket (z-0) */}
          <div className="absolute inset-0 bg-[#7a0d0d] rounded-2xl z-0 overflow-hidden border border-[#520707]">
            {/* Dark inner shadow for depth */}
            <div className="absolute inset-0 bg-black/35 shadow-[inset_0_4px_16px_rgba(0,0,0,0.6)]" />
          </div>

          {/* 2. GOLDEN INNER CARD: Tucked inside, slides up on reveal (z-10) */}
          <div 
            className={`absolute top-[40px] left-[15px] w-[260px] h-[300px] bg-gradient-to-br from-[#FFF5D6] via-[#FFFDF5] to-[#FCD975] rounded-xl border-2 border-amber-400 p-4 shadow-xl z-10 flex flex-col justify-between items-center transition-all ${
              showCard ? "card-animated" : "opacity-0 translate-y-[120px] pointer-events-none"
            }`}
            style={{
              animation: showCard ? "cardRise 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards" : "none",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.8)"
            }}
          >
            {/* Elegant inner gold border */}
            <div className="absolute inset-1.5 border border-amber-500/30 rounded-lg pointer-events-none flex flex-col items-center justify-between p-3">
              
              {/* Header Auspicious Cloud Deco */}
              <div className="w-full flex items-center justify-center gap-1.5 opacity-80 mt-1">
                <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-amber-500" />
                <span className="text-amber-600 text-xs">🧧</span>
                <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-amber-500" />
              </div>

              {/* Number and fortune container */}
              <div className="flex-1 flex flex-col items-center justify-center my-auto">
                <p 
                  className="text-[10px] font-bold text-amber-800/60 uppercase tracking-widest mb-0.5"
                  style={{ fontFamily: "var(--font-cinzel)" }}
                >
                  Lucky Number
                </p>
                <h4 
                  className="text-6xl font-black text-red-700 tracking-wider drop-shadow-sm select-none"
                  style={{ fontFamily: "var(--font-cinzel)" }}
                >
                  {fortune?.luckyNumber ?? "--"}
                </h4>
                
                {/* Visual separator line */}
                <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent my-3.5" />

                {/* Blessing message */}
                <p 
                  className="text-sm sm:text-base font-bold italic text-red-950/90 leading-relaxed px-2 text-center select-none"
                  style={{ fontFamily: "var(--font-cormorant)" }}
                >
                  "{fortune?.blessing ?? "Your blessing awaits..."}"
                </p>
              </div>

              {/* Footer Stamp Deco */}
              <div className="flex flex-col items-center justify-center opacity-70 mb-1">
                <span 
                  className="text-[10px] font-bold text-amber-700/80 uppercase tracking-widest"
                  style={{ fontFamily: "var(--font-cinzel)" }}
                >
                  Luck ഉണ്ടോ ?
                </span>
                <div className="text-[7px] text-amber-600 mt-0.5">✨ 吉祥如意 ✨</div>
              </div>
            </div>
          </div>

          {/* 3. FRONT PAPER FOLDS: Pocket panels styled with clip-path (z-20) */}
          
          {/* Subtle Diagonal Lines Texture overlay for the whole front */}
          <div className="absolute inset-0 z-20 rounded-2xl pointer-events-none overflow-hidden bg-[repeating-linear-gradient(45deg,rgba(0,0,0,0)_0px,rgba(0,0,0,0)_12px,rgba(0,0,0,0.04)_12px,rgba(0,0,0,0.04)_24px)]" />

          {/* LEFT FOLD */}
          <div 
            className="absolute inset-0 bg-gradient-to-br from-[#c62828] to-[#991b1b] rounded-2xl z-20 border-l border-[#8a1414] shadow-md"
            style={{
              clipPath: "polygon(0 0, 50% 50%, 0 100%)",
            }}
          />

          {/* RIGHT FOLD */}
          <div 
            className="absolute inset-0 bg-gradient-to-bl from-[#b71c1c] to-[#991b1b] rounded-2xl z-20 border-r border-[#8a1414] shadow-md"
            style={{
              clipPath: "polygon(100% 0, 50% 50%, 100% 100%)",
            }}
          />

          {/* BOTTOM FOLD */}
          <div 
            className="absolute inset-0 bg-gradient-to-t from-[#8d0f0f] via-[#a81616] to-[#b71c1c] rounded-2xl z-20 border-b border-[#700909] shadow-lg"
            style={{
              clipPath: "polygon(0 100%, 50% 50%, 100% 100%)",
            }}
          />

          {/* 4. DECORATIVE CREASE LINES: SVG stitch lines meeting at the center (z-22) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-22 opacity-35" viewBox="0 0 290 370">
            <line x1="0" y1="0" x2="145" y2="185" stroke="#fcd34d" strokeWidth="1.5" strokeDasharray="4,4" />
            <line x1="290" y1="0" x2="145" y2="185" stroke="#fcd34d" strokeWidth="1.5" strokeDasharray="4,4" />
            <line x1="0" y1="370" x2="145" y2="185" stroke="#fcd34d" strokeWidth="1.5" strokeDasharray="4,4" />
            <line x1="290" y1="370" x2="145" y2="185" stroke="#fcd34d" strokeWidth="1.5" strokeDasharray="4,4" />
          </svg>

          {/* 5. GOLD MEDALLION: Center decoration over the folds (z-25) */}
          <div 
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-[3px] border-amber-400 bg-gradient-to-br from-[#800c0c] to-[#4c0505] flex items-center justify-center text-amber-400 text-3xl font-extrabold shadow-[0_4px_12px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.15)] ring-2 ring-amber-400/20 font-sans select-none z-25 transition-transform duration-300 ${
              isIdle ? "group-hover:scale-110 active:scale-95" : ""
            }`}
          >
            囍
          </div>

          {/* 6. TOP FLAP: Triangular top panel that swings open (z-30) */}
          <div 
            className={`absolute top-0 left-0 w-full h-[185px] origin-top preserve-3d z-30 transition-transform ${
              isOpening || isRevealing || isDone ? "flap-animated" : ""
            }`}
            style={{
              transformStyle: "preserve-3d",
              transformOrigin: "top center",
              animation: (isOpening || isRevealing || isDone) ? "flapOpen 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards" : "none"
            }}
          >
            {/* Front outer face of the flap */}
            <div 
              className="absolute inset-0 bg-gradient-to-b from-[#d32f2f] to-[#b71c1c] backface-hidden"
              style={{
                clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.25))"
              }}
            >
              {/* Gold trim along flap edge */}
              <svg className="w-full h-full opacity-60" viewBox="0 0 290 185">
                <line x1="0" y1="0" x2="145" y2="185" stroke="#fcd34d" strokeWidth="2.5" />
                <line x1="290" y1="0" x2="145" y2="185" stroke="#fcd34d" strokeWidth="2.5" />
              </svg>
            </div>

            {/* Back inner face of the flap (seen when flipped open -180 deg) */}
            <div 
              className="absolute inset-0 bg-gradient-to-t from-[#8d0f0f] to-[#b71c1c]"
              style={{
                clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                transform: "rotateX(180deg)", /* flipped standard orientation */
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden"
              }}
            >
              {/* Inner details */}
              <div className="absolute inset-0 flex items-center justify-center opacity-25">
                <span 
                  className="text-amber-400 text-3xl font-bold"
                  style={{ fontFamily: "var(--font-cinzel)" }}
                >
                  福
                </span>
              </div>
              <svg className="w-full h-full opacity-40" viewBox="0 0 290 185">
                <line x1="0" y1="0" x2="145" y2="185" stroke="#fcd34d" strokeWidth="1.5" />
                <line x1="290" y1="0" x2="145" y2="185" stroke="#fcd34d" strokeWidth="1.5" />
              </svg>
            </div>
          </div>

          {/* Crease shadow at the top fold line (z-30) */}
          <div 
            className={`absolute top-0 left-0 w-full h-5 bg-gradient-to-b from-black/45 to-transparent z-30 pointer-events-none transition-opacity duration-500 ${
              isIdle ? "opacity-0" : "opacity-100"
            }`} 
          />

        </div>
      </div>
    </div>
  );
}
