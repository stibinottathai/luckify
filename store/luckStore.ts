import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STARTING_COIN_BALANCE } from "@/lib/prizes";

export interface HistoryItem {
  game: string;
  result: string;
  timestamp: string;
  isWin: boolean;
  scoreImpact: number;
}

interface LuckStore {
  totalPlays: number;
  winStreak: number;
  luckyScore: number; // 0-100, updates after each game
  coinBalance: number;
  history: HistoryItem[];
  addResult: (game: string, result: string, isWin: boolean, scoreImpact?: number) => void;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  resetToday: () => void;
}

export const useLuckStore = create<LuckStore>()(
  persist(
    (set, get) => ({
      totalPlays: 0,
      winStreak: 0,
      luckyScore: 50, // Starts at 50 (neutral luck)
      coinBalance: STARTING_COIN_BALANCE,
      history: [],

      addResult: (game, result, isWin, scoreImpact) => {
        set((state) => {
          const newTotalPlays = state.totalPlays + 1;
          const newWinStreak = isWin ? state.winStreak + 1 : 0;
          
          // Calculate score impact if not explicitly provided
          let impact = scoreImpact;
          if (impact === undefined) {
            if (isWin) {
              // Wins give +5 to +15, slightly boosted by current streak
              impact = Math.floor(Math.random() * 11) + 5 + Math.min(state.winStreak, 5);
            } else {
              // Losses subtract -4 to -10
              impact = -(Math.floor(Math.random() * 7) + 4);
            }
          }

          // Compute new score constrained between 0 and 100
          const newLuckyScore = Math.max(0, Math.min(100, state.luckyScore + impact));

          // Create new history item
          const newHistoryItem: HistoryItem = {
            game,
            result,
            timestamp: new Date().toISOString(),
            isWin,
            scoreImpact: impact,
          };

          // Limit history to last 20 elements
          const newHistory = [newHistoryItem, ...state.history].slice(0, 20);

          return {
            totalPlays: newTotalPlays,
            winStreak: newWinStreak,
            luckyScore: newLuckyScore,
            history: newHistory,
          };
        });
      },

      addCoins: (amount) => {
        if (amount <= 0) return;
        set((state) => ({
          coinBalance: state.coinBalance + amount,
        }));
      },

      spendCoins: (amount) => {
        if (amount <= 0) return true;

        const { coinBalance } = get();
        if (coinBalance < amount) {
          return false;
        }

        set({ coinBalance: coinBalance - amount });
        return true;
      },

      resetToday: () => {
        set({
          totalPlays: 0,
          winStreak: 0,
          luckyScore: 50,
          coinBalance: STARTING_COIN_BALANCE,
          history: [],
        });
      },
    }),
    {
      name: "lucky-vibes-store",
    }
  )
);
