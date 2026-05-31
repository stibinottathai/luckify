export const COLORS = [
  { label: 'Crimson',  bg: '#dc2626', text: '#fff' },
  { label: 'Cobalt',   bg: '#1d4ed8', text: '#fff' },
  { label: 'Emerald',  bg: '#059669', text: '#fff' },
  { label: 'Gold',     bg: '#d97706', text: '#fff' },
];

export const FORTUNES: Record<number, string> = {
  1: "A secret admirer watches from a distance.",
  2: "Your next risk leads to your greatest reward.",
  3: "The answer you've been waiting for arrives tomorrow.",
  4: "An old friendship is about to be rekindled.",
  5: "Something you lost will find its way back.",
  6: "The universe is saving the best for last.",
  7: "A bold move now changes everything ahead.",
  8: "Luck is already sitting in your pocket.",
};

// Map number choice (1–4 or 5-8) × color position to a fortune index (1-8)
export const getFortune = (colorIdx: number, number: number) => {
  return FORTUNES[((colorIdx * 4 + number) % 8) + 1];
};
