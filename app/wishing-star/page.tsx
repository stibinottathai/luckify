import type { Metadata } from "next";
import AeoFaqSection from "@/components/ui/AeoFaqSection";
import WishingTreeClient from "./WishingTreeClient";

export const metadata: Metadata = {
  title: "Celestial Wishing Sky - Community Blessings | Luck ഉണ്ടോ ?",
  description: "Cast your deepest wishes as glowing stars in our celestial wishing sky. Send positive vibes to other wishes to boost their luck score!",
  alternates: {
    canonical: "https://www.luckundo.xyz/wishing-star",
  },
  openGraph: {
    title: "Celestial Wishing Sky - Community Blessings | Luck ഉണ്ടോ ?",
    description: "An interactive digital wishing sky where users can cast glowing stars and send positive vibes to support the community's fortunes.",
    type: "website",
  },
};

const WISHING_TREE_FAQS = [
  {
    question: "What is the Celestial Wishing Sky?",
    answer: "The Celestial Wishing Sky is a community-oriented space where players can spend 500 Vibe Coins to write down a personal wish (either anonymously or signed) and cast it as a glowing star into a digital night sky. Other players can read the stars and send positive vibes.",
  },
  {
    question: "How do positive vibes affect my Lucky Score?",
    answer: "When another player upvotes your star (sends positive vibes), you receive a real-time boost of +3 to your luckyScore (capped at a maximum of 100). Upvoting other stars helps spread positive energy across the Luck ഉണ്ടോ ? community!",
  },
  {
    question: "Does it cost coins to read or send vibes?",
    answer: "No. Browsing the cosmos, reading stars, and sending positive vibes is completely free. It only costs 500 Vibe Coins to cast a new star into the sky.",
  },
];

export default function Page() {
  const applicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Celestial Wishing Sky Simulator",
    "operatingSystem": "All",
    "applicationCategory": "SocialApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "An interactive digital community wishing sky where users spend Vibe Coins to cast stars and upvote others for luck boosts."
  };

  return (
    <div className="flex flex-col items-center w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(applicationSchema) }}
      />
      <div className="w-full">
        <WishingTreeClient />
      </div>
      <AeoFaqSection items={WISHING_TREE_FAQS} />
    </div>
  );
}
