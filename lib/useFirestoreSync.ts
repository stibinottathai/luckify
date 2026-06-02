"use client";

/**
 * useFirestoreSync
 *
 * Subscribes to Zustand luckStore changes and writes them to Firestore
 * with a short debounce so rapid state changes (e.g. during spin animation)
 * don't trigger multiple writes.
 *
 * Only runs for authenticated (non-guest) users.
 */

import { useEffect, useRef } from "react";
import { useLuckStore } from "@/store/luckStore";
import { saveFirestoreProfile } from "@/lib/firestoreProfile";

const DEBOUNCE_MS = 1500; // wait 1.5 s after last change before writing

export function useFirestoreSync(uid: string | null) {
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
    if (!uid || uid === "guest") return;

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
      });
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    uid,
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
