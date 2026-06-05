import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";

const WheelGame = dynamic(() => import("@/components/games/WheelGame"), {
  loading: () => (
    <div className="w-full max-w-lg h-[500px] bg-white dark:bg-card border-2 border-deep-violet/10 dark:border-white/10 rounded-3xl animate-pulse flex flex-col items-center justify-center gap-3 text-deep-violet/30 dark:text-soft-cream/30 font-fredoka font-black">
      <span>Calibrating Fortune Wheel... 🎡</span>
    </div>
  ),
});

export const metadata: Metadata = {
  title: "Fortune Wheel Online - Spin Virtual Prize Wheel | Luckify",
  description: "Spin the Fortune Wheel with three daily spins, unlock more with points, and win rewards from 100 to the rare 1000-point section.",
  alternates: {
    canonical: "https://luckify.vercel.app/wheel",
  },
  openGraph: {
    title: "Fortune Wheel Online - Spin Virtual Prize Wheel | Luckify",
    description: "An interactive HTML5 Canvas points reward wheel with daily spins, optional extra spin packs, and eight prize sections.",
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
    "description": "An interactive HTML5 Canvas spinning wheel where users get three daily spins, can unlock extra spin packs with points, and can win point rewards across eight visible sections."
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
          "text": "The Fortune Wheel has eight visible sections: 1000 points, 800 points, 700 points, 500 points, 300 points, 200 points, 100 points, and Try Again. Users get three daily spins and can unlock three more spins for 200 points."
        }
      },
      {
        "@type": "Question",
        "name": "Are the prize wheel outcomes statistically fair?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The wheel displays eight equal sections, while the reward outcome uses weighted random selection so higher point rewards are harder to achieve and the 1000-point section is the rarest."
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
        {/* Titles */}
        <div className="w-full max-w-lg mb-3 sm:mb-6 flex flex-col items-start gap-2.5 select-none">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-deep-violet/40 hover:text-deep-violet dark:text-soft-cream/40 dark:hover:text-soft-cream transition-colors cursor-pointer group"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="group-hover:-translate-x-0.5 transition-transform"
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            Back to Lobby
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-fredoka text-deep-violet dark:text-soft-cream leading-none">
              Fortune Wheel 🎡
            </h1>
            <p className="text-xs font-semibold text-deep-violet/50 dark:text-soft-cream/50 mt-1">
              Use 3 daily spins, unlock extra spins with points, and chase the rare 1000-point reward.
            </p>
          </div>
        </div>


        {/* Main Wheel component */}
        <WheelGame />
      </div>
    </>
  );
}
