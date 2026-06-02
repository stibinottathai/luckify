"use client";

import { useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { playDiceRoll } from "@/lib/audio";
import { useLuckStore } from "@/store/luckStore";
import { useAuth } from "@/components/auth/AuthProvider";
import ResultCard from "@/components/ui/ResultCard";
import ShareModal from "@/components/ui/ShareModal";
import GoldenDiceAnimation from "./GoldenDiceAnimation";
import GoldenDiceModal from "./GoldenDiceModal";
import GoldenDiceBanner from "./GoldenDiceBanner";
import GoldenDiceLeaderboard from "./GoldenDiceLeaderboard";
import DiceInventory from "./DiceInventory";
import DiceLeaderboard from "./DiceLeaderboard";
import DiceUnlockAnimation from "./DiceUnlockAnimation";
import ActiveEquippedPanel from "./ActiveEquippedPanel";
import { DICE_SKINS_STYLE } from "./Dice3DPreview";
import { Sparkles, Trophy, Play, ShoppingBag, Award } from "lucide-react";
import confetti from "canvas-confetti";

// Map each die face 1-6 to exact 3D cube rotation angles
const FACE_ROTATIONS: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  6: { x: 0, y: 180 },
  2: { x: -90, y: 0 },
  5: { x: 90, y: 0 },
  3: { x: 0, y: -90 },
  4: { x: 0, y: 90 },
};

