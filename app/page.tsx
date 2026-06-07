import type { Metadata } from "next";
import HomeClient from "@/components/HomeClient";

export const metadata: Metadata = {
  title: "Luck ഉണ്ടോ ? | Try Your Luck. Find Your Fortune.",
  description: "Step into the ultimate interactive lucky garden! Roll 3D dice, spin the fortune wheel, and check your vibes score today.",
  alternates: {
    canonical: "https://www.luckundo.xyz/",
  },
  openGraph: {
    title: "Luck ഉണ്ടോ ? | Try Your Luck. Find Your Fortune.",
    description: "An engaging, interactive lucky garden! Roll 3D dice, spin the wheel, and test your vibes score today.",
    url: "https://www.luckundo.xyz",
    siteName: "Luck ഉണ്ടോ ?",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Luck ഉണ്ടോ ? - Virtual Lucky Garden and Fortune Oracle",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Luck ഉണ്ടോ ? | Try Your Luck. Find Your Fortune.",
    description: "Step into the ultimate interactive lucky garden! Roll 3D dice, spin the fortune wheel, and check your vibes score today.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Luck ഉണ്ടോ ?",
    "url": "https://www.luckundo.xyz", // Fallback canonical or domain reference
    "description": "An interactive digital garden of luck simulations, fortune telling, and random decision makers.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://www.luckundo.xyz/?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  const gamesListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Luck ഉണ്ടോ ? Interactive Fortune & Luck Games",
    "numberOfItems": 3,
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Fortune Wheel",
        "description": "Use 3 daily spins, unlock extras with points, and chase rewards up to the rare 1000-point prize.",
        "url": "https://www.luckundo.xyz/wheel"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Pendulum Divination",
        "description": "Submit a question, release the cosmic silver pendulum, and let physical forces reveal the truth!",
        "url": "https://www.luckundo.xyz/pendulum"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Lucky Gift Hunt",
        "description": "Pick 3 mystery gift boxes every day! Will you find the legendary 5000 coin jackpot?",
        "url": "https://www.luckundo.xyz/gift-hunt"
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
