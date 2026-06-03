import type { Metadata } from "next";
import HomeClient from "@/components/HomeClient";

export const metadata: Metadata = {
  title: "Lucky Vibes | Try Your Luck. Find Your Fortune.",
  description: "Step into the ultimate interactive lucky garden! Roll 3D dice, spin the fortune wheel, shake the SVG tree, flip cosmic golden coins, and check your vibes score today.",
  openGraph: {
    title: "Lucky Vibes | Try Your Luck. Find Your Fortune.",
    description: "An engaging, interactive lucky garden! Roll 3D dice, spin the wheel, shake the SVG tree, and test your vibes score today.",
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
    description: "Step into the ultimate interactive lucky garden! Roll 3D dice, spin the fortune wheel, shake the SVG tree, flip cosmic golden coins, and check your vibes score today.",
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
    "numberOfItems": 5,
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Fortune Wheel",
        "description": "Use 3 daily spins, unlock extras with points, and chase rewards up to the rare 1000-point prize.",
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
        "name": "Flip a Coin",
        "description": "Toss a beautiful golden cosmic coin to decide your path: Heads or Tails!",
        "url": "https://luckify.vercel.app/coin"
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": "Pendulum Divination",
        "description": "Submit a question, release the cosmic silver pendulum, and let physical forces reveal the truth!",
        "url": "https://luckify.vercel.app/pendulum"
      },
      {
        "@type": "ListItem",
        "position": 5,
        "name": "Lucky Gift Hunt",
        "description": "Pick 3 mystery gift boxes every day! Will you find the legendary 5000 coin jackpot?",
        "url": "https://luckify.vercel.app/gift-hunt"
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
