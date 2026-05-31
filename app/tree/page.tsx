import TreeGame from "@/components/games/TreeGame";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shaking Tree 🌳 Catch Mystical Fortune Fruits | Lucky Vibes",
  description: "Shake the branches of the Shaking Tree! Customize options, add custom names, and catch whichever name drops to decide your fate.",
};

export default function TreePage() {
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
            Shaking Tree 🌳
          </h1>
          <p className="text-xs font-semibold text-deep-violet/50 dark:text-cream-soft/50 mt-1">
            Customize options, shake the branches, and find out which option fate drops for you!
          </p>
        </div>
      </div>

      <TreeGame />
    </div>
  );
}
