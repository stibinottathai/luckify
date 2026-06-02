/**
 * Firestore profile helpers.
 * All user state (points, spin counts, history, lucky score) is persisted
 * under  users/{uid}  in Firestore so it survives across devices and browsers.
 *
 * Guest users are stored only in localStorage (Zustand persist) — no Firestore.
 */

import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { HistoryItem } from "@/store/luckStore";

// ─── Shape stored in Firestore ────────────────────────────────────────────────

export interface FirestoreUserProfile {
  coinBalance: number;
  luckyScore: number;
  totalPlays: number;
  winStreak: number;
  history: HistoryItem[];
  wheelSpinDate: string;
  wheelDailySpinsUsed: number;
  wheelPaidSpinsUsed: number;
  // Identity — saved for leaderboard display
  displayName?: string;
  photoURL?: string;
  updatedAt?: unknown; // serverTimestamp()
  
  // Gamification & Progression Fields
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

  // Coin Prediction Arena Fields
  coinDailyAttempts?: number;
  coinDailyAttemptsDate?: string;
  coinTotalWins?: number;
  coinTotalLosses?: number;
  coinTotalPredictions?: number;
  coinWinStreak?: number;
  coinBestStreak?: number;
  coinLargestWin?: number;
  coinTotalProfit?: number;
}

// ─── Leaderboard entry ────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  photoURL: string | null;
  coinBalance: number;
  winStreak: number;
  totalPlays: number;
  luckyScore: number;
  level?: number;
  badges?: string[];
  weeklyCoins?: number;
  shakeStreakRecord?: number;
  collectedItems?: number;

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

  // Coin Prediction Arena Fields
  coinDailyAttempts?: number;
  coinDailyAttemptsDate?: string;
  coinTotalWins?: number;
  coinTotalLosses?: number;
  coinTotalPredictions?: number;
  coinWinStreak?: number;
  coinBestStreak?: number;
  coinLargestWin?: number;
  coinTotalProfit?: number;
}

// ─── Reference helper ─────────────────────────────────────────────────────────

const userRef = (uid: string) => doc(db, "users", uid);

// ─── Load profile once ────────────────────────────────────────────────────────

/**
 * Fetch the user's profile from Firestore once.
 * Returns null if no document exists yet (new user).
 */
export async function loadFirestoreProfile(
  uid: string
): Promise<FirestoreUserProfile | null> {
  try {
    const snap = await getDoc(userRef(uid));
    if (!snap.exists()) return null;
    const data = snap.data() as FirestoreUserProfile;
    return data;
  } catch (err) {
    console.error("[Firestore] Failed to load profile:", err);
    return null;
  }
}

// ─── Save profile ─────────────────────────────────────────────────────────────

/**
 * Write (merge) the user profile to Firestore.
 * Safe to call on every state change — Firestore deduplicates writes at SDK level.
 */
export async function saveFirestoreProfile(
  uid: string,
  profile: Omit<FirestoreUserProfile, "updatedAt">
): Promise<void> {
  try {
    await setDoc(
      userRef(uid),
      { ...profile, updatedAt: serverTimestamp() },
      { merge: true }
    );
  } catch (err) {
    console.error("[Firestore] Failed to save profile:", err);
  }
}

// ─── Real-time listener ───────────────────────────────────────────────────────

/**
 * Subscribe to real-time updates for this user's profile.
 * The callback is called whenever data changes in Firestore
 * (e.g. from another device / tab).
 * Returns the unsubscribe function.
 */
export function subscribeFirestoreProfile(
  uid: string,
  onChange: (profile: FirestoreUserProfile) => void
): Unsubscribe {
  return onSnapshot(
    userRef(uid),
    (snap) => {
      if (!snap.exists()) return;
      onChange(snap.data() as FirestoreUserProfile);
    },
    (err) => {
      console.error("[Firestore] Snapshot error:", err);
    }
  );
}

// ─── Leaderboard query ────────────────────────────────────────────────────────

/**
 * Subscribe to live top-100 leaderboard ordered by coinBalance descending.
 * Returns the unsubscribe function.
 */
