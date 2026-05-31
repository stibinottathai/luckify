"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useLuckStore } from "@/store/luckStore";
import ResultCard from "@/components/ui/ResultCard";
import ShareModal from "@/components/ui/ShareModal";
import { playDiceRoll } from "@/lib/audio";
import { Trash2, Plus, RotateCcw, XCircle } from "lucide-react";

interface TreeOption {
  id: string;
  emoji: string;
  name: string;
}

const DEFAULT_OPTIONS: TreeOption[] = [
  { id: "1", emoji: "🍃", name: "John" },
  { id: "2", emoji: "🍃", name: "Sarah" },
  { id: "3", emoji: "🍃", name: "Bob" },
  { id: "4", emoji: "🍃", name: "Emma" },
  { id: "5", emoji: "🍃", name: "Alex" },
  { id: "6", emoji: "🍃", name: "Jessica" },
  { id: "7", emoji: "🍃", name: "Michael" },
  { id: "8", emoji: "🍃", name: "Emily" },
  { id: "9", emoji: "🍃", name: "David" },
  { id: "10", emoji: "🍃", name: "Sophia" },
  { id: "11", emoji: "🍃", name: "Ryan" },
  { id: "12", emoji: "🍃", name: "Olivia" },
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

// Stylized Animated Smiling Boy Shaker Component
function TreeShakerBoy({ shaking }: { shaking: boolean }) {
  return (
    <motion.div
      initial={{ x: -80, opacity: 0, scale: 0.9 }}
      animate={
        shaking
          ? { x: 0, opacity: 1, scale: 1 }
          : { x: -80, opacity: 0, scale: 0.9 }
      }
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
      }}
      className="absolute bottom-[102px] left-[55px] w-20 h-30 z-10 pointer-events-none select-none"
    >
      <motion.svg
        animate={shaking ? { rotate: [-3, 3, -3, 3, -3, 3, 0] } : {}}
        transition={{ repeat: Infinity, duration: 0.2, ease: "easeInOut" }}
        viewBox="0 0 100 150"
        className="w-full h-full drop-shadow-md"
      >
        {/* Backward baseball cap */}
        <path d="M30,32 C30,12 70,12 70,32 Z" fill="#E53935" />
        <path d="M32,22 C18,22 10,28 12,32 C20,32 25,28 32,25 Z" fill="#C62828" />
        
        {/* Hair sticking out from cap */}
        <path d="M26,38 C23,45 28,52 30,58 C32,50 35,46 32,38 Z" fill="#4E342E" />
        <path d="M74,38 C77,45 72,52 70,58 C68,50 65,46 68,38 Z" fill="#4E342E" />
        <path d="M30,30 C40,34 60,34 70,30" stroke="#4E342E" strokeWidth="4" strokeLinecap="round" />

        {/* Boy's Face */}
        <circle cx="50" cy="46" r="22" fill="#FFD180" />
        
        {/* Cute hair bangs on forehead */}
        <path d="M35,30 Q42,36 45,32 Q50,38 55,32 Q60,36 65,30" stroke="#4E342E" strokeWidth="4" strokeLinecap="round" fill="none" />

        {/* Happy curved smiling eyes */}
        <path d="M40,43 Q44,38 46,44" stroke="#4E342E" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M54,43 Q56,38 60,44" stroke="#4E342E" strokeWidth="3" strokeLinecap="round" fill="none" />

        {/* Cute blushing cheeks */}
        <circle cx="36" cy="51" r="3" fill="#FF8A80" opacity="0.8" />
        <circle cx="64" cy="51" r="3" fill="#FF8A80" opacity="0.8" />

        {/* Cute nose */}
        <path d="M49,48 Q50,51 51,48" stroke="#4E342E" strokeWidth="2" strokeLinecap="round" fill="none" />

        {/* Joyful open smile */}
        <path d="M44,53 Q50,62 56,53 Q50,66 44,53 Z" fill="#D32F2F" />
        <path d="M44,53 Q50,62 56,53" stroke="#4E342E" strokeWidth="3" strokeLinecap="round" fill="none" />

        {/* Torso / Shirt */}
        <path d="M32,68 L68,68 L72,100 L28,100 Z" fill="#FFEB3B" />
        <rect x="29.5" y="76" width="41" height="6" fill="#1E88E5" />
        <rect x="28.5" y="88" width="43" height="6" fill="#1E88E5" />

        {/* Pants */}
        <path d="M28,100 L72,100 L74,120 L58,120 L58,110 L42,110 L42,120 L26,120 Z" fill="#1565C0" />

        {/* Legs */}
        <rect x="30" y="120" width="8" height="15" fill="#FFD180" />
        <rect x="62" y="120" width="8" height="15" fill="#FFD180" />

        {/* Sneakers */}
        <path d="M24,138 L38,138 L40,143 L22,143 Z" fill="#C62828" />
        <rect x="22" y="142" width="18" height="3" rx="1" fill="#FFFFFF" />
        <path d="M62,138 L76,138 L78,143 L60,143 Z" fill="#C62828" />
        <rect x="60" y="142" width="18" height="3" rx="1" fill="#FFFFFF" />

        {/* Shaking arms */}
        <motion.path
          animate={shaking ? { x: [0, 3, -3, 3, 0] } : {}}
          transition={{ repeat: Infinity, duration: 0.15 }}
          d="M28,78 C42,66 65,66 78,74"
          stroke="#FFD180"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        <motion.path
          animate={shaking ? { x: [0, -3, 3, -3, 0] } : {}}
          transition={{ repeat: Infinity, duration: 0.15 }}
          d="M72,78 C58,66 48,68 78,74"
          stroke="#FFD180"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
      </motion.svg>
    </motion.div>
  );
}

