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

  const activeUserKey = useLuckStore((s) => s.activeUserKey);
  const profile = useLuckStore((s) => s.profiles[activeUserKey]);

  useEffect(() => {
    // Only sync for real (non-guest) users
    if (!user || user.uid === "guest" || !profile) return;

    const uid = user.uid;

    // Clear any pending write
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      saveFirestoreProfile(uid, {
        ...profile,
        // Always keep identity fresh for leaderboard
        displayName: user.displayName ?? (profile as any).displayName ?? "Lucky Player",
        photoURL: user.photoURL ?? (profile as any).photoURL ?? "",
      });
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [user, profile]);
}
