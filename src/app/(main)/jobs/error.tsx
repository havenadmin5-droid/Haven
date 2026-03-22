"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Bloom } from "@/components/mascot";

export default function JobsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Jobs error:", error);
  }, [error]);

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="card max-w-md mx-auto text-center">
        <Bloom mood="happy" size="md" className="mx-auto mb-4 opacity-50" />
        <div className="w-12 h-12 rounded-full bg-[var(--rose)]/10 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="text-[var(--rose)]" size={24} />
        </div>
        <h2 className="text-lg font-bold mb-2">Unable to load jobs</h2>
        <p className="text-[var(--text-muted)] text-sm mb-4">
          We had trouble loading jobs. Please try again.
        </p>
        <button onClick={reset} className="btn btn-brand">
          <RefreshCw size={16} />
          Try Again
        </button>
      </div>
    </div>
  );
}
