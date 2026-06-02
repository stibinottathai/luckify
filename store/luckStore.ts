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
  consumePendulumQuestion: () => { success: boolean; reason?: 'coins' | 'limit' };
  resetToday: () => void;
  claimScratchCard: (coinsWon: number, outcomeName: string, isWin: boolean, scoreImpact: number) => void;
}

export interface UserLuckProfile {
  totalPlays: number;
  winStreak: number;
  luckyScore: number;
  coinBalance: number;
  history: HistoryItem[];
  wheelSpinDate: string;
  wheelDailySpinsUsed: number;
  wheelPaidSpinsUsed: number;

  // Gamification & Shaking Tree fields
  xp?: number;
  level?: number;
  shakeStreak?: number;
  shakeStreakLastClaimed?: string;
  shakeStreakRecord?: number;
  weeklyCoins?: number;
  weeklyCoinsLastUpdated?: string;
  collectedItems?: number;
  mysteryBoxesCount?: number;
  badges?: string[];
  doubleRewardsUntil?: string;
  streakShieldsCount?: number;
  vipUntil?: string;
  dailyShakesToday?: number;
  extraShakesBalance?: number;
  shakeSpinDate?: string;
  collectibles?: Record<string, number>;

  // Golden Dice System Fields
  totalDiceRolls?: number;
  totalGoldenDiceEvents?: number;
  goldenDiceRate?: number;
  highestRewardWon?: string;
  highestRewardPoints?: number;
  legendaryRewardsCount?: number;

  // Dice Collection System Fields
  equippedDice?: string;
  diceFragments?: number;
  collectionProgress?: number;
  mythicDiceCount?: number;

  // Daily Dice Roll Limits
  diceRollDate?: string;
  diceRollsUsed?: number;

  // Coin Prediction Arena fields
  coinDailyAttempts?: number;
  coinDailyAttemptsDate?: string;
  coinTotalWins?: number;
  coinTotalLosses?: number;
  coinTotalPredictions?: number;
  coinWinStreak?: number;
  coinBestStreak?: number;
  coinLargestWin?: number;
  coinTotalProfit?: number;

  // Daily Scratch Card Fields
  scratchDate?: string;
  scratchUsed?: boolean;
  scratchPrizeWon?: number;

  // Pendulum Divination Fields
  pendulumDailyQuestionsDate?: string;
  pendulumDailyQuestionsUsed?: number;

  // Local Sync Coordinates
  localVersion?: number;
}

const GUEST_USER_KEY = "guest";

const getTodayKey = () => new Date().toISOString().slice(0, 10);

export const createDefaultProfile = (): UserLuckProfile => ({
  totalPlays: 0,
  winStreak: 0,
  luckyScore: 50,
  coinBalance: STARTING_COIN_BALANCE,
  history: [],
  wheelSpinDate: getTodayKey(),
  wheelDailySpinsUsed: 0,
  wheelPaidSpinsUsed: 0,

  // Default values
  xp: 0,
  level: 1,
  shakeStreak: 0,
  shakeStreakLastClaimed: "",
  shakeStreakRecord: 0,
  weeklyCoins: 0,
  weeklyCoinsLastUpdated: new Date().toISOString(),
  collectedItems: 0,
  mysteryBoxesCount: 0,
  badges: [],
  doubleRewardsUntil: "",
  streakShieldsCount: 0,
  vipUntil: "",
  dailyShakesToday: 0,
  extraShakesBalance: 0,
  shakeSpinDate: "",
  collectibles: {},

  // Golden Dice system defaults
  totalDiceRolls: 0,
  totalGoldenDiceEvents: 0,
  goldenDiceRate: 0,
  highestRewardWon: "None",
  highestRewardPoints: 0,
  legendaryRewardsCount: 0,

  // Dice Collection system defaults
  equippedDice: "wooden_dice",
  diceFragments: 0,
  collectionProgress: 1,
  mythicDiceCount: 0,

  // Daily Dice limits defaults
  diceRollDate: getTodayKey(),
  diceRollsUsed: 0,

  // Coin Prediction Arena defaults
  coinDailyAttempts: 0,
  coinDailyAttemptsDate: getTodayKey(),
  coinTotalWins: 0,
  coinTotalLosses: 0,
  coinTotalPredictions: 0,
  coinWinStreak: 0,
  coinBestStreak: 0,
  coinLargestWin: 0,
  coinTotalProfit: 0,

  // Daily Scratch defaults
  scratchDate: "",
  scratchUsed: false,
  scratchPrizeWon: 0,

  // Pendulum defaults
  pendulumDailyQuestionsDate: getTodayKey(),
  pendulumDailyQuestionsUsed: 0,

  // Local Sync Coordinates defaults
  localVersion: 0,
});

export const createGuestProfile = (): UserLuckProfile => ({
  ...createDefaultProfile(),
  coinBalance: 0,
});


