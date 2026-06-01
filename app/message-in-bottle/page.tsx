import type { Metadata } from "next";
import MessageInBottleClient from "./MessageInBottleClient";
import AeoFaqSection from "@/components/ui/AeoFaqSection";

export const metadata: Metadata = {
  title: "Message in a Bottle Online - Cast Fortunes to Sea | Lucky Vibes",
  description: "Cast a glass bottle into the dynamic virtual ocean waves, tap to pop the animated cork, and watch your handwritten paper fortune scroll rise and unfurl.",
  openGraph: {
    title: "Message in a Bottle Online - Cast Fortunes to Sea | Lucky Vibes",
    description: "An animated ocean fortune-telling experience. Retrieve a bottle from the ocean and watch your paper scroll unfurl mystical blessings.",
    type: "website",
  },
};

const BOTTLE_FAQS = [
  {
    question: "How does the virtual Message in a Bottle work?",
    answer: "Players click or tap the floating glass bottle. An animated cork pops off, and a parchment paper scroll rises up and unfurls. The website dynamically queries an affirmation API or pulls from local curated marine fortunes, displaying a personalized ocean blessing."
  },
  {
    question: "Where do the fortunes in the bottle come from?",
    answer: "The game attempts to fetch fresh, positive daily affirmations from a free external API. If the API is offline or blocked, it seamlessly falls back to our curated list of ocean fortunes, ensuring instant loading and complete privacy."
  },
  {
    question: "How do you toss the bottle back into the ocean?",
    answer: "Once you have finished reading your scroll, press the 'Cast Another' button. The scroll will roll back up, enter the bottle, cork itself, and fly back into the waves with a splash animation, preparing the game for your next play."
  }
];

export default function Page() {
  const applicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Virtual Message in a Bottle Simulator",
    "operatingSystem": "All",
    "applicationCategory": "GameApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "An interactive digital simulation where players tap a glass bottle bobbing in water to pop its cork and read parchment scroll fortunes."
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How does the virtual Message in a Bottle work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Players click or tap the floating glass bottle. An animated cork pops off, and a parchment paper scroll rises up and unfurls. The website dynamically queries an affirmation API or pulls from local curated marine fortunes, displaying a personalized ocean blessing."
        }
      },
      {
        "@type": "Question",
        "name": "Where do the fortunes in the bottle come from?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The game attempts to fetch fresh, positive daily affirmations from a free external API. If the API is offline or blocked, it seamlessly falls back to our curated list of ocean fortunes, ensuring instant loading and complete privacy."
        }
      },
      {
        "@type": "Question",
        "name": "How do you toss the bottle back into the ocean?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Once you have finished reading your scroll, press the 'Cast Another' button. The scroll will roll back up, enter the bottle, cork itself, and fly back into the waves with a splash animation, preparing the game for your next play."
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
        <MessageInBottleClient />
      </div>
      <AeoFaqSection items={BOTTLE_FAQS} />
    </div>
  );
}
