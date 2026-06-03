import { NextResponse } from "next/server";

// ─── Config ──────────────────────────────────────────────────────────────────

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const DAILY_SCRATCH_LIMIT = 3;

// Prize table — mirrors client-side SCRATCH_PRIZES for server-authoritative rolls
const SCRATCH_PRIZES = [
  { id: "scratch-1000", emoji: "👑", name: "1000 Coins", coinReward: 1000, weight: 1,  isWin: true,  scoreImpact: 15, fortune: "Incredible jackpot! Absolute luck flows through you today!" },
  { id: "scratch-500",  emoji: "💎", name: "500 Coins",  coinReward: 500,  weight: 4,  isWin: true,  scoreImpact: 10, fortune: "A magnificent treasure! You are in absolute alignment!" },
  { id: "scratch-300",  emoji: "⭐", name: "300 Coins",  coinReward: 300,  weight: 10, isWin: true,  scoreImpact: 8,  fortune: "Sparkling success! Abundance is finding its way to you!" },
  { id: "scratch-100",  emoji: "🪙", name: "100 Coins",  coinReward: 100,  weight: 25, isWin: true,  scoreImpact: 5,  fortune: "Nice prize! A clean boost to keep your luck flowing!" },
  { id: "scratch-try",  emoji: "↻",  name: "Try Again",  coinReward: 0,    weight: 30, isWin: false, scoreImpact: -3, fortune: "No coins this time, but the stars are aligning. Try again!" },
];

// ─── Firestore REST Helpers ───────────────────────────────────────────────────

function fsVal(val: any): any {
  if (!val) return null;
  if (val.stringValue  !== undefined) return val.stringValue;
  if (val.integerValue !== undefined) return parseInt(val.integerValue, 10);
  if (val.doubleValue  !== undefined) return parseFloat(val.doubleValue);
  if (val.booleanValue !== undefined) return val.booleanValue;
  if (val.nullValue    !== undefined) return null;
  if (val.mapValue     !== undefined) {
    const obj: any = {};
    for (const k in val.mapValue.fields || {}) obj[k] = fsVal(val.mapValue.fields[k]);
    return obj;
  }
  if (val.arrayValue !== undefined)
    return (val.arrayValue.values || []).map((v: any) => fsVal(v));
  if (val.timestampValue !== undefined) return val.timestampValue;
  return undefined;
}

function docToJson(doc: any): any {
  const out: any = {};
  for (const k in doc.fields || {}) out[k] = fsVal(doc.fields[k]);
  return out;
}

function toFsVal(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === "string")  return { stringValue: val };
  if (typeof val === "number")  return Number.isInteger(val) ? { integerValue: val.toString() } : { doubleValue: val };
  if (typeof val === "boolean") return { booleanValue: val };
  if (Array.isArray(val))       return { arrayValue: { values: val.map(toFsVal) } };
  if (typeof val === "object") {
    const fields: any = {};
    for (const k in val) fields[k] = toFsVal(val[k]);
    return { mapValue: { fields } };
  }
  return { nullValue: null };
}

function toFsDoc(obj: any): any {
  const fields: any = {};
  for (const k in obj) fields[k] = toFsVal(obj[k]);
  return { fields };
}

// ─── Auth helper ─────────────────────────────────────────────────────────────

async function verifyToken(authHeader: string | null) {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const idToken = authHeader.slice(7);
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${API_KEY}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken }) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.users?.[0] ? { uid: data.users[0].localId, idToken } : null;
  } catch {
    return null;
  }
}

// ─── Prize picker ─────────────────────────────────────────────────────────────

function pickPrize() {
  const total = SCRATCH_PRIZES.reduce((s, p) => s + p.weight, 0);
  let roll = Math.random() * total;
  for (const prize of SCRATCH_PRIZES) {
    roll -= prize.weight;
    if (roll <= 0) return prize;
  }
  return SCRATCH_PRIZES[SCRATCH_PRIZES.length - 1];
}

const getTodayKey = () => new Date().toISOString().slice(0, 10);