export function subscribeLeaderboard(
  onChange: (entries: LeaderboardEntry[]) => void,
  onError?: () => void
): Unsubscribe {
  const q = query(
    collection(db, "users"),
    orderBy("coinBalance", "desc"),
    limit(100)
  );

  return onSnapshot(
    q,
    (snap) => {
      const entries: LeaderboardEntry[] = snap.docs.map((d) => {
        const data = d.data() as FirestoreUserProfile;
        return {
          uid: d.id,
          displayName: data.displayName || "Lucky Player",
          photoURL: data.photoURL ?? null,
          coinBalance: data.coinBalance ?? 0,
          winStreak: data.winStreak ?? 0,
          totalPlays: data.totalPlays ?? 0,
          luckyScore: data.luckyScore ?? 50,
          level: data.level ?? 1,
          badges: data.badges ?? [],
        };
      });
      onChange(entries);
    },
    (err) => {
      console.error("[Firestore] Leaderboard snapshot error:", err);
      onError?.();
    }
  );
}

// ─── Tree Leaderboards query ─────────────────────────────────────────────────

/**
 * Subscribe to top-100 players ordered by chosen field for tree game leaderboards.
 * Supported sorts: 'global' (coinBalance), 'weekly' (weeklyCoins), 'streak' (shakeStreakRecord), 'collection' (collectedItems)
 */
export function subscribeTreeLeaderboard(
  sortBy: "global" | "weekly" | "streak" | "collection",
  onChange: (entries: LeaderboardEntry[]) => void,
  onError?: () => void
): Unsubscribe {
  let orderField = "coinBalance";
  if (sortBy === "weekly") orderField = "weeklyCoins";
  else if (sortBy === "streak") orderField = "shakeStreakRecord";
  else if (sortBy === "collection") orderField = "collectedItems";

  const q = query(
    collection(db, "users"),
    orderBy(orderField, "desc"),
    limit(50) // Keep standard size
  );

  return onSnapshot(
    q,
    (snap) => {
      const entries: LeaderboardEntry[] = snap.docs.map((d) => {
        const data = d.data() as FirestoreUserProfile;
        return {
          uid: d.id,
          displayName: data.displayName || "Lucky Player",
          photoURL: data.photoURL ?? null,
          coinBalance: data.coinBalance ?? 0,
          winStreak: data.winStreak ?? 0,
          totalPlays: data.totalPlays ?? 0,
          luckyScore: data.luckyScore ?? 50,
          level: data.level ?? 1,
          badges: data.badges ?? [],
          weeklyCoins: data.weeklyCoins ?? 0,
          shakeStreakRecord: data.shakeStreakRecord ?? 0,
          collectedItems: data.collectedItems ?? 0,
        };
      });
      onChange(entries);
    },
    (err) => {
      console.error(`[Firestore] Tree Leaderboard snapshot error for ${sortBy}:`, err);
      onError?.();
    }
  );
}

// ─── Golden Dice Announcements & Leaderboard ─────────────────────────────────

export interface GoldenDiceAnnouncement {
  id: string;
  userUid: string;
  displayName: string;
  rewardName: string;
  rewardEmoji: string;
  rewardRarity: string;
  text: string;
  timestamp: string;
}

