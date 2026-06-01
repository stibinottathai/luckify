import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import dynamic from "next/dynamic";

const CoinFlipGame = dynamic(() => import("@/components/games/CoinFlipGame"), {
  loading: () => (
    <div className="w-full max-w-md h-[450px] bg-white dark:bg-card border-2 border-deep-violet/10 dark:border-white/10 rounded-3xl animate-pulse flex flex-col items-center justify-center gap-3 text-deep-violet/30 dark:text-cream-soft/30 font-fredoka font-black">
      <span>Aligning Gravity... 🪙</span>
    </div>
  ),
});

export const metadata: Metadata = {
  title: "Flip a Coin Online - Free 3D Cosmic Coin Toss | Lucky Vibes",
  description: "Toss the mystical 3D cosmic golden coin in space! Choose Heads or Tails, flip the virtual coin with realistic tumbling physics, and see where fate aligns your path.",
  openGraph: {
    title: "Flip a Coin Online - Free 3D Cosmic Coin Toss | Lucky Vibes",
    description: "Predict Heads or Tails and toss the golden cosmic coin online to resolve decisions instantly.",
    type: "website",
  },
};

export default function CoinPage() {
  const applicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Virtual 3D Coin Flip Simulator",
    "operatingSystem": "All",
    "applicationCategory": "GameApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "An interactive 3D digital simulation of a coin toss where players select Heads or Tails and trigger an advanced parabolic tumbling animation."
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Is a coin flip truly 50/50?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, a standard coin toss has a statistical probability of exactly 50% for Heads and 50% for Tails, making it the most universally accepted method for making fair, unbiased binary decisions."
        }
      },
      {
        "@type": "Question",
        "name": "How does the virtual coin flip simulator work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The Lucky Vibes coin flip simulator uses an organic random number generator combined with custom 3D CSS animations. When you click 'FLIP THE COIN', the coin travels along a parabolic path in space, rotating on its Y and X axes before landing cleanly on the selected outcome face."
        }
      },
      {
        "@type": "Question",
        "name": "Can I use the online coin toss for decision making?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Absolutely! The online coin flip simulator is perfect for settling quick arguments, making binary choices, or seeking instant guidance in a completely unbiased, fun, and visually spectacular cosmic setting."
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
        <div className="w-full max-w-5xl mb-6 flex flex-col items-start gap-3 select-none">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-deep-violet/40 hover:text-deep-violet dark:text-cream-soft/40 dark:hover:text-cream-soft transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Lobby
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold font-fredoka text-deep-violet dark:text-cream-soft leading-none">
              Flip a Coin 🪙
            </h1>
            <p className="text-xs font-semibold text-deep-violet/50 dark:text-cream-soft/50 mt-1">
              Choose Heads or Tails, toss the golden cosmic coin, and let destiny reveal your alignment!
            </p>
          </div>
        </div>

        <CoinFlipGame />
      </div>
    </>
  );
}
