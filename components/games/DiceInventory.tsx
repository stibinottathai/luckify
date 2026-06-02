"use client";

import { useEffect, useState } from "react";
import { ALL_DICE_SKINS } from "@/app/api/dice/roll/route";
import { fetchDiceCollection, UnlockedDiceDoc } from "@/lib/firestoreProfile";
import { useLuckStore } from "@/store/luckStore";
import { useAuth } from "@/components/auth/AuthProvider";
import DiceCard from "./DiceCard";
import DiceCollectionProgress from "./DiceCollectionProgress";
import { Sparkles, ShoppingBag } from "lucide-react";
import confetti from "canvas-confetti";

export default function DiceInventory() {
  const { user } = useAuth();
  const activeUserKey = useLuckStore((s) => s.activeUserKey);
  const currentProfile = useLuckStore((s) => s.profiles[activeUserKey]) || useLuckStore((s) => s.profiles["guest"]);

  const [unlockedDice, setUnlockedDice] = useState<UnlockedDiceDoc[]>([]);
  const [activeFilter, setActiveFilter] = useState<"all" | "common" | "rare" | "epic" | "legendary" | "mythic">("all");
  const [craftingLoading, setCraftingLoading] = useState(false);

  // One-time fetch unlocked dice subcollection
  useEffect(() => {
    let isMounted = true;

    if (!user || user.uid === "guest") {
      // Simulate guest collection (Wooden Dice only by default)
      setUnlockedDice([
        {
          id: "wooden_dice",
          name: "Wooden Dice",
          rarity: "common",
          unlockedAt: new Date().toISOString(),
        },
      ]);
      return;
    }

    const loadCollection = async () => {
      try {
        const list = await fetchDiceCollection(user.uid);
        if (!isMounted) return;

        // Ensure "wooden_dice" is always in the list (fallback fallback)
        const hasWood = list.some((d) => d.id === "wooden_dice");
        if (!hasWood) {
          setUnlockedDice([
            {
              id: "wooden_dice",
              name: "Wooden Dice",
              rarity: "common",
              unlockedAt: new Date().toISOString(),
            },
            ...list,
          ]);
        } else {
          setUnlockedDice(list);
        }
      } catch (err) {
        console.error("Failed to fetch dice collection", err);
      }
    };

    loadCollection();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Craft a new dice skin
  const handleCraft = async (diceId: string) => {
    if (craftingLoading) return;
    setCraftingLoading(true);

    try {
      const idToken = user ? await user.getIdToken() : "";
      const craftRes = await fetch("/api/dice/craft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: idToken ? `Bearer ${idToken}` : "",
        },
        body: JSON.stringify({
          isGuest: activeUserKey === "guest",
          diceId,
        }),
      });

      if (!craftRes.ok) {
        const err = await craftRes.json();
        alert(`Crafting failed: ${err.error}`);
        setCraftingLoading(false);
        return;
      }

      const data = await craftRes.json();

      // Sync updated profile to Zustand
      if (data.profile) {
        useLuckStore.setState((state) => {
          const updated = {
            ...state.profiles[activeUserKey],
            coinBalance: data.profile.coinBalance,
            badges: data.profile.badges,
            equippedDice: data.profile.equippedDice,
            diceFragments: data.profile.diceFragments,
            collectionProgress: data.profile.collectionProgress,
            mythicDiceCount: data.profile.mythicDiceCount,
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

      // Celebratory micro-burst confetti!
      confetti({
        particleCount: 50,
        spread: 60,
        colors: ["#F5B700", "#FFD700", "#AA00FF", "#00FFFF"],
      });

      // Re-fetch the collection to reflect the newly crafted dice in the UI
      if (user && user.uid !== "guest") {
        try {
          const updatedList = await fetchDiceCollection(user.uid);
          const hasWood = updatedList.some((d) => d.id === "wooden_dice");
          if (!hasWood) {
            setUnlockedDice([
              {
                id: "wooden_dice",
                name: "Wooden Dice",
                rarity: "common",
                unlockedAt: new Date().toISOString(),
              },
              ...updatedList,
            ]);
          } else {
            setUnlockedDice(updatedList);
          }
        } catch (err) {
          console.error("Failed to refresh dice collection after crafting", err);
        }
      }

      setCraftingLoading(false);
    } catch (err) {
      console.error(err);
      alert("Crafting failed due to network error");
      setCraftingLoading(false);
    }
  };

  // Equip an unlocked skin
  const handleEquip = (diceId: string) => {
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
      particleCount: 20,
      spread: 35,
      colors: ["#F5B700", "#FFD700"],
    });
  };

  const fragmentBalance = currentProfile.diceFragments ?? 0;
  const equippedDice = currentProfile.equippedDice ?? "wooden_dice";

  // Filter skins list
  const filteredSkins = Object.values(ALL_DICE_SKINS).filter((skin) => {
    if (activeFilter === "all") return true;
    return skin.rarity === activeFilter;
  });

  return (
    <div className="w-full flex flex-col gap-6 select-none font-fredoka">
      
      {/* Overview Progress bar and fragment counters */}
      <DiceCollectionProgress
        unlockedSkins={unlockedDice}
        totalSkinsCount={15}
        fragmentBalance={fragmentBalance}
      />

      {/* Rarity selector and search tab filters */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-deep-violet/5 dark:border-white/5 pb-4">
        
        {/* Filters */}
        <div className="flex flex-wrap gap-1.5 items-center justify-center sm:justify-start">
          {(["all", "common", "rare", "epic", "legendary", "mythic"] as const).map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#2D1B69] text-primary-gold border border-primary-gold/30 shadow-md"
                    : "bg-deep-violet/5 dark:bg-white/5 border border-transparent text-deep-violet/50 dark:text-cream-soft/50 hover:bg-deep-violet/10 dark:hover:bg-white/10"
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>

        {/* Fragment counter badge */}
        <div className="h-9 px-3 rounded-full border border-primary-gold/35 bg-primary-gold/10 flex items-center gap-1.5 flex-shrink-0 text-xs font-black text-primary-gold uppercase tracking-wider animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{fragmentBalance} fragments owned</span>
        </div>

      </div>

      {/* Grid of skins */}
      {filteredSkins.length === 0 ? (
        <div className="text-center py-12 text-sm font-bold text-deep-violet/40 dark:text-cream-soft/40">
          No collectible dice match this filter tier. Keep rolling to complete your sets! 🎲
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredSkins.map((skin) => {
            const unlockInfo = unlockedDice.find((d) => d.id === skin.id);
            const isUnlocked = !!unlockInfo || skin.id === "wooden_dice";
            const isEquipped = equippedDice === skin.id;

            return (
              <DiceCard
                key={skin.id}
                skin={skin}
                isUnlocked={isUnlocked}
                isEquipped={isEquipped}
                unlockedAt={unlockInfo ? unlockInfo.unlockedAt : skin.id === "wooden_dice" ? new Date().toISOString() : null}
                fragmentBalance={fragmentBalance}
                onEquip={handleEquip}
                onCraft={handleCraft}
                craftingLoading={craftingLoading}
              />
            );
          })}
        </div>
      )}

    </div>
  );
}
