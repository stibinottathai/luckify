export const FORTUNES = [
  "The tide that carried this message now carries your fortune too.",
  "What you release to the sea returns as something far greater.",
  "A distant shore holds the answer you have long been seeking.",
  "The ocean remembers every wish ever cast upon its waves.",
  "Patience is the vessel. Your fortune is the destination.",
  "Something lost at sea is already finding its way back to you.",
  "The stars guided this bottle here. Trust where they lead you next.",
  "Your greatest adventure begins the moment you leave the shore.",
  "Like the ocean, your potential has no visible edge.",
  "The storm you fear has already passed on distant waters.",
  "Every wave carries a hundred unwritten stories. Yours is next.",
  "Set sail. The wind already knows where you are meant to go.",
  "The sea gives back what the heart truly deserves.",
  "Treasure is never buried — it is merely waiting to be found.",
];

export const getRandomFortune = () =>
  FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
