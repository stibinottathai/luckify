import { NextResponse } from "next/server";

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

// --- Firebase REST Helpers ---
function firestoreValueToJs(val: any): any {
  if (!val) return null;
  if (val.stringValue !== undefined) return val.stringValue;
  if (val.integerValue !== undefined) return parseInt(val.integerValue, 10);
  if (val.doubleValue !== undefined) return parseFloat(val.doubleValue);
  if (val.booleanValue !== undefined) return val.booleanValue;
  if (val.nullValue !== undefined) return null;
  if (val.mapValue !== undefined) {
    const obj: any = {};
    const fields = val.mapValue.fields || {};
    for (const key in fields) {
      obj[key] = firestoreValueToJs(fields[key]);
    }
    return obj;
  }
  if (val.arrayValue !== undefined) {
    const arr = val.arrayValue.values || [];
    return arr.map((item: any) => firestoreValueToJs(item));
  }
  if (val.timestampValue !== undefined) return val.timestampValue;
  return undefined;
}

function firestoreDocToJson(doc: any): any {
  const result: any = {};
  const fields = doc.fields || {};
  for (const key in fields) {
    result[key] = firestoreValueToJs(fields[key]);
  }
  return result;
}

function jsToFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === "string") return { stringValue: val };
  if (typeof val === "number") {
    if (Number.isInteger(val)) return { integerValue: val.toString() };
    return { doubleValue: val };
  }
  if (typeof val === "boolean") return { booleanValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(jsToFirestoreValue) } };
  }
  if (typeof val === "object") {
    const fields: any = {};
    for (const key in val) {
      fields[key] = jsToFirestoreValue(val[key]);
    }
    return { mapValue: { fields } };
  }
  return { nullValue: null };
}

function jsonToFirestoreDoc(obj: any): any {
  const fields: any = {};
  for (const key in obj) {
    fields[key] = jsToFirestoreValue(obj[key]);
  }
  return { fields };
}

async function getAuthenticatedUser(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const idToken = authHeader.split("Bearer ")[1];
  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.users?.[0] || null;
  } catch (err) {
    return null;
  }
}

const getTodayKey = () => new Date().toISOString().slice(0, 10);

export async function POST(req: Request) {
  try {
    const { boxIndex } = await req.json();

    if (typeof boxIndex !== "number" || !Number.isInteger(boxIndex) || boxIndex < 0 || boxIndex >= 20) {
      return NextResponse.json({ error: "Invalid box index" }, { status: 400 });
    }

    const authHeader = req.headers.get("Authorization");
    const authUser = await getAuthenticatedUser(authHeader);

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userUid = authUser.localId;
    const idToken = authHeader!.split("Bearer ")[1];
    const todayStr = getTodayKey();

    // 1. Fetch User Profile & Board
    const profileRes = await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${userUid}`,
      { headers: { Authorization: `Bearer ${idToken}` } }
    );

    if (!profileRes.ok) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const profileDoc = await profileRes.json();
    const profile = firestoreDocToJson(profileDoc);
    
    const board = profile.giftHuntBoard;

    if (!board || board.date !== todayStr) {
      return NextResponse.json({ error: "Daily board not found or expired" }, { status: 404 });
    }

    const openedIndexes: number[] = board.openedIndexes || [];
    const openedRewards: number[] = board.openedRewards || [];
    const rewards: number[] = board.rewards;

    if (openedIndexes.length >= 3) {
      return NextResponse.json({ error: "Daily limit reached" }, { status: 403 });
    }

    if (openedIndexes.includes(boxIndex)) {
      return NextResponse.json({ error: "Box already opened" }, { status: 400 });
    }

    const rewardCoins = rewards[boxIndex];
    openedIndexes.push(boxIndex);
    openedRewards.push(rewardCoins);

    // 2. Update profile fields
    profile.coinBalance = (profile.coinBalance || 0) + rewardCoins;
    profile.giftHuntTotalOpened = (profile.giftHuntTotalOpened || 0) + 1;
    if (rewardCoins > (profile.giftHuntHighestGift || 0)) {
      profile.giftHuntHighestGift = rewardCoins;
    }
    if (rewardCoins === 1000) {
      profile.giftHuntTimes1000 = (profile.giftHuntTimes1000 || 0) + 1;
    }
    if (rewardCoins === 5000) {
      profile.giftHuntTimes5000 = (profile.giftHuntTimes5000 || 0) + 1;
    }
    
    // Update the board object in profile
    board.openedIndexes = openedIndexes;
    board.openedRewards = openedRewards;
    profile.giftHuntBoard = board;

    // 3. Update Profile Document
    const updateRes = await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${userUid}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jsonToFirestoreDoc(profile)),
      }
    );

    if (!updateRes.ok) {
        return NextResponse.json({ error: "Failed to save progress" }, { status: 500 });
    }

    const isGameOver = openedIndexes.length === 3;

    return NextResponse.json({
      success: true,
      reward: rewardCoins,
      openedIndexes,
      openedRewards,
      isGameOver,
      rewards: isGameOver ? rewards : null,
      updatedProfile: {
        coinBalance: profile.coinBalance,
        giftHuntTotalOpened: profile.giftHuntTotalOpened,
        giftHuntHighestGift: profile.giftHuntHighestGift,
        giftHuntTimes1000: profile.giftHuntTimes1000,
        giftHuntTimes5000: profile.giftHuntTimes5000,
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
