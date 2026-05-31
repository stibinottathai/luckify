import ScratchGame from "@/components/games/ScratchGame";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scratch Card 🪙 Rub Silver Covers to Reveal Prizes | Lucky Vibes",
  description: "Scratch off a metallic silver cover card using tactile canvas mouse sweeps to reveal secret win cards and bonus fortunes instantly.",
};

export default function ScratchPage() {
  return (
    <div className="flex-1 flex flex-col items-center">
      <div className="w-full max-w-lg mb-6 flex flex-col items-start gap-3 select-none">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-deep-violet/40 hover:text-deep-violet dark:text-cream-soft/40 dark:hover:text-cream-soft transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Lobby
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold font-fredoka text-deep-violet dark:text-cream-soft leading-none">
            Scratch Card 🪙
          </h1>
          <p className="text-xs font-semibold text-deep-violet/50 dark:text-cream-soft/50 mt-1">
            Rub off the silver layer and check what spectacular fortunes lay beneath!
          </p>
        </div>
      </div>

      <ScratchGame />
    </div>
  );
}