export function subscribeGoldenDiceLeaderboard(
  onChange: (entries: LeaderboardEntry[]) => void,
  onError?: () => void
): Unsubscribe {
  const q = query(
    collection(db, "users"),
    orderBy("totalGoldenDiceEvents", "desc"),
    limit(50)
  );

  return onSnapshot(
    q,
    (snap) => {
      const entries: LeaderboardEntry[] = snap.docs.map((d) => {
        const data = d.data() as FirestoreUserProfile;
        return {
          uid: d.id,
          displayName: data.displayName || "Lucky Player",
          photoURL: data.photoURL ?? null,
          coinBalance: data.coinBalance ?? 0,
          winStreak: data.winStreak ?? 0,
          totalPlays: data.totalPlays ?? 0,
          luckyScore: data.luckyScore ?? 50,
          level: data.level ?? 1,
          badges: data.badges ?? [],
          // Golden Dice stats
          totalDiceRolls: data.totalDiceRolls ?? 0,
          totalGoldenDiceEvents: data.totalGoldenDiceEvents ?? 0,
          goldenDiceRate: data.goldenDiceRate ?? 0,
          highestRewardWon: data.highestRewardWon ?? "None",
          highestRewardPoints: data.highestRewardPoints ?? 0,
          legendaryRewardsCount: data.legendaryRewardsCount ?? 0,
        };
      });

      const sortedEntries = [...entries].sort((a, b) => {
        const eventsDiff = (b.totalGoldenDiceEvents || 0) - (a.totalGoldenDiceEvents || 0);
        if (eventsDiff !== 0) return eventsDiff;
        const legendaryDiff = (b.legendaryRewardsCount || 0) - (a.legendaryRewardsCount || 0);
        if (legendaryDiff !== 0) return legendaryDiff;
        return (b.highestRewardPoints || 0) - (a.highestRewardPoints || 0);
      });

      onChange(sortedEntries);
    },
    (err) => {
      console.error("[Firestore] Golden Dice Leaderboard error:", err);
      onError?.();
    }
  );
}

export function subscribeAnnouncements(
  onChange: (announcements: GoldenDiceAnnouncement[]) => void,
  limitCount: number = 3
): Unsubscribe {
  const q = query(
    collection(db, "announcements"),
    orderBy("timestamp", "desc"),
    limit(limitCount)
  );

  return onSnapshot(
    q,
    (snap) => {
      const announcements: GoldenDiceAnnouncement[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          userUid: data.userUid || "",
          displayName: data.displayName || "Lucky Player",
          rewardName: data.rewardName || "",
          rewardEmoji: data.rewardEmoji || "🎁",
          rewardRarity: data.rewardRarity || "common",
          text: data.text || "",
          timestamp: data.timestamp || new Date().toISOString(),
        };
      });
      onChange(announcements);
    },
    (err) => {
      console.error("[Firestore] Announcements snapshot error:", err);
    }
  );
}

// ─── Dice Collection System Subscriptions ────────────────────────────────────

export interface UnlockedDiceDoc {
  id: string;
  name: string;
  rarity: string;
  unlockedAt: string;
}

/**
 * Subscribe to a user's unlocked dice collection subcollection.
 */
export function subscribeDiceCollection(
  uid: string,
  onChange: (diceList: UnlockedDiceDoc[]) => void,
  onError?: () => void
): Unsubscribe {
  const q = query(
    collection(db, "users", uid, "diceCollection"),
    orderBy("unlockedAt", "desc")
  );

  return onSnapshot(
    q,
    (snap) => {
      const diceList: UnlockedDiceDoc[] = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name || "",
          rarity: data.rarity || "common",
          unlockedAt: data.unlockedAt || new Date().toISOString(),
        };
      });
      onChange(diceList);
    },
    (err) => {
      console.error("[Firestore] Dice Collection subscription error:", err);
      onError?.();
    }
  );
}

/**
 * Subscribe to the top-50 Dice Collectors.
 * Ordered by unique collectionProgress desc.
 */
