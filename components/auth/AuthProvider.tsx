"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useLuckStore } from "@/store/luckStore";
import {
  loadFirestoreProfile,
  subscribeFirestoreProfile,
} from "@/lib/firestoreProfile";
import { useFirestoreSync } from "@/lib/useFirestoreSync";
import { STARTING_COIN_BALANCE } from "@/lib/prizes";

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

// ─── Inner component that can safely call hooks ────────────────────────────────

function FirestoreSyncLayer({ uid }: { uid: string | null }) {
  useFirestoreSync(uid);
  return null;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const setActiveUser = useLuckStore((state) => state.setActiveUser);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
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
        // Hydrate the Zustand store with cloud data (cloud wins)
        useLuckStore.setState((state) => {
          const updatedProfile = {
            totalPlays: firestoreProfile.totalPlays ?? state.totalPlays,
            winStreak: firestoreProfile.winStreak ?? state.winStreak,
            luckyScore: firestoreProfile.luckyScore ?? state.luckyScore,
            coinBalance: firestoreProfile.coinBalance ?? state.coinBalance,
            history: firestoreProfile.history ?? state.history,
            wheelSpinDate: firestoreProfile.wheelSpinDate ?? state.wheelSpinDate,
            wheelDailySpinsUsed: firestoreProfile.wheelDailySpinsUsed ?? state.wheelDailySpinsUsed,
            wheelPaidSpinsUsed: firestoreProfile.wheelPaidSpinsUsed ?? state.wheelPaidSpinsUsed,
          };

          return {
            ...updatedProfile,
            profiles: {
              ...state.profiles,
              [uid]: updatedProfile,
            },
          };
        });
      } else {
        // First time this user logs in — give them starting balance
        useLuckStore.setState((state) => {
          const freshProfile = {
            totalPlays: 0,
            winStreak: 0,
            luckyScore: 50,
            coinBalance: STARTING_COIN_BALANCE,
            history: [] as import("@/store/luckStore").HistoryItem[],
            wheelSpinDate: new Date().toISOString().slice(0, 10),
            wheelDailySpinsUsed: 0,
            wheelPaidSpinsUsed: 0,
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
        const merged = {
          totalPlays: remoteProfile.totalPlays ?? state.totalPlays,
          winStreak: remoteProfile.winStreak ?? state.winStreak,
          luckyScore: remoteProfile.luckyScore ?? state.luckyScore,
          coinBalance: remoteProfile.coinBalance ?? state.coinBalance,
          history: remoteProfile.history ?? state.history,
          wheelSpinDate: remoteProfile.wheelSpinDate ?? state.wheelSpinDate,
          wheelDailySpinsUsed: remoteProfile.wheelDailySpinsUsed ?? state.wheelDailySpinsUsed,
          wheelPaidSpinsUsed: remoteProfile.wheelPaidSpinsUsed ?? state.wheelPaidSpinsUsed,
        };

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
    <AuthContext.Provider value={{ user, loading }}>
      {/* Mount the debounced sync layer for the active user */}
      <FirestoreSyncLayer uid={user?.uid ?? null} />
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
