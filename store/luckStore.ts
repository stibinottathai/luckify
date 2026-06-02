import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  STARTING_COIN_BALANCE,
  WHEEL_FREE_DAILY_SPINS,
  WHEEL_MAX_PAID_SPINS,
  WHEEL_PAID_SPIN_COST,
} from "@/lib/prizes";

export interface HistoryItem {
  game: string;
  result: string;
  timestamp: string;
  isWin: boolean;
  scoreImpact: number;
}

interface LuckStore {
  activeUserKey: string;
  profiles: Record<string, UserLuckProfile>;
  totalPlays: number;
  winStreak: number;
  luckyScore: number; // 0-100, updates after each game
  coinBalance: number;
  history: HistoryItem[];
  wheelSpinDate: string;
  wheelDailySpinsUsed: number; // total spins used today (free + paid)
  wheelPaidSpinsUsed: number;  // paid spins used today (max 5)
  setActiveUser: (userKey: string) => void;
  addResult: (game: string, result: string, isWin: boolean, scoreImpact?: number) => void;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  refreshWheelSpins: () => void;
  consumeWheelSpin: () => boolean;
  resetToday: () => void;
}

type UserLuckProfile = Pick<
  LuckStore,
  | "totalPlays"
  | "winStreak"
  | "luckyScore"
  | "coinBalance"
  | "history"
  | "wheelSpinDate"
  | "wheelDailySpinsUsed"
  | "wheelPaidSpinsUsed"
>;

const GUEST_USER_KEY = "guest";

const getTodayKey = () => new Date().toISOString().slice(0, 10);

const createDefaultProfile = (): UserLuckProfile => ({
  totalPlays: 0,
  winStreak: 0,
  luckyScore: 50,
  coinBalance: STARTING_COIN_BALANCE,
  history: [],
  wheelSpinDate: getTodayKey(),
  wheelDailySpinsUsed: 0,
  wheelPaidSpinsUsed: 0,
});

const normalizeProfile = (profile?: Partial<UserLuckProfile>): UserLuckProfile => {
  const defaults = createDefaultProfile();
  const nextProfile = {
    ...defaults,
    ...profile,
    history: profile?.history ?? defaults.history,
  };

  if (nextProfile.wheelSpinDate !== getTodayKey()) {
    return {
      ...nextProfile,
      wheelSpinDate: getTodayKey(),
      wheelDailySpinsUsed: 0,
      wheelPaidSpinsUsed: 0,
    };
  }

  return nextProfile;
};

const applyProfile = (userKey: string, profile: UserLuckProfile, profiles: Record<string, UserLuckProfile>) => ({
  activeUserKey: userKey,
  profiles,
  ...profile,
});

const syncActiveProfile = (state: LuckStore, profile: UserLuckProfile) => ({
  ...profile,
  profiles: {
    ...state.profiles,
    [state.activeUserKey]: profile,
  },
});

