export interface Prize {
  id: string;
  emoji: string;
  name: string;
  color: string;
  isWin: boolean;
  scoreImpact: number;
  coinReward: number;
  weight: number;
}

export const WHEEL_SPIN_COST = 100;
export const STARTING_COIN_BALANCE = 500;

export const WHEEL_PRIZES: Prize[] = [
  { id: "1000", emoji: "🪙", name: "1000 Coins", color: "#B7791F", isWin: true, scoreImpact: 0, coinReward: 1000, weight: 1 },
  { id: "800", emoji: "🪙", name: "800 Coins", color: "#F5B700", isWin: true, scoreImpact: 0, coinReward: 800, weight: 3 },
  { id: "700", emoji: "🪙", name: "700 Coins", color: "#FF8C00", isWin: true, scoreImpact: 0, coinReward: 700, weight: 5 },
  { id: "500", emoji: "🪙", name: "500 Coins", color: "#00B4A0", isWin: true, scoreImpact: 0, coinReward: 500, weight: 9 },
  { id: "300", emoji: "🪙", name: "300 Coins", color: "#8E2DE2", isWin: true, scoreImpact: 0, coinReward: 300, weight: 14 },
  { id: "200", emoji: "🪙", name: "200 Coins", color: "#00BFFF", isWin: true, scoreImpact: 0, coinReward: 200, weight: 18 },
  { id: "100", emoji: "🪙", name: "100 Coins", color: "#FF6B6B", isWin: true, scoreImpact: 0, coinReward: 100, weight: 25 },
  { id: "try-again", emoji: "↻", name: "Try Again", color: "#A0AEC0", isWin: false, scoreImpact: 0, coinReward: 0, weight: 25 },
];

export const SCRATCH_OUTCOMES = [
  { id: "win", emoji: "🎉", name: "YOU WIN!", isWin: true, scoreImpact: 15, fortune: "Success is knocking at your door!" },
  { id: "loss", emoji: "🙁", name: "Better Luck", isWin: false, scoreImpact: -5, fortune: "Failure is just another step to greatness. Try again!" },
  { id: "bonus", emoji: "⭐", name: "BONUS SPIN", isWin: true, scoreImpact: 8, fortune: "Bonus energy is heading your way!" }
];

export const DICE_MEANINGS: Record<number, string> = {
  2: "Snake Eyes! Double trouble, but double rare luck!",
  3: "Lucky day! Good news will reach you soon.",
  4: "Solid roll! Balance and harmony are aligned.",
  5: "Progress! A path is opening up for you.",
  6: "Nirvana! Peaceful times are ahead.",
  7: "Classic lucky 7! Magic is in the air.",
  8: "Infinity luck! Abundance flows effortlessly.",
  9: "High potential! Step up and take charge.",
  10: "Perfect ten! Success in your next venture.",
  11: "Super roll! Luck is highly concentrated.",
  12: "Double sixes! Cosmic power is on your side.",
  13: "Unlucky 13? Turn it around and make it yours!",
  14: "Fortunate twist! Expect the unexpected.",
  15: "Supreme alignment! The stars are supporting you.",
  16: "Sweet sixteen! High vibrations only.",
  17: "Stepping stone! Great decisions lay ahead.",
  18: "MAX LUCK! Incredible rolling power!",
};
