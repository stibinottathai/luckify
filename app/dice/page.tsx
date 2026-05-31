import DiceGame from "@/components/games/DiceGame";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lucky Dice Roller Online 🎲 Roll 3D CSS Cubes | Lucky Vibes",
  description: "Roll up to three fully interactive 3D CSS dice! Customize target scoring, trigger clattering audio, and check your rolling luck score alignment instantly.",
  openGraph: {
    title: "Lucky Dice Roller Online 🎲 Roll 3D CSS Cubes | Lucky Vibes",
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
              Lucky Dice 🎲
            </h1>
            <p className="text-xs font-semibold text-deep-violet/50 dark:text-cream-soft/50 mt-1">
              Shake up the 3D dice machine and find out your rolling alignment!
            </p>
          </div>
        </div>

        <DiceGame />
      </div>
    </>
  );
}