export const useLuckStore = create<LuckStore>()(
  persist(
    (set, get) => ({
      activeUserKey: GUEST_USER_KEY,
      profiles: {
        [GUEST_USER_KEY]: createDefaultProfile(),
      },
      ...createDefaultProfile(),

      setActiveUser: (userKey) => {
        const nextUserKey = userKey || GUEST_USER_KEY;
        set((state) => {
          const profile = normalizeProfile(state.profiles[nextUserKey]);
          return applyProfile(nextUserKey, profile, {
            ...state.profiles,
            [nextUserKey]: profile,
          });
        });
      },

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

          return syncActiveProfile(state, {
            totalPlays: newTotalPlays,
            winStreak: newWinStreak,
            luckyScore: newLuckyScore,
            coinBalance: state.coinBalance,
            history: newHistory,
            wheelSpinDate: state.wheelSpinDate,
            wheelDailySpinsUsed: state.wheelDailySpinsUsed,
            wheelPaidSpinsUsed: state.wheelPaidSpinsUsed,
          });
        });
      },

      addCoins: (amount) => {
        if (amount <= 0) return;
        set((state) => syncActiveProfile(state, {
          totalPlays: state.totalPlays,
          winStreak: state.winStreak,
          luckyScore: state.luckyScore,
          coinBalance: state.coinBalance + amount,
          history: state.history,
          wheelSpinDate: state.wheelSpinDate,
          wheelDailySpinsUsed: state.wheelDailySpinsUsed,
          wheelPaidSpinsUsed: state.wheelPaidSpinsUsed,
        }));
      },

      spendCoins: (amount) => {
        if (amount <= 0) return true;

        const { coinBalance } = get();
        if (coinBalance < amount) {
          return false;
        }

        set((state) => syncActiveProfile(state, {
          totalPlays: state.totalPlays,
          winStreak: state.winStreak,
          luckyScore: state.luckyScore,
          coinBalance: coinBalance - amount,
          history: state.history,
          wheelSpinDate: state.wheelSpinDate,
          wheelDailySpinsUsed: state.wheelDailySpinsUsed,
          wheelPaidSpinsUsed: state.wheelPaidSpinsUsed,
        }));
        return true;
      },

      refreshWheelSpins: () => {
        set((state) => syncActiveProfile(state, normalizeProfile(state)));
      },

      consumeWheelSpin: () => {
        const state = get();
        const profile = normalizeProfile(state);

        const hasUsedFreeSpinToday = profile.wheelDailySpinsUsed >= WHEEL_FREE_DAILY_SPINS;

        // First spin of the day: FREE — no point requirement
        if (!hasUsedFreeSpinToday) {
          set((currentState) => syncActiveProfile(currentState, {
            ...profile,
            wheelDailySpinsUsed: profile.wheelDailySpinsUsed + 1,
          }));
          return true;
        }

        // Subsequent spins: cost 200 points each, max 5 paid per day
        if (profile.wheelPaidSpinsUsed >= WHEEL_MAX_PAID_SPINS) {
          // Reached daily paid spin limit
          return false;
        }

        if (profile.coinBalance < WHEEL_PAID_SPIN_COST) {
          // Not enough points for a paid spin
          return false;
        }

        set((currentState) => syncActiveProfile(currentState, {
          ...profile,
          coinBalance: profile.coinBalance - WHEEL_PAID_SPIN_COST,
          wheelDailySpinsUsed: profile.wheelDailySpinsUsed + 1,
          wheelPaidSpinsUsed: profile.wheelPaidSpinsUsed + 1,
        }));
        return true;
      },

      resetToday: () => {
        set((state) => syncActiveProfile(state, createDefaultProfile()));
      },
    }),
    {
      name: "lucky-vibes-store",
      version: 5,
      migrate: (persistedState) => {
        const state = persistedState as Partial<LuckStore> | undefined;
        if (!state) {
          const profile = createDefaultProfile();
          return applyProfile(GUEST_USER_KEY, profile, { [GUEST_USER_KEY]: profile });
        }

        if (state.profiles && state.activeUserKey) {
          const profiles = Object.fromEntries(
            Object.entries(state.profiles).map(([userKey, profile]) => [userKey, normalizeProfile(profile)])
          );
          const profile = profiles[state.activeUserKey] ?? createDefaultProfile();
          return {
            ...state,
            ...applyProfile(state.activeUserKey, profile, profiles),
          };
        }

        const legacyProfile = normalizeProfile({
          totalPlays: state.totalPlays ?? 0,
          winStreak: state.winStreak ?? 0,
          luckyScore: state.luckyScore ?? 50,
          coinBalance: state.coinBalance ?? STARTING_COIN_BALANCE,
          history: state.history ?? [],
          wheelPaidSpinsUsed: 0,
        });

        return applyProfile(GUEST_USER_KEY, legacyProfile, {
          [GUEST_USER_KEY]: legacyProfile,
        });
      },
    }
  )
);
