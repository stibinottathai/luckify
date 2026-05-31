import type { Metadata } from "next";
import LuckyEnvelopeClient from "./LuckyEnvelopeClient";
import AeoFaqSection from "@/components/ui/AeoFaqSection";

export const metadata: Metadata = {
  title: "Lucky Envelope 🧧 Open Virtual Red Packets (Hongbao) | Lucky Vibes",
  description: "Receive a traditional lucky red envelope, fold away its 3D golden seal, and reveal your daily blessing of prosperity, wealth, luck, and happiness.",
  openGraph: {
    title: "Lucky Envelope 🧧 Open Virtual Red Packets (Hongbao) | Lucky Vibes",
    description: "An elegant virtual Hongbao simulation. Open your red packet to reveal mystical fortunes and daily luck blessings.",
    type: "website",
  },
};

const ENVELOPE_FAQS = [
  {
    question: "What is a Lucky Envelope (Hongbao)?",
    answer: "A Lucky Envelope, known as Hongbao in Chinese, is a traditional red packet filled with money given during holidays like Chinese New Year or special occasions. It symbolizes good luck, prosperity, and protection from evil spirits."
  },
  {
    question: "How does the virtual Lucky Envelope work?",
    answer: "In the Lucky Vibes virtual envelope simulator, you simply tap the red packet to pop the gold seal and open it. It reveals a random Chinese cultural blessing and your lucky numbers, updating your daily vibes score."
  },
  {
    question: "Is the digital red packet simulator free to use?",
    answer: "Yes, the Lucky Envelope simulation on Lucky Vibes is 100% free with no registration, fees, advertisements, or limits. You can open red envelopes for daily fortune blessings as many times as you wish."
  }
];

export default function Page() {
  const applicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Lucky Envelope Simulator",
    "operatingSystem": "All",
    "applicationCategory": "GameApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "Receive a digital traditional red packet (Hongbao), unfold its 3D golden seal, and reveal a daily blessing of prosperity and lucky numbers."
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is a Lucky Envelope (Hongbao)?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "A Lucky Envelope, known as Hongbao in Chinese, is a traditional red packet filled with money given during holidays like Chinese New Year or special occasions. It symbolizes good luck, prosperity, and protection from evil spirits."
        }
      },
      {
        "@type": "Question",
        "name": "How does the virtual Lucky Envelope work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "In the Lucky Vibes virtual envelope simulator, you simply tap the red packet to pop the gold seal and open it. It reveals a random Chinese cultural blessing and your lucky numbers, updating your daily vibes score."
        }
      },
      {
        "@type": "Question",
        "name": "Is the digital red packet simulator free to use?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, the Lucky Envelope simulation on Lucky Vibes is 100% free with no registration, fees, advertisements, or limits. You can open red envelopes for daily fortune blessings as many times as you wish."
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
        <LuckyEnvelopeClient />
      </div>
      <AeoFaqSection items={ENVELOPE_FAQS} />
    </div>
  );
}
