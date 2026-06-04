import type { Metadata } from "next";
import dynamic from "next/dynamic";

const LeaderboardClient = dynamic(
  () => import("@/components/games/LeaderboardClient"),
  {
    loading: () => (
      <div className="w-full max-w-2xl mx-auto space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-2xl bg-deep-violet/5 dark:bg-white/5 animate-pulse"
          />
        ))}
      </div>
    ),
  }
);

export const metadata: Metadata = {
  title: "Leaderboard – Top Lucky Players | Lucky Vibes",
  description:
    "See the top 100 Lucky Vibes players ranked by total Lucky Points. Can you make it to the top?",
  alternates: {
    canonical: "https://luckify.vercel.app/leaderboard",
  },
  openGraph: {
    title: "Leaderboard – Top Lucky Players | Lucky Vibes",
    description:
      "Live rankings of the luckiest players on Lucky Vibes. Compete for the top spot!",
    type: "website",
  },
};

export default function LeaderboardPage() {
  return (
    <div className="flex-1 flex flex-col items-center">
      {/* Page title */}
      <div className="w-full max-w-2xl mb-6 flex flex-col items-start gap-1 select-none">
        <h1 className="text-2xl sm:text-3xl font-extrabold font-fredoka text-deep-violet dark:text-cream-soft leading-none">
          Leaderboard 🏆
        </h1>
        <p className="text-xs font-semibold text-deep-violet/50 dark:text-cream-soft/50 mt-1">
          Top 100 players ranked by Lucky Points — updated live.
        </p>
      </div>

      <LeaderboardClient />
    </div>
  );
}
