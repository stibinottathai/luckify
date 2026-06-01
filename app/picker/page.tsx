import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import dynamic from "next/dynamic";

const PickerGame = dynamic(() => import("@/components/games/PickerGame"), {
  loading: () => (
    <div className="w-full max-w-2xl h-[500px] bg-white dark:bg-card border-2 border-deep-violet/10 dark:border-white/10 rounded-3xl animate-pulse flex flex-col items-center justify-center gap-3 text-deep-violet/30 dark:text-cream-soft/30 font-fredoka font-black">
      <span>Charging Lotto Machine... 🎰</span>
    </div>
  ),
});

export const metadata: Metadata = {
  title: "Lottery Number Picker Online - Free Lotto Ball Generator | Lucky Vibes",
  description: "Pick 6 lucky lottery numbers, run the dynamic staggered ball drop machine, and chart your session draws frequencies in a detailed custom inline SVG graph.",
  openGraph: {
    title: "Lottery Number Picker Online - Free Lotto Ball Generator | Lucky Vibes",
    description: "An interactive lottery number generator. Select 6 balls, trigger the drop machine, and review matching statistics.",
    type: "website",
  },
};

export default function PickerPage() {
  const applicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Virtual Lottery Number Picker",
    "operatingSystem": "All",
    "applicationCategory": "GameApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "An interactive digital lottery ball drawer where users select six numbers, run a physics-inspired drawing cage, and track matching statistics on a session histogram."
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How are the lottery numbers generated?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "When you start the lotto drop machine, the application dynamically draws 6 unique random numbers between 1 and 49, mimicking the authentic drawing style of national lotteries like Powerball or Mega Millions."
        }
      },
      {
        "@type": "Question",
        "name": "What is the custom lotto draw statistics graph?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Every time you execute a draw, the number picker logs the results. It builds a real-time session frequency histogram, displaying a custom SVG bar chart that shows which numbers are drawn most frequently over your entire play session."
        }
      },
      {
        "@type": "Question",
        "name": "Can I use this lottery picker to win the real lottery?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "This application is a statistical simulator and fortune game meant entirely for entertainment and vibes analysis. While it uses real, unbiased random numbers suitable for number suggestions, it does not guarantee wins in real-world commercial lotteries."
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
        <div className="w-full max-w-2xl mb-6 flex flex-col items-start gap-3 select-none">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-deep-violet/40 hover:text-deep-violet dark:text-cream-soft/40 dark:hover:text-cream-soft transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Lobby
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold font-fredoka text-deep-violet dark:text-cream-soft leading-none">
              Lucky Number Picker 🎰
            </h1>
            <p className="text-xs font-semibold text-deep-violet/50 dark:text-cream-soft/50 mt-1">
              Pick 6 lucky lottery numbers, run the drop machine, and check how many matches you get!
            </p>
          </div>
        </div>

        <PickerGame />
      </div>
    </>
  );
}
