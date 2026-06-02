import { NextResponse } from "next/server";

// ─── Config & Keys ────────────────────────────────────────────────────────────

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

// ─── Reward Pools ─────────────────────────────────────────────────────────────

interface RewardItem {
  id: string;
  name: string;
  emoji: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  points?: number;
  badge?: string;
  collectible?: string;
  pointsValue: number; // For ranking/highest reward comparison
}

const COMMON_REWARDS: RewardItem[] = [
  { id: "gold_points_500", name: "+500 Lucky Points", emoji: "🪙", rarity: "common", points: 500, pointsValue: 500 },
  { id: "gold_points_750", name: "+750 Lucky Points", emoji: "🪙", rarity: "common", points: 750, pointsValue: 750 },
  { id: "gold_points_1000", name: "+1000 Lucky Points", emoji: "🪙", rarity: "common", points: 1000, pointsValue: 1000 },
];

const RARE_REWARDS: RewardItem[] = [
  { id: "badge_golden_dice", name: "Golden Dice Badge", emoji: "🏆", rarity: "rare", badge: "badge_golden_dice", pointsValue: 1200 },
  { id: "badge_fortune_master", name: "Fortune Master Badge", emoji: "🔮", rarity: "rare", badge: "badge_fortune_master", pointsValue: 1500 },
  { id: "badge_golden_avatar_frame", name: "Golden Avatar Frame", emoji: "🖼️", rarity: "rare", badge: "badge_golden_avatar_frame", pointsValue: 1800 },
];

const EPIC_REWARDS: RewardItem[] = [
  { id: "collectible_golden_banana", name: "Golden Banana", emoji: "🍌", rarity: "epic", collectible: "collectible_golden_banana", pointsValue: 2500 },
  { id: "collectible_fortune_crystal", name: "Fortune Crystal", emoji: "💎", rarity: "epic", collectible: "collectible_fortune_crystal", pointsValue: 3000 },
  { id: "badge_rainbow_dice_skin", name: "Rainbow Dice Skin", emoji: "🌈", rarity: "epic", badge: "badge_rainbow_dice_skin", pointsValue: 3500 },
];

const LEGENDARY_REWARDS: RewardItem[] = [
  { id: "badge_dragon_dice", name: "Dragon Dice Skin", emoji: "🐉", rarity: "legendary", badge: "badge_dragon_dice", pointsValue: 5000 },
  { id: "badge_eternal_lucky", name: "Eternal Lucky Badge", emoji: "🌿", rarity: "legendary", badge: "badge_eternal_lucky", pointsValue: 7500 },
  { id: "collectible_fortune_crown", name: "Fortune Crown", emoji: "👑", rarity: "legendary", collectible: "collectible_fortune_crown", pointsValue: 10000 },
];

// ─── Collectible Dice Skins Configurations ─────────────────────────────────────

interface DiceSkin {
  id: string;
  name: string;
  rarity: "common" | "rare" | "epic" | "legendary" | "mythic";
  emoji: string;
  cost: number; // Crafting fragment cost
  fragmentsValue: number; // Awarded on duplicates
}

export const ALL_DICE_SKINS: Record<string, DiceSkin> = {
  wooden_dice: { id: "wooden_dice", name: "Wooden Dice", rarity: "common", emoji: "🪵", cost: 0, fragmentsValue: 10 },
  stone_dice: { id: "stone_dice", name: "Stone Dice", rarity: "common", emoji: "🪨", cost: 50, fragmentsValue: 10 },
  bronze_dice: { id: "bronze_dice", name: "Bronze Dice", rarity: "common", emoji: "🥉", cost: 50, fragmentsValue: 10 },
  
  crystal_dice: { id: "crystal_dice", name: "Crystal Dice", rarity: "rare", emoji: "💎", cost: 100, fragmentsValue: 25 },
  nature_dice: { id: "nature_dice", name: "Nature Dice", rarity: "rare", emoji: "🌿", cost: 100, fragmentsValue: 25 },
  steel_dice: { id: "steel_dice", name: "Steel Dice", rarity: "rare", emoji: "⚙️", cost: 100, fragmentsValue: 25 },
  
  rainbow_dice: { id: "rainbow_dice", name: "Rainbow Dice", rarity: "epic", emoji: "🌈", cost: 500, fragmentsValue: 50 },
  flame_dice: { id: "flame_dice", name: "Flame Dice", rarity: "epic", emoji: "🔥", cost: 500, fragmentsValue: 50 },
  frost_dice: { id: "frost_dice", name: "Frost Dice", rarity: "epic", emoji: "❄️", cost: 500, fragmentsValue: 50 },
  
  dragon_dice: { id: "dragon_dice", name: "Dragon Dice", rarity: "legendary", emoji: "🐉", cost: 1000, fragmentsValue: 100 },
  royal_dice: { id: "royal_dice", name: "Royal Dice", rarity: "legendary", emoji: "👑", cost: 1000, fragmentsValue: 100 },
  thunder_dice: { id: "thunder_dice", name: "Thunder Dice", rarity: "legendary", emoji: "⚡", cost: 1000, fragmentsValue: 100 },
  
  cosmic_dice: { id: "cosmic_dice", name: "Cosmic Dice", rarity: "mythic", emoji: "🌌", cost: 2500, fragmentsValue: 250 },
  galaxy_dice: { id: "galaxy_dice", name: "Galaxy Dice", rarity: "mythic", emoji: "⭐", cost: 2500, fragmentsValue: 250 },
  infinity_dice: { id: "infinity_dice", name: "Infinity Dice", rarity: "mythic", emoji: "🌠", cost: 2500, fragmentsValue: 250 },
};