// ─── POST /api/scratch/reveal ─────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { isGuest } = body;

    const authHeader = req.headers.get("Authorization");
    const todayStr = getTodayKey();

    // ── GUEST path: Block guests to make it strictly user-based ──────────────
    if (isGuest || !authHeader) {
      return NextResponse.json(
        { error: "Authentication required to scratch card. Please log in." },
        { status: 401 }
      );
    }

    // ── Authenticated path ────────────────────────────────────────────────────
    const auth = await verifyToken(authHeader);
    if (!auth) {
      return NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });
    }

    const { uid, idToken } = auth;
    const userDocUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`;

    // 1. Fetch current profile
    const profileRes = await fetch(userDocUrl, {
      headers: { Authorization: `Bearer ${idToken}` },
    });

    let profile: any = {
      coinBalance: 500,
      luckyScore: 50,
      totalPlays: 0,
      winStreak: 0,
      history: [],
      scratchDate: "",
      scratchAttemptsUsed: 0,
      scratchPrizeWon: 0,
    };

    if (profileRes.ok) {
      const dbProfile = docToJson(await profileRes.json());
      profile = { ...profile, ...dbProfile };
    } else if (profileRes.status !== 404) {
      return NextResponse.json({ error: "Failed to read profile." }, { status: 500 });
    }

    // 2. Reset daily counter if it's a new day
    if (profile.scratchDate !== todayStr) {
      profile.scratchDate = todayStr;
      profile.scratchAttemptsUsed = 0;
      profile.scratchPrizeWon = 0;
    }

    // 3. Enforce 3/day limit — server-authoritative, cannot be bypassed client-side
    const attemptsUsed: number = profile.scratchAttemptsUsed ?? 0;
    if (attemptsUsed >= DAILY_SCRATCH_LIMIT) {
      return NextResponse.json(
        { error: "You've used all 3 daily scratch cards. Come back tomorrow!" },
        { status: 403 }
      );
    }

    // 4. Server-side prize roll — client cannot influence this
    const prize = pickPrize();

    // 5. Update profile fields
    profile.scratchAttemptsUsed = attemptsUsed + 1;
    profile.scratchPrizeWon = (profile.scratchPrizeWon ?? 0) + prize.coinReward;
    profile.coinBalance = (profile.coinBalance ?? 0) + prize.coinReward;
    profile.totalPlays = (profile.totalPlays ?? 0) + 1;

    if (prize.isWin) {
      profile.winStreak = (profile.winStreak ?? 0) + 1;
    } else {
      profile.winStreak = 0;
    }

    profile.luckyScore = Math.max(0, Math.min(100, (profile.luckyScore ?? 50) + prize.scoreImpact));

    const historyItem = {
      game: "Scratch Card",
      result: prize.coinReward > 0 ? `🎉 Won ${prize.coinReward} Coins` : `↻ Try Again`,
      timestamp: new Date().toISOString(),
      isWin: prize.isWin,
      scoreImpact: prize.scoreImpact,
    };
    profile.history = [historyItem, ...(profile.history || [])].slice(0, 20);

    // 6. Persist to Firestore
    const patchRes = await fetch(userDocUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(toFsDoc(profile)),
    });

    if (!patchRes.ok) {
      console.error("[scratch/reveal] Firestore PATCH failed:", await patchRes.text());
      return NextResponse.json({ error: "Failed to save result." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      prize: {
        id: prize.id,
        emoji: prize.emoji,
        name: prize.name,
        coinReward: prize.coinReward,
        isWin: prize.isWin,
        scoreImpact: prize.scoreImpact,
        fortune: prize.fortune,
      },
      profile: {
        coinBalance: profile.coinBalance,
        luckyScore: profile.luckyScore,
        totalPlays: profile.totalPlays,
        winStreak: profile.winStreak,
        history: profile.history,
        scratchDate: profile.scratchDate,
        scratchAttemptsUsed: profile.scratchAttemptsUsed,
        scratchPrizeWon: profile.scratchPrizeWon,
      },
    });
  } catch (err: any) {
    console.error("[scratch/reveal] Error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