export function subscribeDiceCollectorsLeaderboard(
  onChange: (entries: LeaderboardEntry[]) => void,
  onError?: () => void
): Unsubscribe {
  const q = query(
    collection(db, "users"),
    orderBy("collectionProgress", "desc"),
    limit(50)
  );

  return onSnapshot(
    q,
    (snap) => {
      const entries: LeaderboardEntry[] = snap.docs.map((d) => {
        const data = d.data() as FirestoreUserProfile;
        return {
          uid: d.id,
          displayName: data.displayName || "Lucky Player",
          photoURL: data.photoURL ?? null,
          coinBalance: data.coinBalance ?? 0,
          winStreak: data.winStreak ?? 0,
          totalPlays: data.totalPlays ?? 0,
          luckyScore: data.luckyScore ?? 50,
          level: data.level ?? 1,
          badges: data.badges ?? [],
          equippedDice: data.equippedDice ?? "wooden_dice",
          diceFragments: data.diceFragments ?? 0,
          collectionProgress: data.collectionProgress ?? 1,
          mythicDiceCount: data.mythicDiceCount ?? 0,
        };
      });

      // Perform in-memory sorting:
      // 1. Total unique dice (collectionProgress)
      // 2. Mythic dice owned (mythicDiceCount)
      // 3. Coin balance descending
      const sortedEntries = [...entries].sort((a, b) => {
        const progressDiff = (b.collectionProgress || 1) - (a.collectionProgress || 1);
        if (progressDiff !== 0) return progressDiff;
        const mythicDiff = (b.mythicDiceCount || 0) - (a.mythicDiceCount || 0);
        if (mythicDiff !== 0) return mythicDiff;
        return (b.coinBalance || 0) - (a.coinBalance || 0);
      });

      onChange(sortedEntries);
    },
    (err) => {
      console.error("[Firestore] Dice Collectors Leaderboard error:", err);
      onError?.();
    }
  );
}

/**
 * Subscribe to top Coin Prediction Arena players.
 * Supported sorts: 'wins' (coinTotalWins desc), 'profit' (coinTotalProfit desc), 'winrate' (in-memory win rate with min 50 predictions)
 */
export function subscribeCoinLeaderboard(
  sortBy: "wins" | "profit" | "winrate",
  onChange: (entries: LeaderboardEntry[]) => void,
  onError?: () => void
): Unsubscribe {
  let orderField = "coinTotalWins";
  if (sortBy === "profit") orderField = "coinTotalProfit";
  else if (sortBy === "winrate") orderField = "coinTotalPredictions";

  const q = query(
    collection(db, "users"),
    orderBy(orderField, "desc"),
    limit(100)
  );

  return onSnapshot(
    q,
    (snap) => {
      const entries: LeaderboardEntry[] = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          uid: d.id,
          displayName: data.displayName || "Lucky Player",
          photoURL: data.photoURL ?? null,
          coinBalance: data.coinBalance ?? 0,
          winStreak: data.winStreak ?? 0,
          totalPlays: data.totalPlays ?? 0,
          luckyScore: data.luckyScore ?? 50,
          level: data.level ?? 1,
          badges: data.badges ?? [],
          // Coin Stats
          coinDailyAttempts: data.coinDailyAttempts ?? 0,
          coinDailyAttemptsDate: data.coinDailyAttemptsDate ?? "",
          coinTotalWins: data.coinTotalWins ?? 0,
          coinTotalLosses: data.coinTotalLosses ?? 0,
          coinTotalPredictions: data.coinTotalPredictions ?? 0,
          coinWinStreak: data.coinWinStreak ?? 0,
          coinBestStreak: data.coinBestStreak ?? 0,
          coinLargestWin: data.coinLargestWin ?? 0,
          coinTotalProfit: data.coinTotalProfit ?? 0,
        };
      });

      let sortedEntries = [...entries];
      if (sortBy === "winrate") {
        sortedEntries = sortedEntries
          .filter((e) => (e.coinTotalPredictions || 0) >= 50)
          .sort((a, b) => {
            const wrA = ((a.coinTotalWins || 0) / (a.coinTotalPredictions || 1)) * 100;
            const wrB = ((b.coinTotalWins || 0) / (b.coinTotalPredictions || 1)) * 100;
            if (wrB !== wrA) return wrB - wrA;
            return (b.coinTotalWins || 0) - (a.coinTotalWins || 0); // Tie breaker: absolute wins
          });
      } else if (sortBy === "wins") {
        sortedEntries = sortedEntries.sort((a, b) => (b.coinTotalWins || 0) - (a.coinTotalWins || 0));
      } else if (sortBy === "profit") {
        sortedEntries = sortedEntries.sort((a, b) => (b.coinTotalProfit || 0) - (a.coinTotalProfit || 0));
      }

      onChange(sortedEntries.slice(0, 50));
    },
    (err) => {
      console.error(`[Firestore] Coin Leaderboard snapshot error for ${sortBy}:`, err);
      onError?.();
    }
  );
}


