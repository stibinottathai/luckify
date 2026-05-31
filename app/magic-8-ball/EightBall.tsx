"use client";

import React from "react";
import { Answer } from "./answers";
import "./8ball.css";

interface EightBallProps {
  phase: "idle" | "shaking" | "revealing" | "answer" | "resetting";
  answer: Answer | null;
}

export default function EightBall({ phase, answer }: EightBallProps) {
  // Determine the glow color variable based on answer type
  const getGlowColor = () => {
    if (!answer) return "rgba(0, 0, 0, 0.5)";
    switch (answer.type) {
      case "positive":
        return "rgba(74, 222, 128, 0.4)";
      case "neutral":
        return "rgba(96, 165, 250, 0.4)";
      case "negative":
        return "rgba(248, 113, 113, 0.4)";
      default:
        return "rgba(0, 0, 0, 0.5)";
    }
  };

  // Determine glow animation class
  const getGlowClass = () => {
    if (phase !== "answer" || !answer) return "";
    switch (answer.type) {
      case "positive":
        return "ball-glow-positive animate-glow";
      case "neutral":
        return "ball-glow-neutral animate-glow";
      case "negative":
        return "ball-glow-negative animate-glow";
      default:
        return "";
    }
  };

  // Determine the triangle color category class
  const getTriangleClass = () => {
    if (!answer) return "";
    switch (answer.type) {
      case "positive":
        return "triangle-positive";
      case "neutral":
        return "triangle-neutral";
      case "negative":
        return "triangle-negative";
      default:
        return "";
    }
  };

  // Check state groups
  const showWhiteCircle = phase === "idle" || phase === "shaking";
  const showWindow = phase === "revealing" || phase === "answer" || phase === "resetting";

  return (
    <div className="relative flex items-center justify-center select-none py-10">
      
      {/* Outer 8-Ball Sphere */}
      <div
        id="ball-outer"
        className={`relative flex items-center justify-center transition-all duration-500 ease-in-out ${
          phase === "shaking" ? "animate-shake" : ""
        } ${getGlowClass()}`}
        style={{
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          background: "radial-gradient(circle at 35% 35%, #2a2a2a, #000000)",
          boxShadow: phase === "answer" ? undefined : `
            0 0 0 2px #111,
            0 20px 60px rgba(0, 0, 0, 0.8),
            0 0 40px rgba(0, 0, 0, 0.5),
            inset 0 -10px 30px rgba(0, 0, 0, 0.9)
          `,
          ["--glow-color" as any]: getGlowColor(),
        }}
      >
        
        {/* Top-Left Highlight Shine overlay (Gloss effect) */}
        <div
          id="ball-shine"
          className="pointer-events-none"
          style={{
            position: "absolute",
            width: "90px",
            height: "60px",
            top: "30px",
            left: "40px",
            background: "radial-gradient(ellipse, rgba(255, 255, 255, 0.18), transparent)",
            borderRadius: "50%",
            transform: "rotate(-30deg)",
            zIndex: 10,
          }}
        />

        {/* White Circle "8" Screen */}
        <div
          id="ball-circle-white"
          className="ball-circle-transition absolute flex items-center justify-center bg-white shadow-[inset_0_-4px_10px_rgba(0,0,0,0.2),_0_4px_10px_rgba(0,0,0,0.3)]"
          style={{
            width: "110px",
            height: "110px",
            borderRadius: "50%",
            zIndex: 5,
            opacity: showWhiteCircle ? 1 : 0,
            transform: showWhiteCircle ? "scale(1)" : "scale(0.6)",
            filter: phase === "shaking" ? "blur(1px)" : "none",
          }}
        >
          <span className="text-black font-fredoka font-black text-5xl select-none select-none-all">
            8
          </span>
        </div>

        {/* Dark Window Window (Visible when shaking completes) */}
        <div
          id="window-outer"
          className="window-transition absolute flex items-center justify-center overflow-hidden border-[4px] border-[#181822] bg-[#02020a]"
          style={{
            width: "140px",
            height: "140px",
            borderRadius: "50%",
            transform: showWindow ? "translateY(10px) scale(1)" : "translateY(10px) scale(0.6)",
            opacity: showWindow ? 1 : 0,
            zIndex: 6,
            boxShadow: "inset 0 4px 15px rgba(0,0,0,0.9), 0 2px 4px rgba(255,255,255,0.05)",
          }}
        >
          {/* Inner Dark Blue Pool */}
          <div
            id="window-inner"
            className={`w-full h-full flex items-center justify-center relative ${
              phase === "shaking" ? "animate-window-darken" : ""
            }`}
            style={{
              background: "radial-gradient(circle at center, #0a0a2e 0%, #000005 70%)",
              borderRadius: "50%",
            }}
          >
            {/* The Answer Triangle */}
            {answer && (
              <div
                id="triangle"
                className={`transition-all duration-300 flex flex-col items-center justify-center select-none ${getTriangleClass()} ${
                  phase === "revealing" || phase === "answer" ? "animate-rise" : ""
                } ${phase === "resetting" ? "animate-sink" : ""}`}
                style={{
                  clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
                  width: "116px",
                  height: "100px",
                  paddingTop: "54px",
                  paddingLeft: "6px",
                  paddingRight: "6px",
                  filter: `drop-shadow(0 0 6px ${getGlowColor()})`,
                  transform: "translateY(14px)",
                }}
              >
                {/* Answer Text inside Triangle */}
                <p
                  id="answer-text"
                  className="font-cinzel text-[8.5px] uppercase font-black tracking-wide text-center leading-tight select-none select-none-all"
                  style={{
                    color: "currentColor",
                    textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                    maxWidth: "74px",
                  }}
                >
                  {answer.text}
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
