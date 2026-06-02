import Link from "next/link";
import { ArrowLeft, Sparkles, Coins, Trophy } from "lucide-react";
import type { Metadata } from "next";
import dynamic from "next/dynamic";

const DiceGame = dynamic(() => import("@/components/games/DiceGame"), {
  loading: () => (
    <div className="w-full max-w-lg h-[450px] bg-white dark:bg-card border-2 border-deep-violet/10 dark:border-white/10 rounded-3xl animate-pulse flex flex-col items-center justify-center gap-3 text-deep-violet/30 dark:text-cream-soft/30 font-fredoka font-black">
      <span>Preparing Dice Roller... 🎲</span>
    </div>
  ),
});

export const metadata: Metadata = {
  title: "Lucky Dice Roller Online - Roll 3D CSS Cubes | Lucky Vibes",
  description: "Roll up to three fully interactive 3D CSS dice! Customize target scoring, trigger clattering audio, and check your rolling luck score alignment instantly.",
  openGraph: {
    title: "Lucky Dice Roller Online - Roll 3D CSS Cubes | Lucky Vibes",
    description: "An interactive 3D virtual dice rolling simulator. Roll up to three customizable dice with realistic rotational physics.",
    type: "website",
  },
};

export default function DicePage() {
  const applicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Virtual 3D Dice Roller",
    "operatingSystem": "All",
    "applicationCategory": "GameApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "An interactive digital dice rolling application rendering up to three fully rotating 3D CSS cubes with custom roll targets and real-time sound synthesis."
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How do you roll a virtual die in 3D?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The Lucky Vibes dice simulator uses complete HTML/CSS 3D transforms. When a user clicks 'Roll Dice', the cubes spin dynamically on multiple axes using advanced keyframe animations and settle on the correct face coordinate based on a random number outcome."
        }
      },
      {
        "@type": "Question",
        "name": "Can I roll multiple dice at once?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, our interactive dice machine allows you to select between rolling one, two, or three dice simultaneously, making it suitable for classic tabletop board games, roleplaying games, or statistical probability study."
        }
      },
      {
        "@type": "Question",
        "name": "Are the virtual dice rolls truly random?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, all dice results are calculated using standard secure cryptographic client-side random generation, ensuring complete fairness and unbiased rolling distributions for every roll."
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
        
        {/* Widened header with complete Quick Guide & Rules alert box */}
        <div className="w-full max-w-5xl mx-auto px-4 mb-8 select-none font-fredoka">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-deep-violet/5 dark:border-white/5 pb-5">
            
            {/* Title Block */}
            <div className="flex flex-col items-start gap-2.5">
              <Link
                href="/"
                className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-deep-violet/40 hover:text-deep-violet dark:text-cream-soft/40 dark:hover:text-cream-soft transition-colors cursor-pointer group"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                Back to Lobby
              </Link>
              <div>
                <h1 className="text-3xl font-black text-deep-violet dark:text-cream-soft leading-none uppercase tracking-wider">
                  Lucky Dice 🎲
                </h1>
                <p className="text-xs font-semibold text-deep-violet/50 dark:text-cream-soft/50 mt-1">
                  Roll the 3D dice machine, complete your skin sets, and score points!
                </p>
              </div>
            </div>

            {/* Glowing Rules & Rewards Callout Card */}
            <div className="bg-gradient-to-r from-primary-gold/15 via-[#2D1B69]/5 dark:via-white/5 to-transparent border border-primary-gold/30 rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 max-w-md shadow-sm">
              <div className="p-3 rounded-2xl bg-primary-gold/10 text-primary-gold border border-primary-gold/20 flex-shrink-0 self-start sm:self-center animate-pulse">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-1">
                <h4 className="text-xs font-black text-primary-gold uppercase tracking-wider leading-none">
                  Quick Guide & Rules
                </h4>
                <ul className="text-[10px] font-bold text-deep-violet/60 dark:text-cream-soft/60 space-y-1 mt-1 normal-case leading-normal list-disc pl-4">
                  <li>🎁 <span className="font-extrabold">1 Free Daily Roll</span> (Additional rolls cost <span className="font-extrabold text-primary-gold">200 points</span> each, max 5/day).</li>
                  <li>⚡ <span className="font-extrabold">Roll Multiplier</span>: Win points equal to <span className="font-extrabold text-primary-gold font-mono">Roll Value × 100</span>! (e.g. 5 = +500 pts).</li>
                  <li>✨ <span className="font-extrabold">Skins Vault</span>: 15% drop rate to unlock or craft 15+ collectible 3D skins!</li>
                </ul>
              </div>
            </div>

          </div>
        </div>

        <DiceGame />
      </div>
    </>
  );
}
