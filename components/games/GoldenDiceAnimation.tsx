"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playGoldenDiceTrigger, playGoldenDiceRoll } from "@/lib/audio";

interface GoldenDiceAnimationProps {
  onComplete: () => void;
  outcomeValue: number; // Value to settle on (1-6)
}

// Coordinate angles for settling the 3D cube
const FACE_ROTATIONS: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  6: { x: 0, y: 180 },
  2: { x: -90, y: 0 },
  5: { x: 90, y: 0 },
  3: { x: 0, y: -90 },
  4: { x: 0, y: 90 },
};

function GoldenDieFace({ value }: { value: number }) {
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
          r="9"
          className="fill-amber-950/85 filter drop-shadow-[0_1px_2px_rgba(255,255,255,0.2)]"
        />
      ))}
    </svg>
  );
}

export default function GoldenDiceAnimation({ onComplete, outcomeValue }: GoldenDiceAnimationProps) {
  const [phase, setPhase] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; scale: number; speed: number }[]>([]);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    // Generate floating golden particles
    const list = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: 100 + Math.random() * 20,
      scale: 0.3 + Math.random() * 0.7,
      speed: 4 + Math.random() * 5,
    }));
    setParticles(list);

    // Sequence timing
    playGoldenDiceTrigger();

    const p2Timer = setTimeout(() => {
      if (isMounted.current) setPhase(2);
    }, 1200);

    const p3Timer = setTimeout(() => {
      if (isMounted.current) setPhase(3);
    }, 3200);

    let interval: NodeJS.Timeout;
    let innerTimer: NodeJS.Timeout;

    const p4Timer = setTimeout(() => {
      if (!isMounted.current) return;
      setPhase(4);
      interval = setInterval(() => {
        playGoldenDiceRoll();
      }, 250);
      
      innerTimer = setTimeout(() => {
        clearInterval(interval);
        if (isMounted.current) setPhase(5);
      }, 3000);
    }, 5200);

    return () => {
      isMounted.current = false;
      clearTimeout(p2Timer);
      clearTimeout(p3Timer);
      clearTimeout(p4Timer);
      if (interval) clearInterval(interval);
      if (innerTimer) clearTimeout(innerTimer);
    };
  }, []);

  useEffect(() => {
    if (phase === 5) {
      const timer = setTimeout(() => {
        onComplete();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [phase, onComplete]);

  const getCubeRotation = () => {
    if (phase === 1 || phase === 2) {
      return { rotateX: [0, 180], rotateY: [0, 180], scale: 1 };
    }
    if (phase === 3) {
      return { rotateX: [180, 540], rotateY: [180, 540], scale: [1, 1.6, 1.4] };
    }
    if (phase === 4) {
      const target = FACE_ROTATIONS[outcomeValue] || { x: 0, y: 0 };
      return {
        rotateX: [0, 360 * 3 + target.x],
        rotateY: [0, 360 * 3 + target.y],
        z: [0, 60, 0],
        scale: 1.4,
      };
    }
    const target = FACE_ROTATIONS[outcomeValue] || { x: 0, y: 0 };
    return { rotateX: target.x, rotateY: target.y, scale: 1.4 };
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex flex-col items-center justify-center overflow-hidden select-none">
      
      {phase >= 2 && (
        <div className="absolute inset-0 pointer-events-none z-0">
          {particles.map((p) => (
            <motion.span
              key={p.id}
              style={{ left: `${p.x}%` }}
              initial={{ y: "110%", opacity: 0 }}
              animate={{ y: "-10%", opacity: [0, 0.7, 0.7, 0] }}
              transition={{ repeat: Infinity, duration: p.speed, ease: "linear" }}
              className="absolute text-yellow-400 font-extrabold"
            >
              ★
            </motion.span>
          ))}
        </div>
      )}

      <AnimatePresence>
        {phase >= 2 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: phase === 3 ? 0.85 : 0.45,
              scale: phase === 3 ? 1.6 : 1,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className={`absolute w-72 h-72 rounded-full filter blur-[60px] pointer-events-none bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 shadow-[0_0_60px_rgba(245,183,0,0.4)]`}
          />
        )}
      </AnimatePresence>

      <div className="text-center mb-10 px-6 z-10 max-w-md select-none font-fredoka">
        <AnimatePresence mode="wait">
          {phase === 1 && (
            <motion.h2
              key="p1"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="text-2xl sm:text-3xl font-black text-amber-300 drop-shadow-[0_0_15px_rgba(245,183,0,0.5)] animate-pulse"
            >
              ⚡ Something feels different...
            </motion.h2>
          )}

          {phase === 2 && (
            <motion.h2
              key="p2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-2xl sm:text-3xl font-black text-amber-300 drop-shadow-[0_0_15px_rgba(245,183,0,0.5)]"
            >
              🔮 Atmospheric alignment shifting...
            </motion.h2>
          )}

          {phase === 3 && (
            <motion.h2
              key="p3"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: [0, 1, 1], scale: [0.7, 1.3, 1] }}
              exit={{ opacity: 0, y: -20 }}
              className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-600 drop-shadow-[0_2px_20px_rgba(245,183,0,0.85)] tracking-widest uppercase animate-bounce"
            >
              🌟 GOLDEN DICE EVENT 🌟
            </motion.h2>
          )}

          {phase === 4 && (
            <motion.h2
              key="p4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xl sm:text-2xl font-black text-white uppercase tracking-widest drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]"
            >
              ⏳ Rolling Legendary dice in slow-motion...
            </motion.h2>
          )}

          {phase === 5 && (
            <motion.h2
              key="p5"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-400 drop-shadow-[0_0_15px_rgba(245,183,0,0.7)]"
            >
              ✨ DESTINY HAS ALIGNED! ✨
            </motion.h2>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        animate={
          phase === 2
            ? { x: [0, -6, 6, -6, 6, 0], y: [0, 4, -4, 4, -4, 0] }
            : {}
        }
        transition={{ repeat: phase === 2 ? Infinity : 0, duration: 0.15 }}
        className="perspective-1000 w-[160px] h-[160px] flex items-center justify-center z-10"
      >
        <motion.div
          key={phase >= 3 ? "gold-cube" : "purple-cube"}
          initial={phase === 1 ? { rotateX: 0, rotateY: 0, scale: 1 } : false}
          animate={getCubeRotation()}
          transition={{
            duration: phase === 3 ? 2 : phase === 4 ? 3 : 0.6,
            ease: phase === 4 ? "easeOut" : "easeInOut",
          }}
          style={{ transformStyle: "preserve-3d", width: "100px", height: "100px" }}
          className="relative"
        >
          {phase < 3 ? (
            <>
              {/* 1. FRONT FACE (Val 1) */}
              <div
                style={{ transform: "rotateY(0deg) translateZ(50px)" }}
                className="absolute inset-0 bg-[#2D1B69] border-2 border-white/20 rounded-2xl flex items-center justify-center shadow-md backface-hidden"
              >
                <div className="w-full h-full p-2 bg-[#2D1B69] rounded-2xl">
                  <svg className="w-full h-full p-2" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="8" className="fill-white" />
                  </svg>
                </div>
              </div>

              {/* 2. BACK FACE (Val 6) */}
              <div
                style={{ transform: "rotateY(180deg) translateZ(50px)" }}
                className="absolute inset-0 bg-[#2D1B69] border-2 border-white/20 rounded-2xl flex items-center justify-center shadow-md backface-hidden"
              >
                <div className="w-full h-full p-2 bg-[#2D1B69] rounded-2xl">
                  <svg className="w-full h-full p-2" viewBox="0 0 100 100">
                    {[25, 75].map((cx) => [25, 50, 75].map((cy) => (
                      <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="8" className="fill-white" />
                    )))}
                  </svg>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* 1. FRONT FACE (Val 1) */}
              <div
                style={{ transform: "rotateY(0deg) translateZ(50px)" }}
                className="absolute inset-0 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 border-2 border-white/45 rounded-2xl flex items-center justify-center shadow-[inset_0_4px_10px_rgba(255,255,255,0.4)] backface-hidden"
              >
                <GoldenDieFace value={1} />
              </div>

              {/* 2. BACK FACE (Val 6) */}
              <div
                style={{ transform: "rotateY(180deg) translateZ(50px)" }}
                className="absolute inset-0 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 border-2 border-white/45 rounded-2xl flex items-center justify-center shadow-[inset_0_4px_10px_rgba(255,255,255,0.4)] backface-hidden"
              >
                <GoldenDieFace value={6} />
              </div>

              {/* 3. RIGHT FACE (Val 3) */}
              <div
                style={{ transform: "rotateY(90deg) translateZ(50px)" }}
                className="absolute inset-0 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 border-2 border-white/45 rounded-2xl flex items-center justify-center shadow-[inset_0_4px_10px_rgba(255,255,255,0.4)] backface-hidden"
              >
                <GoldenDieFace value={3} />
              </div>

              {/* 4. LEFT FACE (Val 4) */}
              <div
                style={{ transform: "rotateY(-90deg) translateZ(50px)" }}
                className="absolute inset-0 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 border-2 border-white/45 rounded-2xl flex items-center justify-center shadow-[inset_0_4px_10px_rgba(255,255,255,0.4)] backface-hidden"
              >
                <GoldenDieFace value={4} />
              </div>

              {/* 5. TOP FACE (Val 2) */}
              <div
                style={{ transform: "rotateX(90deg) translateZ(50px)" }}
                className="absolute inset-0 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 border-2 border-white/45 rounded-2xl flex items-center justify-center shadow-[inset_0_4px_10px_rgba(255,255,255,0.4)] backface-hidden"
              >
                <GoldenDieFace value={2} />
              </div>

              {/* 6. BOTTOM FACE (Val 5) */}
              <div
                style={{ transform: "rotateX(-90deg) translateZ(50px)" }}
                className="absolute inset-0 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 border-2 border-white/45 rounded-2xl flex items-center justify-center shadow-[inset_0_4px_10px_rgba(255,255,255,0.4)] backface-hidden"
              >
                <GoldenDieFace value={5} />
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
