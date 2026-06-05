import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";

const AstroVibesClient = dynamic(() => import("./AstroVibesClient"), {
  loading: () => (
    <div className="w-full max-w-2xl mx-auto h-[500px] bg-white dark:bg-card border-2 border-deep-violet/10 dark:border-white/10 rounded-3xl animate-pulse flex flex-col items-center justify-center gap-3 text-deep-violet/30 dark:text-cream-soft/30 font-fredoka font-black">
      <span>Aligning daily horoscope signals... 🌌</span>
    </div>
  ),
});

export const metadata: Metadata = {
  title: "Astro-Vibes Alignment - Daily Horoscopes & Zodiac Luck | Lucky Vibes",
  description: "Align your zodiac sign, reveal daily cosmic forecasts for Luck, Love, and Career, and claim your daily cosmic coin alignment bonus!",
  alternates: {
    canonical: "https://luckify.vercel.app/astro-vibes",
  },
  openGraph: {
    title: "Astro-Vibes Alignment - Daily Horoscopes & Zodiac Luck | Lucky Vibes",
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
          className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-deep-violet/40 hover:text-deep-violet dark:text-cream-soft/40 dark:hover:text-cream-soft transition-colors cursor-pointer group"
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
          <h1 className="text-2xl sm:text-3xl font-extrabold font-fredoka text-deep-violet dark:text-cream-soft leading-none">
            Astro-Vibes Alignment 🌌
          </h1>
          <p className="text-xs font-semibold text-deep-violet/50 dark:text-cream-soft/50 mt-1">
            Align your zodiac sign, reveal daily cosmic forecasts, and claim daily coin rewards.
          </p>
        </div>
      </div>

      <AstroVibesClient />
    </div>
  );
}
