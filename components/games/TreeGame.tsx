"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useLuckStore } from "@/store/luckStore";
import ResultCard from "@/components/ui/ResultCard";
import ShareModal from "@/components/ui/ShareModal";
import { playDiceRoll } from "@/lib/audio";
import { RotateCcw } from "lucide-react";

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

  const [showResult, setShowResult] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const addResult = useLuckStore((state) => state.addResult);
  const currentScore = useLuckStore((state) => state.luckyScore);

  const handleShake = () => {
    if (options.length < 1) {
      alert("⚠️ No names left on the tree! Please click Restock Tree to replenish them.");
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

  const handleRestock = () => {
    setOptions(DEFAULT_OPTIONS);
    handleReset();
  };

  return (
    <div className="w-full max-w-sm mx-auto py-0 sm:py-4 flex flex-col items-center select-none">
      {/* Game board relative card container */}
      <div className="relative w-full bg-white dark:bg-card border-4 border-primary-gold rounded-3xl p-6 shadow-xl flex flex-col items-center select-none overflow-hidden h-[460px]">
        
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
          {options.length === 0 ? (
            <button
              onClick={handleRestock}
              className="py-3.5 px-8 rounded-2xl font-extrabold text-base select-none cursor-pointer tracking-wider shadow-lg transition-all transform active:scale-95 bg-[#F5B700] hover:bg-[#E0A700] text-[#2D1B69] hover:shadow-xl flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              RESTOCK TREE 🔄
            </button>
          ) : (
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
          )}
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
