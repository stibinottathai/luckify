import {
  collection,
  addDoc,
  getDocs,
  runTransaction,
  doc,
  query,
  orderBy
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface TimeCapsule {
  id: string;
  userId: string;
  messageText: string;
  coinsLocked: number;
  multiplier: number;
  createdAt: string; // ISO string
  unlockDate: string; // ISO string
  isOpened: boolean;
}

export async function createTimeCapsuleInDb(
  uid: string,
  messageText: string,
  coinsLocked: number,
  durationType: "1week" | "1month" | "1year"
): Promise<string | null> {
  if (!db) {
    console.warn("[Firestore] DB is not initialized. Simulating offline capsule creation.");
    return `local-capsule-${Date.now()}`;
  }

  let durationMs = 0;
  let multiplier = 1.0;

  switch (durationType) {
    case "1week":
      durationMs = 7 * 24 * 60 * 60 * 1000;
      multiplier = 1.05;
      break;
    case "1month":
      durationMs = 30 * 24 * 60 * 60 * 1000;
      multiplier = 1.10;
      break;
    case "1year":
      durationMs = 365 * 24 * 60 * 60 * 1000;
      multiplier = 1.20;
      break;
  }

  const now = new Date();
  const createdAtStr = now.toISOString();
  const unlockDateStr = new Date(now.getTime() + durationMs).toISOString();

  try {
    const capsRef = collection(db, "users", uid, "timeCapsules");
    const docRef = await addDoc(capsRef, {
      userId: uid,
      messageText,
      coinsLocked,
      multiplier,
      createdAt: createdAtStr,
      unlockDate: unlockDateStr,
      isOpened: false
    });
    return docRef.id;
  } catch (err) {
    console.error("[Firestore] createTimeCapsuleInDb failed:", err);
    return null;
  }
}

export async function fetchTimeCapsulesFromDb(uid: string): Promise<TimeCapsule[]> {
  if (!db) return [];
  try {
    const q = query(
      collection(db, "users", uid, "timeCapsules"),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        userId: data.userId || uid,
        messageText: data.messageText || "",
        coinsLocked: data.coinsLocked ?? 0,
        multiplier: data.multiplier ?? 1.0,
        createdAt: data.createdAt || new Date().toISOString(),
        unlockDate: data.unlockDate || new Date().toISOString(),
        isOpened: !!data.isOpened
      };
    });
  } catch (err) {
    console.error("[Firestore] fetchTimeCapsulesFromDb failed:", err);
    return [];
  }
}

export async function claimTimeCapsuleInDb(
  uid: string,
  capsuleId: string
): Promise<{ success: boolean; newCoins: number; finalPayout: number }> {
  if (!db) return { success: false, newCoins: 0, finalPayout: 0 };

  const capsRef = doc(db, "users", uid, "timeCapsules", capsuleId);
  const userRef = doc(db, "users", uid);

  try {
    return await runTransaction(db, async (transaction) => {
      // 1. All reads first
      const capsSnap = await transaction.get(capsRef);
      if (!capsSnap.exists()) {
        throw new Error("Capsule does not exist");
      }
      const capsData = capsSnap.data();
      if (capsData.isOpened) {
        throw new Error("Capsule already opened");
      }

      const now = new Date();
      const unlockTime = new Date(capsData.unlockDate);
      if (now.getTime() < unlockTime.getTime()) {
        throw new Error("Capsule is still locked");
      }

      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists()) {
        throw new Error("User profile does not exist");
      }

      const userData = userSnap.data();
      const currentCoins = userData.coinBalance ?? 0;

      // 2. All writes next
      const finalPayout = Math.floor((capsData.coinsLocked ?? 0) * (capsData.multiplier ?? 1.0));
      const nextCoins = currentCoins + finalPayout;

      transaction.update(userRef, { coinBalance: nextCoins });
      transaction.update(capsRef, { isOpened: true });

      return {
        success: true,
        newCoins: nextCoins,
        finalPayout
      };
    });
  } catch (err) {
    console.error("[Firestore] claimTimeCapsuleInDb failed:", err);
    return { success: false, newCoins: 0, finalPayout: 0 };
  }
}
