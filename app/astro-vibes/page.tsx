import type { Metadata } from "next";
import AstroVibesClient from "./AstroVibesClient";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Astro-Vibes Alignment - Daily Horoscopes & Zodiac Luck | Luck ഉണ്ടോ ?",
  description: "Align your zodiac sign, reveal daily cosmic forecasts for Luck, Love, and Career, and claim your daily cosmic coin alignment bonus!",
  alternates: {
    canonical: "https://luckify.vercel.app/astro-vibes",
  },
  openGraph: {
    title: "Astro-Vibes Alignment - Daily Horoscopes & Zodiac Luck | Luck ഉണ്ടോ ?",
    description: "Align your zodiac sign, reveal daily cosmic forecasts for Luck, Love, and Career, and claim your daily cosmic coin alignment bonus!",
    type: "website",
  },
};

export default function AstroVibesPage() {
  return (
    <div className="flex-1 flex flex-col items-center">
      <div className="w-full max-w-2xl mb-3 sm:mb-6 flex flex-col items-start gap-2.5 select-none">
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
            Astro-Vibes Alignment 🌌
          </h1>
          <p className="text-xs font-semibold text-deep-violet/50 dark:text-soft-cream/50 mt-1">
            Align your zodiac sign, reveal daily cosmic forecasts, and claim daily coin rewards.
          </p>
        </div>
      </div>

      <AstroVibesClient />
    </div>
  );
}
