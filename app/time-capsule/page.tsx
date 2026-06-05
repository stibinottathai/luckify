import type { Metadata } from "next";
import AeoFaqSection from "@/components/ui/AeoFaqSection";
import dynamic from "next/dynamic";

const TimeCapsuleClient = dynamic(() => import("./TimeCapsuleClient"), {
  loading: () => (
    <div className="w-full max-w-lg h-[450px] bg-white/70 dark:bg-[#1B103E]/70 border border-white/20 dark:border-white/5 rounded-3xl animate-pulse flex flex-col items-center justify-center gap-3 text-deep-violet/30 dark:text-soft-cream/30 font-fredoka font-black mx-auto">
      <span>Entering the Capsule Vault... 🕰️</span>
    </div>
  ),
});

export const metadata: Metadata = {
  title: "Time Capsule of Hope - Lock & Yield Cosmic Interest | Lucky Vibes",
  description: "Bury a message to your future self in our digital time capsule. Lock a custom amount of Vibe Coins along with your words and collect them back with high-yield cosmic interest once it unlocks!",
  alternates: {
    canonical: "https://luckify.vercel.app/time-capsule",
  },
  openGraph: {
    title: "Time Capsule of Hope - Lock & Yield Cosmic Interest | Lucky Vibes",
    description: "Write messages to your future self, lock Vibe Coins, and reap time-locked coin rewards in our space-themed digital capsule simulator.",
    type: "website",
  },
};

const CAPSULE_FAQS = [
  {
    question: "What is the Time Capsule of Hope?",
    answer: "The Time Capsule of Hope is a time-locked social progression minigame. You write down a message (a hope, prediction, or goal for your future self) and lock Vibe Coins inside the capsule. Once the lock timer expires, you can unseal the capsule to read your message and claim your wagered coins back with a high-yield interest multiplier.",
  },
  {
    question: "What are the interest multipliers and lock durations?",
    answer: "We offer multiple lock periods tailored for your journey: 1 Minute (Test: +5% yield), 1 Hour (+10% yield), 1 Day (+15% yield), 1 Week (+30% yield), 1 Month (+75% yield), and 1 Year (+150% yield). Choosing longer durations yields significantly higher returns!",
  },
  {
    question: "Is there any risk of losing my locked coins?",
    answer: "No. Your locked coins are safely secured inside the capsule document in Firestore. There is zero chance of losing them. Once the lock date passes, the 'Unseal' button becomes active, allowing you to instantly claim your coins plus the interest yield.",
  },
];

export default function Page() {
  const applicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Time Capsule of Hope Simulator",
    "operatingSystem": "All",
    "applicationCategory": "GameApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "An interactive digital time-locked capsule game where users lock Vibe Coins with messages to earn progressive cosmic yield interest."
  };

  return (
    <div className="flex flex-col items-center w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(applicationSchema) }}
      />
      <div className="w-full">
        <TimeCapsuleClient />
      </div>
      <AeoFaqSection items={CAPSULE_FAQS} />
    </div>
  );
}
