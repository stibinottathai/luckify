import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import dynamic from "next/dynamic";

const WheelGame = dynamic(() => import("@/components/games/WheelGame"), {
  loading: () => (
    <div className="w-full max-w-lg h-[500px] bg-white dark:bg-card border-2 border-deep-violet/10 dark:border-white/10 rounded-3xl animate-pulse flex flex-col items-center justify-center gap-3 text-deep-violet/30 dark:text-cream-soft/30 font-fredoka font-black">
      <span>Calibrating Fortune Wheel... 🎡</span>
    </div>
  ),
});

export const metadata: Metadata = {
  title: "Fortune Wheel Online - Spin Virtual Prize Wheel | Lucky Vibes",
  description: "Spin the Fortune Wheel with 100 coins per play and win coin rewards from 100 to the rare 1000-coin section.",
  openGraph: {
    title: "Fortune Wheel Online - Spin Virtual Prize Wheel | Lucky Vibes",
    description: "An interactive HTML5 Canvas coin reward wheel with eight sections and a 100-coin spin cost.",
    type: "website",
  },
};

export default function WheelPage() {
  const applicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Virtual Fortune Wheel Spinner",
    "operatingSystem": "All",
    "applicationCategory": "GameApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "An interactive HTML5 Canvas spinning wheel where users spend 100 coins per spin and can win coin rewards across eight visible sections."
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How does the virtual Fortune Wheel work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The prize wheel is rendered dynamically using a HTML5 `<canvas>` element. When a user triggers a spin, the wheel is accelerated to a high angular velocity, which then decays due to friction physics, stopping precisely at a wedge indicated by a mechanical clapper indicator at the top."
        }
      },
      {
        "@type": "Question",
        "name": "What prizes can I win on the Fortune Wheel?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The Fortune Wheel has eight visible sections: 1000 coins, 800 coins, 700 coins, 500 coins, 300 coins, 200 coins, 100 coins, and Try Again. Each spin costs 100 coins, and the 1000-coin section is the rarest outcome."
        }
      },
      {
        "@type": "Question",
        "name": "Are the prize wheel outcomes statistically fair?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The wheel displays eight equal sections, while the reward outcome uses weighted random selection so higher coin rewards are harder to achieve and the 1000-coin section is the rarest."
        }
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(applicationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="flex-1 flex flex-col items-center">
        {/* Navigation and titles */}
        <div className="w-full max-w-lg mb-3 sm:mb-6 flex flex-col items-start gap-2 sm:gap-3 select-none">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-deep-violet/40 hover:text-deep-violet dark:text-cream-soft/40 dark:hover:text-cream-soft transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Lobby
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-fredoka text-deep-violet dark:text-cream-soft leading-none">
              Fortune Wheel 🎡
            </h1>
            <p className="text-xs font-semibold text-deep-violet/50 dark:text-cream-soft/50 mt-1">
              Spin for 100 coins and win up to the rare 1000-coin reward.
            </p>
          </div>
        </div>

        {/* Main Wheel component */}
        <WheelGame />
      </div>
    </>
  );
}
