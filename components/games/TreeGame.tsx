"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLuckStore } from "@/store/luckStore";
import { useAuth } from "@/components/auth/AuthProvider";
import ResultCard from "@/components/ui/ResultCard";
import ShareModal from "@/components/ui/ShareModal";
import { playWinChime, playDudSound } from "@/lib/audio";
import {
  RotateCcw,
  Sparkles,
  Award,
  Calendar,
  Gift,
  Plus,
  Trash2,
  Lock,
  ChevronRight,
  Volume2,
} from "lucide-react";
import confetti from "canvas-confetti";

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface TreeOption {
  id: string;
  emoji: string;
  name: string;
}

const MAX_FREE_DAILY_SHAKES = 5;

// ─── Default & Branch Coordinates ─────────────────────────────────────────────

const DEFAULT_OPTIONS: TreeOption[] = [
  { id: "1", emoji: "🍃", name: "Water" },
  { id: "2", emoji: "🍃", name: "Coffee" },
  { id: "3", emoji: "🍃", name: "Tea" },
  { id: "4", emoji: "🍃", name: "Juice" },
  { id: "5", emoji: "🍃", name: "Soda" },
  { id: "6", emoji: "🍃", name: "Milk" },
  { id: "7", emoji: "🍃", name: "Smoothie" },
  { id: "8", emoji: "🍃", name: "Energy" },
];

const BRANCH_COORDINATES = [
  { xPercent: 24, yPercent: 22 },
  { xPercent: 58, yPercent: 25 },
  { xPercent: 44, yPercent: 12 },
  { xPercent: 68, yPercent: 38 },
  { xPercent: 16, yPercent: 35 },
  { xPercent: 50, yPercent: 30 },
  { xPercent: 32, yPercent: 42 },
  { xPercent: 40, yPercent: 28 },
  { xPercent: 58, yPercent: 16 },
  { xPercent: 12, yPercent: 24 },
  { xPercent: 74, yPercent: 22 },
  { xPercent: 44, yPercent: 42 },
];

const COLLECTIBLES_CONFIG = [
  { id: "collectible_lucky_leaf", name: "Lucky Leaf", emoji: "🍃", color: "from-green-400 to-emerald-600", glow: "rgba(16,185,129,0.3)" },
  { id: "collectible_golden_leaf", name: "Golden Leaf", emoji: "🍁", color: "from-amber-400 to-yellow-600", glow: "rgba(245,158,11,0.3)" },
  { id: "collectible_rainbow_fruit", name: "Rainbow Fruit", emoji: "🍎", color: "from-pink-500 via-purple-500 to-cyan-500", glow: "rgba(168,85,247,0.3)" },
  { id: "collectible_fortune_crystal", name: "Fortune Crystal", emoji: "🔮", color: "from-indigo-500 to-purple-600", glow: "rgba(99,102,241,0.3)" },
  { id: "collectible_golden_banana", name: "Golden Banana", emoji: "🍌", color: "from-yellow-400 to-amber-500", glow: "rgba(234,179,8,0.3)" },
  { id: "collectible_magic_butterfly", name: "Magic Butterfly", emoji: "🦋", color: "from-cyan-400 to-blue-500", glow: "rgba(6,182,212,0.3)" },
  { id: "collectible_dragon_egg", name: "Dragon Egg", emoji: "🥚", color: "from-emerald-500 to-teal-700", glow: "rgba(16,185,129,0.35)" },
  { id: "collectible_fortune_crown", name: "Fortune Crown", emoji: "👑", color: "from-yellow-500 via-amber-400 to-yellow-600", glow: "rgba(245,158,11,0.4)" },
];

// ─── Sound Synthesizer ────────────────────────────────────────────────────────

function playSoundSway() {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(160, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.9);
    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
    osc.start();
    osc.stop(ctx.currentTime + 0.9);
  } catch (e) {}
}

function playSoundChirp() {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(900, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1700, ctx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) {}
}

function playSoundMagic() {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "triangle";
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0, now + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.08, now + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.25);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.3);
    });
  } catch (e) {}
}

// ─── Level system client utility ──────────────────────────────────────────────

