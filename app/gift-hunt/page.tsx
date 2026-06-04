import type { Metadata } from "next";
import GiftHuntGame from "@/components/games/GiftHuntGame";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Lucky Gift Hunt - Open Daily Mystery Gift Boxes | Lucky Vibes",
  description: "Pick 3 mystery gift boxes every day and discover rare coin rewards up to 5000. Can you find the legendary jackpot gift on Lucky Vibes?",
  alternates: {
    canonical: "https://luckify.vercel.app/gift-hunt",
  },
  openGraph: {
    title: "Lucky Gift Hunt - Open Daily Mystery Gift Boxes | Lucky Vibes",
    description: "Pick 3 mystery gift boxes every day. Discover rare rewards up to 5000 coins!",
    url: "https://luckify.vercel.app/gift-hunt",
    type: "website",
  },
};

export default function GiftHuntPage() {
  return (
    <div className="w-full flex flex-col items-center gap-6 pb-20 relative">
      {/* Background gradients specific to Gift Hunt */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-[#120A2C]/0 to-transparent pointer-events-none -z-10" />

      {/* Navigation */}
      <div className="w-full max-w-5xl flex justify-start">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-deep-violet/50 dark:text-cream-soft/50 hover:text-primary-gold dark:hover:text-primary-gold transition-colors font-fredoka py-2 px-4 rounded-full bg-deep-violet/5 dark:bg-white/5 hover:bg-deep-violet/10 dark:hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Garden
        </Link>
      </div>

      <GiftHuntGame />
    </div>
  );
}
