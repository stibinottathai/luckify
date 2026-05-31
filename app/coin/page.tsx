import CoinFlipGame from "@/components/games/CoinFlipGame";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Flip a Coin 🪙 Toss the Cosmic Golden Coin | Lucky Vibes",
  description: "Toss the mystical 3D cosmic golden coin! Choose Heads or Tails, flip the coin in space, and see where fate aligns your path.",
};

export default function CoinPage() {
  return (
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
            Flip a Coin 🪙
          </h1>
          <p className="text-xs font-semibold text-deep-violet/50 dark:text-cream-soft/50 mt-1">
            Choose Heads or Tails, toss the golden cosmic coin, and let destiny reveal your alignment!
          </p>
        </div>
      </div>

      <CoinFlipGame />
    </div>
  );
}
