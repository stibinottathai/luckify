import TreeGame from "@/components/games/TreeGame";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shaking Tree Simulator - Random Choice Generator | Lucky Vibes",
  description: "Shake the branches of the interactive SVG Shaking Tree! Add custom names or choices, trigger realistic physics shaking, and catch whichever name drops to decide your fate.",
  openGraph: {
    title: "Shaking Tree Simulator - Random Choice Generator | Lucky Vibes",
    description: "An interactive choice selector. Shake the magical SVG tree branches and catch whichever names fruit drops.",
    type: "website",
  },
};

export default function TreePage() {
  const applicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Virtual Shaking Tree Choice Picker",
    "operatingSystem": "All",
    "applicationCategory": "GameApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "An interactive SVG physics simulator where players type multiple custom options and shake a digital tree, prompting one option to drop as a falling fruit."
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How does the virtual Shaking Tree make decisions?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Users input their list of choices or names. These options are rendered as glowing, hanging fruits on our high-fidelity SVG vector tree. Clicking 'SHAKE THE TREE' triggers a wobble animation, releasing a random fruit which falls down to the ground based on simulated gravity physics."
        }
      },
      {
        "@type": "Question",
        "name": "How many names or custom options can I add?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "You can add up to 20 custom options or names, making the Shaking Tree an exceptional choice generator for picking random raffle winners, deciding what to eat, or selecting tasks."
        }
      },
      {
        "@type": "Question",
        "name": "Is the Shaking Tree randomizer unbiased?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, our selection algorithms weight all active options perfectly equally, ensuring that every fruit has an identical probability of being shaken loose for completely fair and unbiased name drawings."
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
              Shaking Tree 🌳
            </h1>
            <p className="text-xs font-semibold text-deep-violet/50 dark:text-cream-soft/50 mt-1">
              Customize options, shake the branches, and find out which option fate drops for you!
            </p>
          </div>
        </div>

        <TreeGame />
      </div>
    </>
  );
}
