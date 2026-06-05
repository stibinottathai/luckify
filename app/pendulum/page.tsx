import type { Metadata } from "next";
import AeoFaqSection from "@/components/ui/AeoFaqSection";
import PendulumClient from "./PendulumClient";

export const metadata: Metadata = {
  title: "Pendulum Divination - Virtual Dowsing Pendulum | Luckify",
  description: "Focus your energy and query on the digital canvas, release the cosmic silver pendulum bob on its string, and let physical gravity simulate the oracle's answer.",
  alternates: {
    canonical: "https://luckify.vercel.app/pendulum",
  },
  openGraph: {
    title: "Pendulum Divination - Virtual Dowsing Pendulum | Luckify",
    description: "Type your query, release the silver pendulum, and let physical forces guide your cosmic yes or no decision.",
    type: "website",
  },
};

const PENDULUM_FAQS = [
  {
    question: "What is pendulum divination (dowsing)?",
    answer: "Pendulum divination, or dowsing, is a spiritual practice where a heavy object (a crystal, metal bob, or ring) suspended on a string is used to seek guidance. The direction of the swing (clockwise, counterclockwise, horizontal, or vertical) is interpreted as a binary yes or no answer from the subconscious or the spiritual realm."
  },
  {
    question: "How does the virtual pendulum physics simulation work?",
    answer: "The Luckify simulator utilizes real mathematical physics formulas on a HTML5 Canvas. It calculates rope constraints, angular acceleration, gravity pulling, and kinetic damping over time. The pendulum's initial release coordinates are affected by your query and intention, producing an organic swing sequence that settles on YES (clockwise spiral) or NO (counterclockwise spiral)."
  },
  {
    question: "How do you ask the virtual dowsing pendulum a question?",
    answer: "Type a binary query in the text box. Then click 'Release Pendulum'. The system initiates the swing coordinates based on a combination of time variables, intent vectors, and physical drag, rendering an organic oscillation path on the screen."
  }
];

export default function Page() {
  const applicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Virtual Pendulum Divination Simulator",
    "operatingSystem": "All",
    "applicationCategory": "GameApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "An interactive HTML5 Canvas physical simulation of a dowsing pendulum used for decision making and seeking yes-or-no guidance."
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is pendulum divination (dowsing)?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Pendulum divination, or dowsing, is a spiritual practice where a heavy object (a crystal, metal bob, or ring) suspended on a string is used to seek guidance. The direction of the swing (clockwise, counterclockwise, horizontal, or vertical) is interpreted as a binary yes or no answer from the subconscious or the spiritual realm."
        }
      },
      {
        "@type": "Question",
        "name": "How does the virtual pendulum physics simulation work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The Luckify simulator utilizes real mathematical physics formulas on a HTML5 Canvas. It calculates rope constraints, angular acceleration, gravity pulling, and kinetic damping over time. The pendulum's initial release coordinates are affected by your query and intention, producing an organic swing sequence that settles on YES (clockwise spiral) or NO (counterclockwise spiral)."
        }
      },
      {
        "@type": "Question",
        "name": "How do you ask the virtual dowsing pendulum a question?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Type a binary query in the text box. Then click 'Release Pendulum'. The system initiates the swing coordinates based on a combination of time variables, intent vectors, and physical drag, rendering an organic oscillation path on the screen."
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
        <PendulumClient />
      </div>
      <AeoFaqSection items={PENDULUM_FAQS} />
    </div>
  );
}
