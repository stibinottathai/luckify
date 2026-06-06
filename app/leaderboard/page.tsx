import type { Metadata } from "next";
import LeaderboardClient from "@/components/games/LeaderboardClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Leaderboard – Top Lucky Players | Luckify",
  description:
    "See the top 100 Luckify players ranked by total Lucky Points. Can you make it to the top?",
  alternates: {
    canonical: "https://luckify.vercel.app/leaderboard",
  },
  openGraph: {
    title: "Leaderboard – Top Lucky Players | Luckify",
    description:
      "Live rankings of the luckiest players on Luckify. Compete for the top spot!",
    type: "website",
  },
};

export default function LeaderboardPage() {
  return (
    <div className="flex-1 flex flex-col items-center">
      {/* Page title */}
      <div className="w-full max-w-2xl mb-6 flex flex-col items-start gap-3 select-none">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-deep-violet/40 hover:text-deep-violet dark:text-soft-cream/40 dark:hover:text-soft-cream transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Lobby
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-fredoka text-deep-violet dark:text-soft-cream leading-none">
            Leaderboard 🏆
          </h1>
          <p className="text-xs font-semibold text-deep-violet/50 dark:text-soft-cream/50 mt-1">
            Top 100 players ranked by Lucky Points — updated live.
          </p>
        </div>
      </div>

      <LeaderboardClient />
    </div>
  );
}
