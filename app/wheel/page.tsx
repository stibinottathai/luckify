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
  description: "Spin the Fortune Wheel of Lucky Vibes! Set spin speed timers and test your daily fortune outcomes instantly.",
  openGraph: {
    title: "Fortune Wheel Online - Spin Virtual Prize Wheel | Lucky Vibes",
    description: "An interactive HTML5 Canvas prize wheel spinner. Spin the wheel to claim daily blessings and fortunes.",
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
    "description": "An interactive HTML5 Canvas spinning wheel of fortune where users spin the wheel to trigger circular physical rotations and receive daily fortunes."
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
          "text": "The Fortune Wheel features several premium rewards, including the Big Prize, Lucky Star, Clover, Jackpot, Mystery, Hot Pick, Gem, and a Try Again segment. Each segment is color-coded and offers positive or negative score impacts based on where the wheel lands."
        }
      },
      {
        "@type": "Question",
        "name": "Are the prize wheel outcomes statistically fair?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, all stopping degrees are determined using standard secure random functions. Because each wedge occupies a perfectly equal angular width, every custom wedge has an identical statistical chance of winning for unbiased drawings."
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
        <div className="w-full max-w-lg mb-6 flex flex-col items-start gap-3 select-none">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-deep-violet/40 hover:text-deep-violet dark:text-cream-soft/40 dark:hover:text-cream-soft transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Lobby
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold font-fredoka text-deep-violet dark:text-cream-soft leading-none">
              Fortune Wheel 🎡
            </h1>
            <p className="text-xs font-semibold text-deep-violet/50 dark:text-cream-soft/50 mt-1">
              Give the wheel a spin and claim your daily lucky prize!
            </p>
          </div>
        </div>

        {/* Main Wheel component */}
        <WheelGame />
      </div>
    </>
  );
}
