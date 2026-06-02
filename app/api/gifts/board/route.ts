import { NextResponse } from "next/server";

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

// The exact 20 rewards
const REWARD_POOL = [
  100, 200, 300, 50, 25, 0, 500, 250, 30, 10,
  75, 150, 175, 225, 550, 600, 650, 5000, 1000, 800
];

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

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    const authUser = await getAuthenticatedUser(authHeader);
    
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userUid = authUser.localId;
    const idToken = authHeader!.split("Bearer ")[1];
    const todayStr = getTodayKey();

    // Try to fetch user's profile
    const profileRes = await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${userUid}`,
      { headers: { Authorization: `Bearer ${idToken}` } }
    );

    if (!profileRes.ok) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const docJson = await profileRes.json();
    const profile = firestoreDocToJson(docJson);

    // Check if board exists and is from today
    let board = profile.giftHuntBoard;

    if (board && board.date === todayStr) {
      return NextResponse.json({
        openedIndexes: board.openedIndexes || [],
        openedRewards: board.openedRewards || [],
        // ONLY return the full rewards array if they have opened 3 boxes
        rewards: (board.openedIndexes || []).length >= 3 ? board.rewards : null
      });
    } else {
      // Board doesn't exist for today, generate one!
      const shuffled = [...REWARD_POOL].sort(() => Math.random() - 0.5);
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      const newBoard = {
        rewards: shuffled,
        openedIndexes: [],
        openedRewards: [],
        date: todayStr
      };

      profile.giftHuntBoard = newBoard;

      const writeRes = await fetch(
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

      if (!writeRes.ok) {
        return NextResponse.json({ error: "Failed to create board" }, { status: 500 });
      }

      return NextResponse.json({
        openedIndexes: [],
        openedRewards: [],
        rewards: null
      });
    }

  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