// Render dots inside the main dynamic rolling dice face using dynamic skin dot colors
function DynamicDieFace({ value, dotColor }: { value: number; dotColor: string }) {
  const dots: Record<number, [number, number][]> = {
    1: [[50, 50]],
    2: [[25, 25], [75, 75]],
    3: [[25, 25], [50, 50], [75, 75]],
    4: [[25, 25], [25, 75], [75, 25], [75, 75]],
    5: [[25, 25], [25, 75], [50, 50], [75, 25], [75, 75]],
    6: [[25, 25], [25, 50], [25, 75], [75, 25], [75, 50], [75, 75]],
  };

  return (
    <svg className="w-full h-full p-2" viewBox="0 0 100 100">
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

export default function DiceGame() {
  const { user } = useAuth();
  const activeUserKey = useLuckStore((s) => s.activeUserKey);
  const currentScore = useLuckStore((s) => s.luckyScore);
  const currentProfile = useLuckStore((s) => s.profiles[activeUserKey]) || useLuckStore((s) => s.profiles["guest"]);

  const [activeTab, setActiveTab] = useState<"play" | "collection" | "collectors" | "golden">("play");

  const diceCount = 1;
  const [isRolling, setIsRolling] = useState(false);
  const [hasRolled, setHasRolled] = useState(false);
  const [diceValues, setDiceValues] = useState<number[]>([4]);
  
  // Custom controls for 3D rotations
  const rollControls = [useAnimation()];

  // Outcomes / Result Cards standard states
  const [showResult, setShowResult] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [outcomeData, setOutcomeData] = useState<{
    sum: number;
    title: string;
    description: string;
    isWin: boolean;
    scoreImpact: number;
    emoji: string;
  } | null>(null);

  // Golden Dice specific animation and modal states
  const [showGoldenAnimation, setShowGoldenAnimation] = useState(false);
  const [showGoldenModal, setShowGoldenModal] = useState(false);
  const [goldenReward, setGoldenReward] = useState<any>(null);
  
  // Dice Drops / Unlocks overlay states
  const [showUnlockAnimation, setShowUnlockAnimation] = useState(false);
  const [unlockedDiceDrop, setUnlockedDiceDrop] = useState<any>(null);

  // Dev Helpers
  const [forceGoldenForDev, setForceGoldenForDev] = useState(false);
  const [forceDiceDropForDev, setForceDiceDropForDev] = useState(false);
  const isDev = process.env.NODE_ENV === "development";

  // Handle premium roll flow with instant optimistic rolling animations
  const handleRoll = async () => {
    if (isRolling) return;
    setIsRolling(true);
    setHasRolled(true);
    setShowResult(false);
    setGoldenReward(null);
    setUnlockedDiceDrop(null);

    let soundTimer: any = null;

    try {
      // 1. Instantly trigger clattering sound loop
      soundTimer = setInterval(() => {
        playDiceRoll();
      }, 100);

      // 2. Instantly trigger infinite tumbling animation (rotates in 3D in parallel with fetch)
      rollControls.forEach((control) => {
        control.start({
          rotateX: [0, 360],
          rotateY: [0, 360],
          z: [0, 25, 0],
          transition: { duration: 0.5, ease: "linear" as const, repeat: Infinity },
        });
      });

      const idToken = user ? await user.getIdToken() : "";
      
      // Hit secure server-side probability engine
      const rollRes = await fetch("/api/dice/roll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: idToken ? `Bearer ${idToken}` : "",
        },
        body: JSON.stringify({
          isGuest: activeUserKey === "guest",
          forceGolden: forceGoldenForDev,
          forceDiceDrop: forceDiceDropForDev,
        }),
      });

      if (!rollRes.ok) {
        if (soundTimer) clearInterval(soundTimer);
        rollControls.forEach((c) => c.stop());
        throw new Error("Failed to draw roll outcomes from server");
      }

      const data = await rollRes.json();
      
      // Update local Zustand store parameters if provided
      if (data.profile) {
        useLuckStore.setState((state) => {
          const updated = {
            ...state.profiles[activeUserKey],
            coinBalance: data.profile.coinBalance,
            history: data.profile.history,
            badges: data.profile.badges,
            collectibles: data.profile.collectibles,
            totalDiceRolls: data.profile.totalDiceRolls,
            totalGoldenDiceEvents: data.profile.totalGoldenDiceEvents,
            goldenDiceRate: data.profile.goldenDiceRate,
            highestRewardWon: data.profile.highestRewardWon,
            highestRewardPoints: data.profile.highestRewardPoints,
            legendaryRewardsCount: data.profile.legendaryRewardsCount,
            // Dice Collection System
            equippedDice: data.profile.equippedDice,
            diceFragments: data.profile.diceFragments,
            collectionProgress: data.profile.collectionProgress,
            mythicDiceCount: data.profile.mythicDiceCount,
            // Daily limits fields
            diceRollsUsed: data.profile.diceRollsUsed,
            diceRollDate: data.profile.diceRollDate,
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

      const serverVal = data.roll || 4;

      // Check if a new collectible dice dropped
      if (data.diceDrop) {
        setUnlockedDiceDrop(data.diceDrop);
      }

      if (data.triggered) {
        // Intercept normal roll with premium multi-phase Golden Sequence!
        if (soundTimer) clearInterval(soundTimer);
        rollControls.forEach((c) => c.stop());
        setIsRolling(false); // Stop rolling indicator
        setGoldenReward(data.reward);
        setDiceValues([serverVal]);
        setShowGoldenAnimation(true);
      } else {
        // Normal roll: stop clattering and start smooth target settle wind-down
        if (soundTimer) clearInterval(soundTimer);

        const newValues = [serverVal];

        const animationPromises = newValues.map(async (val, index) => {
          const targetRot = FACE_ROTATIONS[val];
          const spinX = 360 * 2 + targetRot.x;
          const spinY = 360 * 2 + targetRot.y;

          // Transition smoothly from fast spin to exact settle face
          await rollControls[index].start({
            rotateX: spinX,
            rotateY: spinY,
            z: 0,
            transition: { duration: 0.8, ease: "easeOut" as const },
          });

          rollControls[index].set({
            rotateX: targetRot.x,
            rotateY: targetRot.y,
          });
        });

        await Promise.all(animationPromises);
        setDiceValues(newValues);
        setIsRolling(false);

        // Standard outcomes formatting
        let scoreImpact = 5;
        let isWin = true;
        let title = `You rolled a ${serverVal}!`;
        let emoji = "🎲";
        let description = "";

        if (serverVal === 6) {
          scoreImpact = 20;
          isWin = true;
          title = "MAX LUCK 6! 🎰";
          emoji = "🔥";
          description = "Maximum rolling power! You have unlocked cosmic abundance!";
        } else if (serverVal === 5) {
          scoreImpact = 10;
          isWin = true;
          title = "High 5! 💥";
          emoji = "💥";
          description = "Adventure and change! A new opportunity is opening up for you.";
        } else if (serverVal === 4) {
          scoreImpact = 5;
          isWin = true;
          title = "Solid 4! 🍀";
          emoji = "🍀";
          description = "Solid foundation! Strong support and steady progress are coming.";
        } else if (serverVal === 3) {
          scoreImpact = 4;
          isWin = true;
          title = "Lucky 3! ✨";
          emoji = "✨";
          description = "Growth and creativity! Good news will reach you soon.";
        } else if (serverVal === 2) {
          scoreImpact = 2;
          isWin = true;
          title = "Rolled a 2 ⚖️";
          emoji = "⚖️";
          description = "Balance and duality. A great time to partner up.";
        } else {
          scoreImpact = -5;
          isWin = false;
          title = "Rolled a 1 🌧️";
          emoji = "🌧️";
          description = "A fresh start! Let's shake it up and roll again!";
        }

        setOutcomeData({ sum: serverVal, title, description, isWin, scoreImpact, emoji });
        
        // Settle unlock modal or result card
        if (data.diceDrop) {
          setShowUnlockAnimation(true);
        } else {
          setShowResult(true);
        }
      }

    } catch (err) {
      console.error(err);
      if (soundTimer) clearInterval(soundTimer);
      rollControls.forEach((c) => c.stop());
      alert("Roll failed due to connection error!");
      setIsRolling(false);
    }
  };

  // Equip unlocked dice (for unlock animation modal)
  const handleEquipFromUnlock = (diceId: string) => {
    useLuckStore.setState((state) => {
      const updated = {
        ...state.profiles[activeUserKey],
        equippedDice: diceId,
      };
      return {
        profiles: {
          ...state.profiles,
          [activeUserKey]: updated,
        },
        ...updated,
      };
    });

    confetti({
      particleCount: 30,
      spread: 40,
      colors: ["#F5B700", "#FFD700"],
    });
  };

  const equippedDice = currentProfile.equippedDice || "wooden_dice";
  const skinStyle = DICE_SKINS_STYLE[equippedDice] || DICE_SKINS_STYLE.wooden_dice;

  const isGuest = activeUserKey === "guest";
  const rollsUsedToday = currentProfile.diceRollsUsed ?? 0;
  const isDailyLimitReached = rollsUsedToday >= 5;
  const rollCost = rollsUsedToday === 0 ? 0 : 200;
  const hasInsufficientPoints = rollCost > 0 && (currentProfile.coinBalance ?? 0) < rollCost;

  let buttonText = "ROLL THE DICE! 🎲";
  let isButtonDisabled = isRolling;

  if (isRolling) {
    buttonText = "Rolling...";
  } else if (isDailyLimitReached) {
    buttonText = "DAILY LIMIT REACHED 🛑";
    isButtonDisabled = true;
  } else if (isGuest && rollsUsedToday > 0) {
    buttonText = "SIGN IN TO PLAY 🎮";
    isButtonDisabled = true;
  } else if (hasInsufficientPoints) {
    buttonText = "NEED 200 POINTS 🪙";
    isButtonDisabled = true;
  } else if (rollsUsedToday === 0) {
    buttonText = "FREE DAILY ROLL! 🎁";
  } else {
    buttonText = "ROLL FOR 200 PTS 🪙";
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-2 select-none relative font-fredoka">
      
      {/* Real-time Global Announcement Banner */}
      <GoldenDiceBanner />

      {/* 5-Phase Golden Dice Event Animation overlay */}
      {showGoldenAnimation && (
        <GoldenDiceAnimation
          outcomeValue={diceValues[0]}
          onComplete={() => {
            setShowGoldenAnimation(false);
            setShowGoldenModal(true);
          }}
        />
      )}

      {/* AAA loot-box style Golden Reward Modal */}
      {goldenReward && (
        <GoldenDiceModal
          isOpen={showGoldenModal}
          onClose={() => {
            setShowGoldenModal(false);
            if (unlockedDiceDrop) {
              setShowUnlockAnimation(true);
            } else {
              setHasRolled(false);
            }
          }}
          reward={goldenReward}
          onShare={() => setShowShare(true)}
        />
      )}

      {/* Dice Collectible Skin Unlocks overlay */}
      {unlockedDiceDrop && (
        <DiceUnlockAnimation
          isOpen={showUnlockAnimation}
          onClose={() => {
            setShowUnlockAnimation(false);
            setShowResult(true);
          }}
          drop={unlockedDiceDrop}
          onEquip={handleEquipFromUnlock}
        />
      )}

      {/* Dashboard Nav Tabs */}
      <div className="flex items-center justify-center gap-2 mb-8 bg-white/60 dark:bg-card/60 backdrop-blur-md rounded-2xl p-1.5 border border-deep-violet/5 dark:border-white/5 shadow-inner">
        {(["play", "collection", "collectors", "golden"] as const).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 py-2.5 px-5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                isActive
                  ? "bg-[#2D1B69] text-primary-gold border border-primary-gold/30 shadow-md scale-102"
                  : "text-deep-violet/60 dark:text-cream-soft/60 hover:text-deep-violet dark:hover:text-cream-soft"
              }`}
            >
              {tab === "play" && <Play className="w-3.5 h-3.5" />}
              {tab === "collection" && <ShoppingBag className="w-3.5 h-3.5" />}
              {tab === "collectors" && <Award className="w-3.5 h-3.5" />}
              {tab === "golden" && <Trophy className="w-3.5 h-3.5" />}
              <span>
                {tab === "play" && "Roll Console"}
                {tab === "collection" && "My Collection"}
                {tab === "collectors" && "Dice Collectors"}
                {tab === "golden" && "Golden Legends"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Workspace */}
      <div className="w-full">
        {activeTab === "play" && (
          <div className="flex flex-col gap-10">
            {/* Top Row: Console + Stats Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              
              {/* Main skinned roll console (Left) */}
              <div className="lg:col-span-7 flex flex-col items-center gap-6">
                <div className="relative w-full h-full bg-white dark:bg-card border-4 border-primary-gold rounded-[2.5rem] p-6 sm:p-8 shadow-2xl flex flex-col items-center justify-center min-h-[440px] overflow-hidden">
                  
                  {/* Mesh magical gradients backdrop */}
                  <div className="absolute inset-0 bg-radial from-violet-500/5 via-transparent to-transparent pointer-events-none animate-hue-sweep" />

                  {/* Equipped skin label tag */}
                  <div className="absolute top-4 left-4 z-20 flex flex-col items-start gap-1 font-fredoka">
                    <span className="text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full bg-black/40 border border-white/10 text-primary-gold shadow-md">
                      🎲 Skin: {equippedDice.replace("_", " ").toUpperCase()}
                    </span>
                  </div>

                  {/* Standard 3D Skinned Cube console */}
                  <div className="flex items-center justify-center gap-8 py-10 perspective-1000">
                    {Array.from({ length: diceCount }).map((_, i) => {
                      const currentVal = diceValues[i] || 1;
                      return (
                        <motion.div
                          key={i}
                          initial={{
                            rotateX: FACE_ROTATIONS[currentVal]?.x || 0,
                            rotateY: FACE_ROTATIONS[currentVal]?.y || 0,
                          }}
                          animate={rollControls[i]}
                          style={{
                            transformStyle: "preserve-3d",
                            width: "80px",
                            height: "80px",
                          }}
                          className={`relative ${skinStyle.glowClass}`}
                        >
                          {/* 1. FRONT FACE (Val 1) */}
                          <div
                            style={{ transform: "rotateY(0deg) translateZ(40px)" }}
                            className={`absolute inset-0 border rounded-xl flex items-center justify-center shadow-md backface-hidden ${skinStyle.bgClass} ${skinStyle.borderClass}`}
                          >
                            <DynamicDieFace value={1} dotColor={skinStyle.dotColor} />
                          </div>

                          {/* 2. BACK FACE (Val 6) */}
                          <div
                            style={{ transform: "rotateY(180deg) translateZ(40px)" }}
                            className={`absolute inset-0 border rounded-xl flex items-center justify-center shadow-md backface-hidden ${skinStyle.bgClass} ${skinStyle.borderClass}`}
                          >
                            <DynamicDieFace value={6} dotColor={skinStyle.dotColor} />
                          </div>

                          {/* 3. RIGHT FACE (Val 3) */}
                          <div
                            style={{ transform: "rotateY(90deg) translateZ(40px)" }}
                            className={`absolute inset-0 border rounded-xl flex items-center justify-center shadow-md backface-hidden ${skinStyle.bgClass} ${skinStyle.borderClass}`}
                          >
                            <DynamicDieFace value={3} dotColor={skinStyle.dotColor} />
                          </div>

                          {/* 4. LEFT FACE (Val 4) */}
                          <div
                            style={{ transform: "rotateY(-90deg) translateZ(40px)" }}
                            className={`absolute inset-0 border rounded-xl flex items-center justify-center shadow-md backface-hidden ${skinStyle.bgClass} ${skinStyle.borderClass}`}
                          >
                            <DynamicDieFace value={4} dotColor={skinStyle.dotColor} />
                          </div>

                          {/* 5. TOP FACE (Val 2) */}
                          <div
                            style={{ transform: "rotateX(90deg) translateZ(40px)" }}
                            className={`absolute inset-0 border rounded-xl flex items-center justify-center shadow-md backface-hidden ${skinStyle.bgClass} ${skinStyle.borderClass}`}
                          >
                            <DynamicDieFace value={2} dotColor={skinStyle.dotColor} />
                          </div>

                          {/* 6. BOTTOM FACE (Val 5) */}
                          <div
                            style={{ transform: "rotateX(-90deg) translateZ(40px)" }}
                            className={`absolute inset-0 border rounded-xl flex items-center justify-center shadow-md backface-hidden ${skinStyle.bgClass} ${skinStyle.borderClass}`}
                          >
                            <DynamicDieFace value={5} dotColor={skinStyle.dotColor} />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Display Current Settle Value */}
                  <div
                    className={`mb-3 text-sm font-extrabold uppercase tracking-widest text-deep-violet/50 dark:text-cream-soft/50 transition-all duration-300 ${
                      !hasRolled || isRolling ? "opacity-0 scale-90 pointer-events-none" : "opacity-100 scale-100"
                    }`}
                  >
                    You Rolled:{" "}
                    <span className="text-primary-gold text-lg font-black font-mono">
                      {diceValues[0]}
                    </span>
                  </div>

                  {/* Rolls Today indicator */}
                  <div className="mb-5 text-xs font-black uppercase tracking-wider text-deep-violet/40 dark:text-cream-soft/40 flex items-center gap-1.5">
                    <span>Rolls Today:</span>
                    <span className={`font-mono text-sm font-black ${rollsUsedToday >= 5 ? 'text-rose-500' : 'text-primary-gold'}`}>
                      {rollsUsedToday} / 5
                    </span>
                  </div>

                  {/* Action trigger button */}
                  <button
                    disabled={isButtonDisabled}
                    onClick={handleRoll}
                    className={`w-64 py-4 px-8 rounded-2xl font-extrabold text-base select-none cursor-pointer tracking-wider shadow-lg transition-all transform active:scale-95 border-2 border-white/10 ${
                      isButtonDisabled
                        ? "bg-deep-violet/10 dark:bg-white/5 border-transparent text-deep-violet/30 dark:text-cream-soft/20 pointer-events-none"
                        : "bg-primary-gold hover:bg-[#E0A700] text-deep-violet hover:shadow-xl"
                    }`}
                  >
                    {buttonText}
                  </button>

                  {/* Help / Progression Info */}
                  {isRolling ? (
                    <div className="mt-4 max-w-sm text-center">
                      <p className="text-[10px] font-bold text-deep-violet/35 dark:text-cream-soft/30 uppercase tracking-widest leading-relaxed">
                        🔮 Summoning luck from the matrix...
                      </p>
                    </div>
                  ) : isDailyLimitReached ? (
                    <div className="mt-4 max-w-sm w-full bg-rose-500/10 border border-rose-500/20 rounded-2xl p-3 text-center">
                      <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest leading-relaxed">
                        🛑 Daily Limit Reached
                      </p>
                      <p className="text-[9px] font-bold text-deep-violet/60 dark:text-cream-soft/60 mt-1 normal-case leading-relaxed">
                        You've completed your 5 daily rolls! Come back tomorrow for your next free roll. In the meantime, play the <a href="/wheel" className="text-primary-gold font-black hover:underline">Wheel of Fortune</a> or try <a href="/tree" className="text-primary-gold font-black hover:underline">Tree Shaking</a> to earn points!
                      </p>
                    </div>
                  ) : isGuest && rollsUsedToday > 0 ? (
                    <div className="mt-4 max-w-sm w-full bg-primary-gold/10 border border-primary-gold/20 rounded-2xl p-3 text-center animate-bounce">
                      <p className="text-[10px] font-black text-primary-gold uppercase tracking-widest leading-relaxed">
                        🎮 Playing as Guest
                      </p>
                      <p className="text-[9px] font-bold text-deep-violet/60 dark:text-cream-soft/60 mt-1 normal-case leading-relaxed">
                        Guests are limited to 1 free roll daily. To save your progress, gain permanent points, and unlock/craft legendary 3D dice skins in your vault, please Sign In!
                      </p>
                    </div>
                  ) : hasInsufficientPoints ? (
                    <div className="mt-4 max-w-sm w-full bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 text-center">
                      <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-relaxed">
                        🪙 Insufficient Points
                      </p>
                      <p className="text-[9px] font-bold text-deep-violet/60 dark:text-cream-soft/60 mt-1 normal-case leading-relaxed">
                        Paid rolls cost 200 points. You currently have <span className="font-bold font-mono text-primary-gold">{currentProfile.coinBalance}</span> points. Play <a href="/wheel" className="text-primary-gold font-black hover:underline">Wheel of Fortune</a> or try <a href="/tree" className="text-primary-gold font-black hover:underline">Shaking Tree</a> to earn more!
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 max-w-sm w-full flex flex-col gap-1.5 items-center text-center">
                      <p className="text-[10px] font-bold text-deep-violet/35 dark:text-cream-soft/30 uppercase tracking-widest leading-relaxed">
                        ✨ 1 Free daily roll. Extra rolls cost 200 points (max 5/day).
                      </p>
                      <p className="text-[10px] font-bold text-primary-gold/75 uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                        ⚡ Win multipliers: Roll Value × 100 points! (e.g. Roll a 6 = +600 pts!)
                      </p>
                    </div>
                  )}

                  {/* Dev Tools Toggles */}
                  {isDev && (
                    <div className="mt-5 flex flex-col items-center gap-2.5">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setForceGoldenForDev(!forceGoldenForDev)}
                          className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all border cursor-pointer ${
                            forceGoldenForDev
                              ? "bg-rose-500 border-rose-400 text-white animate-pulse"
                              : "bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-500"
                          }`}
                        >
                          ⚡ Force Golden: {forceGoldenForDev ? "ON" : "OFF"}
                        </button>
                        <button
                          onClick={() => setForceDiceDropForDev(!forceDiceDropForDev)}
                          className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all border cursor-pointer ${
                            forceDiceDropForDev
                              ? "bg-purple-500 border-purple-400 text-white animate-pulse"
                              : "bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-500"
                          }`}
                        >
                          ✨ Force Drop: {forceDiceDropForDev ? "ON" : "OFF"}
                        </button>
                      </div>
                      <span className="text-[9px] font-bold text-zinc-400">
                        (Visible only in local development mode)
                      </span>
                    </div>
                  )}

                </div>
              </div>

              {/* Equipped Dice & Quick Stats Panel (Right) */}
              <div className="lg:col-span-5 flex flex-col gap-6 w-full">
                <ActiveEquippedPanel
                  equippedDice={equippedDice}
                  unlockedDiceCount={currentProfile.collectionProgress || 1}
                  totalDiceCount={15}
                  fragmentBalance={currentProfile.diceFragments || 0}
                  totalDiceRolls={currentProfile.totalDiceRolls || 0}
                  totalGoldenDiceEvents={currentProfile.totalGoldenDiceEvents || 0}
                  goldenDiceRate={currentProfile.goldenDiceRate || 0}
                />
              </div>

            </div>

            {/* Bottom Row: Full Collectibles Vault (Space Below!) */}
            <div className="w-full bg-white/60 dark:bg-card/60 backdrop-blur-md rounded-[2.5rem] p-6 sm:p-8 border border-deep-violet/5 dark:border-white/5 shadow-2xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-deep-violet/5 dark:border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-primary-gold/10 text-primary-gold border border-primary-gold/20 flex-shrink-0 animate-pulse">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-deep-violet dark:text-cream-soft uppercase tracking-wider leading-none">
                      💎 Collectibles Vault
                    </h3>
                    <p className="text-[10px] font-bold text-deep-violet/40 dark:text-cream-soft/40 uppercase tracking-widest mt-1">
                      Equip skins, craft duplicates, and unlock mythical models
                    </p>
                  </div>
                </div>
              </div>
              
              <DiceInventory />
            </div>

          </div>
        )}

        {/* Tab 2: Showcase Collection Inventory */}
        {activeTab === "collection" && (
          <div className="w-full">
            <DiceInventory />
          </div>
        )}

        {/* Tab 3: Collectors Leaderboard */}
        {activeTab === "collectors" && (
          <div className="w-full max-w-lg mx-auto">
            <DiceLeaderboard />
          </div>
        )}

        {/* Tab 4: Golden Legends Leaderboard */}
        {activeTab === "golden" && (
          <div className="w-full max-w-lg mx-auto">
            <GoldenDiceLeaderboard />
          </div>
        )}
      </div>

      {/* Standard roll results card */}
      {outcomeData && (
        <ResultCard
          isOpen={showResult}
          onClose={() => {
            setShowResult(false);
            setHasRolled(false);
          }}
          gameName="Lucky Dice"
          emoji={outcomeData.emoji}
          title={String(outcomeData.sum)}
          description={outcomeData.description}
          scoreImpact={outcomeData.scoreImpact}
          isWin={outcomeData.isWin}
          onRestart={handleRoll}
          onShare={() => setShowShare(true)}
          justNumber={true}
        />
      )}

      {outcomeData && (
        <ShareModal
          isOpen={showShare}
          onClose={() => setShowShare(false)}
          score={currentScore}
          game="Lucky Dice"
          prize={`Roll Sum of ${outcomeData.sum}`}
        />
      )}
    </div>
  );
}
