import { NextResponse } from "next/server";

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const ALL_COLLECTIBLES = [
  "collectible_lucky_leaf",
  "collectible_golden_leaf",
  "collectible_rainbow_fruit",
  "collectible_fortune_crystal",
  "collectible_golden_banana",
  "collectible_magic_butterfly",
  "collectible_dragon_egg",
  "collectible_fortune_crown",
];

// ─── Help Helpers ─────────────────────────────────────────────────────────────

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

// ─── Level system ─────────────────────────────────────────────────────────────

function getLevelInfo(xp: number) {
  let level = 1;
  let remainingXp = xp;
  while (true) {
    const xpForNext = level * 100;
    if (remainingXp >= xpForNext) {
      remainingXp -= xpForNext;
      level++;
    } else {
      break;
    }
  }

  let title = "Seedling";
  if (level >= 100) title = "Legend of Luck";
  else if (level >= 50) title = "Tree Master";
  else if (level >= 20) title = "Fortune Hunter";
  else if (level >= 10) title = "Tree Explorer";
  else if (level >= 5) title = "Gardener";

  return {
    level,
    xpInCurrentLevel: remainingXp,
    xpNeededForNextLevel: level * 100,
    title,
  };
}

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
    console.error("Token verification error in Box:", err);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { isGuest } = await req.json();

    let userUid = "guest";
    let idToken = "";
    let doubleRewardsActive = false;

    let profile: any = {
      coinBalance: 500,
      luckyScore: 50,
      totalPlays: 0,
      winStreak: 0,
      xp: 0,
      level: 1,
      shakeStreak: 0,
      shakeStreakLastClaimed: "",
      shakeStreakRecord: 0,
      weeklyCoins: 0,
      weeklyCoinsLastUpdated: new Date().toISOString(),
      shakeSpinDate: "",
      dailyShakesToday: 0,
      extraShakesBalance: 0,
      collectibles: {},
      collectedItems: 0,
      mysteryBoxesCount: 0,
      badges: [],
      doubleRewardsUntil: "",
      streakShieldsCount: 0,
      vipUntil: "",
      history: [],
    };

    const authHeader = req.headers.get("Authorization");

    if (!isGuest && authHeader) {
      idToken = authHeader.split("Bearer ")[1];
      const authUser = await getAuthenticatedUser(authHeader);
      if (!authUser) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }
      userUid = authUser.localId;

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
      } else {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
      }
    }

    // Verify boxes exist
    if (profile.mysteryBoxesCount <= 0) {
      return NextResponse.json({ error: "No Mystery Boxes to open!" }, { status: 400 });
    }

    // Deduct box
    profile.mysteryBoxesCount--;

    // ─── Generate Box Loot ──────────────────────────────────────────────────
    // Points: +100 to +500
    const rawPoints = Math.floor(Math.random() * 401) + 100;
    // XP: +50 to +200
    const rawXp = Math.floor(Math.random() * 151) + 50;

    let pointsWon = rawPoints;
    const nowStr = new Date().toISOString();
    if (profile.doubleRewardsUntil && new Date(profile.doubleRewardsUntil) > new Date(nowStr)) {
      doubleRewardsActive = true;
      pointsWon *= 2;
    }

    profile.coinBalance += pointsWon;
    profile.weeklyCoins += pointsWon;
    profile.xp += rawXp;

    // Collectible drop (35% chance)
    let wonCollectible: string | null = null;
    let collectibleEmoji = "";
    let collectibleName = "";
    if (Math.random() < 0.35) {
      const dropPool = [
        { id: "collectible_golden_leaf", name: "Golden Leaf", emoji: "🍁" },
        { id: "collectible_rainbow_fruit", name: "Rainbow Fruit", emoji: "🍎" },
        { id: "collectible_fortune_crystal", name: "Fortune Crystal", emoji: "🔮" },
        { id: "collectible_golden_banana", name: "Golden Banana", emoji: "🍌" },
        { id: "collectible_magic_butterfly", name: "Magic Butterfly", emoji: "🦋" },
      ];
      const selected = dropPool[Math.floor(Math.random() * dropPool.length)];
      wonCollectible = selected.id;
      collectibleEmoji = selected.emoji;
      collectibleName = selected.name;

      profile.collectibles = profile.collectibles || {};
      profile.collectibles[wonCollectible] = (profile.collectibles[wonCollectible] || 0) + 1;
    }

    // Badge drop (10% chance)
    let wonBadge: string | null = null;
    if (Math.random() < 0.10) {
      wonBadge = "badge_box_cracker";
      profile.badges = profile.badges || [];
      if (!profile.badges.includes("badge_box_cracker")) {
        profile.badges.push("badge_box_cracker");
      }
    }

    // Extra shakes drop (20% chance)
    let wonExtraShakes = 0;
    if (Math.random() < 0.20) {
      wonExtraShakes = Math.random() < 0.7 ? 1 : 2;
      profile.extraShakesBalance = (profile.extraShakesBalance || 0) + wonExtraShakes;
    }

    // Check Collectibles Completion
    let uniqueCollected = 0;
    ALL_COLLECTIBLES.forEach((col) => {
      if (profile.collectibles[col] && profile.collectibles[col] > 0) {
        uniqueCollected++;
      }
    });
    profile.collectedItems = uniqueCollected;

    let collCompleteAward = "";
    if (uniqueCollected === ALL_COLLECTIBLES.length) {
      profile.badges = profile.badges || [];
      if (!profile.badges.includes("badge_tree_overlord")) {
        profile.badges.push("badge_tree_overlord");
        profile.coinBalance += 2500;
        profile.weeklyCoins += 2500;
        profile.xp += 500;
        collCompleteAward = " COLLECTION COMPLETED! Earned 'Tree Overlord' Badge & +2500 Points! 👑🎉";
      }
    }

    // Process Level Up
    const oldLevelInfo = getLevelInfo(profile.xp - rawXp);
    const newLevelInfo = getLevelInfo(profile.xp);
    let leveledUp = false;
    let lvlUpMsg = "";

    if (newLevelInfo.level > oldLevelInfo.level) {
      leveledUp = true;
      profile.level = newLevelInfo.level;
      lvlUpMsg = `Leveled Up to Level ${newLevelInfo.level} (${newLevelInfo.title})! 🎉`;

      const levelBadges: Record<number, string> = {
        5: "badge_gardener",
        10: "badge_tree_explorer",
        20: "badge_fortune_hunter",
        50: "badge_tree_master",
        100: "badge_legend_of_luck",
      };
      if (levelBadges[newLevelInfo.level]) {
        profile.badges = profile.badges || [];
        if (!profile.badges.includes(levelBadges[newLevelInfo.level])) {
          profile.badges.push(levelBadges[newLevelInfo.level]);
        }
      }
    }

    // History addition
    const historyItem = {
      game: "Mystery Box",
      result: `Opened Box: Earned ${pointsWon} Pts, +${rawXp} XP!`,
      timestamp: nowStr,
      isWin: true,
      scoreImpact: 10,
    };
    profile.history = [historyItem, ...(profile.history || [])].slice(0, 20);

    // ─── Flush to Firestore ──────────────────────────────────────────────────
    if (!isGuest && authHeader) {
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
        console.error("Failed to persist box updates:", await writeRes.text());
      }
    }

    return NextResponse.json({
      success: true,
      loot: {
        points: pointsWon,
        xp: rawXp,
        doubleRewardsActive,
        extraShakes: wonExtraShakes,
        collectible: wonCollectible
          ? {
              id: wonCollectible,
              name: collectibleName,
              emoji: collectibleEmoji,
            }
          : null,
        badge: wonBadge,
        message: collCompleteAward,
      },
      levelUp: {
        leveled: leveledUp,
        level: profile.level,
        title: newLevelInfo.title,
        message: lvlUpMsg,
      },
      profile: {
        coinBalance: profile.coinBalance,
        xp: profile.xp,
        level: profile.level,
        mysteryBoxesCount: profile.mysteryBoxesCount,
        collectiblesCount: profile.collectedItems,
        extraShakesBalance: profile.extraShakesBalance,
        badges: profile.badges,
      },
    });
  } catch (err: any) {
    console.error("Open Mystery Box error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