export default function TreeGame() {
  const [shaking, setShaking] = useState(false);
  const [hasShaken, setHasShaken] = useState(false);
  const [fallingItems, setFallingItems] = useState<{ id: string; name: string; startX?: number; startY?: number; x: number; y: number; rotate: number }[]>([]);
  
  // Custom Tree Options state, defaulting to DEFAULT_OPTIONS
  const [options, setOptions] = useState<TreeOption[]>(DEFAULT_OPTIONS);
  const [luckyItem, setLuckyItem] = useState<TreeOption | null>(null);

  // Form Input
  const [newName, setNewName] = useState("");
  
  const [showResult, setShowResult] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const addResult = useLuckStore((state) => state.addResult);
  const currentScore = useLuckStore((state) => state.luckyScore);

  const handleShake = () => {
    if (options.length < 1) {
      alert("⚠️ You need at least 1 name on the tree to shake it! Please add a name in the editor.");
      return;
    }

    if (shaking) return;
    
    setShaking(true);
    setHasShaken(true);
    setLuckyItem(null);
    setShowResult(false);
    
    // Procedural sound synthesis during shake
    const soundInterval = setInterval(() => {
      playDiceRoll();
    }, 150);

    setTimeout(() => {
      clearInterval(soundInterval);
      setShaking(false);

      // Select one lucky option randomly
      const luckyIndex = Math.floor(Math.random() * options.length);
      const chosenItem = options[luckyIndex];
      setLuckyItem(chosenItem);

      // Find the branch coordinate it falls from
      const coordIndex = options.findIndex((o) => o.id === chosenItem.id) % 12;
      const coord = BRANCH_COORDINATES[coordIndex];
      const startX = ((coord.xPercent - 50) / 100) * 280;
      const startY = ((coord.yPercent / 100) * 260) - 240; // top foliage offset

      // Calculate flying physics trajectory for the single selected lucky item
      const calculatedFalls = [{
        id: chosenItem.id,
        name: chosenItem.name,
        startX: startX,
        startY: startY,
        x: (60 + Math.random() * 25), // land on the right side of the forest floor
        y: 240 + Math.random() * 20, // ground level
        rotate: Math.random() * 180 - 90,
      }];

      setFallingItems(calculatedFalls);

      // Slide up outcome card
      setTimeout(() => {
        setShowResult(true);
        addResult("Shaking Tree", `Selected Name: ${chosenItem.name}`, true, 10);
        
        // Remove the fallen name from the options list!
        setOptions((prev) => prev.filter((o) => o.id !== chosenItem.id));
      }, 1000);

    }, 1200); // 1.2s shaking sequence
  };

  const handleReset = () => {
    setHasShaken(false);
    setFallingItems([]);
    setLuckyItem(null);
    setShowResult(false);
  };

  const handleAddOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    if (options.length >= 12) {
      alert("⚠️ You have reached the maximum limit of 12 options! Please delete some options before adding a new one.");
      return;
    }

    const trimmedName = newName.trim().slice(0, 12);
    const isDuplicate = options.some(
      (opt) => opt.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      alert(`⚠️ The name "${trimmedName}" is already on the tree! Please enter a unique name.`);
      return;
    }

    const newOption: TreeOption = {
      id: Math.random().toString(),
      emoji: "🍃",
      name: trimmedName,
    };

    setOptions([...options, newOption]);
    setNewName("");
  };

  const handleDeleteOption = (id: string) => {
    setOptions(options.filter((o) => o.id !== id));
  };

  const handleClearAllOptions = () => {
    setOptions([]);
  };

  const handleResetOptions = () => {
    setOptions(DEFAULT_OPTIONS);
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-4">
      {/* Responsive two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start select-none">
        
        {/* LEFT COLUMN: Shaking Tree Game View */}
        <div className="lg:col-span-7 flex flex-col items-center">
          {/* Game board relative card container */}
          <div className="relative w-full max-w-sm bg-white dark:bg-card border-4 border-primary-gold rounded-3xl p-6 shadow-xl flex flex-col items-center select-none overflow-hidden h-[460px]">
            
            {/* Large premium redesigned SVG tree */}
            <div className={`relative w-[280px] h-[260px] transition-transform ${shaking ? "animate-shake" : ""}`}>
              <svg viewBox="0 0 200 180" className="w-full h-full filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.12)] dark:drop-shadow-[0_8px_16px_rgba(0,0,0,0.32)]">
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

              {/* Absolute overlaying custom names as leaf-like pills on branches */}
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
                      {/* Wooden/Paper-style sign board */}
                      <div
                        className="px-2.5 py-1 rounded-md border-2 shadow-sm text-[10px] font-black tracking-wide whitespace-nowrap -mt-[2px] bg-white dark:bg-[#1B103E] border-[#2D1B69] dark:border-[#F5B700] text-[#2D1B69] dark:text-[#FFF8E7]"
                      >
                        {item.name}
                      </div>
                    </motion.div>
                  );
                })}
            </div>

            {/* Falling Leaves overlay */}
            {shaking && (
              <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
                <motion.svg
                  initial={{ x: 140, y: 70, opacity: 0, rotate: 0 }}
                  animate={{ x: 70, y: 220, opacity: [0, 1, 1, 0], rotate: 360 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="absolute w-5 h-5 text-accent-teal fill-current"
                  viewBox="0 0 24 24"
                >
                  <path d="M17,8C8,10 5.9,16.17 3.82,21.34L2.18,20.66C4.26,15.49 6.5,8.83 17,8M12,2C10.5,3.5 9,6.5 9,9C9,11.5 10.5,13.5 12,14C13.5,13.5 15,11.5 15,9C15,6.5 13.5,3.5 12,2Z" />
                </motion.svg>
                <motion.svg
                  initial={{ x: 100, y: 80, opacity: 0, rotate: 0 }}
                  animate={{ x: 150, y: 230, opacity: [0, 1, 1, 0], rotate: -240 }}
                  transition={{ duration: 1.4, delay: 0.1, ease: "easeOut" }}
                  className="absolute w-4 h-4 text-[#00E676] fill-current"
                  viewBox="0 0 24 24"
                >
                  <path d="M17,8C8,10 5.9,16.17 3.82,21.34L2.18,20.66C4.26,15.49 6.5,8.83 17,8M12,2C10.5,3.5 9,6.5 9,9C9,11.5 10.5,13.5 12,14C13.5,13.5 15,11.5 15,9C15,6.5 13.5,3.5 12,2Z" />
                </motion.svg>
                <motion.svg
                  initial={{ x: 190, y: 90, opacity: 0, rotate: 0 }}
                  animate={{ x: 230, y: 210, opacity: [0, 1, 1, 0], rotate: 180 }}
                  transition={{ duration: 1.0, delay: 0.2, ease: "easeOut" }}
                  className="absolute w-4 h-4 text-[#00C853] fill-current"
                  viewBox="0 0 24 24"
                >
                  <path d="M17,8C8,10 5.9,16.17 3.82,21.34L2.18,20.66C4.26,15.49 6.5,8.83 17,8M12,2C10.5,3.5 9,6.5 9,9C9,11.5 10.5,13.5 12,14C13.5,13.5 15,11.5 15,9C15,6.5 13.5,3.5 12,2Z" />
                </motion.svg>
              </div>
            )}

            {/* Tree Shaker Boy character */}
            <TreeShakerBoy shaking={shaking} />

            {/* Dynamic Fall & Landing area for Custom Name Signs */}
            <div className="absolute inset-x-0 bottom-[80px] h-[150px] pointer-events-none">
              {hasShaken &&
                fallingItems.map((item) => {
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ x: item.startX ?? 0, y: item.startY ?? -180, scale: 1.0, rotate: 0 }}
                      animate={{
                        x: item.x,
                        y: item.y - 150, // raised landing offset
                        rotate: item.rotate,
                        scale: 1.3,
                      }}
                      transition={{
                        type: "spring",
                        damping: 12,
                        stiffness: 85,
                      }}
                      style={{
                        position: "absolute",
                        left: "50%",
                      }}
                      className="text-[10px] font-black px-2.5 py-1 rounded-sm border flex items-center justify-center whitespace-nowrap shadow-md z-10 pointer-events-none transform -translate-x-1/2 ring-4 ring-[#F5B700] bg-[#F5B700] text-[#2D1B69] border-white z-20 shadow-xl animate-pulse opacity-100"
                    >
                      {item.name}
                    </motion.div>
                  );
                })}
            </div>

            {/* Forest floor ground barrier */}
            <div className="absolute inset-x-0 bottom-[105px] h-3 bg-emerald-500/20 border-t border-emerald-500/40 dark:bg-white/5 dark:border-white/10" />

            {/* Action Button Controls */}
            <div className="absolute bottom-4 flex items-center gap-3">
              <button
                disabled={shaking}
                onClick={handleShake}
                className={`py-3.5 px-8 rounded-2xl font-extrabold text-base select-none cursor-pointer tracking-wider shadow-lg transition-all transform active:scale-95 ${
                  shaking
                    ? "bg-[#2D1B69]/30 dark:bg-white/10 text-[#2D1B69]/50 dark:text-[#FFF8E7]/50 pointer-events-none"
                    : "bg-[#F5B700] hover:bg-[#E0A700] text-[#2D1B69] hover:shadow-xl"
                }`}
              >
                {shaking ? "Shaking..." : "SHAKE THE TREE! 🌳"}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Custom Options Editor */}
        <div className="lg:col-span-5 lg:-mt-8 bg-white dark:bg-card border-4 border-primary-gold rounded-3xl p-6 shadow-xl flex flex-col w-full text-slate-900 dark:text-white">
          <h3 className="text-xl font-extrabold font-fredoka text-slate-900 dark:text-[#FFF8E7] mb-2 border-b border-slate-200 dark:border-white/10 pb-3 flex justify-between items-center">
            <span>Name List Editor 🎨</span>
            <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${options.length >= 12 ? "bg-alert-coral/10 text-alert-coral animate-pulse" : "bg-slate-100 text-slate-800 dark:bg-white/5 dark:text-cream-soft/40"}`}>
              {options.length}/12 Limit
            </span>
          </h3>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-5">
            Add custom names below to hang them on the tree and shake them down! (Max 12 chars)
          </p>

          {/* Add Option Form */}
          <form onSubmit={handleAddOption} className="flex gap-2 mb-6">
            <input
              type="text"
              placeholder={options.length >= 12 ? "Limit reached!" : "Enter name (Max 12 chars)"}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              disabled={shaking || options.length >= 12}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-white/25 bg-slate-50 dark:bg-white/5 font-bold text-sm outline-none focus:border-primary-gold dark:focus:border-primary-gold text-slate-900 dark:text-white placeholder-slate-500 disabled:opacity-40"
              maxLength={12}
              required
            />
            <button
              type="submit"
              disabled={shaking || options.length >= 25}
              className="p-3 bg-[#F5B700] text-[#2D1B69] hover:bg-[#E0A700] rounded-xl font-bold flex items-center justify-center cursor-pointer disabled:opacity-40 shrink-0"
            >
              <Plus className="w-5 h-5" />
            </button>
          </form>

          {/* List of active tree options */}
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1 mb-6">
            {options.length === 0 ? (
              <div className="py-8 text-center text-xs font-bold text-slate-500 dark:text-slate-400 italic">
                No active names. Add some above!
              </div>
            ) : (
              options.map((seg) => (
                <div
                  key={seg.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/5 font-bold text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-900 dark:text-[#FFF8E7]">
                      👤 {seg.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={shaking}
                    onClick={() => handleDeleteOption(seg.id)}
                    className="p-1 text-red-600 hover:bg-red-100 dark:text-alert-coral dark:hover:bg-red-950/30 rounded-lg cursor-pointer disabled:opacity-40"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Actions Grid */}
          <div className="grid grid-cols-2 gap-3 w-full">
            <button
              type="button"
              disabled={shaking || options.length === 0}
              onClick={handleClearAllOptions}
              className="flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 dark:bg-red-950/20 dark:hover:bg-red-950/30 dark:text-red-400 dark:border-red-900/30 transition-all active:scale-95 cursor-pointer disabled:opacity-40 animate-duration-300"
            >
              <XCircle className="w-4 h-4" />
              Clear All
            </button>
            <button
              type="button"
              disabled={shaking}
              onClick={handleResetOptions}
              className="flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white dark:border-white/10 transition-all active:scale-95 cursor-pointer disabled:opacity-40"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Defaults
            </button>
          </div>
        </div>

      </div>

      {/* Outcome Cards and sharing modals */}
      {luckyItem && (
        <ResultCard
          isOpen={showResult}
          onClose={() => {
            setShowResult(false);
            setFallingItems([]);
            setHasShaken(false);
          }}
          gameName="Shaking Tree"
          emoji="🌳"
          title={`Chosen Name: ${luckyItem.name}!`}
          description={`The magical shaking tree has selected ${luckyItem.name} for you! Your cosmic balance is perfectly aligned.`}
          scoreImpact={10}
          isWin={true}
          onRestart={handleShake}
          onShare={() => setShowShare(true)}
        />
      )}

      {luckyItem && (
        <ShareModal
          isOpen={showShare}
          onClose={() => setShowShare(false)}
          score={currentScore}
          game="Shaking Tree"
          prize={`${luckyItem.emoji} ${luckyItem.name}`}
        />
      )}
    </div>
  );
}