function getLevelProgress(xp: number) {
  let level = 1;
  let remainingXp = xp;
  while (true) {
    const xpForNext = level * 100;
    if (remainingXp >= xpForNext) {
      remainingXp -= xpForNext;
      level++;
    } else {
      break;
    }
  }

  let title = "Seedling";
  if (level >= 100) title = "Legend of Luck";
  else if (level >= 50) title = "Tree Master";
  else if (level >= 20) title = "Fortune Hunter";
  else if (level >= 10) title = "Tree Explorer";
  else if (level >= 5) title = "Gardener";

  return {
    level,
    xpInCurrentLevel: remainingXp,
    xpNeededForNextLevel: level * 100,
    title,
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TreeGame() {
  const { user } = useAuth();
  
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const intervalsRef = useRef<NodeJS.Timeout[]>([]);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      timeoutsRef.current.forEach(clearTimeout);
      intervalsRef.current.forEach(clearInterval);
    };
  }, []);

  // Local active option lists
  const [options, setOptions] = useState<TreeOption[]>(DEFAULT_OPTIONS);
  const [newOptionName, setNewOptionName] = useState("");
  
  // Game state sways
  const [shaking, setShaking] = useState(false);
  const [hasShaken, setHasShaken] = useState(false);
  const [fallingItems, setFallingItems] = useState<{ id: string; name: string; startX?: number; startY?: number; x: number; y: number; rotate: number }[]>([]);
  const [luckyItem, setLuckyItem] = useState<TreeOption | null>(null);
  
  // Interactive result visual systems
  const [showResultCard, setShowResultCard] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [suspensePhase, setSuspensePhase] = useState(false);

  // Gamified updates received from server API
  const [earnedReward, setEarnedReward] = useState<any>(null);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [earnedXp, setEarnedXp] = useState(0);
  const [streakClaimedMsg, setStreakClaimedMsg] = useState("");
  const [levelUpInfo, setLevelUpInfo] = useState<any>(null);
  
  // Screens effects triggers
  const [legendaryBeamTrigger, setLegendaryBeamTrigger] = useState(false);
  const [epicGlowTrigger, setEpicGlowTrigger] = useState(false);

  // Lucky events anim triggers
  const [eventBirdTrigger, setEventBirdTrigger] = useState(false);
  const [eventNestTrigger, setEventNestTrigger] = useState(false);
  const [eventGoldenAppleTrigger, setEventGoldenAppleTrigger] = useState(false);
  const [eventSpiritTrigger, setEventSpiritTrigger] = useState(false);
  const [eventActiveMsg, setEventActiveMsg] = useState("");

  // Mystery Box Opening System
  const [boxOpeningActive, setBoxOpeningActive] = useState(false);
  const [boxLootOutcome, setBoxLootOutcome] = useState<any>(null);
  const [showBoxLootModal, setShowBoxLootModal] = useState(false);

  // Hydrate local Zustand store profile parameters
  const currentProfile = useLuckStore((s) => s.profiles[s.activeUserKey]) || useLuckStore((s) => s.profiles["guest"]);
  const activeUserKey = useLuckStore((s) => s.activeUserKey);

  const levelInfo = getLevelProgress(currentProfile.xp ?? 0);

  // Options panel management
  const addOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOptionName.trim()) return;
    if (options.length >= 20) {
      alert("🌳 The Shaking Tree can hold a maximum of 20 options!");
      return;
    }
    const newOpt: TreeOption = {
      id: Date.now().toString(),
      emoji: "🍃",
      name: newOptionName.trim(),
    };
    setOptions((prev) => [...prev, newOpt]);
    setNewOptionName("");
    playSoundChirp();
  };

  const removeOption = (id: string) => {
    setOptions((prev) => prev.filter((o) => o.id !== id));
    playSoundSway();
  };

  // ─── Main Shake Handler ──────────────────────────────────────────────────────

  const handleShake = async () => {
    if (options.length < 1) {
      alert("⚠️ Tree has no choices! Click RESTOCK in options sidebar to fill branches.");
      return;
    }

    if (shaking || suspensePhase) return;

    setShaking(true);
    setHasShaken(true);
    setLuckyItem(null);
    setShowResultCard(false);
    setEarnedReward(null);
    setEarnedPoints(0);
    setEarnedXp(0);
    setStreakClaimedMsg("");
    setLevelUpInfo(null);
    setEventBirdTrigger(false);
    setEventNestTrigger(false);
    setEventGoldenAppleTrigger(false);
    setEventSpiritTrigger(false);
    setEventActiveMsg("");

    // Procedural sound sway synthesis sweeps
    playSoundSway();
    const soundInterval = setInterval(() => {
      playSoundSway();
    }, 200);
    intervalsRef.current.push(soundInterval);

    const t = setTimeout(async () => {
      clearInterval(soundInterval);
      setShaking(false);
      setSuspensePhase(true); // initiate suspense countdown

      // Pick a random client option
      const luckyIndex = Math.floor(Math.random() * options.length);
      const chosenItem = options[luckyIndex];
      setLuckyItem(chosenItem);

      // Branch coordinate index it falls from
      const coordIndex = options.findIndex((o) => o.id === chosenItem.id) % 12;
      const coord = BRANCH_COORDINATES[coordIndex];
      const startX = ((coord.xPercent - 50) / 100) * 280;
      const startY = ((coord.yPercent / 100) * 260) - 240;

      // Start falling signs physics mapping
      const calculatedFalls = [{
        id: chosenItem.id,
        name: chosenItem.name,
        startX: startX,
        startY: startY,
        x: (50 + Math.random() * 30),
        y: 240 + Math.random() * 20,
        rotate: Math.random() * 180 - 90,
      }];

      setFallingItems(calculatedFalls);

      // Contact Backend API /api/tree/shake securely!
      try {
        const idToken = user ? await user.getIdToken() : "";
        const shakeRes = await fetch("/api/tree/shake", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: idToken ? `Bearer ${idToken}` : "",
          },
          body: JSON.stringify({
            isGuest: activeUserKey === "guest",
            activeOptionId: chosenItem.id,
            options: options.map(o => o.name),
          }),
        });

        if (!shakeRes.ok) {
          const errData = await shakeRes.json();
          alert(`Shake failed: ${errData.error}`);
          setSuspensePhase(false);
          setHasShaken(false);
          setFallingItems([]);
          return;
        }

        const data = await shakeRes.json();
        
        // Setup local rewards details
        setEarnedReward(data.reward);
        setEarnedPoints(data.earnedPoints);
        setEarnedXp(data.earnedXp);
        setStreakClaimedMsg(data.streakAwardedMsg);
        if (data.levelUp && data.levelUp.leveled) {
          setLevelUpInfo(data.levelUp);
        }

        // Hydrate local Zustand store immediately
        if (data.profile) {
          useLuckStore.setState((state) => {
            const updated = {
              ...state.profiles[activeUserKey],
              coinBalance: data.profile.coinBalance,
              xp: data.profile.xp,
              level: data.profile.level,
              shakeStreak: data.profile.shakeStreak,
              shakeStreakRecord: data.profile.shakeStreakRecord,
              dailyShakesToday: data.profile.dailyShakesToday,
              extraShakesBalance: data.profile.extraShakesBalance,
              mysteryBoxesCount: data.profile.mysteryBoxesCount,
              collectedItems: data.profile.collectiblesCount,
              streakShieldsCount: data.profile.streakShieldsCount,
              doubleRewardsUntil: data.profile.doubleRewardsUntil,
              vipUntil: data.profile.vipUntil,
              badges: data.profile.badges,
            };
            return {
              profiles: {
                ...state.profiles,
                [activeUserKey]: updated,
              },
              ...updated,
            };
          });
        }

        // ─── Trigger Lucky Events animations if set ──────────────────────
        if (data.luckyEvent) {
          setEventActiveMsg(data.luckyEvent.description);
          const eType = data.luckyEvent.type;
          
          if (eType === "lucky_bird") {
            setEventBirdTrigger(true);
            timeoutsRef.current.push(setTimeout(() => playSoundChirp(), 1500));
          } else if (eType === "hidden_nest") {
            setEventNestTrigger(true);
            timeoutsRef.current.push(setTimeout(() => playSoundMagic(), 1200));
          } else if (eType === "golden_fruit") {
            setEventGoldenAppleTrigger(true);
            timeoutsRef.current.push(setTimeout(() => playSoundMagic(), 800));
          } else if (eType === "tree_spirit") {
            setEventSpiritTrigger(true);
            timeoutsRef.current.push(setTimeout(() => playSoundMagic(), 500));
          }
        }

        // ─── Suspense phase ending, display outcome ──────────────────────
        timeoutsRef.current.push(setTimeout(() => {
          setSuspensePhase(false);
          setShowResultCard(true);

          // Remove the fallen option from the active choices
          setOptions((prev) => prev.filter((o) => o.id !== chosenItem.id));

          // Trigger high-fidelity graphical overlays based on rarity!
          const rarity = data.rarity;
          if (rarity === "rare") {
            confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
            playWinChime();
          } else if (rarity === "epic") {
            setEpicGlowTrigger(true);
            timeoutsRef.current.push(setTimeout(() => setEpicGlowTrigger(false), 2500));
            confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
            playWinChime();
          } else if (rarity === "legendary") {
            setLegendaryBeamTrigger(true);
            timeoutsRef.current.push(setTimeout(() => setLegendaryBeamTrigger(false), 4500));
            playWinChime();
            // massive multi confetti blast
            let duration = 3 * 1000;
            let end = Date.now() + duration;
            (function frame() {
              confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 } });
              confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 } });
              if (Date.now() < end) requestAnimationFrame(frame);
            }());
          } else {
            playWinChime(); // Standard short chime
          }

        }, 1800)); // 1.8s suspense duration

      } catch (err) {
        console.error(err);
        alert("Network error occurred while shaking the tree!");
        setSuspensePhase(false);
        setHasShaken(false);
        setFallingItems([]);
      }

    }, 1200); // Shaking swaying duration
    timeoutsRef.current.push(t);
  };

  // ─── Mystery Box opening handler ──────────────────────────────────────────────

  const handleOpenMysteryBox = async () => {
    if ((currentProfile.mysteryBoxesCount ?? 0) <= 0 || boxOpeningActive) return;

    setBoxOpeningActive(true);
    setBoxLootOutcome(null);
    setShowBoxLootModal(false);

    playSoundSway();

    try {
      const idToken = user ? await user.getIdToken() : "";
      const boxRes = await fetch("/api/tree/open-box", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: idToken ? `Bearer ${idToken}` : "",
        },
        body: JSON.stringify({
          isGuest: activeUserKey === "guest",
        }),
      });

      if (!boxRes.ok) {
        alert("Failed to open Mystery Box!");
        setBoxOpeningActive(false);
        return;
      }

      const data = await boxRes.json();
      setBoxLootOutcome(data.loot);
      if (data.levelUp && data.levelUp.leveled) {
        setLevelUpInfo(data.levelUp);
      }

      // Hydrate local Zustand store profile values
      if (data.profile) {
        useLuckStore.setState((state) => {
          const updated = {
            ...state.profiles[activeUserKey],
            coinBalance: data.profile.coinBalance,
            xp: data.profile.xp,
            level: data.profile.level,
            mysteryBoxesCount: data.profile.mysteryBoxesCount,
            collectedItems: data.profile.collectiblesCount,
            extraShakesBalance: data.profile.extraShakesBalance,
            badges: data.profile.badges,
          };
          return {
            profiles: {
              ...state.profiles,
              [activeUserKey]: updated,
            },
            ...updated,
          };
        });
      }

      // Play particle animations and win chime
      setTimeout(() => {
        setBoxOpeningActive(false);
        setShowBoxLootModal(true);
        playWinChime();
        confetti({ particleCount: 60, spread: 50, colors: ["#FFD700", "#FF8C00", "#FF1493"] });
      }, 1600); // matches shaking vibrating delay

    } catch (err) {
      console.error(err);
      alert("Failed to open Mystery Box due to server error!");
      setBoxOpeningActive(false);
    }
  };

  const handleRestock = () => {
    setOptions(DEFAULT_OPTIONS);
    setHasShaken(false);
    setFallingItems([]);
    setLuckyItem(null);
    setShowResultCard(false);
    playSoundChirp();
  };

  // Status check utilities
  const doubleActive = currentProfile.doubleRewardsUntil && new Date(currentProfile.doubleRewardsUntil) > new Date();
  const vipActive = currentProfile.vipUntil && new Date(currentProfile.vipUntil) > new Date();

  return (
    <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 py-2 select-none relative">
      
      {/* ── Screen wide visual feedback overlays ── */}
      <AnimatePresence>
        {legendaryBeamTrigger && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[60] flex flex-col items-center justify-center pointer-events-none"
          >
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "100%", opacity: [0, 1, 1, 0.2, 1, 0] }}
              transition={{ duration: 3, times: [0, 0.1, 0.4, 0.6, 0.8, 1] }}
              className="w-16 bg-gradient-to-b from-yellow-300 via-amber-400 to-yellow-600 blur-md"
            />
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [0.5, 1.2, 1], opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="absolute text-center flex flex-col items-center gap-2"
            >
              <span className="text-8xl animate-bounce">👑</span>
              <h2 className="font-fredoka text-4xl sm:text-5xl font-black text-primary-gold uppercase tracking-wider drop-shadow-[0_0_20px_rgba(245,183,0,0.8)]">
                Legendary Drop!
              </h2>
              <p className="font-fredoka text-sm font-bold text-cream-soft tracking-widest mt-2 uppercase">
                Cosmic vibrations have aligned perfectly
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Columns 1 & 2: Interactive SVG Tree & controls ── */}
      <div className="lg:col-span-2 flex flex-col items-center gap-6">
        
        {/* Game board relative card container */}
        <div
          className={`relative w-full bg-white dark:bg-card border-4 border-primary-gold rounded-[2.5rem] p-6 shadow-2xl flex flex-col items-center select-none overflow-hidden h-[540px] transition-all duration-300 ${
            epicGlowTrigger ? "ring-8 ring-purple-500/50 border-purple-500 shadow-[0_0_50px_rgba(168,85,247,0.4)]" : ""
          } ${legendaryBeamTrigger ? "animate-shake" : ""}`}
        >
          {/* Decorative ambient magical particle sparkles in background */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
          
          <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2">
            {vipActive && (
              <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-400 to-yellow-600 text-deep-violet border border-white/20 animate-pulse shadow-md">
                👑 VIP ACTIVE
              </span>
            )}
            {doubleActive && (
              <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md bg-gradient-to-r from-purple-500 to-indigo-600 text-white border border-white/20 animate-pulse shadow-md">
                ⚡ 2X DOUBLE ACTIVE
              </span>
            )}
          </div>

          <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-1 font-fredoka">
            <span className="text-xs font-black text-deep-violet/40 dark:text-cream-soft/40 uppercase tracking-widest">
              Daily Shakes:
            </span>
            <span className="text-sm font-black text-deep-violet dark:text-cream-soft">
              {vipActive ? "∞ Unlimited" : `${MAX_FREE_DAILY_SHAKES - (currentProfile.dailyShakesToday || 0)} / 5 Free`}
            </span>
            {!vipActive && (currentProfile.extraShakesBalance || 0) > 0 && (
              <span className="text-[10px] font-bold text-emerald-500 mt-0.5 uppercase tracking-wide">
                +{currentProfile.extraShakesBalance} Extra Shakes Owned
              </span>
            )}
          </div>

          {/* Large premium redesigned SVG tree */}
          <div className={`relative w-[340px] h-[320px] mt-4 transition-transform ${shaking ? "animate-shake origin-bottom" : ""}`}>
            
            {/* ── Lucky Event visual layers ── */}
            
            {/* Event: Bluebird */}
            <AnimatePresence>
              {eventBirdTrigger && (
                <motion.div
                  initial={{ x: -120, y: -40, rotate: 0 }}
                  animate={{ x: [0, 80, 80, 320], y: [30, 45, 45, -80], rotate: [5, -5, 0, 10] }}
                  transition={{ duration: 4.5, times: [0, 0.4, 0.75, 1], ease: "easeInOut" }}
                  className="absolute z-30 w-12 h-12 select-none pointer-events-none"
                >
                  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
                    <circle cx="50" cy="50" r="22" fill="#29B6F6" />
                    <polygon points="68,45 84,50 68,55" fill="#FFA726" />
                    <circle cx="60" cy="42" r="3.5" fill="#000" />
                    <circle cx="62" cy="40" r="1.5" fill="#fff" />
                    <path d="M30,50 Q8,42 28,58" fill="#0288D1" />
                    <path d="M46,70 Q43,82 41,82" stroke="#E65100" strokeWidth="3" />
                    <path d="M52,70 Q55,82 57,82" stroke="#E65100" strokeWidth="3" />
                  </svg>
                  {/* Drop seed drop animation */}
                  <motion.div
                    initial={{ opacity: 0, y: 0, scale: 0.5 }}
                    animate={{ opacity: [0, 1, 1, 0], y: [0, 140, 140, 140], scale: [0.5, 1.2, 1.2, 0.5] }}
                    transition={{ delay: 1.8, duration: 1.8 }}
                    className="absolute left-6 top-8 text-xl text-primary-gold drop-shadow-md"
                  >
                    ✨🌱
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Event: Hidden Nest */}
            {eventNestTrigger && (
              <motion.div
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1.2 }}
                transition={{ duration: 0.8, delay: 0.5, type: "spring" }}
                className="absolute z-30 top-[110px] left-[135px] pointer-events-none select-none"
              >
                <svg viewBox="0 0 80 50" className="w-14 h-10 drop-shadow-[0_4px_10px_rgba(0,0,0,0.15)]">
                  {/* Straw Nest structure */}
                  <path d="M10,25 C10,40 70,40 70,25 C60,15 20,15 10,25 Z" fill="#8D6E63" />
                  <path d="M15,28 C20,38 60,38 65,28" stroke="#5D4037" strokeWidth="3" fill="none" />
                  {/* Eggs */}
                  <ellipse cx="32" cy="22" rx="6" ry="9" fill="#FFF8E1" transform="rotate(-15 32 22)" />
                  <ellipse cx="48" cy="22" rx="7" ry="10" fill="#E0F2F1" transform="rotate(15 48 22)" />
                  {/* Glowing halo */}
                  <circle cx="40" cy="22" r="15" fill="rgba(245,183,0,0.2)" className="animate-pulse" />
                </svg>
              </motion.div>
            )}

            {/* Event: Golden Apple Fruit */}
            {eventGoldenAppleTrigger && (
              <motion.div
                initial={{ opacity: 0, scale: 0.3, y: -20 }}
                animate={{ opacity: 1, scale: 1.4, y: 0 }}
                transition={{ duration: 0.6, type: "spring" }}
                className="absolute z-30 top-[40px] left-[95px] pointer-events-none select-none flex flex-col items-center"
              >
                {/* Glowing Golden Apple */}
                <svg viewBox="0 0 60 60" className="w-12 h-12 filter drop-shadow-[0_0_15px_rgba(245,183,0,0.7)] animate-pulse">
                  <path d="M30,12 C20,12 12,20 12,30 C12,42 20,50 30,50 C40,50 48,42 48,30 C48,20 40,12 30,12 Z" fill="url(#gold-apple-grad)" />
                  <path d="M30,12 C32,5 38,8 38,8" stroke="#8D6E63" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <path d="M30,10 C22,6 20,10 20,10" stroke="#4CAF50" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  <defs>
                    <radialGradient id="gold-apple-grad" cx="40%" cy="30%" r="60%">
                      <stop offset="0%" stopColor="#FFF176" />
                      <stop offset="60%" stopColor="#F5B700" />
                      <stop offset="100%" stopColor="#B388FF" />
                    </radialGradient>
                  </defs>
                </svg>
              </motion.div>
            )}

            {/* Event: Tree Spirit */}
            <AnimatePresence>
              {eventSpiritTrigger && (
                <motion.div
                  initial={{ y: 80, x: 0, opacity: 0, scale: 0.5 }}
                  animate={{ y: [80, -20, -50], x: [0, 15, -15], opacity: [0, 0.95, 0], scale: [0.5, 1.3, 1] }}
                  transition={{ duration: 4.5, ease: "easeOut" }}
                  className="absolute bottom-24 left-[130px] z-30 select-none pointer-events-none flex flex-col items-center"
                >
                  <svg viewBox="0 0 100 100" className="w-16 h-16 fill-[#EA80FC] text-[#AA00FF] stroke-current filter drop-shadow-[0_0_18px_rgba(234,128,252,0.85)]">
                    <path d="M50,15 C25,15 15,35 15,65 C15,80 25,90 50,90 C75,90 85,80 85,65 C85,35 75,15 50,15 Z" fillOpacity="0.8" strokeWidth="3" />
                    <circle cx="38" cy="45" r="5" fill="#AA00FF" />
                    <circle cx="62" cy="45" r="5" fill="#AA00FF" />
                    <path d="M42,60 Q50,68 58,60" fill="none" stroke="#AA00FF" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                  <span className="text-[8px] font-black text-[#EA80FC] tracking-widest mt-1 bg-black/60 px-2 py-0.5 rounded-full uppercase border border-[#EA80FC]/40 shadow-lg">
                    Tree Spirit
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <svg viewBox="0 0 200 180" className="w-full h-full filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.12)] dark:drop-shadow-[0_8px_18px_rgba(0,0,0,0.38)]">
              <defs>
                {/* Foliage Gradients */}
                <radialGradient id="leaves-grad-1" cx="50%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#2EFD94" />
                  <stop offset="60%" stopColor="#00C853" />
                  <stop offset="100%" stopColor="#007E33" />
                </radialGradient>
                <radialGradient id="leaves-grad-2" cx="30%" cy="30%" r="50%">
                  <stop offset="0%" stopColor="#00E676" />
                  <stop offset="100%" stopColor="#009624" />
                </radialGradient>
                {/* Trunk Linear Gradient */}
                <linearGradient id="trunk-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8D6E63" />
                  <stop offset="30%" stopColor="#5D4037" />
                  <stop offset="70%" stopColor="#4E342E" />
                  <stop offset="100%" stopColor="#3E2723" />
                </linearGradient>
                <linearGradient id="branch-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#5D4037" />
                  <stop offset="100%" stopColor="#8D6E63" />
                </linearGradient>
                <radialGradient id="highlight-grad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#A7FFEB" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#A7FFEB" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Tree roots & trunk flare */}
              <path
                d="M72,175 C80,165 85,150 90,140 C95,120 92,100 88,85 L112,85 C108,100 105,120 110,140 C115,150 120,165 128,175 C118,170 82,170 72,175 Z"
                fill="url(#trunk-grad)"
              />

              {/* Tree main branches */}
              <path
                d="M92,95 C80,80 62,75 50,75 C62,82 78,88 88,95 Z"
                fill="url(#branch-grad)"
              />
              <path
                d="M108,95 C120,80 138,75 150,75 C138,82 122,88 112,95 Z"
                fill="url(#branch-grad)"
              />
              <path
                d="M100,85 C100,60 92,50 88,40 C95,50 102,60 100,85 Z"
                fill="url(#branch-grad)"
              />

              {/* Bark texture detailing lines */}
              <path d="M96,155 Q99,130 96,115" stroke="#3E2723" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.3" />
              <path d="M104,150 Q101,125 104,110" stroke="#3E2723" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.3" />
              <path d="M90,165 C95,160 105,160 110,165" stroke="#3E2723" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.3" />

              {/* Foliage Clusters (High density overlapping circles) */}
              <circle cx="100" cy="50" r="38" fill="url(#leaves-grad-1)" />
              <circle cx="65" cy="65" r="32" fill="url(#leaves-grad-1)" />
              <circle cx="135" cy="65" r="32" fill="url(#leaves-grad-1)" />
              <circle cx="100" cy="85" r="30" fill="url(#leaves-grad-1)" />
              <circle cx="52" cy="92" r="24" fill="url(#leaves-grad-1)" />
              <circle cx="148" cy="92" r="24" fill="url(#leaves-grad-1)" />
              
              {/* Midground highlight leaf clusters */}
              <circle cx="85" cy="50" r="25" fill="url(#leaves-grad-2)" opacity="0.95" />
              <circle cx="115" cy="50" r="25" fill="url(#leaves-grad-2)" opacity="0.95" />
              <circle cx="62" cy="78" r="20" fill="url(#leaves-grad-2)" opacity="0.95" />
              <circle cx="138" cy="78" r="20" fill="url(#leaves-grad-2)" opacity="0.95" />
              
              {/* Foreground leafy shapes for details */}
              <path d="M90,30 C100,15 110,30 C100,45 90,30 Z" fill="#B9F6CA" opacity="0.3" />
              <path d="M55,60 C65,48 75,60 C65,72 55,60 Z" fill="#B9F6CA" opacity="0.3" />
              <path d="M125,60 C135,48 145,60 C135,72 125,60 Z" fill="#B9F6CA" opacity="0.3" />

              {/* Glowing magic spots in the tree */}
              <circle cx="100" cy="50" r="10" fill="url(#highlight-grad)" />
              <circle cx="70" cy="70" r="8" fill="url(#highlight-grad)" />
              <circle cx="130" cy="70" r="8" fill="url(#highlight-grad)" />
            </svg>

            {/* Absolute overlaying custom options as hanging wooden sign board pills */}
            {options.slice(0, 12).map((item, index) => {
              // If the tree has shaken, hide ONLY the selected lucky item from the branches
              const isFallen = hasShaken && luckyItem?.id === item.id;
              if (isFallen) return null;

              const coord = BRANCH_COORDINATES[index % BRANCH_COORDINATES.length];
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: -15, scale: 0.3, rotate: index % 2 === 0 ? -1.5 : 1.5 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    rotate: index % 2 === 0 ? [-2, 2, -2] : [2, -2, 2],
                  }}
                  transition={{
                    scale: { type: "spring", stiffness: 200, damping: 15 },
                    y: { type: "spring", stiffness: 200, damping: 15 },
                    rotate: {
                      repeat: Infinity,
                      duration: 2.5 + (index % 4) * 0.5,
                      ease: "easeInOut",
                    },
                    delay: index * 0.02,
                  }}
                  style={{
                    position: "absolute",
                    left: `${coord.xPercent}%`,
                    top: `${coord.yPercent}%`,
                  }}
                  className="flex flex-col items-center z-20 pointer-events-none select-none origin-top"
                >
                  {/* Hanging Thread/String */}
                  <div className="w-[1.5px] h-3 bg-[#5D4037]/60 dark:bg-[#FFF8E7]/30" />
                  {/* Pin/Nail dot */}
                  <div className="w-1.5 h-1.5 rounded-full bg-[#5D4037] dark:bg-[#F5B700] -mt-[3px] z-30" />
                  {/* Wooden sign board style */}
                  <div className="px-2.5 py-0.5 rounded-md border shadow-md text-[9px] font-black tracking-wide whitespace-nowrap -mt-[2px] bg-[#FFF8E7] dark:bg-[#1B103E] border-[#5D4037] dark:border-[#F5B700] text-[#5D4037] dark:text-[#FFF8E7] max-w-[80px] truncate">
                    {item.name}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Falling Leaves overlay particles */}
          {shaking && (
            <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
              <motion.svg
                initial={{ x: 140, y: 70, opacity: 0, rotate: 0 }}
                animate={{ x: 70, y: 240, opacity: [0, 1, 1, 0], rotate: 360 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="absolute w-5 h-5 text-accent-teal fill-current"
                viewBox="0 0 24 24"
              >
                <path d="M17,8C8,10 5.9,16.17 3.82,21.34L2.18,20.66C4.26,15.49 6.5,8.83 17,8M12,2C10.5,3.5 9,6.5 9,9C9,11.5 10.5,13.5 12,14C13.5,13.5 15,11.5 15,9C15,6.5 13.5,3.5 12,2Z" />
              </motion.svg>
              <motion.svg
                initial={{ x: 100, y: 80, opacity: 0, rotate: 0 }}
                animate={{ x: 160, y: 250, opacity: [0, 1, 1, 0], rotate: -240 }}
                transition={{ duration: 1.4, delay: 0.1, ease: "easeOut" }}
                className="absolute w-4 h-4 text-[#00E676] fill-current"
                viewBox="0 0 24 24"
              >
                <path d="M17,8C8,10 5.9,16.17 3.82,21.34L2.18,20.66C4.26,15.49 6.5,8.83 17,8M12,2C10.5,3.5 9,6.5 9,9C9,11.5 10.5,13.5 12,14C13.5,13.5 15,11.5 15,9C15,6.5 13.5,3.5 12,2Z" />
              </motion.svg>
            </div>
          )}

          {/* Suspense Countdown/Glow phase overlay */}
          <AnimatePresence>
            {suspensePhase && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-deep-violet/40 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center font-fredoka font-black pointer-events-none"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1], rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 border-4 border-dashed border-[#F5B700] rounded-full flex items-center justify-center"
                />
                <motion.span
                  animate={{ scale: [0.9, 1.1, 0.9] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="text-lg text-cream-soft uppercase tracking-widest mt-4 drop-shadow-md text-primary-gold"
                >
                  Calculating Fate... 🔮
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dynamic Fall & Landing area for selected option */}
          <div className="absolute inset-x-0 bottom-[90px] h-[150px] pointer-events-none">
            {hasShaken && !suspensePhase &&
              fallingItems.map((item) => {
                return (
                  <motion.div
                    key={item.id}
                    initial={{ x: item.startX ?? 0, y: item.startY ?? -180, scale: 1.0, rotate: 0 }}
                    animate={{
                      x: item.x,
                      y: item.y - 120, // raised landing offset
                      rotate: item.rotate,
                      scale: 1.3,
                    }}
                    transition={{
                      type: "spring",
                      damping: 10,
                      stiffness: 80,
                    }}
                    style={{
                      position: "absolute",
                      left: "50%",
                    }}
                    className="text-[10px] font-black px-3 py-1.5 rounded-lg border flex items-center justify-center whitespace-nowrap shadow-xl z-20 transform -translate-x-1/2 ring-4 ring-[#F5B700] bg-[#F5B700] text-[#2D1B69] border-white shadow-2xl animate-pulse"
                  >
                    🎯 {item.name}
                  </motion.div>
                );
              })}
          </div>

          {/* Active Event Banner Overlay */}
          <AnimatePresence>
            {eventActiveMsg && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="absolute bottom-[100px] left-4 right-4 bg-emerald-500/20 border border-emerald-500/40 backdrop-blur-md rounded-xl p-2 text-center text-[10px] font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider"
              >
                ✨ {eventActiveMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Forest floor ground barrier */}
          <div className="absolute inset-x-0 bottom-[105px] h-3 bg-emerald-500/20 border-t border-emerald-500/40 dark:bg-white/5 dark:border-white/10" />

          {/* Action button controls */}
          <div className="absolute bottom-4 flex items-center gap-3">
            {options.length === 0 ? (
              <button
                onClick={handleRestock}
                className="py-3.5 px-8 rounded-2xl font-extrabold text-base select-none cursor-pointer tracking-wider shadow-lg transition-all transform active:scale-95 bg-[#F5B700] hover:bg-[#E0A700] text-[#2D1B69] hover:shadow-xl flex items-center gap-2 border border-white/20"
              >
                <RotateCcw className="w-4 h-4 animate-spin-slow" />
                RESTOCK TREE 🔄
              </button>
            ) : (
              <button
                disabled={shaking || suspensePhase}
                onClick={handleShake}
                className={`py-4 px-10 rounded-2xl font-black text-base select-none cursor-pointer tracking-wider shadow-lg transition-all transform active:scale-95 border border-white/20 ${
                  shaking || suspensePhase
                    ? "bg-[#2D1B69]/30 dark:bg-white/10 text-[#2D1B69]/50 dark:text-[#FFF8E7]/50 pointer-events-none animate-pulse"
                    : "bg-[#F5B700] hover:bg-[#E0A700] text-[#2D1B69] hover:shadow-2xl shadow-[0_4px_20px_rgba(245,183,0,0.4)] hover:-translate-y-0.5"
                }`}
              >
                {shaking ? "Shaking branches..." : suspensePhase ? "Gazing fate..." : "SHAKE THE TREE! 🌳"}
              </button>
            )}
          </div>
        </div>

        {/* ── Customizable Options List Management Sidebar/Drawer Panel ── */}
        <div className="w-full bg-white dark:bg-card border-2 border-deep-violet/10 dark:border-white/5 rounded-3xl p-5 shadow-lg flex flex-col gap-4 font-fredoka">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-deep-violet dark:text-cream-soft uppercase tracking-wider flex items-center gap-2">
              📋 Options Management ({options.length}/20)
            </h3>
            <button
              onClick={handleRestock}
              className="text-[10px] font-black uppercase text-deep-violet/40 hover:text-deep-violet dark:text-cream-soft/40 dark:hover:text-cream-soft tracking-wider flex items-center gap-1 transition-colors"
            >
              Reset to Defaults 🔄
            </button>
          </div>

          <form onSubmit={addOption} className="flex gap-2">
            <input
              type="text"
              value={newOptionName}
              onChange={(e) => setNewOptionName(e.target.value)}
              placeholder="Enter custom choice name..."
              maxLength={15}
              className="flex-1 px-4 py-2 text-xs rounded-xl bg-deep-violet/5 dark:bg-white/[0.03] border border-deep-violet/10 dark:border-white/10 text-deep-violet dark:text-cream-soft placeholder-deep-violet/30 font-semibold focus:outline-none focus:ring-2 focus:ring-primary-gold/50 focus:border-transparent transition-all"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-primary-gold hover:bg-[#E0A700] text-[#2D1B69] font-black text-xs flex items-center gap-1 active:scale-95 transition-all shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </form>

          {/* Options tags wrap */}
          <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto pr-1">
            {options.map((item) => (
              <span
                key={item.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-black rounded-lg bg-deep-violet/5 dark:bg-white/[0.04] border border-deep-violet/10 dark:border-white/10 text-deep-violet dark:text-cream-soft"
              >
                🍃 {item.name}
                <button
                  onClick={() => removeOption(item.id)}
                  className="text-deep-violet/35 hover:text-[#C62828] dark:text-cream-soft/30 dark:hover:text-[#FF8A80] transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
            {options.length === 0 && (
              <p className="text-[11px] font-semibold text-deep-violet/40 dark:text-cream-soft/40 italic py-2 text-center w-full">
                Tree branches are empty! Fill them above to begin shaking.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Column 3: The Gamified Sideboard Panels ── */}
      <div className="flex flex-col gap-6">
        


        {/* ── 2. Player Level & XP Titles Progression ── */}
        <div className="w-full bg-white dark:bg-card border-2 border-deep-violet/10 dark:border-white/5 rounded-3xl p-5 shadow-lg flex flex-col gap-3 font-fredoka">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-deep-violet/35 dark:text-cream-soft/35 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-[#A855F7]" /> Level Title
            </span>
            <span className="text-xs font-black text-[#A855F7]">
              Lvl {levelInfo.level}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xl shadow-md border border-white/20">
              🌱
            </div>
            <div>
              <h4 className="text-sm font-black text-deep-violet dark:text-cream-soft leading-none">
                {levelInfo.title}
              </h4>
              <p className="text-[10px] font-bold text-deep-violet/40 dark:text-cream-soft/40 mt-1 uppercase tracking-wider">
                Total XP: {currentProfile.xp ?? 0}
              </p>
            </div>
          </div>

          {/* Gauge progress bar */}
          <div className="w-full space-y-1">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
              <span className="text-deep-violet/40 dark:text-cream-soft/35">XP PROGRESS</span>
              <span className="text-primary-gold font-mono">
                {levelInfo.xpInCurrentLevel} / {levelInfo.xpNeededForNextLevel}
              </span>
            </div>
            <div className="w-full h-3 bg-deep-violet/5 dark:bg-white/[0.04] border border-deep-violet/10 dark:border-white/10 rounded-full overflow-hidden">
              <motion.div
                animate={{ width: `${(levelInfo.xpInCurrentLevel / levelInfo.xpNeededForNextLevel) * 100}%` }}
                className="h-full bg-gradient-to-r from-purple-500 via-[#A855F7] to-indigo-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.4)]"
              />
            </div>
          </div>
        </div>

        {/* ── 3. Collectibles Inventory & Mystery Boxes Shelf ── */}
        <div className="w-full bg-white dark:bg-card border-2 border-deep-violet/10 dark:border-white/5 rounded-3xl p-5 shadow-lg flex flex-col gap-3.5 font-fredoka">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-deep-violet/35 dark:text-cream-soft/35 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent-teal" /> Collectibles Shelf
            </h3>
            <span className="text-[11px] font-black text-accent-teal uppercase tracking-widest font-mono">
              Found: {currentProfile.collectedItems ?? 0} / 8
            </span>
          </div>

          {/* Linear progress gauge bar */}
          <div className="w-full h-1.5 bg-deep-violet/5 dark:bg-white/[0.04] rounded-full overflow-hidden border border-deep-violet/5 dark:border-white/5">
            <motion.div
              animate={{ width: `${((currentProfile.collectedItems ?? 0) / 8) * 100}%` }}
              className="h-full bg-gradient-to-r from-teal-400 to-accent-teal rounded-full"
            />
          </div>

          {/* 8 Collectibles grid */}
          <div className="grid grid-cols-4 gap-2">
            {COLLECTIBLES_CONFIG.map((col) => {
              const count = currentProfile.collectibles?.[col.id] ?? 0;
              const hasFound = count > 0;
              return (
                <div
                  key={col.id}
                  style={{
                    boxShadow: hasFound ? `0 0 12px ${col.glow}` : "none",
                  }}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center relative border transition-all duration-300 ${
                    hasFound
                      ? `bg-gradient-to-br ${col.color} border-white/20 shadow-md`
                      : "bg-deep-violet/5 dark:bg-white/[0.02] border-deep-violet/10 dark:border-white/10 filter grayscale opacity-25"
                  }`}
                >
                  <span className="text-2xl filter drop-shadow-sm select-none">{col.emoji}</span>
                  <span className="text-[7px] font-black uppercase tracking-wider text-center mt-1 max-w-[50px] truncate text-white">
                    {col.name.split(" ")[0]}
                  </span>
                  {hasFound && count > 1 && (
                    <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-1 rounded-full bg-deep-violet text-[7px] font-black text-white border border-white flex items-center justify-center shadow-md">
                      x{count}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mystery Box Drawer Panel Section */}
          <div className="border-t border-deep-violet/5 dark:border-white/5 pt-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-deep-violet/35 dark:text-cream-soft/35 flex items-center gap-1">
                <Gift className="w-3.5 h-3.5 text-primary-gold" /> Mystery Box Shelf
              </span>
              <span className="text-xs font-black text-primary-gold font-mono">
                {currentProfile.mysteryBoxesCount ?? 0} Owned
              </span>
            </div>

            <div className="flex items-center gap-4 bg-deep-violet/5 dark:bg-white/[0.02] border border-deep-violet/10 dark:border-white/10 rounded-2xl p-3">
              <div className={`text-4xl select-none ${boxOpeningActive ? "animate-bounce" : ""}`}>🎁</div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-black text-deep-violet dark:text-cream-soft">
                  Mystery Gift Box
                </h4>
                <p className="text-[9px] font-bold text-deep-violet/40 dark:text-cream-soft/40 leading-none mt-1">
                  Contains: XP, Points, Rare Collectibles & Badges!
                </p>
              </div>
              <button
                disabled={(currentProfile.mysteryBoxesCount ?? 0) <= 0 || boxOpeningActive}
                onClick={handleOpenMysteryBox}
                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all shadow-md border border-white/10 ${
                  (currentProfile.mysteryBoxesCount ?? 0) <= 0 || boxOpeningActive
                    ? "bg-deep-violet/10 text-deep-violet/35 dark:bg-white/5 dark:text-cream-soft/30 pointer-events-none"
                    : "bg-primary-gold hover:bg-[#E0A700] text-[#2D1B69]"
                }`}
              >
                {boxOpeningActive ? "Opening..." : "OPEN BOX 🎁"}
              </button>
            </div>
          </div>
        </div>



      </div>

      {/* ── Suspense-revealing dialogs (Standard result card integration) ── */}
      {luckyItem && earnedReward && (
        <ResultCard
          isOpen={showResultCard}
          onClose={() => {
            setShowResultCard(false);
            setFallingItems([]);
            setHasShaken(false);
          }}
          gameName="Shaking Tree"
          emoji={earnedReward.emoji || "🌳"}
          title={`fate has drop: ${luckyItem.name}!`}
          description={`Shook branches revealed ${luckyItem.name}. Awarded prize: ${earnedReward.name}! XP earned: +${earnedXp} XP.${
            streakClaimedMsg ? ` ${streakClaimedMsg}` : ""
          }`}
          scoreImpact={earnedReward.points || 10}
          isWin={true}
          onRestart={handleShake}
          onShare={() => setShowShareModal(true)}
        />
      )}

      {luckyItem && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          score={currentProfile.luckyScore ?? 50}
          game="Shaking Tree"
          prize={`fate chose: ${luckyItem.name} + got: ${earnedReward?.name || "Lucky Leaf"}`}
        />
      )}

      {/* ── Interactive Level-Up celebration modal overlay ── */}
      <AnimatePresence>
        {levelUpInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 30 }}
              className="w-full max-w-sm bg-white dark:bg-[#1B103E] border-4 border-[#A855F7] rounded-[2rem] p-6 shadow-2xl text-center flex flex-col items-center gap-4 font-fredoka relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent pointer-events-none" />
              
              <span className="text-7xl animate-bounce">🎉🏆</span>
              <h2 className="text-3xl font-black text-[#A855F7] uppercase tracking-wider">Level Up!</h2>
              
              <div className="flex items-center gap-2 bg-[#A855F7]/10 px-4 py-2 rounded-2xl border border-[#A855F7]/30 shadow-sm mt-1">
                <span className="text-xs font-black uppercase text-[#A855F7]">New Rank:</span>
                <span className="text-sm font-black text-deep-violet dark:text-cream-soft font-mono uppercase tracking-widest">{levelUpInfo.title}</span>
              </div>

              <p className="text-xs font-semibold text-deep-violet/60 dark:text-cream-soft/50 max-w-[240px] leading-relaxed">
                {levelUpInfo.message || `You reached Level ${levelUpInfo.level}! Keep shaking to unlock gardener milestones!`}
              </p>

              <button
                onClick={() => setLevelUpInfo(null)}
                className="mt-2 py-3 px-8 rounded-2xl font-black text-xs uppercase tracking-widest bg-[#A855F7] hover:bg-[#8B5CF6] text-white active:scale-95 transition-all shadow-md shadow-purple-500/35"
              >
                Claim Cosmic Honor! 👑
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Box Loot opening visual bouncing screen overlay ── */}
      <AnimatePresence>
        {boxOpeningActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-md pointer-events-none"
          >
            <motion.div
              animate={{
                rotate: [-6, 6, -6, 6, -6, 6, 0],
                scale: [1, 1.2, 1.2, 1.35, 1],
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="text-9xl filter drop-shadow-[0_0_30px_rgba(245,183,0,0.8)]"
            >
              🎁
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Box Loot Display Modal ── */}
      <AnimatePresence>
        {showBoxLootModal && boxLootOutcome && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 30 }}
              className="w-full max-w-sm bg-white dark:bg-[#1B103E] border-4 border-primary-gold rounded-[2rem] p-6 shadow-2xl text-center flex flex-col items-center gap-3.5 font-fredoka relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary-gold/10 via-transparent to-transparent pointer-events-none" />
              
              <span className="text-7xl animate-pulse">🎁✨</span>
              <h2 className="text-2xl font-black text-primary-gold uppercase tracking-wider leading-none">Box Opened!</h2>
              <p className="text-[10px] font-bold text-deep-violet/40 dark:text-cream-soft/40 uppercase tracking-widest leading-none mt-1">Mystery Chest Rewards</p>
              
              {/* Loot cards items display */}
              <div className="w-full flex flex-col gap-2 mt-2 bg-deep-violet/5 dark:bg-white/[0.02] border border-deep-violet/10 dark:border-white/10 rounded-2xl p-4">
                <div className="flex items-center justify-between text-xs font-black">
                  <span className="text-deep-violet/40 dark:text-cream-soft/40">🪙 Points Won:</span>
                  <span className="text-primary-gold font-mono text-sm">+{boxLootOutcome.points} Pts</span>
                </div>
                <div className="flex items-center justify-between text-xs font-black border-t border-deep-violet/5 dark:border-white/5 pt-2.5">
                  <span className="text-deep-violet/40 dark:text-cream-soft/40">✨ XP Gained:</span>
                  <span className="text-[#A855F7] font-mono">+{boxLootOutcome.xp} XP</span>
                </div>

                {boxLootOutcome.extraShakes > 0 && (
                  <div className="flex items-center justify-between text-xs font-black border-t border-deep-violet/5 dark:border-white/5 pt-2.5 text-emerald-500">
                    <span>🔄 Extra Shakes:</span>
                    <span className="font-mono">+{boxLootOutcome.extraShakes} Shakes</span>
                  </div>
                )}

                {boxLootOutcome.collectible && (
                  <div className="flex items-center justify-between text-xs font-black border-t border-deep-violet/5 dark:border-white/5 pt-2.5">
                    <span className="text-deep-violet/40 dark:text-cream-soft/40">💎 Collectible found:</span>
                    <span className="text-accent-teal font-mono">
                      {boxLootOutcome.collectible.emoji} {boxLootOutcome.collectible.name}
                    </span>
                  </div>
                )}

                {boxLootOutcome.badge && (
                  <div className="flex items-center justify-between text-xs font-black border-t border-deep-violet/5 dark:border-white/5 pt-2.5">
                    <span className="text-deep-violet/40 dark:text-cream-soft/40">🎖️ Badge unlocked:</span>
                    <span className="text-[#A855F7] font-mono">Box Cracker 🍀</span>
                  </div>
                )}
              </div>

              {boxLootOutcome.message && (
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl shadow-sm leading-tight">
                  {boxLootOutcome.message}
                </p>
              )}

              <button
                onClick={() => setShowBoxLootModal(false)}
                className="mt-3 py-3.5 px-8 rounded-2xl font-black text-xs uppercase tracking-widest bg-primary-gold hover:bg-[#E0A700] text-[#2D1B69] active:scale-95 transition-all shadow-md shadow-amber-500/20 w-full"
              >
                Claim Mystery Rewards! 🏆
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
