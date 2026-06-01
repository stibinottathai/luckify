"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error safely to console or reporting services
    console.error("Uncaught client-side interface error caught by Next.js boundary:", error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[75vh] w-full text-center select-none">
      {/* Decorative Outer Circle container */}
      <div className="relative w-24 h-24 rounded-full border-4 border-alert-coral/20 bg-alert-coral/5 flex items-center justify-center mb-6 animate-pulse">
        <AlertTriangle className="w-10 h-10 text-alert-coral drop-shadow-[0_0_12px_rgba(255,107,107,0.4)]" />
      </div>

      {/* Styled Branded Header */}
      <h2 className="text-3xl font-black font-fredoka text-deep-violet dark:text-cream-soft uppercase tracking-wide leading-tight mb-3">
        Destiny Misaligned... 🌀
      </h2>
      
      {/* Informational Subtext */}
      <p className="text-sm font-semibold text-deep-violet/60 dark:text-cream-soft/60 max-w-md leading-relaxed mb-8">
        An unexpected cosmic alignment error occurred while rendering this game. This might be due to temporary browser constraints, WebAudio limits, or canvas errors.
      </p>

      {/* Action Buttons Container */}
      <div className="flex flex-col sm:flex-row items-center gap-4 justify-center w-full max-w-sm">
        {/* Recovery Reset Button */}
        <button
          onClick={() => reset()}
          className="w-full py-3.5 px-6 rounded-2xl font-black text-sm select-none cursor-pointer tracking-wider shadow-md bg-primary-gold hover:bg-amber-300 text-[#1E1145] hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 font-fredoka uppercase"
        >
          <RefreshCw className="w-4 h-4 animate-spin-slow" />
          Realight Destiny 🔮
        </button>

        {/* Home Lobby Link */}
        <Link
          href="/"
          className="w-full py-3.5 px-6 rounded-2xl font-black text-sm select-none cursor-pointer tracking-wider border border-deep-violet/10 dark:border-white/10 hover:bg-deep-violet/5 dark:hover:bg-white/5 text-deep-violet dark:text-cream-soft active:scale-95 transition-all flex items-center justify-center gap-2 font-fredoka uppercase"
        >
          <Home className="w-4 h-4" />
          Back to Lobby
        </Link>
      </div>

      {/* Error Digest (Debug info shown only in non-production or discrete footer) */}
      {error.digest && (
        <span className="text-[10px] font-mono text-deep-violet/30 dark:text-cream-soft/30 mt-8 tracking-widest uppercase">
          Error Signature: {error.digest}
        </span>
      )}
    </div>
  );
}
