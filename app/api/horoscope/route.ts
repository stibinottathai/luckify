import { NextResponse } from "next/server";

// Valid game recommendations for the app
const GAME_RECOMMENDATIONS = [
  { name: "Fortune Wheel", href: "/wheel", emoji: "🎡" },
  { name: "Lucky Gift Hunt", href: "/gift-hunt", emoji: "🎁" },
  { name: "Pendulum Divination", href: "/pendulum", emoji: "🔮" },
  { name: "Lucky Envelope", href: "/lucky-envelope", emoji: "✉️" },
  { name: "Magic 8-Ball", href: "/magic-8-ball", emoji: "🎱" },
  { name: "Message in a Bottle", href: "/message-in-bottle", emoji: "🍾" }
];

const COSMIC_INTROS = [
  "The celestial spheres are perfectly aligned today.",
  "A powerful planetary shift triggers major clarity.",
  "Mystical cosmic vibrations envelop your star sign.",
  "An auspicious lunar phase highlights your daily path.",
  "The universe is sending subtle signals in your direction.",
  "A harmonious energy transition dominates your alignment today."
];

const COSMIC_FOCUSES = [
  "A sudden wave of creative inspiration will help you tackle old challenges,",
  "A peaceful moment of quiet introspection will clear your thoughts,",
  "An energetic social connection will bring unexpected cosmic guidance,",
  "A strong current of financial confidence urges you to trust your luck,",
  "A cosmic window of pure clarity opens, amplifying your communication,",
  "A minor cosmic detour shifts your daily plans into a luckier direction,",
  "A stellar alignment in your ambition sector highlights career dedication,",
  "An adventurous spark encourages you to step out of your comfort zone,"
];

const COSMIC_OUTCOMES = [
  "leading you straight to a hidden prize or breakthrough.",
  "so keep your mind open to positive surprises and guidance.",
  "and a minor calculated risk today will pay off beautifully.",
  "reminding you that patience holds the key to the ultimate jackpot.",
  "winning you admiration and opening up a brand-new doorway.",
  "revealing that small daily steps lead to massive long-term successes.",
  "and your positive vibrations will attract abundance to your pocket.",
  "which will reveal a lucky pathway you didn't even notice before."
];

const ZODIAC_COSMIC_ADVICE: Record<string, string> = {
  aries: "As a Fire sign, your initiative is extremely high today. Action leads to victory—spin the wheel first!",
  taurus: "Your Earth element keeps you grounded. Take a slow, calculated choice today—let the Pendulum decide your next move.",
  gemini: "Air energies swirl around your communications. Ask a deep cosmic question today; your mind is ready to receive answers.",
  cancer: "Your Water element heightens your intuition. Trust your gut completely today—especially when picking mystery boxes.",
  leo: "Fire elements boost your charisma and star power. Choose a high-reward game today and chase the jackpot with confidence!",
  virgo: "Earth energies favor detail and analysis. Use your precision in prediction games today—predict the coin flips carefully.",
  libra: "Air elements bring harmony and balance. It's a perfect day to balance your luck score and test your vibes score.",
  scorpio: "Water energies spark passionate insights. Trust a mystery choice today; the hidden depths hold great coin rewards.",
  sagittarius: "Fire elements boost your adventurous spirit. Play a game you haven't played in a while; luck favors the bold traveler.",
  capricorn: "Earth elements bring stability and endurance. Your steady persistence will win the day. Accumulate points step-by-step.",
  aquarius: "Air elements favor originality and progress. Break your daily pattern and try a random luck test with a fresh mindset.",
  pisces: "Water elements bring high spiritual connection. Divination tools like the Pendulum are calling your name today."
};

