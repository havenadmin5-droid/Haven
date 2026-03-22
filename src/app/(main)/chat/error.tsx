"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Bloom } from "@/components/mascot";

export default function ChatError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Chat error:", error);
  }, [error]);

  return (
    <div className="h-full flex items-center justify-center p-4">
      <div className="card max-w-md text-center">
        <Bloom mood="happy" size="md" className="mx-auto mb-4 opacity-50" />
        <div className="w-12 h-12 rounded-full bg-[var(--rose)]/10 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="text-[var(--rose)]" size={24} />
        </div>
        <h2 className="text-lg font-bold mb-2">Unable to load chat</h2>
        <p className="text-[var(--text-muted)] text-sm mb-4">
          We had trouble connecting to the chat. Please try again.
        </p>
        <button onClick={reset} className="btn btn-brand">
          <RefreshCw size={16} />
          Try Again
        </button>
      </div>
    </div>
  );
}
