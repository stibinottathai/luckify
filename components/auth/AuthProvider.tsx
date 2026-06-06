"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useLuckStore, normalizeProfile } from "@/store/luckStore";
import {
  loadFirestoreProfile,
  saveFirestoreProfile,
  subscribeFirestoreProfile,
} from "@/lib/firestoreProfile";
import { useFirestoreSync } from "@/lib/useFirestoreSync";
import { STARTING_COIN_BALANCE } from "@/lib/prizes";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  /** True only after Firestore profile has been fully loaded and hydrated into the store. */
  profileLoaded: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  profileLoaded: false,
});

// ─── Inner component that can safely call hooks ─────────────────────────────────────────────────────

function FirestoreSyncLayer({ user }: { user: User | null }) {
  useFirestoreSync(user);
  return null;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Separate from `loading`: only true after Firestore data has been
  // fetched and merged into the Zustand store for the current user.
  const [profileLoaded, setProfileLoaded] = useState(false);

  const setActiveUser = useLuckStore((state) => state.setActiveUser);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setProfileLoaded(false);
      setUser(firebaseUser);

      if (!firebaseUser) {
        // Logged out → switch to guest profile
        setActiveUser("guest");
        setLoading(false);
        return;
      }

      const uid = firebaseUser.uid;

      // Switch local store to this user's profile slot first
      setActiveUser(uid);

      // Attempt to load the user's data from Firestore
      const firestoreProfile = await loadFirestoreProfile(uid);

      if (firestoreProfile) {
        const updatedProfile = normalizeProfile(firestoreProfile);

        // Hydrate the Zustand store with cloud data (cloud wins)
        useLuckStore.setState((state) => {
          const localVer = state.profiles[uid]?.localVersion ?? 0;
          const mergedProfile = {
            ...updatedProfile,
            localVersion: localVer,
          };
          return {
            ...mergedProfile,
            profiles: {
              ...state.profiles,
              [uid]: mergedProfile,
            },
          };
        });

        // Always refresh display identity (fire-and-forget — don't block sign-in)
        saveFirestoreProfile(uid, {
          ...updatedProfile,
          displayName: firebaseUser.displayName ?? firestoreProfile.displayName ?? "Lucky Player",
          photoURL: firebaseUser.photoURL ?? firestoreProfile.photoURL ?? "",
        }).catch(() => {/* silent — identity refresh is best-effort */});
      } else {
        // First time this user logs in — give them starting balance
        useLuckStore.setState((state) => {
          const localVer = state.profiles[uid]?.localVersion ?? 0;
          const freshProfile = {
            totalPlays: 0,
            winStreak: 0,
            luckyScore: 50,
            coinBalance: STARTING_COIN_BALANCE,
            history: [] as import("@/store/luckStore").HistoryItem[],
            wheelSpinDate: new Date().toISOString().slice(0, 10),
            wheelDailySpinsUsed: 0,
            wheelPaidSpinsUsed: 0,
            localVersion: localVer,
          };
          return {
            ...freshProfile,
            profiles: {
              ...state.profiles,
              [uid]: freshProfile,
            },
          };
        });
      }

      // Mark profile as fully loaded — store now contains real Firestore data.
      // HomeClient waits for this before running the daily visit claim.
      setProfileLoaded(true);
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, [setActiveUser]);

  // Real-time listener: pull Firestore changes into local store
  // (handles multi-device / multi-tab scenarios)
  useEffect(() => {
    if (!user) return;

    const uid = user.uid;
    let isFirstSnapshot = true; // skip the first echo of our own write

    const unsubscribe = subscribeFirestoreProfile(uid, (remoteProfile) => {
      // Skip the very first snapshot — that's the initial load we already handled
      if (isFirstSnapshot) {
        isFirstSnapshot = false;
        return;
      }

      useLuckStore.setState((state) => {
        const localVersion = state.profiles[uid]?.localVersion ?? 0;
        const remoteVersion = remoteProfile.localVersion ?? 0;

        // If the local state is newer (has unsynced local mutations), do not overwrite it with stale remote data
        if (localVersion > remoteVersion) {
          return state;
        }

        const merged = normalizeProfile(remoteProfile);
        // Preserve client-side localVersion so it does not trigger a redundant write
        merged.localVersion = localVersion;

        return {
          ...merged,
          profiles: {
            ...state.profiles,
            [uid]: merged,
          },
        };
      });
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, profileLoaded }}>
      {/* Mount the debounced sync layer for the active user */}
      <FirestoreSyncLayer user={user} />
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
