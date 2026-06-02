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
