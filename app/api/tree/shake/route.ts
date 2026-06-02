import { NextResponse } from "next/server";

// ─── Constants & Weights ──────────────────────────────────────────────────────

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const MAX_FREE_DAILY_SHAKES = 5;

// Collectibles definitions
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

// ─── Date Helpers ─────────────────────────────────────────────────────────────

const getTodayKey = () => new Date().toISOString().slice(0, 10);
const getYesterdayKey = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};

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

// ─── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const { isGuest, activeOptionId, options } = await req.json();

    let userUid = "guest";
    let idToken = "";
    let isVip = false;
    let doubleRewardsActive = false;

    // Load or set default user details
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
      } else if (docRes.status !== 404) {
        return NextResponse.json({ error: "Failed to read profile" }, { status: 500 });
      }
    }

    // Check temp boosts / status durations
    const nowStr = new Date().toISOString();
    if (profile.vipUntil && new Date(profile.vipUntil) > new Date(nowStr)) {
      isVip = true;
    }
    if (profile.doubleRewardsUntil && new Date(profile.doubleRewardsUntil) > new Date(nowStr)) {
      doubleRewardsActive = true;
    }

    // Reset weekly points if new week starts
    const lastWeeklyUpdate = profile.weeklyCoinsLastUpdated ? new Date(profile.weeklyCoinsLastUpdated) : new Date(0);
    const getWeekNumber = (d: Date) => {
      const date = new Date(d.getTime());
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
      const week1 = new Date(date.getFullYear(), 0, 4);
      return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
    };
    if (getWeekNumber(lastWeeklyUpdate) !== getWeekNumber(new Date())) {
      profile.weeklyCoins = 0;
      profile.weeklyCoinsLastUpdated = nowStr;
    }

    // Validate Daily Limit for non-VIPs (VIP gets unlimited free shakes!)
    const todayStr = getTodayKey();
    if (profile.shakeSpinDate !== todayStr) {
      profile.shakeSpinDate = todayStr;
      profile.dailyShakesToday = 0;
    }

    if (!isVip) {
      if (profile.dailyShakesToday >= MAX_FREE_DAILY_SHAKES) {
        if (profile.extraShakesBalance <= 0) {
          return NextResponse.json({
            error: "Out of shakes today! Wait until tomorrow or earn Extra Shakes.",
            dailyShakesToday: profile.dailyShakesToday,
            extraShakesBalance: profile.extraShakesBalance,
          }, { status: 403 });
        } else {
          profile.extraShakesBalance--;
        }
      } else {
        profile.dailyShakesToday++;
      }
    }

    // ─── Streaks & Visit Checks (Runs on first shake of the day) ──────────────────
    let streakClaimedToday = false;
    let streakAwardedMsg = "";
    let streakRewardPoints = 0;
    let streakRewardXp = 0;
    let streakRewardCollectible = "";
    let streakRewardMysteryBox = false;
    let streakGuaranteedLegendary = false;

    const yesterdayStr = getYesterdayKey();

    if (profile.shakeStreakLastClaimed !== todayStr) {
      streakClaimedToday = true;

      if (profile.shakeStreakLastClaimed === yesterdayStr || profile.shakeStreak === 0) {
        // Increment streak
        profile.shakeStreak++;
      } else {
        // Streak broken! Check if they have a streak shield active
        if (profile.streakShieldsCount && profile.streakShieldsCount > 0) {
          profile.streakShieldsCount--;
          profile.shakeStreak++;
          streakAwardedMsg = "Streak Shield consumed! Streak protected! 🛡️";
        } else {
          // Reset
          profile.shakeStreak = 1;
          streakAwardedMsg = "Streak reset! Visit daily to claim big rewards. 📅";
        }
      }

      profile.shakeStreakLastClaimed = todayStr;
      if (profile.shakeStreak > (profile.shakeStreakRecord || 0)) {
        profile.shakeStreakRecord = profile.shakeStreak;
      }

      // Award daily streak rewards
      const currentStreakDay = profile.shakeStreak;
      streakRewardXp = 10 + Math.min(currentStreakDay * 5, 100);

      if (currentStreakDay === 1) {
        streakRewardPoints = 10;
        streakAwardedMsg = "Day 1 Streak: +10 Lucky Points, +10 XP! 📅";
      } else if (currentStreakDay === 3) {
        streakRewardCollectible = "collectible_lucky_leaf";
        streakAwardedMsg = "Day 3 Streak: Found a Lucky Leaf! 🍃";
      } else if (currentStreakDay === 5) {
        streakRewardCollectible = "collectible_magic_butterfly";
        streakAwardedMsg = "Day 5 Streak: Captured a Magic Butterfly! 🦋";
      } else if (currentStreakDay === 7) {
        streakRewardMysteryBox = true;
        streakRewardPoints = 200;
        streakAwardedMsg = "Day 7 Streak: You earned a Mystery Gift Box + 200 Pts! 🎁";
      } else if (currentStreakDay === 30) {
        streakGuaranteedLegendary = true;
        streakAwardedMsg = "Day 30 Streak: GUARANTEED LEGENDARY REWARD DROP! 👑";
      } else {
        streakRewardPoints = currentStreakDay * 10;
        streakAwardedMsg = `Day ${currentStreakDay} Streak: +${streakRewardPoints} Points, +${streakRewardXp} XP!`;
      }

      // Add streak rewards to profile
      profile.coinBalance += streakRewardPoints;
      profile.weeklyCoins += streakRewardPoints;
      profile.xp += streakRewardXp;

      if (streakRewardCollectible) {
        profile.collectibles = profile.collectibles || {};
        profile.collectibles[streakRewardCollectible] = (profile.collectibles[streakRewardCollectible] || 0) + 1;
      }
      if (streakRewardMysteryBox) {
        profile.mysteryBoxesCount = (profile.mysteryBoxesCount || 0) + 1;
      }
    }

    // ─── Server-Side Probability Reward Selection ──────────────────────────────

    const roll = Math.random() * 100;
    let rarity: "common" | "rare" | "epic" | "legendary" = "common";

    if (streakGuaranteedLegendary) {
      rarity = "legendary";
    } else {
      if (roll < 1) {
        rarity = "legendary";
      } else if (roll < 10) {
        rarity = "epic";
      } else if (roll < 30) {
        rarity = "rare";
      } else {
        rarity = "common";
      }
    }

    interface DropItem {
      id: string;
      name: string;
      emoji: string;
      points?: number;
      xp?: number;
      extraShakes?: number;
      collectible?: string;
      badge?: string;
      doubleHours?: number;
      vipHours?: number;
      mysteryBox?: boolean;
      streakShield?: boolean;
    }

    const COMMON_DROPS: DropItem[] = [
      { id: "points_10", name: "+10 Lucky Points", emoji: "🪙", points: 10 },
      { id: "points_20", name: "+20 Lucky Points", emoji: "🪙", points: 20 },
      { id: "points_50", name: "+50 Lucky Points", emoji: "🪙", points: 50 },
      { id: "extra_shake", name: "Extra Tree Shake", emoji: "🔄", extraShakes: 1 },
      { id: "xp_boost", name: "Small XP Boost", emoji: "✨", xp: 25 },
    ];

    const RARE_DROPS: DropItem[] = [
      { id: "collectible_golden_leaf", name: "Golden Leaf", emoji: "🍁", collectible: "collectible_golden_leaf", points: 100 },
      { id: "badge_lucky_charm", name: "Lucky Charm Badge", emoji: "🍀", badge: "badge_lucky_charm", points: 150 },
      { id: "boost_double_1h", name: "Double Rewards (1 Hour)", emoji: "⚡", doubleHours: 1 },
      { id: "mystery_box", name: "Mystery Gift Box", emoji: "🎁", mysteryBox: true },
      { id: "streak_shield", name: "Streak Protection Shield", emoji: "🛡️", streakShield: true },
    ];

    const EPIC_DROPS: DropItem[] = [
      { id: "treasure_chest", name: "Treasure Chest", emoji: "🏴‍☠️", points: 250, xp: 100, mysteryBox: true },
      { id: "boost_vip_24h", name: "VIP Badge (24 Hours)", emoji: "👑", vipHours: 24, points: 500 },
      { id: "collectible_rainbow_fruit", name: "Rainbow Fruit", emoji: "🍎", collectible: "collectible_rainbow_fruit", points: 300 },
      { id: "collectible_fortune_crystal", name: "Fortune Crystal", emoji: "🔮", collectible: "collectible_fortune_crystal", points: 400 },
      { id: "collectible_golden_banana", name: "Golden Banana", emoji: "🍌", collectible: "collectible_golden_banana", points: 500 },
    ];

    const LEGENDARY_DROPS: DropItem[] = [
      { id: "collectible_dragon_egg", name: "Dragon Egg", emoji: "🥚", collectible: "collectible_dragon_egg", points: 1000 },
      { id: "badge_tree_spirit", name: "Tree Spirit Badge", emoji: "👻", badge: "badge_tree_spirit", points: 1000 },
      { id: "collectible_fortune_crown", name: "Fortune Crown", emoji: "👑", collectible: "collectible_fortune_crown", points: 1500 },
      { id: "badge_eternal_leaf", name: "Eternal Lucky Leaf", emoji: "🌿", badge: "badge_eternal_leaf", points: 2000 },
      { id: "jackpot_chest", name: "Jackpot Treasure Chest", emoji: "💎", points: 5000, xp: 300 },
    ];

    let dropsPool = COMMON_DROPS;
    if (rarity === "rare") dropsPool = RARE_DROPS;
    else if (rarity === "epic") dropsPool = EPIC_DROPS;
    else if (rarity === "legendary") dropsPool = LEGENDARY_DROPS;

    const reward = { ...dropsPool[Math.floor(Math.random() * dropsPool.length)] };

    // ─── Double Points Boost Factor ───────────────────────────────────────────
    let earnedPoints = reward.points || 0;
    if (doubleRewardsActive && earnedPoints > 0) {
      earnedPoints *= 2;
      reward.name = `Double! ${reward.name} (x2)`;
    }

    // ─── Update User Profile State ────────────────────────────────────────────
    profile.coinBalance += earnedPoints;
    profile.weeklyCoins += earnedPoints;

    const shakeXp = reward.xp || 15; // standard 15 XP for shaking, or specific reward XP
    profile.xp += shakeXp;

    if (reward.extraShakes) {
      profile.extraShakesBalance = (profile.extraShakesBalance || 0) + reward.extraShakes;
    }

    if (reward.collectible) {
      profile.collectibles = profile.collectibles || {};
      profile.collectibles[reward.collectible] = (profile.collectibles[reward.collectible] || 0) + 1;
    }

    if (reward.badge) {
      profile.badges = profile.badges || [];
      if (!profile.badges.includes(reward.badge)) {
        profile.badges.push(reward.badge);
      }
    }

    if (reward.mysteryBox) {
      profile.mysteryBoxesCount = (profile.mysteryBoxesCount || 0) + 1;
    }

    if (reward.streakShield) {
      profile.streakShieldsCount = (profile.streakShieldsCount || 0) + 1;
    }

    if (reward.doubleHours) {
      const doubleUntil = new Date(Date.now() + reward.doubleHours * 3600000).toISOString();
      profile.doubleRewardsUntil = doubleUntil;
    }

    if (reward.vipHours) {
      const vipUntil = new Date(Date.now() + reward.vipHours * 3600000).toISOString();
      profile.vipUntil = vipUntil;
    }

    // Check Collectibles Completion
    profile.collectibles = profile.collectibles || {};
    let uniqueCollected = 0;
    ALL_COLLECTIBLES.forEach((col) => {
      if (profile.collectibles[col] && profile.collectibles[col] > 0) {
        uniqueCollected++;
      }
    });
    profile.collectedItems = uniqueCollected;

    if (uniqueCollected === ALL_COLLECTIBLES.length) {
      profile.badges = profile.badges || [];
      if (!profile.badges.includes("badge_tree_overlord")) {
        profile.badges.push("badge_tree_overlord");
        // Major collection complete reward!
        profile.coinBalance += 2500;
        profile.weeklyCoins += 2500;
        profile.xp += 500;
        streakAwardedMsg += " COLLECTION COMPLETED! Earned 'Tree Overlord' Badge & +2500 Points! 👑🎉";
      }
    }

    // Process Level Up
    const oldLevelInfo = getLevelInfo(profile.xp - shakeXp - (streakRewardXp || 0));
    const newLevelInfo = getLevelInfo(profile.xp);
    let leveledUp = false;
    let lvlUpMsg = "";

    if (newLevelInfo.level > oldLevelInfo.level) {
      leveledUp = true;
      profile.level = newLevelInfo.level;
      lvlUpMsg = `Leveled Up to Level ${newLevelInfo.level} (${newLevelInfo.title})! 🎉`;

      // Milestone level up badges
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
    profile.totalPlays = (profile.totalPlays || 0) + 1;
    const historyItem = {
      game: "Shaking Tree",
      result: `Earned ${reward.name}`,
      timestamp: nowStr,
      isWin: rarity !== "common",
      scoreImpact: rarity === "legendary" ? 25 : rarity === "epic" ? 15 : rarity === "rare" ? 8 : 4,
    };
    profile.history = [historyItem, ...(profile.history || [])].slice(0, 20);

    // ─── Random Lucky Event Trigger (15% rate) ──────────────────────────────────
    let triggeredEvent: string | null = null;
    let eventBonusPoints = 0;
    let eventBonusXp = 0;
    let eventRewardText = "";

    if (Math.random() < 0.15) {
      const eventRand = Math.random();
      if (eventRand < 0.40) {
        triggeredEvent = "lucky_bird"; // Lucky Bird: +100 Pts, +50 XP
        eventBonusPoints = 100;
        eventBonusXp = 50;
        eventRewardText = "A cute Lucky Bluebird landed and dropped a Golden Seed! +100 Pts, +50 XP! 🐦";
      } else if (eventRand < 0.75) {
        triggeredEvent = "hidden_nest"; // Nest: drops a Mystery Box!
        profile.mysteryBoxesCount = (profile.mysteryBoxesCount || 0) + 1;
        eventBonusXp = 30;
        eventRewardText = "You found a Hidden Nest in the branches containing a Mystery Box! 🪹";
      } else if (eventRand < 0.95) {
        triggeredEvent = "golden_fruit"; // Golden Fruit: double rewards!
        eventBonusPoints = earnedPoints; // matches points won again!
        eventBonusXp = 50;
        eventRewardText = "A giant glowing Golden Apple drops, granting matching bonus points! 🍎✨";
      } else {
        triggeredEvent = "tree_spirit"; // Tree Spirit: Epic or Legendary collectible directly!
        const spiritCollectibles = [
          "collectible_rainbow_fruit",
          "collectible_fortune_crystal",
          "collectible_golden_banana",
          "collectible_dragon_egg",
          "collectible_fortune_crown",
        ];
        const directColl = spiritCollectibles[Math.floor(Math.random() * spiritCollectibles.length)];
        profile.collectibles[directColl] = (profile.collectibles[directColl] || 0) + 1;
        eventBonusXp = 100;
        const collCleanName = directColl.replace("collectible_", "").replace("_", " ").toUpperCase();
        eventRewardText = `The Magical Tree Spirit glows into existence, gifting a rare ${collCleanName}! 👻✨`;
      }

      profile.coinBalance += eventBonusPoints;
      profile.weeklyCoins += eventBonusPoints;
      profile.xp += eventBonusXp;
    }

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
        console.error("Failed to persist tree updates:", await writeRes.text());
      }
    }

    // Compute UI details
    return NextResponse.json({
      success: true,
      reward,
      rarity,
      earnedPoints,
      earnedXp: shakeXp + (streakRewardXp || 0) + eventBonusXp,
      streak: profile.shakeStreak,
      streakClaimedToday,
      streakAwardedMsg,
      levelUp: {
        leveled: leveledUp,
        level: profile.level,
        title: newLevelInfo.title,
        message: lvlUpMsg,
      },
      luckyEvent: triggeredEvent
        ? {
            type: triggeredEvent,
            bonusPoints: eventBonusPoints,
            bonusXp: eventBonusXp,
            description: eventRewardText,
          }
        : null,
      profile: {
        coinBalance: profile.coinBalance,
        xp: profile.xp,
        level: profile.level,
        shakeStreak: profile.shakeStreak,
        shakeStreakRecord: profile.shakeStreakRecord,
        dailyShakesToday: profile.dailyShakesToday,
        extraShakesBalance: profile.extraShakesBalance,
        mysteryBoxesCount: profile.mysteryBoxesCount,
        collectiblesCount: profile.collectedItems,
        streakShieldsCount: profile.streakShieldsCount,
        doubleRewardsUntil: profile.doubleRewardsUntil,
        vipUntil: profile.vipUntil,
        badges: profile.badges,
      },
    });
  } catch (err: any) {
    console.error("Shaking Tree error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
