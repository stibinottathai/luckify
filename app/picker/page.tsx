import PickerGame from "@/components/games/PickerGame";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Number Picker 🎰 Run Staggered Lottery Ball Drops | Lucky Vibes",
  description: "Pick 6 lottery numbers, run the staggered ball drop machine, and chart your session draws frequencies in a custom inline SVG graph.",
};

export default function PickerPage() {
  return (
    <div className="flex-1 flex flex-col items-center">
      <div className="w-full max-w-2xl mb-6 flex flex-col items-start gap-3 select-none">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-deep-violet/40 hover:text-deep-violet dark:text-cream-soft/40 dark:hover:text-cream-soft transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Lobby
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold font-fredoka text-deep-violet dark:text-cream-soft leading-none">
            Lucky Number Picker 🎰
          </h1>
          <p className="text-xs font-semibold text-deep-violet/50 dark:text-cream-soft/50 mt-1">
            Pick 6 lucky lottery numbers, run the drop machine, and check how many matches you get!
          </p>
        </div>
      </div>

      <PickerGame />
    </div>
  );
}
