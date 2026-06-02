"use client";

import { useEffect, useState } from "react";
import { subscribeGoldenDiceLeaderboard, LeaderboardEntry } from "@/lib/firestoreProfile";
import { Trophy } from "lucide-react";
import Image from "next/image";

export default function GoldenDiceLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeGoldenDiceLeaderboard(
      (data) => {
        setEntries(data);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-lg bg-white dark:bg-card border-2 border-deep-violet/10 dark:border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[300px] gap-3 text-deep-violet/40 dark:text-cream-soft/40 animate-pulse font-fredoka font-bold">
        <div className="w-10 h-10 border-4 border-primary-gold border-t-transparent rounded-full animate-spin" />
        <span>Syncing Golden Dice Legends...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg bg-white dark:bg-card border-2 border-deep-violet/10 dark:border-white/10 rounded-3xl p-5 shadow-xl select-none flex flex-col gap-4 font-fredoka">
      
      <div className="flex items-center gap-2 border-b border-deep-violet/5 dark:border-white/5 pb-3">
        <span className="w-8 h-8 rounded-full bg-primary-gold/15 flex items-center justify-center text-primary-gold animate-bounce">
          <Trophy className="w-4.5 h-4.5" />
        </span>
        <div>
          <h2 className="text-lg font-black text-deep-violet dark:text-cream-soft leading-none">
            🏆 Golden Dice Legends
          </h2>
          <p className="text-[10px] font-bold text-deep-violet/45 dark:text-cream-soft/45 mt-1 uppercase tracking-wide">
            Ranked by Events, Legendary Rewards, and Highest Win
          </p>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-12 text-sm font-semibold text-deep-violet/40 dark:text-cream-soft/40">
          No Golden Dice triggers logged yet. Be the first to unlock legendary fortune! 🎲✨
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
          {entries.map((entry, idx) => {
            const isTop1 = idx === 0;
            const isTop2 = idx === 1;
            const isTop3 = idx === 2;

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
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  
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
                  </div>

                  <div className="min-w-0 flex flex-col justify-center">
                    <span className="block text-xs font-black text-deep-violet dark:text-cream-soft truncate leading-tight flex items-center gap-1">
                      {entry.displayName}
                    </span>
                    <span className="block text-[9px] font-bold text-deep-violet/40 dark:text-cream-soft/40 truncate leading-none mt-0.5 max-w-[130px] sm:max-w-[160px]">
                      Win: <span className="text-primary-gold font-extrabold">{entry.highestRewardWon || "None"}</span>
                    </span>
                  </div>

                </div>

                <div className="flex items-center gap-3.5 text-right flex-shrink-0">
                  
                  {(entry.legendaryRewardsCount || 0) > 0 && (
                    <div className="flex flex-col items-end leading-none" title="Legendary Rewards Won">
                      <span className="text-[8px] uppercase tracking-wider font-extrabold text-rose-500/80 leading-none">Epic/Leg</span>
                      <span className="text-xs font-black text-rose-500 font-mono leading-none mt-0.5">
                        {entry.legendaryRewardsCount}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col items-end leading-none">
                    <span className="text-[8px] uppercase tracking-wider font-extrabold text-deep-violet/45 dark:text-cream-soft/45 leading-none">Golden</span>
                    <span className="text-sm font-black text-primary-gold font-mono leading-none mt-0.5">
                      {entry.totalGoldenDiceEvents}
                    </span>
                  </div>

                  <div className="flex flex-col items-end leading-none">
                    <span className="text-[8px] uppercase tracking-wider font-extrabold text-deep-violet/45 dark:text-cream-soft/45 leading-none">Rate</span>
                    <span className="text-xs font-black text-deep-violet/70 dark:text-cream-soft/75 font-mono leading-none mt-0.5">
                      {((entry.goldenDiceRate || 0) * 100).toFixed(1)}%
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
