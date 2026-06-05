import type { Metadata } from "next";
import AeoFaqSection from "@/components/ui/AeoFaqSection";
import dynamic from "next/dynamic";

const Magic8BallClient = dynamic(() => import("./Magic8BallClient"), {
  loading: () => (
    <div className="w-full max-w-sm h-[420px] bg-slate-900/20 border-2 border-slate-900/30 rounded-[2.5rem] animate-pulse flex flex-col items-center justify-center gap-3 text-slate-500/30 font-fredoka font-black mx-auto">
      <span>Gazing into Sphere... 🔮</span>
    </div>
  ),
});

export const metadata: Metadata = {
  title: "Magic 8-Ball Online - Shake the Virtual Cosmic Ball | Luckify",
  description: "Ask any yes or no question, shake the realistic 3D gloss-black sphere, and reveal the cosmic oracle's mysterious floating wisdom answers.",
  alternates: {
    canonical: "https://luckify.vercel.app/magic-8-ball",
  },
  openGraph: {
    title: "Magic 8-Ball Online - Shake the Virtual Cosmic Ball | Luckify",
    description: "Seek instant cosmic validation! Ask your question and shake the 3D Magic 8-Ball oracle online.",
    type: "website",
  },
};

const BALL_FAQS = [
  {
    question: "How does the Magic 8-Ball make decisions?",
    answer: "The traditional Magic 8-Ball contains a 20-sided die (icosahedron) floating in dark blue liquid. When you ask a question and shake the ball, one of the 20 faces containing a positive, negative, or neutral answer rises to the viewing window."
  },
  {
    question: "How do you shake the virtual Magic 8-Ball?",
    answer: "Type a yes-or-no question into the oracle input box, then press the 'Ask the Oracle' button. The 3D ball will shake dynamically using CSS keyframe animations, agitating the void before slowly revealing the floating text answer."
  },
  {
    question: "Is the online Magic 8-Ball simulation accurate?",
    answer: "Yes, our simulation perfectly mirrors the exact 20 traditional answers of the physical toy (10 positive, 5 neutral, and 5 negative), matching authentic statistical probabilities for a faithful virtual divination experience."
  }
];

export default function Page() {
  const applicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Virtual Magic 8-Ball Oracle",
    "operatingSystem": "All",
    "applicationCategory": "GameApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "An interactive 3D digital simulation of the classic Magic 8-Ball toy where users ask questions and shake the ball to reveal floating answer triangles."
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How does the Magic 8-Ball make decisions?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The traditional Magic 8-Ball contains a 20-sided die (icosahedron) floating in dark blue liquid. When you ask a question and shake the ball, one of the 20 faces containing a positive, negative, or neutral answer rises to the viewing window."
        }
      },
      {
        "@type": "Question",
        "name": "How do you shake the virtual Magic 8-Ball?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Type a yes-or-no question into the oracle input box, then press the 'Ask the Oracle' button. The 3D ball will shake dynamically using CSS keyframe animations, agitating the void before slowly revealing the floating text answer."
        }
      },
      {
        "@type": "Question",
        "name": "Is the online Magic 8-Ball simulation accurate?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, our simulation perfectly mirrors the exact 20 traditional answers of the physical toy (10 positive, 5 neutral, and 5 negative), matching authentic statistical probabilities for a faithful virtual divination experience."
        }
      }
    ]
  };

  return (
    <div className="flex flex-col items-center w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(applicationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="w-full">
        <Magic8BallClient />
      </div>
      <AeoFaqSection items={BALL_FAQS} />
    </div>
  );
}
