export interface Answer {
  text: string;
  type: 'positive' | 'neutral' | 'negative';
}

export const ANSWERS: Answer[] = [
  // Positive (green glow)
  { text: "It is certain.",            type: 'positive' },
  { text: "Without a doubt.",          type: 'positive' },
  { text: "Yes, definitely.",          type: 'positive' },
  { text: "You may rely on it.",       type: 'positive' },
  { text: "Most likely.",              type: 'positive' },
  { text: "Signs point to yes.",       type: 'positive' },
  { text: "As I see it, yes.",         type: 'positive' },
  { text: "Outlook good.",             type: 'positive' },

  // Neutral (blue glow)
  { text: "Reply hazy, try again.",    type: 'neutral' },
  { text: "Ask again later.",          type: 'neutral' },
  { text: "Better not tell you now.",  type: 'neutral' },
  { text: "Cannot predict now.",       type: 'neutral' },
  { text: "Concentrate and ask again.",type: 'neutral' },

  // Negative (red glow)
  { text: "Don't count on it.",        type: 'negative' },
  { text: "My reply is no.",           type: 'negative' },
  { text: "My sources say no.",        type: 'negative' },
  { text: "Outlook not so good.",      type: 'negative' },
  { text: "Very doubtful.",            type: 'negative' },
  { text: "The stars do not align.",   type: 'negative' },
  { text: "The cosmos remain silent.", type: 'negative' },
];

export function getRandomAnswer(): Answer {
  return ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
}