export const normalizeProfile = (profile?: Partial<UserLuckProfile>): UserLuckProfile => {
  const defaults = createDefaultProfile();
  const nextProfile = {
    ...defaults,
    ...profile,
    history: profile?.history ?? defaults.history,
  };

  // Self-healing rule: If they are a new user (total plays is 0),
  // they must have the starting coin balance of 500!
  if (nextProfile.totalPlays === 0) {
    nextProfile.coinBalance = STARTING_COIN_BALANCE;
  }

  // Handle Daily Spin date resets
  if (nextProfile.wheelSpinDate !== getTodayKey()) {
    nextProfile.wheelSpinDate = getTodayKey();
    nextProfile.wheelDailySpinsUsed = 0;
    nextProfile.wheelPaidSpinsUsed = 0;
  }

  // Handle Daily Dice Roll date resets
  if (nextProfile.diceRollDate !== getTodayKey()) {
    nextProfile.diceRollDate = getTodayKey();
    nextProfile.diceRollsUsed = 0;
  }

  // Handle Daily Coin Prediction date resets
  if (nextProfile.coinDailyAttemptsDate !== getTodayKey()) {
    nextProfile.coinDailyAttemptsDate = getTodayKey();
    nextProfile.coinDailyAttempts = 0;
  }

  // Handle Daily Scratch resets
  if (nextProfile.scratchDate !== getTodayKey()) {
    nextProfile.scratchDate = getTodayKey();
    nextProfile.scratchUsed = false;
    nextProfile.scratchPrizeWon = 0;
  }

  // Handle Daily Pendulum resets
  if (nextProfile.pendulumDailyQuestionsDate !== getTodayKey()) {
    nextProfile.pendulumDailyQuestionsDate = getTodayKey();
    nextProfile.pendulumDailyQuestionsUsed = 0;
  }

  return nextProfile;
};

const applyProfile = (userKey: string, profile: UserLuckProfile, profiles: Record<string, UserLuckProfile>) => ({
  activeUserKey: userKey,
  profiles,
  ...profile,
});

const syncActiveProfile = (state: LuckStore, profile: UserLuckProfile) => {
  const nextProfile = {
    ...profile,
    localVersion: (profile.localVersion ?? 0) + 1,
  };
  return {
    ...nextProfile,
    profiles: {
      ...state.profiles,
      [state.activeUserKey]: nextProfile,
    },
  };
};

export const useLuckStore = create<LuckStore>()(
  persist(
    (set, get) => ({
      activeUserKey: GUEST_USER_KEY,
      profiles: {
        [GUEST_USER_KEY]: createGuestProfile(),
      },
      ...createGuestProfile(),

      setActiveUser: (userKey) => {
        const nextUserKey = userKey || GUEST_USER_KEY;
        set((state) => {
          const rawProfile = state.profiles[nextUserKey];
          const isGuestKey = nextUserKey === GUEST_USER_KEY;

          let profile = normalizeProfile(rawProfile);
          if (isGuestKey) {
            profile.coinBalance = 0;
          }

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

      consumePendulumQuestion: () => {
        const state = get();
        const profile = normalizeProfile(state.profiles[state.activeUserKey] || state);

        if (profile.pendulumDailyQuestionsUsed! >= 5) {
          return { success: false, reason: 'limit' };
        }

        if (profile.coinBalance < 100) {
          return { success: false, reason: 'coins' };
        }

        const newProfile = {
          ...profile,
          coinBalance: profile.coinBalance - 100,
          pendulumDailyQuestionsUsed: profile.pendulumDailyQuestionsUsed! + 1,
        };

        set((currentState) => syncActiveProfile(currentState, newProfile));
        return { success: true };
      },

      resetToday: () => {
        set((state) => syncActiveProfile(state, createDefaultProfile()));
      },

      claimScratchCard: (coinsWon, outcomeName, isWin, scoreImpact) => {
        set((state) => {
          const profile = normalizeProfile(state.profiles[state.activeUserKey] || state);
          const newTotalPlays = profile.totalPlays + 1;
          const newWinStreak = isWin ? profile.winStreak + 1 : 0;
          const newLuckyScore = Math.max(0, Math.min(100, profile.luckyScore + scoreImpact));
          
          const newHistoryItem: HistoryItem = {
            game: "Scratch Card",
            result: coinsWon > 0 ? `🎉 Won ${coinsWon} coins` : `🌧️ Try Again`,
            timestamp: new Date().toISOString(),
            isWin,
            scoreImpact,
          };
          const newHistory = [newHistoryItem, ...profile.history].slice(0, 20);

          const updated = {
            ...profile,
            totalPlays: newTotalPlays,
            winStreak: newWinStreak,
            luckyScore: newLuckyScore,
            coinBalance: profile.coinBalance + coinsWon,
            history: newHistory,
            scratchUsed: true,
            scratchDate: getTodayKey(),
            scratchPrizeWon: coinsWon,
          };

          return syncActiveProfile(state, updated);
        });
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
