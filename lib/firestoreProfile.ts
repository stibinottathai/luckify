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
  where,
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
  lastVisitDate?: string;
  visitStreak?: number;
  visitStreakRecord?: number;
  zodiacSign?: string;
  lastAstroClaimDate?: string;
  lastWishDate?: string;
  lastTimeCapsuleDate?: string;

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

  // Daily Scratch Card Fields
  scratchAttemptsUsed?: number;
  scratchDate?: string;
  scratchPrizeWon?: number;
  localVersion?: number;
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
  lastVisitDate?: string;
  visitStreak?: number;
  visitStreakRecord?: number;
  zodiacSign?: string;
  lastAstroClaimDate?: string;
  lastWishDate?: string;
  lastTimeCapsuleDate?: string;

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

  // Daily Scratch Card Fields
  scratchAttemptsUsed?: number;
  scratchDate?: string;
  scratchPrizeWon?: number;
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
 * Fetch top-100 leaderboard ordered by coinBalance descending.
 */
export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const q = query(
    collection(db, "users"),
    orderBy("coinBalance", "desc"),
    limit(100)
  );

  try {
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
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
  } catch (err) {
    console.error("[Firestore] Leaderboard fetch error:", err);
    throw err;
  }
}



// ─── Tree Leaderboards query ─────────────────────────────────────────────────

/**
 * Fetch top-50 players ordered by chosen field for tree game leaderboards.
 * Supported sorts: 'global' (coinBalance), 'weekly' (weeklyCoins), 'streak' (shakeStreakRecord), 'collection' (collectedItems)
 */
export async function fetchTreeLeaderboard(
  sortBy: "global" | "weekly" | "streak" | "collection"
): Promise<LeaderboardEntry[]> {
  let orderField = "coinBalance";
  if (sortBy === "weekly") orderField = "weeklyCoins";
  else if (sortBy === "streak") orderField = "shakeStreakRecord";
  else if (sortBy === "collection") orderField = "collectedItems";

  const q = query(
    collection(db, "users"),
    orderBy(orderField, "desc"),
    limit(50) // Keep standard size
  );

  try {
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
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
  } catch (err) {
    console.error(`[Firestore] Tree Leaderboard fetch error for ${sortBy}:`, err);
    throw err;
  }
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

export async function fetchGoldenDiceLeaderboard(): Promise<LeaderboardEntry[]> {
  const q = query(
    collection(db, "users"),
    orderBy("totalGoldenDiceEvents", "desc"),
    limit(50)
  );

  try {
    const snap = await getDocs(q);
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

    return [...entries].sort((a, b) => {
      const eventsDiff = (b.totalGoldenDiceEvents || 0) - (a.totalGoldenDiceEvents || 0);
      if (eventsDiff !== 0) return eventsDiff;
      const legendaryDiff = (b.legendaryRewardsCount || 0) - (a.legendaryRewardsCount || 0);
      if (legendaryDiff !== 0) return legendaryDiff;
      return (b.highestRewardPoints || 0) - (a.highestRewardPoints || 0);
    });
  } catch (err) {
    console.error("[Firestore] Golden Dice Leaderboard error:", err);
    throw err;
  }
}

export async function fetchAnnouncements(
  limitCount: number = 3
): Promise<GoldenDiceAnnouncement[]> {
  const q = query(
    collection(db, "announcements"),
    orderBy("timestamp", "desc"),
    limit(limitCount)
  );

  try {
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
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
  } catch (err) {
    console.error("[Firestore] Announcements fetch error:", err);
    throw err;
  }
}

// ─── Dice Collection System Subscriptions ────────────────────────────────────

export interface UnlockedDiceDoc {
  id: string;
  name: string;
  rarity: string;
  unlockedAt: string;
}

/**
 * Fetch a user's unlocked dice collection subcollection.
 */
export async function fetchDiceCollection(
  uid: string
): Promise<UnlockedDiceDoc[]> {
  const q = query(
    collection(db, "users", uid, "diceCollection"),
    orderBy("unlockedAt", "desc")
  );

  try {
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name || "",
        rarity: data.rarity || "common",
        unlockedAt: data.unlockedAt || new Date().toISOString(),
      };
    });
  } catch (err) {
    console.error("[Firestore] Dice Collection fetch error:", err);
    throw err;
  }
}

/**
 * Fetch the top-50 Dice Collectors.
 * Ordered by unique collectionProgress desc.
 */
export async function fetchDiceCollectorsLeaderboard(): Promise<LeaderboardEntry[]> {
  const q = query(
    collection(db, "users"),
    orderBy("collectionProgress", "desc"),
    limit(50)
  );

  try {
    const snap = await getDocs(q);
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
    return [...entries].sort((a, b) => {
      const progressDiff = (b.collectionProgress || 1) - (a.collectionProgress || 1);
      if (progressDiff !== 0) return progressDiff;
      const mythicDiff = (b.mythicDiceCount || 0) - (a.mythicDiceCount || 0);
      if (mythicDiff !== 0) return mythicDiff;
      return (b.coinBalance || 0) - (a.coinBalance || 0);
    });
  } catch (err) {
    console.error("[Firestore] Dice Collectors Leaderboard error:", err);
    throw err;
  }
}

/**
 * Fetch top Coin Prediction Arena players.
 * Supported sorts: 'wins' (coinTotalWins desc), 'profit' (coinTotalProfit desc), 'winrate' (in-memory win rate with min 50 predictions)
 */
export async function fetchCoinLeaderboard(
  sortBy: "wins" | "profit" | "winrate"
): Promise<LeaderboardEntry[]> {
  let orderField = "coinTotalWins";
  if (sortBy === "profit") orderField = "coinTotalProfit";
  else if (sortBy === "winrate") orderField = "coinTotalPredictions";

  const q = query(
    collection(db, "users"),
    orderBy(orderField, "desc"),
    limit(100)
  );

  try {
    const snap = await getDocs(q);
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

    return sortedEntries.slice(0, 50);
  } catch (err) {
    console.error(`[Firestore] Coin Leaderboard fetch error for ${sortBy}:`, err);
    throw err;
  }
}


