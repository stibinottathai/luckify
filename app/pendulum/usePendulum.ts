"use client";

import { useEffect, useRef } from "react";
import { playTick } from "@/lib/audio";

interface UsePendulumProps {
  phase: "idle" | "swinging" | "settled";
  setPhase: (phase: "idle" | "swinging" | "settled") => void;
  answer: "yes" | "no" | null;
  setAnswer: (answer: "yes" | "no" | null) => void;
  onSettle: (finalAnswer: "yes" | "no") => void;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  color: string;
}

export function usePendulum({
  phase,
  setPhase,
  answer,
  setAnswer,
  onSettle,
}: UsePendulumProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Physics state stored in refs for synchronous, fluid reading in the rAF loop
  const angleRef = useRef<number>(0);
  const velocityRef = useRef<number>(0);
  const prevAngleRef = useRef<number>(0);

  // Motion trail stores the historical positions of the bob for organic blur sweeping
  const trailRef = useRef<{ x: number; y: number }[]>([]);

  // Magical drifting stardust sparks
  const sparksRef = useRef<Spark[]>([]);

  // Constant Physics Parameters
  const G = 9.8;
  const L = 0.45;
  const DAMPING = 0.996; // Suspenseful slowing damp
  const DT = 0.016; // Stable 60fps frame delta

  const pivotX = 250;
  const pivotY = 50;
  const stringLength = 250; // Perfect fit in our 500x420 bounds

  // Initialize/Reset physical variables
  const resetDivination = () => {
    angleRef.current = 0;
    velocityRef.current = 0;
    prevAngleRef.current = 0;
    trailRef.current = [];
    sparksRef.current = [];
    setAnswer(null);
    setPhase("idle");
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    triggerRenderLoop();
  };

  // Launch the physical swing
  const startDivination = () => {
    if (phase === "swinging") return;

    // Pick a random starting side
    const sign = Math.random() > 0.5 ? 1 : -1;
    // Starting angle between 25° and 45° in radians (0.436 to 0.785 rad)
    const randomAngleDeg = 25 + Math.random() * 20;
    const startAngleRad = (randomAngleDeg * Math.PI) / 180 * sign;

    angleRef.current = startAngleRad;
    velocityRef.current = 0;
    prevAngleRef.current = startAngleRad;
    trailRef.current = [];
    sparksRef.current = [];
    setAnswer(null);
    setPhase("swinging");
  };

  // Draw complex circular astrological background chart
  const drawCelestialDial = (ctx: CanvasRenderingContext2D) => {
    const dialX = 250;
    const dialY = 180;

    ctx.save();
    
    // 1. Concentric circles with extremely fine cosmic gold/indigo opacities
    ctx.strokeStyle = "rgba(255, 248, 231, 0.02)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(dialX, dialY, 80, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(245, 183, 0, 0.03)";
    ctx.beginPath();
    ctx.arc(dialX, dialY, 150, 0, Math.PI * 2);
    ctx.stroke();

    // Dotted outer guide circle
    ctx.strokeStyle = "rgba(99, 102, 241, 0.04)";
    ctx.beginPath();
    ctx.arc(dialX, dialY, 210, 0, Math.PI * 2);
    ctx.setLineDash([4, 8]);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Astrological compass subdivision lines
    ctx.strokeStyle = "rgba(255, 248, 231, 0.015)";
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      const x1 = dialX + 130 * Math.cos(a);
      const y1 = dialY + 130 * Math.sin(a);
      const x2 = dialX + 170 * Math.cos(a);
      const y2 = dialY + 170 * Math.sin(a);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // 3. Faint large swing arc path
    ctx.strokeStyle = "rgba(245, 183, 0, 0.035)";
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, stringLength, Math.PI * 0.3, Math.PI * 0.7);
    ctx.stroke();

    // Subtle star symbol marks on the arc paths
    ctx.fillStyle = "rgba(245, 183, 0, 0.08)";
    const starAngles = [Math.PI * 0.38, Math.PI * 0.44, Math.PI * 0.5, Math.PI * 0.56, Math.PI * 0.62];
    for (const sa of starAngles) {
      const sx = pivotX + stringLength * Math.sin(sa - Math.PI / 2);
      const sy = pivotY + stringLength * Math.cos(sa - Math.PI / 2);
      ctx.beginPath();
      ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  };

  // Main drawing engine invoked on every animation frame
  const drawFrame = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // 1. Clean drawing area
    ctx.clearRect(0, 0, width, height);

    // 2. Draw astrological cosmic dial in background
    drawCelestialDial(ctx);

    const angle = angleRef.current;
    
    // Compute current physical bob coordinates in logical space
    const bobX = pivotX + stringLength * Math.sin(angle);
    const bobY = pivotY + stringLength * Math.cos(angle);

    // Update motion trail
    if (phase === "swinging") {
      trailRef.current.push({ x: bobX, y: bobY });
      if (trailRef.current.length > 25) {
        trailRef.current.shift();
      }
    } else if (phase === "settled") {
      // Gradually decay trail on settle
      if (trailRef.current.length > 0) {
        trailRef.current.shift();
      }
    } else {
      trailRef.current = [];
    }

    // 3. Draw Settle/Winning glowing bloom circle backgrounds
    const pulse = 0.85 + 0.15 * Math.sin(Date.now() * 0.005);
    
    // Left Label: NO (at x=90, y=280)
    if (phase === "settled" && answer === "no") {
      const bloomGrad = ctx.createRadialGradient(90, 280, 5, 90, 280, 75 * pulse);
      bloomGrad.addColorStop(0, "rgba(147, 197, 253, 0.35)");
      bloomGrad.addColorStop(0.4, "rgba(147, 197, 253, 0.1)");
      bloomGrad.addColorStop(1, "rgba(147, 197, 253, 0)");
      ctx.fillStyle = bloomGrad;
      ctx.beginPath();
      ctx.arc(90, 280, 75 * pulse, 0, Math.PI * 2);
      ctx.fill();
    }

    // Right Label: YES (at x=410, y=280)
    if (phase === "settled" && answer === "yes") {
      const bloomGrad = ctx.createRadialGradient(410, 280, 5, 410, 280, 75 * pulse);
      bloomGrad.addColorStop(0, "rgba(245, 183, 0, 0.35)");
      bloomGrad.addColorStop(0.4, "rgba(245, 183, 0, 0.1)");
      bloomGrad.addColorStop(1, "rgba(245, 183, 0, 0)");
      ctx.fillStyle = bloomGrad;
      ctx.beginPath();
      ctx.arc(410, 280, 75 * pulse, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Draw beautiful, high-contrast serif YES / NO labels inside the canvas
    ctx.font = "bold 36px Cinzel, Georgia, 'Times New Roman', serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // NO Label (Left)
    if (phase === "settled" && answer === "no") {
      ctx.fillStyle = "#93C5FD"; // Bright blue-300
      ctx.shadowColor = "#3B82F6";
      ctx.shadowBlur = 15;
    } else if (phase === "settled" && answer === "yes") {
      ctx.fillStyle = "rgba(147, 197, 253, 0.08)"; // Extremely dim
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = "rgba(147, 197, 253, 0.35)"; // Standard dim
      ctx.shadowBlur = 0;
    }
    ctx.fillText("NO", 90, 280);

    // YES Label (Right)
    if (phase === "settled" && answer === "yes") {
      ctx.fillStyle = "#fbbf24"; // Bright amber-400
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = 15;
    } else if (phase === "settled" && answer === "no") {
      ctx.fillStyle = "rgba(245, 183, 0, 0.08)"; // Extremely dim
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = "rgba(245, 183, 0, 0.35)"; // Standard dim
      ctx.shadowBlur = 0;
    }
    ctx.fillText("YES", 410, 280);

    ctx.shadowBlur = 0; // Reset

    // 5. Draw fading arc trail with sweeping neon blurs
    const trail = trailRef.current;
    if (trail.length > 1) {
      for (let i = 0; i < trail.length - 1; i++) {
        const p1 = trail[i];
        const p2 = trail[i + 1];
        const opacity = (i / trail.length) * 0.4;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        
        if (phase === "settled") {
          ctx.strokeStyle = answer === "yes" 
            ? `rgba(245, 183, 0, ${opacity * 0.5})` 
            : `rgba(147, 197, 253, ${opacity * 0.5})`;
        } else {
          ctx.strokeStyle = `rgba(165, 180, 252, ${opacity})`; // Soft indigo neon sweep
        }
        
        ctx.lineWidth = (i / trail.length) * 3 + 0.5;
        ctx.stroke();
      }
    }

    // 6. Draw drifting stardust sparks (glowing particles floating off the moving crystal)
    const sparks = sparksRef.current;
    ctx.save();
    for (const s of sparks) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fillStyle = s.color.replace("ALPHA", s.alpha.toString());
      ctx.shadowColor = s.color.includes("245") ? "#F5B700" : "#60A5FA";
      ctx.shadowBlur = 5 * s.alpha;
      ctx.fill();
    }
    ctx.restore();

    // 7. Draw the Elegant string line with a glowing starlight halo
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(bobX, bobY);
    ctx.strokeStyle = "rgba(199, 210, 254, 0.75)"; // Light indigo starlight
    ctx.lineWidth = 1.6;
    ctx.shadowColor = "rgba(165, 180, 252, 0.4)";
    ctx.shadowBlur = 4;
    ctx.stroke();
    ctx.restore();

    // Draw solid golden double hoop hook supporting the crystal
    ctx.beginPath();
    ctx.arc(bobX, bobY - 26, 6, 0, Math.PI * 2);
    ctx.strokeStyle = "#F5B700";
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(bobX, bobY - 22, 4, 0, Math.PI * 2);
    ctx.strokeStyle = "#FFE082";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 8. Draw intricate 3D Faceted Crystal Bob (double-pointed polished jewel)
    // Points relative to bobX, bobY
    const topPt = { x: bobX, y: bobY - 24 };
    const bottomPt = { x: bobX, y: bobY + 30 };
    const leftPt = { x: bobX - 17, y: bobY + 2 };
    const rightPt = { x: bobX + 17, y: bobY + 2 };
    const centerPt = { x: bobX, y: bobY + 4 };

    // Shading themes based on settlement state
    const isGold = !(phase === "settled" && answer === "no");
    
    // We define individual triangles (facets) to achieve gorgeous 3D volumetric glass reflections
    const drawFacet = (
      p1: { x: number; y: number },
      p2: { x: number; y: number },
      p3: { x: number; y: number },
      gradientColors: [string, string]
    ) => {
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.closePath();

      const facetGrad = ctx.createLinearGradient(p1.x, p1.y, p3.x, p3.y);
      facetGrad.addColorStop(0, gradientColors[0]);
      facetGrad.addColorStop(1, gradientColors[1]);
      ctx.fillStyle = facetGrad;
      ctx.fill();
    };

    // Facet Color Gradients
    let gLeftTop: [string, string];
    let gRightTop: [string, string];
    let gLeftBottom: [string, string];
    let gRightBottom: [string, string];

    if (phase === "settled" && answer === "yes") {
      // Hyper radiant cosmic gold/amber
      gLeftTop = ["#FFFDE7", "#F5B700"];     // High reflection face
      gRightTop = ["#FFF8E7", "#E6A100"];    // Soft reflection face
      gLeftBottom = ["#F5B700", "#B78100"];  // Solid body
      gRightBottom = ["#D88F00", "#7F5A00"]; // Deep shadow
    } else if (phase === "settled" && answer === "no") {
      // Hyper icy celestial sapphire / silver
      gLeftTop = ["#F0F9FF", "#60A5FA"];     // Silver reflection face
      gRightTop = ["#E0F2FE", "#3B82F6"];    // Soft ice blue
      gLeftBottom = ["#93C5FD", "#1D4ED8"];  // Sapphire body
      gRightBottom = ["#2563EB", "#1E3A8A"]; // Deep obsidian blue shadow
    } else {
      // Standard gold divination state
      gLeftTop = ["#FFF9C4", "#FFC107"];
      gRightTop = ["#FFF59D", "#E6A100"];
      gLeftBottom = ["#F5B700", "#A77A00"];
      gRightBottom = ["#B78100", "#6D4C00"];
    }

    // Draw the 4 main facets of the 3D crystal
    drawFacet(topPt, leftPt, centerPt, gLeftTop);
    drawFacet(topPt, rightPt, centerPt, gRightTop);
    drawFacet(bottomPt, leftPt, centerPt, gLeftBottom);
    drawFacet(bottomPt, rightPt, centerPt, gRightBottom);

    // 9. Sharp highlights along the crystal facet edges
    ctx.beginPath();
    ctx.moveTo(topPt.x, topPt.y);
    ctx.lineTo(centerPt.x, centerPt.y);
    ctx.lineTo(bottomPt.x, bottomPt.y);
    ctx.strokeStyle = isGold ? "rgba(255, 255, 255, 0.45)" : "rgba(240, 249, 255, 0.55)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(leftPt.x, leftPt.y);
    ctx.lineTo(centerPt.x, centerPt.y);
    ctx.lineTo(rightPt.x, rightPt.y);
    ctx.strokeStyle = isGold ? "rgba(255, 248, 220, 0.35)" : "rgba(224, 242, 254, 0.4)";
    ctx.stroke();

    // 10. Draw the outer bounding border of the crystal
    ctx.beginPath();
    ctx.moveTo(topPt.x, topPt.y);
    ctx.lineTo(rightPt.x, rightPt.y);
    ctx.lineTo(bottomPt.x, bottomPt.y);
    ctx.lineTo(leftPt.x, leftPt.y);
    ctx.closePath();
    ctx.strokeStyle = isGold ? "#FFD54F" : "#93C5FD";
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // 11. Core glowing crystal micro-gem
    ctx.beginPath();
    ctx.arc(centerPt.x, centerPt.y, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = isGold ? "#FFFDE7" : "#E0F2FE";
    ctx.shadowColor = isGold ? "#F5B700" : "#3B82F6";
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0; // Reset

    // 12. Draw physical pivot hanger at top center (elegant metallic bracket)
    const pivotGrad = ctx.createRadialGradient(pivotX, pivotY, 1, pivotX, pivotY, 15);
    pivotGrad.addColorStop(0, "#FFF59D");
    pivotGrad.addColorStop(0.5, "#E6A100");
    pivotGrad.addColorStop(1, "rgba(22, 10, 50, 0)");
    
    ctx.fillStyle = pivotGrad;
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 15, 0, Math.PI * 2);
    ctx.fill();

    // Solid core pivot pin
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#FFD54F";
    ctx.strokeStyle = "#4D3B00";
    ctx.lineWidth = 1;
    ctx.fill();
    ctx.stroke();
  };

  const triggerRenderLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Apply High-DPI (Retina) Canvas scale overrides
    const dpr = window.devicePixelRatio || 1;
    const logicalWidth = 500;
    const logicalHeight = 420;

    if (canvas.width !== logicalWidth * dpr || canvas.height !== logicalHeight * dpr) {
      canvas.width = logicalWidth * dpr;
      canvas.height = logicalHeight * dpr;
      canvas.style.width = `${logicalWidth}px`;
      canvas.style.height = `${logicalHeight}px`;
      ctx.scale(dpr, dpr);
    }

    const loop = () => {
      const angle = angleRef.current;
      const bobX = pivotX + stringLength * Math.sin(angle);
      const bobY = pivotY + stringLength * Math.cos(angle);

      // 1. Physical simulation updating inside rAF loop
      if (phase === "swinging") {
        const velocity = velocityRef.current;

        // Pendulum differential physical model: acc = -(g / l) * sin(theta)
        const angularAcc = -(G / L) * Math.sin(angle);
        const nextVelocity = (velocity + angularAcc * DT) * DAMPING;
        const nextAngle = angle + nextVelocity;

        // Update references synchronously
        angleRef.current = nextAngle;
        velocityRef.current = nextVelocity;

        // Play subtle clicking wooden ticks on center crossing
        if (prevAngleRef.current * nextAngle < 0) {
          playTick();
        }

        prevAngleRef.current = nextAngle;

        // Emit magical floating stardust sparks on high-velocity swings
        const speed = Math.abs(nextVelocity);
        if (Math.random() < 0.38 + speed * 2) {
          sparksRef.current.push({
            x: bobX + (Math.random() - 0.5) * 8,
            y: bobY + (Math.random() - 0.5) * 8,
            // Drifts backward using inertia
            vx: (Math.random() - 0.5) * 0.4 - nextVelocity * 10,
            vy: Math.random() * 0.4 + 0.15, // float down
            alpha: 0.9,
            size: Math.random() * 2 + 0.8,
            color: "rgba(245, 183, 0, ALPHA)", // gold spark
          });
        }

        // Settling detector: slow velocity near vertical center axis
        if (Math.abs(nextVelocity) < 0.00085 && Math.abs(nextAngle) < 0.045) {
          const finalAnswer: "yes" | "no" = nextAngle >= 0 ? "yes" : "no";
          
          // Lock exact minor physical tilt based on outcome for visual consistency
          angleRef.current = finalAnswer === "yes" ? 0.035 : -0.035;
          velocityRef.current = 0;
          
          setAnswer(finalAnswer);
          setPhase("settled");
          onSettle(finalAnswer);
        }
      } else if (phase === "idle") {
        // Soft rhythmic breathing sway in idle state
        angleRef.current = Math.sin(Date.now() * 0.0018) * 0.022;

        // Emit an occasional tiny golden dust particle in idle state
        if (Math.random() < 0.015) {
          sparksRef.current.push({
            x: bobX + (Math.random() - 0.5) * 6,
            y: bobY + 12,
            vx: (Math.random() - 0.5) * 0.25,
            vy: Math.random() * 0.1 + 0.05,
            alpha: 0.7,
            size: Math.random() * 1.5 + 0.5,
            color: "rgba(245, 183, 0, ALPHA)",
          });
        }
      } else if (phase === "settled" && answer) {
        // Emit winning-colored celebration dust during settles!
        if (Math.random() < 0.05) {
          sparksRef.current.push({
            x: bobX + (Math.random() - 0.5) * 12,
            y: bobY + (Math.random() - 0.5) * 12,
            vx: (Math.random() - 0.5) * 0.35,
            vy: Math.random() * 0.15 + 0.05,
            alpha: 0.8,
            size: Math.random() * 2 + 0.5,
            color: answer === "yes" ? "rgba(245, 183, 0, ALPHA)" : "rgba(147, 197, 253, ALPHA)",
          });
        }
      }

      // Update stardust particle physics
      const sparks = sparksRef.current;
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.alpha -= 0.018; // Fade speed
        if (s.alpha <= 0) {
          sparks.splice(i, 1);
        }
      }

      // 2. Draw updated state onto canvas
      drawFrame(ctx, logicalWidth, logicalHeight);

      // Recursive requestAnimationFrame call
      animFrameRef.current = requestAnimationFrame(loop);
    };

    loop();
  };

  // Triggers the animation loop once component mounts and keeps it running continuously
  useEffect(() => {
    triggerRenderLoop();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [phase, answer]);

  return {
    canvasRef,
    startDivination,
    resetDivination,
    angleRef,
    velocityRef,
  };
}
