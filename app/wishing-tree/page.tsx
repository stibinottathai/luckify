import type { Metadata } from "next";
import AeoFaqSection from "@/components/ui/AeoFaqSection";
import WishingTreeClient from "./WishingTreeClient";

export const metadata: Metadata = {
  title: "Celestial Wishing Tree - Community Blessings | Luckify",
  description: "Hang your deepest wishes as glowing parchment paper tags on our celestial wishing tree. Send positive vibes to other wishes to boost their luck score!",
  alternates: {
    canonical: "https://luckify.vercel.app/wishing-tree",
  },
  openGraph: {
    title: "Celestial Wishing Tree - Community Blessings | Luckify",
    description: "An interactive digital wishing tree where users can hang glowing wishes and send positive vibes to support the community's fortunes.",
    type: "website",
  },
};

const WISHING_TREE_FAQS = [
  {
    question: "What is the Celestial Wishing Tree?",
    answer: "The Celestial Wishing Tree is a community-oriented space where players can spend 500 Vibe Coins to write down a personal wish (either anonymously or signed) and hang it as a glowing tag on a digital willow tree. Other players can read the branches and send positive vibes.",
  },
  {
    question: "How do positive vibes affect my Lucky Score?",
    answer: "When another player upvotes your wish (sends positive vibes), you receive a real-time boost of +3 to your luckyScore (capped at a maximum of 100). Upvoting other wishes helps spread positive energy across the Luckify community!",
  },
  {
    question: "Does it cost coins to read or send vibes?",
    answer: "No. Browsing the wishing branches, reading wishes, and sending positive vibes is completely free. It only costs 500 Vibe Coins to create and hang a new wish on the tree.",
  },
];

export default function Page() {
  const applicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Celestial Wishing Tree Simulator",
    "operatingSystem": "All",
    "applicationCategory": "SocialApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "An interactive digital community wishing tree where users spend Vibe Coins to write wishes and upvote others for luck boosts."
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
