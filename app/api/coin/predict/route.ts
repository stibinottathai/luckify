import { NextResponse } from "next/server";

// ─── Constants & Configurations ──────────────────────────────────────────────

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const MAX_DAILY_PREDICTIONS = 10;
const VALID_WAGERS = [1000, 2000, 3000, 4000, 5000];

// ─── Firestore Helpers ────────────────────────────────────────────────────────

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

// ─── Authenticate Firebase ID Token ──────────────────────────────────────────

async function getAuthenticatedUser(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const idToken = authHeader.split("Bearer ")[1];
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    return data.users?.[0] || null;
  } catch (err) {
    console.error("Token verification error:", err);
    return null;
  }
}

// ─── Date Helper ─────────────────────────────────────────────────────────────

const getTodayKey = () => new Date().toISOString().slice(0, 10);

// ─── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { isGuest, prediction, wager, forceGoldenCoin } = body;

    // Validate request inputs
    if (!prediction || (prediction !== "heads" && prediction !== "tails")) {
      return NextResponse.json({ error: "Invalid prediction. Must be Heads or Tails." }, { status: 400 });
    }

    if (!wager || !VALID_WAGERS.includes(wager)) {
      return NextResponse.json({ error: "Invalid wager amount." }, { status: 400 });
    }

    let userUid = "guest";
    let idToken = "";
    let displayName = "Lucky Player";

    // Standard profile setup
    let profile: any = {
      coinBalance: 5000, // starting balance for local simulation if profile does not exist
      luckyScore: 50,
      totalPlays: 0,
      winStreak: 0,
      history: [],
      badges: [],
      mysteryBoxesCount: 0,

      // Coin Arena Defaults
      coinDailyAttempts: 0,
      coinDailyAttemptsDate: getTodayKey(),
      coinTotalWins: 0,
      coinTotalLosses: 0,
      coinTotalPredictions: 0,
      coinWinStreak: 0,
      coinBestStreak: 0,
      coinLargestWin: 0,
      coinTotalProfit: 0,
    };

    const authHeader = req.headers.get("Authorization");

    if (!isGuest && authHeader) {
      idToken = authHeader.split("Bearer ")[1];
      const authUser = await getAuthenticatedUser(authHeader);
      if (!authUser) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }
      userUid = authUser.localId;
      displayName = authUser.displayName || "Lucky Player";

      // Fetch from Firestore
      const docRes = await fetch(
        `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${userUid}`,
        {
          headers: { Authorization: `Bearer ${idToken}` },
        }
      );

      if (docRes.ok) {
        const docJson = await docRes.json();
        const dbProfile = firestoreDocToJson(docJson);
        profile = { ...profile, ...dbProfile };
      } else if (docRes.status !== 404) {
        return NextResponse.json({ error: "Failed to read profile" }, { status: 500 });
      }
    }

    // ─── Daily Limits ─────────────────────────────────────────────────────────
    const todayStr = getTodayKey();
    if (profile.coinDailyAttemptsDate !== todayStr) {
      profile.coinDailyAttemptsDate = todayStr;
      profile.coinDailyAttempts = 0;
    }

    const currentAttempts = profile.coinDailyAttempts || 0;
    if (currentAttempts >= MAX_DAILY_PREDICTIONS) {
      return NextResponse.json(
        { error: "Daily limit of 10 predictions reached! Come back tomorrow." },
        { status: 403 }
      );
    }

    // ─── Balance Check ────────────────────────────────────────────────────────
    const userBalance = profile.coinBalance ?? 0;
    if (userBalance < wager) {
      return NextResponse.json(
        { error: `Insufficient Coins. Your balance is ${userBalance}, but wager is ${wager}.` },
        { status: 400 }
      );
    }

    // Deduct wager immediately
    profile.coinBalance = userBalance - wager;
    profile.coinDailyAttempts = currentAttempts + 1;

    // ─── Roll Calculation ─────────────────────────────────────────────────────
    
    // Golden Coin portal event (2% chance)
    const isDev = process.env.NODE_ENV === "development";
    const isGoldenCoin = forceGoldenCoin === true && isDev ? true : Math.random() < 0.02;

    // Secure 50% ratio win probability
    const coinResult: "heads" | "tails" = Math.random() < 0.5 ? "heads" : "tails";
    const won = prediction === coinResult;

    let winMultiplier = 2; // normal double payout (gives 200% return on wager, i.e. 100% profit)
    let goldenCoinBonus = null;
    let badgeAwarded = "";

    if (isGoldenCoin && won) {
      // Golden Coin rewards if prediction matches
      const goldenRoll = Math.random();
      if (goldenRoll < 0.4) {
        winMultiplier = 3; // 3x multiplier
        goldenCoinBonus = "3x Golden Multiplier! ⚡";
      } else if (goldenRoll < 0.7) {
        winMultiplier = 2;
        badgeAwarded = "badge_golden_coin";
        goldenCoinBonus = "Rare Golden Coin Badge! 🪙";
      } else {
        winMultiplier = 2;
        badgeAwarded = "badge_lucky_charm";
        goldenCoinBonus = "Rare Lucky Charm Badge! 🍀";
      }
    }

    let payout = 0;
    let profit = -wager;
    let streakBonus = 0;
    let streakBonusMessage = "";

    if (won) {
      payout = wager * winMultiplier;
      profit = payout - wager;

      // Update streaks and wins
      profile.coinTotalWins = (profile.coinTotalWins || 0) + 1;
      profile.coinWinStreak = (profile.coinWinStreak || 0) + 1;
      profile.coinBestStreak = Math.max(profile.coinBestStreak || 0, profile.coinWinStreak);
      profile.coinTotalProfit = (profile.coinTotalProfit || 0) + profit;
      profile.coinLargestWin = Math.max(profile.coinLargestWin || 0, profit);

      // Add payout back to balance
      profile.coinBalance += payout;

      // Lucky Streak rewards
      const currentStreak = profile.coinWinStreak;
      if (currentStreak === 3) {
        streakBonus = 500;
        streakBonusMessage = "🔥 3 Wins Streak! Bonus 500 Coins awarded!";
      } else if (currentStreak === 5) {
        streakBonus = 1500;
        streakBonusMessage = "🔥 5 Wins Streak! Bonus 1500 Coins awarded!";
      } else if (currentStreak === 10) {
        streakBonus = 3000;
        profile.mysteryBoxesCount = (profile.mysteryBoxesCount || 0) + 1;
        streakBonusMessage = "🔥 10 Wins Streak! Bonus 3000 Coins & Mystery Gift Box awarded!";
      }

      if (streakBonus > 0) {
        profile.coinBalance += streakBonus;
      }

      // Add badge if awarded
      if (badgeAwarded) {
        profile.badges = profile.badges || [];
        if (!profile.badges.includes(badgeAwarded)) {
          profile.badges.push(badgeAwarded);
        }
      }

      // Positive Lucky Score impact
      profile.luckyScore = Math.min(100, (profile.luckyScore || 50) + 1 + Math.min(profile.coinWinStreak, 5));
    } else {
      // Loss
      profile.coinTotalLosses = (profile.coinTotalLosses || 0) + 1;
      profile.coinWinStreak = 0; // reset streak

      // Negative Lucky Score impact
      profile.luckyScore = Math.max(0, (profile.luckyScore || 50) - 3);
    }

    profile.coinTotalPredictions = (profile.coinTotalWins || 0) + (profile.coinTotalLosses || 0);

    // Calculate dynamic stats history
    profile.totalPlays = (profile.totalPlays || 0) + 1;
    const historyItem = {
      game: "Flip a Coin",
      result: `Bet ${wager} on ${prediction.toUpperCase()}. Result: ${coinResult.toUpperCase()}. Payout: +${payout} Coins.`,
      timestamp: new Date().toISOString(),
      isWin: won,
      scoreImpact: won ? 5 : -3,
    };
    profile.history = [historyItem, ...(profile.history || [])].slice(0, 20);

    // ─── Persist to Subcollections & Profile Announcements ───────────────────
    const predictionId = `coin_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    if (!isGuest && authHeader) {
      // 1. Write coinPredictions/{predictionId} doc
      const predictionPayload = {
        userId: userUid,
        prediction: prediction,
        wager: wager,
        result: coinResult,
        won: won,
        payout: payout,
        createdAt: new Date().toISOString(),
      };

      const docWritePayload = jsonToFirestoreDoc(predictionPayload);
      const subRes = await fetch(
        `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/coinPredictions?documentId=${predictionId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(docWritePayload),
        }
      );

      if (!subRes.ok) {
        console.error("Failed to write to coinPredictions root collection:", await subRes.text());
      }

      // If Golden Coin Win, write to announcements
      if (isGoldenCoin && won) {
        const announcementPayload = {
          userUid,
          displayName,
          rewardName: goldenCoinBonus || "Golden Coin Blessing",
          rewardEmoji: "🌟",
          rewardRarity: "epic",
          text: `🌟 ${displayName} unlocked a Golden Coin event and won ${wager * winMultiplier} Coins!`,
          timestamp: new Date().toISOString(),
        };

        const announceDocPayload = jsonToFirestoreDoc(announcementPayload);
        const announceRes = await fetch(
          `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/announcements`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${idToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(announceDocPayload),
          }
        );

        if (!announceRes.ok) {
          console.error("Failed to write global announcement:", await announceRes.text());
        }
      }

      // 2. Patch user's Firestore Profile
      const writePayload = jsonToFirestoreDoc(profile);
      const writeRes = await fetch(
        `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${userUid}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(writePayload),
        }
      );

      if (!writeRes.ok) {
        console.error("Failed to persist coin predictions profile:", await writeRes.text());
      }
    }

    return NextResponse.json({
      success: true,
      result: coinResult,
      won,
      payout,
      profit,
      streak: profile.coinWinStreak,
      streakBonus,
      streakBonusMessage,
      goldenCoin: isGoldenCoin,
      goldenMultiplier: winMultiplier,
      goldenCoinBonus,
      profile: {
        coinBalance: profile.coinBalance,
        luckyScore: profile.luckyScore,
        history: profile.history,
        badges: profile.badges,
        mysteryBoxesCount: profile.mysteryBoxesCount,
        coinDailyAttempts: profile.coinDailyAttempts,
        coinDailyAttemptsDate: profile.coinDailyAttemptsDate,
        coinTotalWins: profile.coinTotalWins,
        coinTotalLosses: profile.coinTotalLosses,
        coinTotalPredictions: profile.coinTotalPredictions,
        coinWinStreak: profile.coinWinStreak,
        coinBestStreak: profile.coinBestStreak,
        coinLargestWin: profile.coinLargestWin,
        coinTotalProfit: profile.coinTotalProfit,
      },
    });
  } catch (err: any) {
    console.error("Secure Coin Prediction API error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
