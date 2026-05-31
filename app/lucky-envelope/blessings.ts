export const BLESSINGS = [
  "Wealth flows toward you like rivers to the sea.",
  "A long-awaited answer arrives before the new moon.",
  "Your patience ripens into extraordinary reward.",
  "Three doors open where one once stood closed.",
  "The one you trust will prove worthy of that trust.",
  "Great fortune hides inside your smallest decision.",
  "Joy returns to your home in an unexpected form.",
  "A distant connection brings surprising opportunity.",
  "What you release today returns to you tenfold.",
  "The universe has reserved something rare for you.",
  "Your next bold step lands on solid golden ground.",
  "Abundance multiplies when shared with open hands.",
];

export interface Fortune {
  luckyNumber: number;
  blessing: string;
}

export function getRandomFortune(): Fortune {
  const luckyNumber = Math.floor(Math.random() * 99) + 1;
  const blessing = BLESSINGS[Math.floor(Math.random() * BLESSINGS.length)];
  return { luckyNumber, blessing };
}
