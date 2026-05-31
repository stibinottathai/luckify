export interface Fortune {
  emoji: string;
  item: string;
  message: string;
  isWin: boolean;
  scoreImpact: number;
}

export const TREE_FORTUNES: Record<string, Omit<Fortune, "emoji" | "item">> = {
  "🍎": { message: "An apple a day! A healthy boost of vitality and vibrant luck is heading your way.", isWin: true, scoreImpact: 8 },
  "🍊": { message: "Sweet success! Your creative efforts will bear sweet, delicious fruits very soon.", isWin: true, scoreImpact: 10 },
  "🌟": { message: "Star power! You will shine exceptionally bright in a difficult project this week.", isWin: true, scoreImpact: 15 },
  "🎁": { message: "Surprise gift! A delightful unexpected blessing is waiting for you around the corner.", isWin: true, scoreImpact: 12 },
  "💰": { message: "Wealth flow! Prosperity winds are blowing in a highly favorable direction.", isWin: true, scoreImpact: 20 },
  "🦋": { message: "Transformation! Beautiful and graceful changes are taking flight in your personal life.", isWin: true, scoreImpact: 7 },
  "🌸": { message: "New beginnings! A fresh opportunity is blooming beautifully, ready for you to seize it.", isWin: true, scoreImpact: 9 },
  "🍀": { message: "Great luck is coming your way this week! Expect unexpected smiles.", isWin: true, scoreImpact: 18 },
  "💎": { message: "Diamond clear! A brilliant spark of genius will effortlessly solve your biggest worry.", isWin: true, scoreImpact: 25 },
  "🎵": { message: "Harmony! Your days will be filled with sweet, rhythmic joy and peaceful vibes.", isWin: true, scoreImpact: 6 },
  "🌈": { message: "Hope! After the storm, a colorful, radiant resolution is absolutely guaranteed.", isWin: true, scoreImpact: 14 },
  "🔮": { message: "Intuition! Trust your inner guidance; you are much closer to the truth than you think.", isWin: true, scoreImpact: 11 },
};

export const DAILY_HOROSCOPES = [
  "✨ Stars say: Your lucky hour is today at 7:00 PM. Take a leap of faith!",
  "🍀 Double up on green today. An unexpected encounter will bring financial joy.",
  "☀️ Radiate positivity today. A small act of kindness will return to you tenfold.",
  "🔮 A mystery from your past will resolve itself in a highly favorable way this afternoon.",
  "💎 Focus on clarity. The answer you seek is already within you. Trust it!",
  "🎵 Listen closely today. A piece of advice in a song or casual dialogue holds the key.",
  "🦋 Let go of old worries. A beautiful transformation is actively brewing for you.",
  "🌈 A colorful coincidence today will put a giant smile on your face. Stay alert!",
  "💰 The universe is plotting your abundance today. Keep your pockets ready!",
  "🌟 Your energy is magnetic today. Speak your desires out loud; they will listen.",
  "🍎 A healthy decision made today will unlock a wave of great physical energy.",
  "🔥 Ignite your passion. That creative idea you've been sitting on? Start it today!"
];
