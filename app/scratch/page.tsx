import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import dynamic from "next/dynamic";

const ScratchGame = dynamic(() => import("@/components/games/ScratchGame"), {
  loading: () => (
    <div className="w-full max-w-lg h-[450px] bg-white dark:bg-card border-2 border-deep-violet/10 dark:border-white/10 rounded-3xl animate-pulse flex flex-col items-center justify-center gap-3 text-deep-violet/30 dark:text-cream-soft/30 font-fredoka font-black">
      <span>Preparing Scratch Layer... 🎟️</span>
    </div>
  ),
});

export const metadata: Metadata = {
  title: "Virtual Scratch Card Online - Rub Silver Covers | Lucky Vibes",
  description: "Rub away the silver metallic layer of our virtual Scratch Card! Sweep your cursor across the tactile canvas, reveal hidden fortunes, and see if you hit the daily jackpot.",
  openGraph: {
    title: "Virtual Scratch Card Online - Rub Silver Covers | Lucky Vibes",
    description: "An interactive tactile scratchcard simulator. Rub away the silver surface to reveal cosmic fortunes instantly.",
    type: "website",
  },
};

export default function ScratchPage() {
  const applicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Virtual Scratch Card Simulator",
    "operatingSystem": "All",
    "applicationCategory": "GameApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "An interactive HTML5 Canvas tactile simulation of a scratchcard lottery ticket where players rub away a silver cover to reveal symbols and awards."
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How does the online Scratch Card work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The game renders a silver glitter cover using HTML5 Canvas pixels. As you hold down your mouse or drag your finger across the screen, it clears the canvas pixels along your brush path, exposing the pre-determined lucky symbols underneath. Once you clear 60% of the surface, the card fully reveals itself."
        }
      },
      {
        "@type": "Question",
        "name": "Is the scratchcard game free?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, our digital scratch card is 100% free. There are no real-money transactions, purchases, or advertisements, providing a completely safe, fun, and satisfying scratching simulation."
        }
      },
      {
        "@type": "Question",
        "name": "What can you win on the Scratch Card?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "By scratching the card and matching three identical mystical symbols (like Stars, Crystals, or Four-Leaf Clovers), you can win daily vibes boosts or hit the mega jackpot, logging your score victory to the global ledger."
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
              Scratch Card 🪙
            </h1>
            <p className="text-xs font-semibold text-deep-violet/50 dark:text-cream-soft/50 mt-1">
              Rub off the silver layer and check what spectacular fortunes lay beneath!
            </p>
          </div>
        </div>

        <ScratchGame />
      </div>
    </>
  );
}
