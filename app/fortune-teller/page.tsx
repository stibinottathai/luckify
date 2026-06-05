import type { Metadata } from "next";
import AeoFaqSection from "@/components/ui/AeoFaqSection";
import dynamic from "next/dynamic";

const FortuneTellerClient = dynamic(() => import("./FortuneTellerClient"), {
  loading: () => (
    <div className="w-full max-w-md h-[450px] bg-amber-500/5 border-2 border-amber-500/10 rounded-[2.5rem] animate-pulse flex flex-col items-center justify-center gap-3 text-amber-500/30 font-fredoka font-black mx-auto">
      <span>Folding Paper... 🔮</span>
    </div>
  ),
});

export const metadata: Metadata = {
  title: "Origami Fortune Teller - Play Virtual Cootie Catcher | Luckify",
  description: "Select colors and pick numbers to unfold the 3D digital paper cootie catcher and reveal your hidden daily fortune and cosmic fate.",
  alternates: {
    canonical: "https://luckify.vercel.app/fortune-teller",
  },
  openGraph: {
    title: "Origami Fortune Teller - Play Virtual Cootie Catcher | Luckify",
    description: "Fold your destiny! An interactive 3D cootie catcher paper game packed with mystical fortune-telling answers.",
    type: "website",
  },
};

const TELLER_FAQS = [
  {
    question: "What is a cootie catcher or origami fortune teller?",
    answer: "A cootie catcher (also called a fortune teller, chatterbox, or origami snapper) is a form of origami used in children's games. A player asks a question, and the operator steps through choices of colors and numbers, folding and squeezing the paper before opening a flap to reveal an answer."
  },
  {
    question: "How do you play the origami fortune teller online?",
    answer: "Simply click on one of the four color quadrants. The 3D paper model will spell out the color through animations. Next, click one of the numbers, and the paper will pinch open and closed that many times. Finally, tap one of the numbered flaps to lift the paper and reveal your secret fortune!"
  },
  {
    question: "Are the cootie catcher fortunes randomized?",
    answer: "Yes, our online origami fortune teller uses randomized algorithms paired with traditional positive blessings, so every play offers a fresh, positive, and insightful look into your daily vibrations."
  }
];

export default function Page() {
  const applicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Virtual Cootie Catcher Fortune Teller",
    "operatingSystem": "All",
    "applicationCategory": "GameApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "An interactive 3D digital folding paper game (cootie catcher) where users pick colors and numbers to reveal secret blessings and fortunes."
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is a cootie catcher or origami fortune teller?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "A cootie catcher (also called a fortune teller, chatterbox, or origami snapper) is a form of origami used in children's games. A player asks a question, and the operator steps through choices of colors and numbers, folding and squeezing the paper before opening a flap to reveal an answer."
        }
      },
      {
        "@type": "Question",
        "name": "How do you play the origami fortune teller online?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Simply click on one of the four color quadrants. The 3D paper model will spell out the color through animations. Next, click one of the numbers, and the paper will pinch open and closed that many times. Finally, tap one of the numbered flaps to lift the paper and reveal your secret fortune!"
        }
      },
      {
        "@type": "Question",
        "name": "Are the cootie catcher fortunes randomized?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, our online origami fortune teller uses randomized algorithms paired with traditional positive blessings, so every play offers a fresh, positive, and insightful look into your daily vibrations."
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
        <FortuneTellerClient />
      </div>
      <AeoFaqSection items={TELLER_FAQS} />
    </div>
  );
}