const COMMON_SKINS = ["wooden_dice", "stone_dice", "bronze_dice"];
const RARE_SKINS = ["crystal_dice", "nature_dice", "steel_dice"];
const EPIC_SKINS = ["rainbow_dice", "flame_dice", "frost_dice"];
const LEGENDARY_SKINS = ["dragon_dice", "royal_dice", "thunder_dice"];
const MYTHIC_SKINS = ["cosmic_dice", "galaxy_dice", "infinity_dice"];

// ─── Firebase Helper Utilities ────────────────────────────────────────────────

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

// ─── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { isGuest, forceGolden, forceDiceDrop } = body;

    let userUid = "guest";
    let idToken = "";
    let displayName = "Lucky Player";

    // Setup initial guest/default profile structure
    let profile: any = {
      coinBalance: 500,
      luckyScore: 50,
      totalPlays: 0,
      winStreak: 0,
      history: [],
      badges: [],
      collectibles: {},
      totalDiceRolls: 0,
      totalGoldenDiceEvents: 0,
      goldenDiceRate: 0,
      highestRewardWon: "None",
      highestRewardPoints: 0,
      legendaryRewardsCount: 0,
      // Dice Collection System defaults
      equippedDice: "wooden_dice",
      diceFragments: 0,
      collectionProgress: 1,
      mythicDiceCount: 0,
      // Daily Dice Limits defaults
      diceRollDate: new Date().toISOString().slice(0, 10),
      diceRollsUsed: 0,
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

    // ─── Secure Daily Dice Roll Limits & Cost Deductions ─────────────────────
    const todayDateStr = new Date().toISOString().slice(0, 10);
    
    if (profile.diceRollDate !== todayDateStr) {
      profile.diceRollDate = todayDateStr;
      profile.diceRollsUsed = 0;
    }

    const currentUsed = profile.diceRollsUsed || 0;
    if (currentUsed >= 5) {
      return NextResponse.json(
        { error: "Daily limit of 5 rolls reached! Come back tomorrow." },
        { status: 400 }
      );
    }

    let cost = 0;
    if (currentUsed > 0) {
      cost = 200;
      if ((profile.coinBalance || 0) < cost) {
        return NextResponse.json(
          { error: "Insufficient points! Roll costs 200 points." },
          { status: 400 }
        );
      }
      profile.coinBalance -= cost;
    }

    // Increment rolls used today
    profile.diceRollsUsed = currentUsed + 1;

    // ─── Roll Calculation ─────────────────────────────────────────────────────

    const randVal = Math.random() * 100;
    const isDev = process.env.NODE_ENV === "development";
    const triggered = forceGolden === true && isDev ? true : randVal < 0.5;

    // Normal rolls settle coordinates 1 to 6
    const rollValue = Math.floor(Math.random() * 6) + 1;
    let reward: RewardItem | null = null;

    profile.totalDiceRolls = (profile.totalDiceRolls || 0) + 1;

    if (triggered) {
      // Pick a random legendary reward based on a tier probability:
      // Common Golden: 60%, Rare: 25%, Epic: 10%, Legendary: 5%
      const tierRand = Math.random() * 100;
      let pool = COMMON_REWARDS;

      if (tierRand < 5) {
        pool = LEGENDARY_REWARDS;
      } else if (tierRand < 15) {
        pool = EPIC_REWARDS;
      } else if (tierRand < 40) {
        pool = RARE_REWARDS;
      }

      reward = { ...pool[Math.floor(Math.random() * pool.length)] };

      // Update golden dice statistics
      profile.totalGoldenDiceEvents = (profile.totalGoldenDiceEvents || 0) + 1;

      // Base reward: rollValue * 100 points added
      const basePointsWon = rollValue * 100;
      profile.coinBalance = (profile.coinBalance || 0) + basePointsWon;

      if (reward.points) {
        profile.coinBalance = (profile.coinBalance || 0) + reward.points;
      }

      if (reward.badge) {
        profile.badges = profile.badges || [];
        if (!profile.badges.includes(reward.badge)) {
          profile.badges.push(reward.badge);
        }
      }

      if (reward.collectible) {
        profile.collectibles = profile.collectibles || {};
        profile.collectibles[reward.collectible] = (profile.collectibles[reward.collectible] || 0) + 1;
      }

      // Track Highest Reward points value for sorting / profile
      const pointsVal = reward.pointsValue;
      if (pointsVal > (profile.highestRewardPoints || 0)) {
        profile.highestRewardWon = `${reward.emoji} ${reward.name}`;
        profile.highestRewardPoints = pointsVal;
      }

      // Track Legendary Rewards Count (Epic and Legendary count as high tier)
      if (reward.rarity === "epic" || reward.rarity === "legendary") {
        profile.legendaryRewardsCount = (profile.legendaryRewardsCount || 0) + 1;
      }

      // Add to History
      const historyItem = {
        game: "Lucky Dice",
        result: `Triggered GOLDEN DICE (+${basePointsWon} base pts) & won ${reward.name}!`,
        timestamp: new Date().toISOString(),
        isWin: true,
        scoreImpact: 50,
      };
      profile.history = [historyItem, ...(profile.history || [])].slice(0, 20);

      // ─── Write subcollection & Announcements if authenticated ──────────────
      if (!isGuest && authHeader) {
        const rollId = `roll_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        
        // 1. Write users/{userId}/goldenDiceEvents
        const eventPayload = {
          rollId,
          date: new Date().toISOString(),
          reward: {
            id: reward.id,
            name: reward.name,
            emoji: reward.emoji,
            rarity: reward.rarity,
            pointsValue: reward.pointsValue,
          },
          timestamp: new Date().toISOString(),
        };

        const subdocPayload = jsonToFirestoreDoc(eventPayload);
        const subdocRes = await fetch(
          `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${userUid}/goldenDiceEvents?documentId=${rollId}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${idToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(subdocPayload),
          }
        );

        if (!subdocRes.ok) {
          console.error("Failed to write to goldenDiceEvents subcollection:", await subdocRes.text());
        }

        // 2. Write global real-time announcement
        const announcementPayload = {
          userUid,
          displayName,
          rewardName: reward.name,
          rewardEmoji: reward.emoji,
          rewardRarity: reward.rarity,
          text: `🌟 ${displayName} unlocked a Golden Dice and won a ${reward.name}!`,
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
    } else {
      // Normal roll history impact
      let isWin = rollValue >= 4;
      let scoreImpact = rollValue === 6 ? 20 : rollValue === 5 ? 10 : rollValue === 4 ? 5 : -5;

      // Award rollValue * 100 points!
      const pointsWon = rollValue * 100;
      profile.coinBalance = (profile.coinBalance || 0) + pointsWon;

      const historyItem = {
        game: "Lucky Dice",
        result: `Rolled a ${rollValue} (+${pointsWon} pts)`,
        timestamp: new Date().toISOString(),
        isWin,
        scoreImpact,
      };
      profile.history = [historyItem, ...(profile.history || [])].slice(0, 20);
    }

    // Recalculate golden dice rate
    profile.goldenDiceRate = parseFloat(((profile.totalGoldenDiceEvents || 0) / (profile.totalDiceRolls || 1)).toFixed(4));

    // ─── Collectible Dice Skins Progression Drop Chance (15% rate) ───────────
    let diceDrop: any = null;
    const isDiceDropTriggered = (Math.random() < 0.15) || (forceDiceDrop === true && isDev);

    if (isDiceDropTriggered) {
      // Rarity Roll: Common 70% | Rare 20% | Epic 8% | Legendary 1.8% | Mythic 0.2%
      const dropRand = Math.random() * 100;
      let skinsPool = COMMON_SKINS;
      let diceRarity: "common" | "rare" | "epic" | "legendary" | "mythic" = "common";

      if (dropRand < 0.2) {
        skinsPool = MYTHIC_SKINS;
        diceRarity = "mythic";
      } else if (dropRand < 2.0) {
        skinsPool = LEGENDARY_SKINS;
        diceRarity = "legendary";
      } else if (dropRand < 10.0) {
        skinsPool = EPIC_SKINS;
        diceRarity = "epic";
      } else if (dropRand < 30.0) {
        skinsPool = RARE_SKINS;
        diceRarity = "rare";
      }

      const rolledSkinId = skinsPool[Math.floor(Math.random() * skinsPool.length)];
      const skinConfig = ALL_DICE_SKINS[rolledSkinId];

      if (!isGuest && authHeader) {
        // Check if user already owns this dice skin
        const checkOwnedRes = await fetch(
          `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${userUid}/diceCollection/${rolledSkinId}`,
          { headers: { Authorization: `Bearer ${idToken}` } }
        );

        if (checkOwnedRes.ok) {
          // Already owned -> Trigger Fragment duplicate conversion
          const awardedFrags = skinConfig.fragmentsValue;
          profile.diceFragments = (profile.diceFragments || 0) + awardedFrags;

          diceDrop = {
            id: skinConfig.id,
            name: skinConfig.name,
            rarity: skinConfig.rarity,
            emoji: skinConfig.emoji,
            isDuplicate: true,
            fragmentsAwarded: awardedFrags,
          };
        } else {
          // New Unlocked skin -> Save to Firestore subcollection
          const unlockPayload = {
            id: skinConfig.id,
            name: skinConfig.name,
            rarity: skinConfig.rarity,
            unlockedAt: new Date().toISOString(),
          };
          const subDocPayload = jsonToFirestoreDoc(unlockPayload);
          const saveRes = await fetch(
            `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${userUid}/diceCollection/${rolledSkinId}`,
            {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${idToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(subDocPayload),
            }
          );

          if (saveRes.ok) {
            profile.collectionProgress = (profile.collectionProgress || 1) + 1;
            if (skinConfig.rarity === "mythic") {
              profile.mythicDiceCount = (profile.mythicDiceCount || 0) + 1;
            }

            // Milestone checks
            profile.badges = profile.badges || [];
            if (profile.collectionProgress === 5) {
              profile.coinBalance += 100; // reward +100 Points
            } else if (profile.collectionProgress === 10) {
              if (!profile.badges.includes("badge_dice_enthusiast")) {
                profile.badges.push("badge_dice_enthusiast");
              }
            } else if (profile.collectionProgress === 25) {
              if (!profile.badges.includes("badge_vip_avatar_frame")) {
                profile.badges.push("badge_vip_avatar_frame");
              }
            } else if (profile.collectionProgress === 50) {
              if (!profile.badges.includes("badge_dice_master")) {
                profile.badges.push("badge_dice_master");
              }
            }

            diceDrop = {
              id: skinConfig.id,
              name: skinConfig.name,
              rarity: skinConfig.rarity,
              emoji: skinConfig.emoji,
              isDuplicate: false,
            };
          }
        }
      } else {
        // Guest drop simulation
        diceDrop = {
          id: skinConfig.id,
          name: skinConfig.name,
          rarity: skinConfig.rarity,
          emoji: skinConfig.emoji,
          isDuplicate: false,
        };
      }
    }

    // Save profile state back to Firestore
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
        console.error("Failed to persist user profile stats:", await writeRes.text());
      }
    }

    return NextResponse.json({
      success: true,
      triggered,
      roll: rollValue,
      reward,
      diceDrop,
      profile: {
        coinBalance: profile.coinBalance,
        history: profile.history,
        badges: profile.badges,
        collectibles: profile.collectibles,
        totalDiceRolls: profile.totalDiceRolls,
        totalGoldenDiceEvents: profile.totalGoldenDiceEvents,
        goldenDiceRate: profile.goldenDiceRate,
        highestRewardWon: profile.highestRewardWon,
        highestRewardPoints: profile.highestRewardPoints,
        legendaryRewardsCount: profile.legendaryRewardsCount,
        // Dice Collection stats
        equippedDice: profile.equippedDice,
        diceFragments: profile.diceFragments,
        collectionProgress: profile.collectionProgress,
        mythicDiceCount: profile.mythicDiceCount,
        // Daily limits fields
        diceRollsUsed: profile.diceRollsUsed,
        diceRollDate: profile.diceRollDate,
      },
    });
  } catch (err: any) {
    console.error("Dice roll secure handler error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
