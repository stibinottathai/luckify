"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useLuckStore } from "@/store/luckStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Coins,
  Lock,
  Clock,
  Trash2,
  Calendar,
  Layers,
  HelpCircle,
  TrendingUp,
  X,
  History,
  Info
} from "lucide-react";
import { playWinChime, playTick } from "@/lib/audio";
import { db } from "@/lib/firebase";
import {
  createTimeCapsuleInDb,
  fetchTimeCapsulesFromDb,
  claimTimeCapsuleInDb,
  TimeCapsule
} from "@/lib/timeCapsules";
import confetti from "canvas-confetti";

// Sub-component for individual time capsule display
function TimeCapsuleCard({
  capsule,
  onClaim,
  onOpen
}: {
  capsule: TimeCapsule;
  onClaim: (id: string) => void;
  onOpen: (capsule: TimeCapsule) => void;
}) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);

  useEffect(() => {
    if (capsule.isOpened) {
      setIsUnlocked(true);
      return;
    }

    const targetTime = new Date(capsule.unlockDate).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const difference = targetTime - now;

      if (difference <= 0) {
        setTimeLeft("Ready to Unseal!");
        setIsUnlocked(true);
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      const hStr = hours.toString().padStart(2, "0");
      const mStr = minutes.toString().padStart(2, "0");
      const sStr = seconds.toString().padStart(2, "0");

      setTimeLeft(`${hStr}h ${mStr}m ${sStr}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [capsule]);

  const rewardCoins = Math.floor(capsule.coinsLocked * capsule.multiplier);
  const yieldPct = Math.round((capsule.multiplier - 1) * 100);

  if (capsule.isOpened) {
    return (
      <div
        onClick={() => onOpen(capsule)}
        className="bg-emerald-500/5 dark:bg-emerald-950/10 border-2 border-emerald-500/20 rounded-[2rem] p-6 shadow-md flex flex-col justify-between hover:border-emerald-500/40 transition-all cursor-pointer relative overflow-hidden group select-none"
      >
        <div className="absolute top-3 right-3 text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
          📜 Unsealed
        </div>
        <div className="mt-2">
          <span className="text-emerald-400 text-lg">🎋</span>
          <h4 className="text-sm font-black text-emerald-700 dark:text-emerald-300 mt-2">Time Capsule</h4>
          <p className="text-[10px] text-deep-violet/50 dark:text-soft-cream/50 font-medium">Unsealed Message</p>
          <p className="text-xs font-semibold italic text-deep-violet/90 dark:text-white/95 mt-4 line-clamp-3 leading-relaxed">
            "{capsule.messageText}"
          </p>
        </div>
        <div className="border-t border-deep-violet/5 dark:border-white/5 pt-4 mt-6 flex items-center justify-between font-fredoka">
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-black">Collected: {rewardCoins} coins</span>
          <span className="text-[9px] text-deep-violet/40 dark:text-soft-cream/40 font-bold">{new Date(capsule.unlockDate).toLocaleDateString()}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`border-2 rounded-[2rem] p-6 shadow-xl flex flex-col justify-between transition-all relative overflow-hidden select-none min-h-[240px] ${
      isUnlocked
        ? "border-amber-500 bg-amber-500/10 dark:bg-amber-950/20 shadow-amber-500/10"
        : "border-deep-violet/10 dark:border-white/10 bg-white/50 dark:bg-white/5"
    }`}>
      <div>
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-black text-deep-violet dark:text-white">Time Capsule</h4>
          <span className={`text-[9px] font-black uppercase tracking-wider py-0.5 px-2.5 rounded-full ${
            isUnlocked ? "bg-amber-500 text-amber-950" : "bg-deep-violet/10 dark:bg-white/10 text-deep-violet/60 dark:text-soft-cream/60"
          }`}>
            {isUnlocked ? "UNLOCKED" : "LOCKED"}
          </span>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-inner ${
            isUnlocked ? "bg-amber-500/20 text-amber-500" : "bg-deep-violet/5 dark:bg-white/5 text-deep-violet/50 dark:text-soft-cream/50"
          }`}>
            {isUnlocked ? "🔓" : "🔒"}
          </div>
          <div>
            <p className="text-[9px] font-black text-deep-violet/40 dark:text-soft-cream/40 uppercase tracking-widest leading-none">Locked Principal</p>
            <p className="text-sm font-black text-deep-violet dark:text-white mt-1">{capsule.coinsLocked} Vibe Coins</p>
          </div>
        </div>

        <div className="mt-4 bg-deep-violet/5 dark:bg-black/25 rounded-2xl p-3 border border-deep-violet/10 dark:border-white/5 text-center">
          <p className="text-[9px] font-black text-deep-violet/40 dark:text-soft-cream/40 uppercase tracking-wider leading-none">Unlock countdown</p>
          <p className={`text-base font-black font-mono mt-1.5 tracking-wider ${isUnlocked ? "text-amber-600 dark:text-amber-500" : "text-deep-violet dark:text-white"}`}>
            {timeLeft}
          </p>
        </div>
      </div>

      <div className="border-t border-deep-violet/5 dark:border-white/5 pt-4 mt-6">
        {isUnlocked ? (
          <button
            onClick={() => onClaim(capsule.id)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 font-black text-xs tracking-widest uppercase shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>✨ Unseal Capsule</span>
          </button>
        ) : (
          <div className="flex items-center justify-between text-[10px] font-bold text-deep-violet/60 dark:text-soft-cream/60">
            <span>Interest Yield: <b className="text-emerald-600 dark:text-emerald-400">+{yieldPct}%</b></span>
            <span>Matures: {new Date(capsule.unlockDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TimeCapsuleClient() {
  const { user } = useAuth();
  const activeUserKey = useLuckStore((s) => s.activeUserKey);
  const currentProfile = useLuckStore((s) => s.profiles[activeUserKey]) || useLuckStore((s) => s.profiles["guest"]);
  const spendCoins = useLuckStore((s) => s.spendCoins);
  const addCoins = useLuckStore((s) => s.addCoins);
  const addResult = useLuckStore((s) => s.addResult);
  const registerTimeCapsuleToday = useLuckStore((s) => s.registerTimeCapsuleToday);

  const todayStr = new Date().toISOString().slice(0, 10);
  const hasBuriedToday = user && user.uid !== "guest" && currentProfile?.lastTimeCapsuleDate === todayStr;

  const [activeTab, setActiveTab] = useState<"bury" | "vault">("bury");
  const [capsules, setCapsules] = useState<TimeCapsule[]>([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [messageText, setMessageText] = useState("");
  const [coinsToLock, setCoinsToLock] = useState<number>(100);
  const [durationType, setDurationType] = useState<"1min" | "1hr" | "1day" | "1week" | "1month" | "1year">("1day");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Viewing Opened Scroll Modal
  const [openCapsule, setOpenCapsule] = useState<TimeCapsule | null>(null);

  const coinBalance = currentProfile?.coinBalance ?? 0;

  // Load capsules
  const loadCapsules = async () => {
    if (!user || user.uid === "guest") {
      setLoading(false);
      return;
    }
    setLoading(true);
    const list = await fetchTimeCapsulesFromDb(user.uid);
    setCapsules(list);
    setLoading(false);
  };

  useEffect(() => {
    loadCapsules();
  }, [user, activeTab]);

  // Compute unlock metrics based on duration
  const getDurationMetrics = () => {
    let multiplier = 1.0;
    let label = "";
    switch (durationType) {
      case "1min":
        multiplier = 1.05;
        label = "1 Minute (Test Mode)";
        break;
      case "1hr":
        multiplier = 1.10;
        label = "1 Hour";
        break;
      case "1day":
        multiplier = 1.15;
        label = "1 Day";
        break;
      case "1week":
        multiplier = 1.30;
        label = "1 Week";
        break;
      case "1month":
        multiplier = 1.75;
        label = "1 Month";
        break;
      case "1year":
        multiplier = 2.50;
        label = "1 Year";
        break;
    }
    const finalYield = Math.floor(coinsToLock * multiplier);
    const interestEarned = finalYield - coinsToLock;
    return { multiplier, label, finalYield, interestEarned };
  };

  const { multiplier, label, finalYield, interestEarned } = getDurationMetrics();

  // Submit Capsule Locking
  const handleBuryCapsule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.uid === "guest") {
      setErrorMsg("Please sign in to lock time capsules!");
      return;
    }

    if (hasBuriedToday) {
      setErrorMsg("You have already sealed a time capsule today.");
      return;
    }

    if (messageText.trim().length === 0) {
      setErrorMsg("Please write a message to lock in the capsule.");
      return;
    }

    if (messageText.length > 500) {
      setErrorMsg("Message must be 500 characters or less.");
      return;
    }

    if (coinsToLock <= 0) {
      setErrorMsg("You must lock at least 1 Vibe Coin.");
      return;
    }

    if (coinsToLock > coinBalance) {
      setErrorMsg("Not enough coins in your balance!");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    // Deduct coins locally
    const spendSuccess = spendCoins(coinsToLock);
    if (!spendSuccess) {
      setErrorMsg("Deduction failed. Please verify coin balance.");
      setSubmitting(false);
      return;
    }

    // Write to Firestore DB
    const id = await createTimeCapsuleInDb(
      user.uid,
      messageText.trim(),
      coinsToLock,
      durationType
    );

    if (id) {
      playWinChime();
      addResult("Time Capsule", `Locked ${coinsToLock} Vibe Coins in a capsule 🕰️`, true, 0);
      registerTimeCapsuleToday(); // Register the time capsule today
      setMessageText("");
      setCoinsToLock(100);
      setDurationType("1day");
      setActiveTab("vault"); // switch to Vault to view countdown
    } else {
      setErrorMsg("Failed to seal capsule. Reverting coin balance.");
      addCoins(coinsToLock); // revert balance
    }
    setSubmitting(false);
  };

  // Claim unsealed capsule
  const handleClaimCapsule = async (capsuleId: string) => {
    if (!user || user.uid === "guest") return;

    playTick();
    const result = await claimTimeCapsuleInDb(user.uid, capsuleId);

    if (result.success) {
      // Confetti burst!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      addResult("Time Capsule", `Unsealed capsule and collected ${result.finalPayout} coins! 🕰️`, true, 0);
      
      // Update local state instantly for UI chimes
      playWinChime();

      // Find capsule to open scroll view
      const claimedCapsule = capsules.find((c) => c.id === capsuleId);
      if (claimedCapsule) {
        setOpenCapsule({
          ...claimedCapsule,
          isOpened: true
        });
      }

      // Refresh list
      loadCapsules();
    } else {
      alert("Failed to unseal. Make sure the lock timer has expired.");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto font-fredoka py-2 select-none relative text-deep-violet dark:text-white">
      {/* Interactive custom hour glass rotations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes hour-rotation {
          0% { transform: rotate(0deg); }
          40% { transform: rotate(0deg); }
          50% { transform: rotate(180deg); }
          100% { transform: rotate(180deg); }
        }
        .spinning-hourglass {
          animation: hour-rotation 6s ease-in-out infinite;
        }
      ` }} />

      {/* Header Area */}
      <div className="bg-white/70 dark:bg-white/5 border border-deep-violet/10 dark:border-white/10 rounded-[2.5rem] p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-500/10 border-2 border-amber-500 text-amber-500 rounded-2xl flex items-center justify-center text-2xl relative overflow-hidden">
            <span className="spinning-hourglass inline-block">⏳</span>
          </div>
          <div>
            <h3 className="text-lg font-black tracking-wide text-deep-violet dark:text-white leading-none">
              Time Capsule of Hope
            </h3>
            <p className="text-[11px] font-bold text-deep-violet/60 dark:text-soft-cream/60 mt-1.5 leading-relaxed">
              Bury predictions, goals, or reflections. Lock Vibe Coins to earn high-yield cosmic interest.
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center rounded-2xl bg-white/70 dark:bg-white/5 border border-deep-violet/10 dark:border-white/10 p-1 select-none w-full md:w-auto">
          <button
            onClick={() => { playTick(); setActiveTab("bury"); }}
            className={`flex-1 md:flex-initial py-2 px-5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "bury"
                ? "bg-deep-violet dark:bg-[#1B103E] text-white dark:text-soft-cream shadow-md"
                : "text-deep-violet/60 dark:text-soft-cream/60 hover:text-deep-violet dark:hover:text-soft-cream"
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Bury Message</span>
          </button>
          <button
            onClick={() => { playTick(); setActiveTab("vault"); }}
            className={`flex-1 md:flex-initial py-2 px-5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "vault"
                ? "bg-deep-violet dark:bg-[#1B103E] text-white dark:text-soft-cream shadow-md"
                : "text-deep-violet/60 dark:text-soft-cream/60 hover:text-deep-violet dark:hover:text-soft-cream"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Capsule Vault</span>
          </button>
        </div>
      </div>

      {/* Bury Message Section */}
      <AnimatePresence mode="wait">
        {activeTab === "bury" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 md:grid-cols-12 gap-8"
          >
            {/* Form Column */}
            <div className="md:col-span-7 bg-white/70 dark:bg-[#1B103E]/50 backdrop-blur-xl border border-deep-violet/10 dark:border-white/10 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full filter blur-3xl pointer-events-none -z-15" />
              
              <h4 className="text-base font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-deep-violet/5 dark:border-white/5 pb-3">
                <span>Seal a Future Promise</span>
                <span className="text-[10px] normal-case bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2.5 py-0.5 rounded-full font-bold">
                  Lock & Matures
                </span>
              </h4>

              {hasBuriedToday ? (
                <div className="text-center py-12 px-4 space-y-5">
                  <span className="text-5xl animate-bounce inline-block">⏳</span>
                  <h4 className="text-lg font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">Temporal Energy Depleted</h4>
                  <p className="text-xs font-semibold text-deep-violet/70 dark:text-soft-cream/75 max-w-sm mx-auto leading-relaxed">
                    You have already sealed a time capsule in the vault today. The cosmic gateway is closed until tomorrow.
                  </p>
                  <div className="inline-block py-2.5 px-6 bg-amber-600/10 dark:bg-amber-500/10 border border-amber-600/30 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 rounded-2xl text-xs font-black select-none">
                    Return Tomorrow to Seal Another Memory ✓
                  </div>
                </div>
              ) : (
                <form onSubmit={handleBuryCapsule} className="space-y-5">
                  {errorMsg && (
                    <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-2">
                      <span className="text-sm">⚠️</span>
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Message TextArea */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px] font-black uppercase tracking-wider text-deep-violet/60 dark:text-soft-cream/60">
                      <label>Your Message to the Future</label>
                      <span>{500 - messageText.length} chars left</span>
                    </div>
                    <textarea
                      rows={4}
                      maxLength={500}
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Write a goal you want to achieve, a wish for your future self, or a prediction of where you'll be. It will be sealed away..."
                      className="w-full rounded-2xl bg-white/50 dark:bg-white/5 border border-deep-violet/20 dark:border-white/10 focus:border-amber-500 p-4 text-xs font-bold text-deep-violet dark:text-white placeholder-deep-violet/30 dark:placeholder-white/30 focus:outline-none resize-none focus:ring-1 focus:ring-amber-500/50"
                    />
                  </div>

                  {/* Coin Locker Input */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px] font-black uppercase tracking-wider text-deep-violet/60 dark:text-soft-cream/60">
                      <label>Lock Vibe Coins Principal</label>
                      <span className="text-amber-600 dark:text-amber-400">Balance: {coinBalance} coins</span>
                    </div>
                    <div className="bg-white/50 dark:bg-white/5 border border-deep-violet/10 dark:border-white/10 rounded-2xl p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Coins className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                          <span className="text-xs font-black">Principal wager:</span>
                        </div>
                        <input
                          type="number"
                          min={10}
                          max={Math.max(10, coinBalance)}
                          value={coinsToLock}
                          onChange={(e) => setCoinsToLock(Math.max(0, parseInt(e.target.value) || 0))}
                          className="bg-white/80 dark:bg-black/40 border border-deep-violet/20 dark:border-white/10 rounded-xl px-3 py-1.5 text-center font-black font-mono text-sm w-28 text-deep-violet dark:text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      {/* Range Slider */}
                      <input
                        type="range"
                        min={10}
                        max={Math.max(100, coinBalance)}
                        value={coinsToLock}
                        onChange={(e) => setCoinsToLock(parseInt(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer h-1.5 bg-deep-violet/10 dark:bg-white/10 rounded-lg appearance-none"
                      />
                    </div>
                  </div>

                  {/* Lock Duration Selection Grid */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-wider text-deep-violet/60 dark:text-soft-cream/60 block">
                      Choose Temporal Lock Period
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { key: "1min", time: "1 min", rate: "+5%" },
                        { key: "1hr", time: "1 hour", rate: "+10%" },
                        { key: "1day", time: "1 day", rate: "+15%" },
                        { key: "1week", time: "1 week", rate: "+30%" },
                        { key: "1month", time: "1 month", rate: "+75%" },
                        { key: "1year", time: "1 year", rate: "+150%" }
                      ].map((d) => (
                        <button
                          key={d.key}
                          type="button"
                          onClick={() => { playTick(); setDurationType(d.key as any); }}
                          className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                            durationType === d.key
                              ? "bg-amber-500 border-amber-400 text-amber-950 font-black shadow-md shadow-amber-500/20 scale-105"
                              : "bg-white/50 dark:bg-white/5 border-deep-violet/10 dark:border-white/10 hover:border-deep-violet/20 dark:hover:border-white/20 text-deep-violet dark:text-white"
                          }`}
                        >
                          <span className="text-[10px] font-black tracking-wider uppercase leading-none">{d.time}</span>
                          <span className={`text-[9px] font-bold ${durationType === d.key ? "text-amber-950/70" : "text-emerald-600 dark:text-emerald-400"}`}>{d.rate} Yield</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={submitting || coinBalance < coinsToLock}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-amber-950 font-black text-xs tracking-widest uppercase shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4.5 h-4.5" />
                    <span>{submitting ? "SEALING CAPSULE..." : "SEAL MESSAGE & LOCK COINS"}</span>
                  </button>
                </form>
              )}
            </div>

            {/* Preview Column */}
            <div className="md:col-span-5 flex flex-col gap-6">
              {/* Yield summary card */}
              <div className="bg-gradient-to-br from-[#FAF3E0] to-[#E8DAB2] dark:from-[#1E1145] dark:to-[#0D0725] border-2 border-amber-600/30 dark:border-amber-500/30 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[280px]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full filter blur-2xl pointer-events-none" />

                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-amber-805 dark:text-amber-400 px-3 py-1 bg-white/40 dark:bg-white/5 rounded-full border border-deep-violet/10 dark:border-white/5 inline-block">
                    Cosmic Yield Breakdown
                  </span>

                  <div className="mt-6 space-y-4">
                    <div className="flex justify-between items-end">
                      <span className="text-xs text-amber-950/70 dark:text-soft-cream/60 font-semibold">Principal Locked:</span>
                      <span className="text-sm font-black font-mono text-amber-950 dark:text-white">{coinsToLock} Coins</span>
                    </div>

                    <div className="flex justify-between items-end border-b border-deep-violet/5 dark:border-white/5 pb-3">
                      <span className="text-xs text-amber-950/70 dark:text-soft-cream/60 font-semibold">Maturation Term:</span>
                      <span className="text-xs font-black text-amber-800 dark:text-amber-300 uppercase">{label}</span>
                    </div>

                    <div className="flex justify-between items-end">
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Estimated Yield Rate:</span>
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">+{Math.round((multiplier - 1) * 100)}%</span>
                    </div>

                    <div className="flex justify-between items-end">
                      <span className="text-xs text-amber-950/70 dark:text-soft-cream/60 font-semibold">Interest Earned:</span>
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-300 font-mono">+{interestEarned} Coins</span>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-600/10 dark:bg-amber-500/10 border border-amber-600/20 dark:border-amber-500/20 rounded-2xl p-4 mt-6">
                  <p className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 leading-none">Total Unlocked Payout</p>
                  <p className="text-xl font-black font-mono text-amber-950 dark:text-white mt-1.5 leading-none">
                    {finalYield} <span className="text-[10px] font-bold text-amber-950/75 dark:text-soft-cream/75">Vibe Coins</span>
                  </p>
                </div>
              </div>

              {/* Instructions / Explanation card */}
              <div className="bg-white/70 dark:bg-white/5 border border-deep-violet/10 dark:border-white/10 rounded-[2rem] p-5 shadow-lg flex items-start gap-3.5">
                <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                <div className="text-[11px] leading-relaxed font-bold text-deep-violet/60 dark:text-soft-cream/60">
                  <p className="text-deep-violet dark:text-white font-black mb-1">How it works:</p>
                  Your message and coins are sealed on Firestore in a time-locked vault. Once the timer matures, you unseal the capsule to collect your locked principal plus the interest. Perfect for setting a long-term goal and tracking your commitment!
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Vault Tab (Locked Capsules) */}
        {activeTab === "vault" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="w-full bg-white/70 dark:bg-[#1B103E]/50 backdrop-blur-xl border border-deep-violet/10 dark:border-white/10 rounded-[2.5rem] p-6 shadow-2xl"
          >
            <h4 className="text-base font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2 mb-6 border-b border-deep-violet/5 dark:border-white/5 pb-3">
              <span>Time Vault</span>
              <span className="text-[10px] bg-deep-violet/5 dark:bg-white/10 text-deep-violet/70 dark:text-soft-cream/70 px-2.5 py-0.5 rounded-full font-bold">
                {capsules.length} sealed capsules
              </span>
            </h4>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-deep-violet/60 dark:text-soft-cream/40 font-semibold">Tuning temporal frequencies...</p>
              </div>
            ) : !user || user.uid === "guest" ? (
              <div className="py-16 text-center space-y-3">
                <p className="text-4xl">🔒</p>
                <h5 className="text-sm font-black text-deep-violet dark:text-white">Vault is Sealed</h5>
                <p className="text-xs text-deep-violet/60 dark:text-soft-cream/40 max-w-xs mx-auto leading-relaxed">
                  Please log in above to unlock your temporal vault and review your time-locked capsules.
                </p>
              </div>
            ) : capsules.length === 0 ? (
              <div className="py-16 text-center border-2 border-dashed border-deep-violet/20 dark:border-white/10 rounded-[2rem] space-y-3 bg-white/50 dark:bg-white/5">
                <p className="text-4xl">🕰️</p>
                <h5 className="text-sm font-black text-deep-violet dark:text-white">No Sealed Capsules</h5>
                <p className="text-xs text-deep-violet/60 dark:text-soft-cream/40 max-w-xs mx-auto leading-relaxed">
                  You don't have any time capsules locked in the vault. Go to the "Bury Message" tab to seal your first one!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {capsules.map((capsule) => (
                  <TimeCapsuleCard
                    key={capsule.id}
                    capsule={capsule}
                    onClaim={handleClaimCapsule}
                    onOpen={setOpenCapsule}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: View Unsealed Scroll Message Popup */}
      <AnimatePresence>
        {openCapsule && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
          >
            {/* Scroll Container */}
            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: -30, opacity: 0 }}
              className="relative max-w-md w-full bg-gradient-to-b from-[#FAF3E0] to-[#E8DAB2] border-4 border-amber-700/60 rounded-3xl p-8 shadow-2xl text-amber-950 font-fredoka flex flex-col items-center justify-center overflow-hidden"
            >
              {/* Close Button */}
              <button
                onClick={() => { playTick(); setOpenCapsule(null); }}
                className="absolute top-4 right-4 w-7 h-7 bg-amber-900/10 border border-amber-900/25 rounded-full flex items-center justify-center text-amber-900 hover:bg-amber-900/20 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-full text-center space-y-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-900 px-3.5 py-1 bg-amber-900/10 rounded-full border border-amber-900/15">
                  🎋 Unsealed Paper Scroll
                </span>

                <div className="py-2 text-4xl">📜</div>

                <h3 className="text-lg font-black text-amber-950 leading-none">
                  A Voice From The Past
                </h3>

                <p className="text-[10px] text-amber-900/65 font-bold">
                  Sealed on {new Date(openCapsule.createdAt).toLocaleDateString()} at {new Date(openCapsule.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>

                {/* Message Scroll Body */}
                <div className="bg-amber-900/5 border-y border-amber-900/15 p-6 rounded-2xl italic font-semibold text-sm leading-relaxed text-amber-950/90 max-h-56 overflow-y-auto">
                  "{openCapsule.messageText}"
                </div>

                {/* Reward Claim Banner */}
                <div className="p-4 bg-gradient-to-r from-amber-600 to-amber-700 rounded-2xl text-white shadow-md">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-200">Unlocked principal + interest payout</p>
                  <p className="text-xl font-black font-mono mt-1">
                    +{Math.floor(openCapsule.coinsLocked * openCapsule.multiplier)} Vibe Coins
                  </p>
                </div>

                <button
                  onClick={() => { playTick(); setOpenCapsule(null); }}
                  className="w-full py-3 rounded-xl bg-amber-900 hover:bg-amber-950 text-white font-black text-xs tracking-wider uppercase transition-colors shadow-md active:scale-95 cursor-pointer"
                >
                  Close Scroll
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
