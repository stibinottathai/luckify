import WheelGame from "@/components/games/WheelGame";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function WheelPage() {
  return (
    <div className="flex-1 flex flex-col items-center">
      {/* Navigation and titles */}
      <div className="w-full max-w-lg mb-6 flex flex-col items-start gap-3 select-none">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-deep-violet/40 hover:text-deep-violet dark:text-cream-soft/40 dark:hover:text-cream-soft transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Lobby
        </Link>
        <div>
          <h2 className="text-3xl font-extrabold font-fredoka text-deep-violet dark:text-cream-soft leading-none">
            Fortune Wheel 🎡
          </h2>
          <p className="text-xs font-semibold text-deep-violet/50 dark:text-cream-soft/50 mt-1">
            Give the wheel a spin and claim your daily lucky prize!
          </p>
        </div>
      </div>

      {/* Main Wheel component */}
      <WheelGame />
    </div>
  );
}