// Local fallback generator (identical to the old deterministic logic to guarantee stability)
function generateFallbackHoroscope(sign: string, dateStr: string) {
  const normalizedSign = sign.toLowerCase();
  const str = `${normalizedSign}-${dateStr}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const getMetric = (metric: string) => {
    const metricStr = `${normalizedSign}-${metric}-${dateStr}`;
    let metricHash = 0;
    for (let i = 0; i < metricStr.length; i++) {
      metricHash = metricStr.charCodeAt(i) + ((metricHash << 5) - metricHash);
    }
    return 45 + Math.abs(metricHash % 56);
  };

  const introIdx = Math.abs((hash * 13) % COSMIC_INTROS.length);
  const focusIdx = Math.abs((hash * 29) % COSMIC_FOCUSES.length);
  const outcomeIdx = Math.abs((hash * 47) % COSMIC_OUTCOMES.length);

  const forecast = `${COSMIC_INTROS[introIdx]} ${COSMIC_FOCUSES[focusIdx]} ${COSMIC_OUTCOMES[outcomeIdx]}`;
  const adviceText = ZODIAC_COSMIC_ADVICE[normalizedSign] || "Trust your inner compass and align your choices with cosmic vibrations today.";
  const gameIdx = Math.abs(hash % GAME_RECOMMENDATIONS.length);

  return {
    forecast,
    luckyScore: getMetric("luck"),
    loveScore: getMetric("love"),
    careerScore: getMetric("career"),
    recommendedGame: GAME_RECOMMENDATIONS[gameIdx].name,
    cosmicAdvice: adviceText,
    isFallback: true
  };
}

export async function POST(req: Request) {
  let sign = "";
  let dateStr = "";
  try {
    const body = await req.json();
    sign = body.sign || "";
    dateStr = body.date || new Date().toISOString().slice(0, 10);
  } catch (e) {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }

  if (!sign) {
    return NextResponse.json({ error: "Zodiac sign is required" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  // If the API key is not configured, immediately return the high-quality fallback
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set. Using local deterministic fallback.");
    return NextResponse.json(generateFallbackHoroscope(sign, dateStr));
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Generate a daily astrology alignment and horoscope reading for the zodiac sign '${sign}' for the date: ${dateStr}.
Use a modern, encouraging, mystical, and astrological tone. Incorporate specific details about planetary alignments, elements, or houses relevant to ${sign} on this day.
Ensure the generated 'forecast' is detailed and consists of exactly around 500 characters.`
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                forecast: {
                  type: "STRING",
                  description: "A cosmic daily alignment forecast for this zodiac sign. Write it in an inspiring, mystical, and engaging manner. Must be detailed and exactly around 500 characters in length."
                },
                luckyScore: {
                  type: "INTEGER",
                  description: "Daily luck vibe rating between 45 and 100."
                },
                loveScore: {
                  type: "INTEGER",
                  description: "Daily love vibe rating between 45 and 100."
                },
                careerScore: {
                  type: "INTEGER",
                  description: "Daily career vibe rating between 45 and 100."
                },
                recommendedGame: {
                  type: "STRING",
                  description: "One of these exact game names that matches the daily vibe: 'Fortune Wheel', 'Lucky Gift Hunt', 'Pendulum Divination', 'Lucky Envelope', 'Magic 8-Ball', 'Message in a Bottle'."
                },
                cosmicAdvice: {
                  type: "STRING",
                  description: "A sentence of specific cosmic alignment advice for the day."
                }
              },
              required: ["forecast", "luckyScore", "loveScore", "careerScore", "recommendedGame", "cosmicAdvice"]
            }
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API Error (status ${response.status}):`, errorText);
      return NextResponse.json(generateFallbackHoroscope(sign, dateStr));
    }

    const data = await response.json();
    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResult) {
      console.error("Gemini API returned empty text or content parts");
      return NextResponse.json(generateFallbackHoroscope(sign, dateStr));
    }

    const parsedResult = JSON.parse(textResult);

    // Validate structure of parsed JSON
    if (
      typeof parsedResult.forecast !== "string" ||
      typeof parsedResult.luckyScore !== "number" ||
      typeof parsedResult.loveScore !== "number" ||
      typeof parsedResult.careerScore !== "number" ||
      typeof parsedResult.recommendedGame !== "string" ||
      typeof parsedResult.cosmicAdvice !== "string"
    ) {
      console.error("Gemini JSON response is missing required fields or has invalid types:", parsedResult);
      return NextResponse.json(generateFallbackHoroscope(sign, dateStr));
    }

    // Ensure recommendedGame is valid
    const gameExists = GAME_RECOMMENDATIONS.some(
      (g) => g.name.toLowerCase() === parsedResult.recommendedGame.toLowerCase()
    );
    if (!gameExists) {
      parsedResult.recommendedGame = "Fortune Wheel"; // Default valid game fallback
    }

    return NextResponse.json({
      ...parsedResult,
      isFallback: false
    });
  } catch (err) {
    console.error("Failed to fetch or parse Gemini horoscope API:", err);
    return NextResponse.json(generateFallbackHoroscope(sign, dateStr));
  }
}
