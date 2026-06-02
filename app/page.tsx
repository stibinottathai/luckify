import type { Metadata } from "next";
import HomeClient from "@/components/HomeClient";

export const metadata: Metadata = {
  title: "Lucky Vibes | Try Your Luck. Find Your Fortune.",
  description: "Step into the ultimate interactive lucky garden! Roll 3D dice, spin the fortune wheel, shake the SVG tree, flip cosmic golden coins, open traditional red envelopes, scratch cards, and check your vibes score today.",
  openGraph: {
    title: "Lucky Vibes | Try Your Luck. Find Your Fortune.",
    description: "An engaging, interactive lucky garden! Roll 3D dice, spin the wheel, shake the SVG tree, select lottery numbers, scratch a card, and test your vibes score today.",
    url: "https://luckify.vercel.app",
    siteName: "Lucky Vibes",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Lucky Vibes - Virtual Lucky Garden and Fortune Oracle",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lucky Vibes | Try Your Luck. Find Your Fortune.",
    description: "Step into the ultimate interactive lucky garden! Roll 3D dice, spin the fortune wheel, shake the SVG tree, flip cosmic golden coins, open traditional red envelopes, scratch cards, and check your vibes score today.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Lucky Vibes",
    "url": "https://luckify.vercel.app", // Fallback canonical or domain reference
    "description": "An interactive digital garden of luck simulations, fortune telling, and random decision makers.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://luckify.vercel.app/?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  const gamesListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Lucky Vibes Interactive Fortune & Luck Games",
    "numberOfItems": 11,
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Fortune Wheel",
        "description": "Spend 100 coins to spin eight reward sections, from Try Again up to the rare 1000-coin prize.",
        "url": "https://luckify.vercel.app/wheel"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Shaking Tree",
        "description": "Shake the magical SVG forest tree and catch whichever glowing fruit falls to earth!",
        "url": "https://luckify.vercel.app/tree"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Lucky Dice",
        "description": "Roll up to three fully interactive 3D CSS dice to find your current numbers alignment!",
        "url": "https://luckify.vercel.app/dice"
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": "Flip a Coin",
        "description": "Toss a beautiful golden cosmic coin to decide your path: Heads or Tails!",
        "url": "https://luckify.vercel.app/coin"
      },
      {
        "@type": "ListItem",
        "position": 5,
        "name": "Scratch Card",
        "description": "Rub off the silver glitter layer with your cursor to reveal hidden fortunes and wins!",
        "url": "https://luckify.vercel.app/scratch"
      },
      {
        "@type": "ListItem",
        "position": 6,
        "name": "Number Picker",
        "description": "Pick 6 lottery balls, run the staggered drop machine, and check your matches frequency!",
        "url": "https://luckify.vercel.app/picker"
      },
      {
        "@type": "ListItem",
        "position": 7,
        "name": "Pendulum Divination",
        "description": "Submit a question, release the cosmic silver pendulum, and let physical forces reveal the truth!",
        "url": "https://luckify.vercel.app/pendulum"
      },
      {
        "@type": "ListItem",
        "position": 8,
        "name": "Lucky Envelope",
        "description": "Receive a traditional red envelope, unfold its 3D golden seal, and uncover your daily blessing!",
        "url": "https://luckify.vercel.app/lucky-envelope"
      },
      {
        "@type": "ListItem",
        "position": 9,
        "name": "Origami Fortune",
        "description": "Select colors and numbers to unfold the 3D paper cootie catcher and reveal your hidden fate!",
        "url": "https://luckify.vercel.app/fortune-teller"
      },
      {
        "@type": "ListItem",
        "position": 10,
        "name": "Magic 8-Ball",
        "description": "Ask a yes or no question, shake the glossy black sphere, and reveal the cosmic oracle's wisdom!",
        "url": "https://luckify.vercel.app/magic-8-ball"
      },
      {
        "@type": "ListItem",
        "position": 11,
        "name": "Message in a Bottle",
        "description": "Cast a glass bottle into the sea, tap to pop the cork, and watch your handwritten fortune unfurl!",
        "url": "https://luckify.vercel.app/message-in-bottle"
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(gamesListSchema) }}
      />
      <HomeClient />
    </>
  );
}
