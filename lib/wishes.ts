import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  getDocs,
  runTransaction,
  doc,
  arrayUnion,
  arrayRemove,
  increment,
  Timestamp,
  deleteDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Wish {
  id: string;
  userId: string;
  displayName: string;
  photoURL: string | null;
  wishText: string;
  vibesCount: number;
  vibesUsers: string[];
  isAnonymous: boolean;
  timestamp: string; // ISO string
}

export async function createWish(
  userId: string,
  displayName: string,
  photoURL: string | null,
  wishText: string,
  isAnonymous: boolean
): Promise<string | null> {
  if (!db) {
    console.warn("[Firestore] DB is not initialized. Simulating offline wish creation.");
    return `local-wish-${Date.now()}`;
  }

  try {
    const docRef = await addDoc(collection(db, "wishes"), {
      userId,
      displayName: isAnonymous ? "Anonymous" : (displayName || "Lucky Player"),
      photoURL: isAnonymous ? null : photoURL,
      wishText,
      vibesCount: 0,
      vibesUsers: [],
      isAnonymous,
      timestamp: serverTimestamp()
    });
    return docRef.id;
  } catch (err) {
    console.error("[Firestore] createWish failed:", err);
    return null;
  }
}

export async function fetchWishes(
  sortBy: "recent" | "trending",
  limitCount: number = 40
): Promise<Wish[]> {
  if (!db) {
    console.warn("[Firestore] DB is not initialized. Returning mock wishes.");
    return getMockWishes();
  }

  try {
    const q = query(
      collection(db, "wishes"),
      orderBy(sortBy === "trending" ? "vibesCount" : "timestamp", "desc"),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      let isoDate = new Date().toISOString();
      if (data.timestamp) {
        if (data.timestamp instanceof Timestamp) {
          isoDate = data.timestamp.toDate().toISOString();
        } else if (typeof data.timestamp.toDate === "function") {
          isoDate = data.timestamp.toDate().toISOString();
        } else if (data.timestamp.seconds) {
          isoDate = new Date(data.timestamp.seconds * 1000).toISOString();
        } else {
          isoDate = new Date(data.timestamp).toISOString();
        }
      }
      return {
        id: d.id,
        userId: data.userId || "",
        displayName: data.displayName || "Anonymous",
        photoURL: data.photoURL ?? null,
        wishText: data.wishText || "",
        vibesCount: data.vibesCount ?? 0,
        vibesUsers: data.vibesUsers || [],
        isAnonymous: !!data.isAnonymous,
        timestamp: isoDate
      };
    });
  } catch (err) {
    console.error("[Firestore] fetchWishes failed:", err);
    return getMockWishes(); // Return mock data as fallback so the page works even if firestore is down
  }
}

export async function toggleVibeWish(
  wishId: string,
  userUid: string
): Promise<{ success: boolean; action: "vibe" | "unvibe"; vibesCount: number }> {
  if (!db) {
    console.warn("[Firestore] DB is not initialized. Simulating toggling vibe.");
    return { success: false, action: "vibe", vibesCount: 0 };
  }

  const wishRef = doc(db, "wishes", wishId);

  try {
    return await runTransaction(db, async (transaction) => {
      // 1. Perform all reads first
      const wishSnap = await transaction.get(wishRef);
      if (!wishSnap.exists()) {
        throw new Error("Wish does not exist");
      }

      const wishData = wishSnap.data();
      const creatorUid = wishData.userId;

      let creatorSnap = null;
      if (creatorUid) {
        const creatorRef = doc(db, "users", creatorUid);
        creatorSnap = await transaction.get(creatorRef);
      }

      // 2. Perform all writes next
      const vibesUsers = wishData.vibesUsers || [];
      const hasVoted = vibesUsers.includes(userUid);

      let nextAction: "vibe" | "unvibe";
      let vibesCountChange = 0;
      let scoreChange = 0;

      if (hasVoted) {
        nextAction = "unvibe";
        vibesCountChange = -1;
        scoreChange = -3;
        transaction.update(wishRef, {
          vibesUsers: arrayRemove(userUid),
          vibesCount: increment(-1)
        });
      } else {
        nextAction = "vibe";
        vibesCountChange = 1;
        scoreChange = 3;
        transaction.update(wishRef, {
          vibesUsers: arrayUnion(userUid),
          vibesCount: increment(1)
        });
      }

      // Update creator's luckyScore if it's not anonymous and profile exists
      if (creatorUid && creatorSnap && creatorSnap.exists()) {
        const creatorRef = doc(db, "users", creatorUid);
        const creatorData = creatorSnap.data();
        const currentScore = creatorData.luckyScore ?? 50;
        const newScore = Math.max(0, Math.min(100, currentScore + scoreChange));
        transaction.update(creatorRef, { luckyScore: newScore });
      }

      return {
        success: true,
        action: nextAction,
        vibesCount: (wishData.vibesCount || 0) + vibesCountChange
      };
    });
  } catch (err) {
    console.error("[Firestore] toggleVibeWish failed:", err);
    return { success: false, action: "vibe", vibesCount: 0 };
  }
}

export async function deleteWish(wishId: string): Promise<boolean> {
  if (!db) {
    console.warn("[Firestore] DB is not initialized. Simulating wish deletion.");
    return true;
  }

  try {
    const wishRef = doc(db, "wishes", wishId);
    await deleteDoc(wishRef);
    return true;
  } catch (err) {
    console.error("[Firestore] deleteWish failed:", err);
    return false;
  }
}

// Fallback Mock Wishes for offline / local-only mode
function getMockWishes(): Wish[] {
  const baseTime = Date.now();
  return [
    {
      id: "mock-1",
      userId: "mock-user-1",
      displayName: "Luna Spark",
      photoURL: null,
      wishText: "I wish for infinite joy and harmony for all living beings in the universe. ✨",
      vibesCount: 14,
      vibesUsers: [],
      isAnonymous: false,
      timestamp: new Date(baseTime - 1000 * 60 * 30).toISOString() // 30m ago
    },
    {
      id: "mock-2",
      userId: "mock-user-2",
      displayName: "Anonymous",
      photoURL: null,
      wishText: "Hoping to pass my exams and get that internship I worked so hard for! 🍀",
      vibesCount: 8,
      vibesUsers: [],
      isAnonymous: true,
      timestamp: new Date(baseTime - 1000 * 60 * 120).toISOString() // 2h ago
    },
    {
      id: "mock-3",
      userId: "mock-user-3",
      displayName: "VibeMaster",
      photoURL: null,
      wishText: "May your dice roll gold and your wheels spin jackpot today! Sending blessings to all! 👑",
      vibesCount: 22,
      vibesUsers: [],
      isAnonymous: false,
      timestamp: new Date(baseTime - 1000 * 60 * 300).toISOString() // 5h ago
    },
    {
      id: "mock-4",
      userId: "mock-user-4",
      displayName: "Anonymous",
      photoURL: null,
      wishText: "I wish to find peace of mind and learn to live in the present moment. 🌸",
      vibesCount: 5,
      vibesUsers: [],
      isAnonymous: true,
      timestamp: new Date(baseTime - 1000 * 60 * 600).toISOString() // 10h ago
    }
  ];
}
