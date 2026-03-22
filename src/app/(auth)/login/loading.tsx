import { Loader2 } from "lucide-react";

export default function LoginLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-[var(--violet)] mb-4" />
      <p className="text-[var(--text-secondary)]">Loading...</p>
    </div>
  );
}
