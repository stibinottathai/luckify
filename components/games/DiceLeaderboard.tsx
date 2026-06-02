"use client";

import { useEffect, useState } from "react";
import { fetchDiceCollectorsLeaderboard, LeaderboardEntry } from "@/lib/firestoreProfile";
import { Trophy, ShieldCheck, Flame, Star } from "lucide-react";
import Image from "next/image";

export default function DiceLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    let isMounted = true;

    fetchDiceCollectorsLeaderboard()
      .then((data) => {
        if (!isMounted) return;
        setEntries(data);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error(err);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-lg bg-white dark:bg-card border-2 border-deep-violet/10 dark:border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[300px] gap-3 text-deep-violet/40 dark:text-cream-soft/40 animate-pulse font-fredoka font-bold">
        <div className="w-10 h-10 border-4 border-primary-gold border-t-transparent rounded-full animate-spin" />
        <span>Syncing Collectors Ledger...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg bg-white dark:bg-card border-2 border-deep-violet/10 dark:border-white/10 rounded-3xl p-5 shadow-xl select-none flex flex-col gap-4 font-fredoka">
      
      {/* Title */}
      <div className="flex items-center gap-2 border-b border-deep-violet/5 dark:border-white/5 pb-3">
        <span className="w-8 h-8 rounded-full bg-primary-gold/15 flex items-center justify-center text-primary-gold animate-bounce">
          <Trophy className="w-4.5 h-4.5" />
        </span>
        <div>
          <h2 className="text-lg font-black text-deep-violet dark:text-cream-soft leading-none">
            🏆 Dice Collectors
          </h2>
          <p className="text-[10px] font-bold text-deep-violet/45 dark:text-cream-soft/45 mt-1 uppercase tracking-wide">
            Ranked by Unique Dice, Mythics, and Balance
          </p>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-12 text-sm font-semibold text-deep-violet/40 dark:text-cream-soft/40">
          No rolls captured yet. Roll to discover rare skins and claim your spot! 🎲✨
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
          {entries.map((entry, idx) => {
            const isTop1 = idx === 0;
            const isTop2 = idx === 1;
            const isTop3 = idx === 2;

            // Simple equipped dice clean label
            const equippedCleanName = (entry.equippedDice || "wooden_dice")
              .replace("_", " ")
              .replace(/\b\w/g, (c) => c.toUpperCase());

            return (
              <div
                key={entry.uid}
                className={`flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all ${
                  isTop1
                    ? "bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-transparent border-yellow-500/25 shadow-md shadow-yellow-500/5"
                    : isTop2
                    ? "bg-gradient-to-r from-slate-400/10 to-transparent border-slate-400/20"
                    : isTop3
                    ? "bg-gradient-to-r from-amber-600/10 to-transparent border-amber-600/20"
                    : "bg-deep-violet/5 dark:bg-white/5 border-transparent hover:border-deep-violet/10 dark:hover:border-white/10"
                }`}
              >
                {/* User Identity info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  
                  {/* Rank Badge */}
                  <span className="w-6 flex-shrink-0 text-center font-mono font-black text-sm text-deep-violet/50 dark:text-cream-soft/50">
                    {isTop1 ? (
                      <span className="text-lg">👑</span>
                    ) : isTop2 ? (
                      <span className="text-lg">🥈</span>
                    ) : isTop3 ? (
                      <span className="text-lg">🥉</span>
                    ) : (
                      idx + 1
                    )}
                  </span>

                  {/* Avatar Frame & image */}
                  <div className="relative w-9 h-9 rounded-full bg-deep-violet/10 dark:bg-white/10 flex items-center justify-center flex-shrink-0 border-2 border-white dark:border-card">
                    {entry.photoURL ? (
                      <Image
                        src={entry.photoURL}
                        alt={entry.displayName}
                        width={36}
                        height={36}
                        className="rounded-full object-cover w-full h-full"
                        unoptimized
                      />
                    ) : (
                      <span className="text-sm font-black text-deep-violet/40 dark:text-cream-soft/40 uppercase">
                        {entry.displayName.slice(0, 2)}
                      </span>
                    )}
                    {/* VIP Frame border indicator */}
                    {(entry.badges?.includes("badge_vip_avatar_frame") || entry.badges?.includes("badge_dice_master")) && (
                      <div className="absolute inset-0 rounded-full border-2 border-fuchsia-500 animate-pulse scale-105" />
                    )}
                  </div>

                  {/* Display Name & Equipped skin */}
                  <div className="min-w-0 flex flex-col justify-center">
                    <span className="block text-xs font-black text-deep-violet dark:text-cream-soft truncate leading-tight flex items-center gap-1">
                      {entry.displayName}
                      {entry.badges?.includes("badge_dice_master") && (
                        <span className="text-[10px] text-fuchsia-500 font-bold" title="Dice Master Title">👑</span>
                      )}
                    </span>
                    <span className="block text-[9px] font-bold text-deep-violet/45 dark:text-cream-soft/45 truncate leading-none mt-0.5 max-w-[130px] sm:max-w-[160px]">
                      Equipped: <span className="text-primary-gold font-extrabold">{equippedCleanName}</span>
                    </span>
                  </div>

                </div>

                {/* Score Stats / Collection parameters */}
                <div className="flex items-center gap-3.5 text-right flex-shrink-0">
                  
                  {/* Mythic Dice count */}
                  {(entry.mythicDiceCount || 0) > 0 && (
                    <div className="flex flex-col items-end leading-none" title="Mythic Dice Owned">
                      <span className="text-[8px] uppercase tracking-wider font-extrabold text-purple-500/80 leading-none">Mythic</span>
                      <span className="text-xs font-black text-purple-500 font-mono leading-none mt-0.5">
                        {entry.mythicDiceCount}
                      </span>
                    </div>
                  )}

                  {/* Unique count / total progress */}
                  <div className="flex flex-col items-end leading-none">
                    <span className="text-[8px] uppercase tracking-wider font-extrabold text-deep-violet/45 dark:text-cream-soft/45 leading-none">Collected</span>
                    <span className="text-sm font-black text-primary-gold font-mono leading-none mt-0.5">
                      {entry.collectionProgress}
                      <span className="text-[10px] font-bold text-deep-violet/30 dark:text-cream-soft/30 font-fredoka">/15</span>
                    </span>
                  </div>

                  {/* Percentage completion */}
                  <div className="flex flex-col items-end leading-none">
                    <span className="text-[8px] uppercase tracking-wider font-extrabold text-deep-violet/45 dark:text-cream-soft/45 leading-none">Comp %</span>
                    <span className="text-xs font-black text-deep-violet/70 dark:text-cream-soft/75 font-mono leading-none mt-0.5">
                      {Math.round(((entry.collectionProgress || 1) / 15) * 100)}%
                    </span>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
