export interface Prize {
  id: string;
  emoji: string;
  name: string;
  color: string;
  isWin: boolean;
  scoreImpact: number;
}

export const WHEEL_PRIZES: Prize[] = [
  { id: "1", emoji: "🎁", name: "Big Prize", color: "#F5B700", isWin: true, scoreImpact: 15 },
  { id: "2", emoji: "⭐", name: "Lucky Star", color: "#8E2DE2", isWin: true, scoreImpact: 5 },
  { id: "3", emoji: "🍀", name: "Clover", color: "#00B4A0", isWin: true, scoreImpact: 10 },
  { id: "4", emoji: "💫", name: "Try Again", color: "#A0AEC0", isWin: false, scoreImpact: -5 },
  { id: "5", emoji: "🎉", name: "Jackpot!", color: "#FF6B6B", isWin: true, scoreImpact: 30 },
  { id: "6", emoji: "🌙", name: "Mystery", color: "#4A00E0", isWin: true, scoreImpact: 8 },
  { id: "7", emoji: "🔥", name: "Hot Pick", color: "#FF8C00", isWin: true, scoreImpact: 12 },
  { id: "8", emoji: "💎", name: "Gem", color: "#00BFFF", isWin: true, scoreImpact: 20 },
];

export const SCRATCH_OUTCOMES = [
  { id: "win", emoji: "🎉", name: "YOU WIN!", isWin: true, scoreImpact: 15, fortune: "Success is knocking at your door!" },
  { id: "loss", emoji: "🙁", name: "Better Luck", isWin: false, scoreImpact: -5, fortune: "Failure is just another step to greatness. Try again!" },
  { id: "bonus", emoji: "⭐", name: "BONUS SPIN", isWin: true, scoreImpact: 8, fortune: "Bonus energy is heading your way!" }
];

export const MYSTERY_PRIZES = [
  { emoji: "🏆", name: "Trophy", isWin: true, scoreImpact: 25, isJackpot: false },
  { emoji: "💣", name: "Dud", isWin: false, scoreImpact: -10, isJackpot: false },
  { emoji: "🌟", name: "Star", isWin: true, scoreImpact: 5, isJackpot: false },
  { emoji: "🎪", name: "Show", isWin: true, scoreImpact: 8, isJackpot: false },
  { emoji: "💰", name: "Gold", isWin: true, scoreImpact: 20, isJackpot: false },
  { emoji: "🎭", name: "Joker", isWin: false, scoreImpact: -2, isJackpot: false },
  { emoji: "🦄", name: "Unicorn", isWin: true, scoreImpact: 30, isJackpot: true }, // Unicorn is the Jackpot!
  { emoji: "🔑", name: "Key", isWin: true, scoreImpact: 12, isJackpot: false },
  { emoji: "🌸", name: "Blossom", isWin: true, scoreImpact: 6, isJackpot: false },
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
