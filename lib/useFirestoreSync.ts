"use client";

/**
 * useFirestoreSync
 *
 * Subscribes to Zustand luckStore changes and writes them to Firestore
 * with a short debounce so rapid state changes (e.g. during spin animation)
 * don't trigger multiple writes.
 *
 * Only runs for authenticated (non-guest) users.
 * Also persists displayName and photoURL for leaderboard display.
 */

import { useEffect, useRef } from "react";
import type { User } from "firebase/auth";
import { useLuckStore } from "@/store/luckStore";
import { saveFirestoreProfile } from "@/lib/firestoreProfile";

const DEBOUNCE_MS = 100; // wait 100ms after last change before writing

export function useFirestoreSync(user: User | null) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const coinBalance = useLuckStore((s) => s.coinBalance);
  const luckyScore = useLuckStore((s) => s.luckyScore);
  const totalPlays = useLuckStore((s) => s.totalPlays);
  const winStreak = useLuckStore((s) => s.winStreak);
  const history = useLuckStore((s) => s.history);
  const wheelSpinDate = useLuckStore((s) => s.wheelSpinDate);
  const wheelDailySpinsUsed = useLuckStore((s) => s.wheelDailySpinsUsed);
  const wheelPaidSpinsUsed = useLuckStore((s) => s.wheelPaidSpinsUsed);

  useEffect(() => {
    // Only sync for real (non-guest) users
    if (!user || user.uid === "guest") return;

    const uid = user.uid;

    // Clear any pending write
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      saveFirestoreProfile(uid, {
        coinBalance,
        luckyScore,
        totalPlays,
        winStreak,
        history,
        wheelSpinDate,
        wheelDailySpinsUsed,
        wheelPaidSpinsUsed,
        // Always keep identity fresh for leaderboard
        displayName: user.displayName ?? "Lucky Player",
        photoURL: user.photoURL ?? "",
      });
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    user,
    coinBalance,
    luckyScore,
    totalPlays,
    winStreak,
    history,
    wheelSpinDate,
    wheelDailySpinsUsed,
    wheelPaidSpinsUsed,
  ]);
}
