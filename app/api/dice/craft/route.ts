import { NextResponse } from "next/server";
import { ALL_DICE_SKINS } from "../roll/route";

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

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
    const { isGuest, diceId } = body;

    if (!diceId || !ALL_DICE_SKINS[diceId]) {
      return NextResponse.json({ error: "Invalid dice skin selection" }, { status: 400 });
    }

    const skinConfig = ALL_DICE_SKINS[diceId];
    if (skinConfig.cost <= 0) {
      return NextResponse.json({ error: "This standard dice skin cannot be crafted" }, { status: 400 });
    }

    let userUid = "guest";
    let idToken = "";

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
      equippedDice: "wooden_dice",
      diceFragments: 0,
      collectionProgress: 1,
      mythicDiceCount: 0,
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

    // ─── Balance Check ────────────────────────────────────────────────────────

    const currentFragments = profile.diceFragments || 0;
    if (currentFragments < skinConfig.cost) {
      return NextResponse.json({
        error: `Insufficient fragments! You need ${skinConfig.cost} fragments to craft the ${skinConfig.name}.`,
      }, { status: 400 });
    }

    if (!isGuest && authHeader) {
      // Check if user already owns this dice skin
      const checkOwnedRes = await fetch(
        `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${userUid}/diceCollection/${diceId}`,
        { headers: { Authorization: `Bearer ${idToken}` } }
      );

      if (checkOwnedRes.ok) {
        return NextResponse.json({ error: "You already own this dice skin" }, { status: 400 });
      }

      // Deduct fragments & increment unique progress
      profile.diceFragments = currentFragments - skinConfig.cost;
      profile.collectionProgress = (profile.collectionProgress || 1) + 1;
      
      if (skinConfig.rarity === "mythic") {
        profile.mythicDiceCount = (profile.mythicDiceCount || 0) + 1;
      }

      // Milestone check
      profile.badges = profile.badges || [];
      if (profile.collectionProgress === 5) {
        profile.coinBalance += 100;
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

      // Save to Subcollection
      const unlockPayload = {
        id: skinConfig.id,
        name: skinConfig.name,
        rarity: skinConfig.rarity,
        unlockedAt: new Date().toISOString(),
      };
      const subDocPayload = jsonToFirestoreDoc(unlockPayload);
      const subRes = await fetch(
        `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${userUid}/diceCollection/${diceId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(subDocPayload),
        }
      );

      if (!subRes.ok) {
        throw new Error("Failed to write to diceCollection subcollection");
      }

      // Save profile
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
        console.error("Failed to update user profile stats:", await writeRes.text());
      }
    } else {
      // Guest local simulation
      profile.diceFragments = currentFragments - skinConfig.cost;
      profile.collectionProgress = (profile.collectionProgress || 1) + 1;
    }

    return NextResponse.json({
      success: true,
      diceId,
      profile: {
        coinBalance: profile.coinBalance,
        badges: profile.badges,
        equippedDice: profile.equippedDice,
        diceFragments: profile.diceFragments,
        collectionProgress: profile.collectionProgress,
        mythicDiceCount: profile.mythicDiceCount,
      },
    });
  } catch (err: any) {
    console.error("Dice craft error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
