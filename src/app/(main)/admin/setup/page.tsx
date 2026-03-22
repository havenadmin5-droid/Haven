"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Shield, Check, AlertTriangle } from "lucide-react";
import { Bloom } from "@/components/mascot";
import { useRouter } from "next/navigation";

export default function AdminSetupPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSetup = async () => {
    setStatus("loading");
    setMessage("");

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user?.email) {
        setStatus("error");
        setMessage("You must be logged in to set up admin access.");
        return;
      }

      const response = await fetch("/api/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus("success");
        setMessage(data.message);

        // Redirect to admin dashboard after 2 seconds
        setTimeout(() => {
          router.push("/admin");
        }, 2000);
      } else {
        setStatus("error");
        setMessage(data.error || "Failed to set up admin access");
      }
    } catch {
      setStatus("error");
      setMessage("An unexpected error occurred");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 text-center">
      <Bloom mood="happy" size="lg" className="mx-auto mb-6" />

      <div className="card">
        <div className="w-16 h-16 rounded-full bg-[var(--violet)]/10 flex items-center justify-center mx-auto mb-4">
          <Shield className="text-[var(--violet)]" size={32} />
        </div>

        <h1 className="text-2xl font-bold mb-2">Admin Setup</h1>
        <p className="text-[var(--text-muted)] mb-6">
          This page allows authorized users to activate their admin privileges.
          Only pre-approved email addresses can become admins.
        </p>

        {status === "idle" && (
          <button onClick={handleSetup} className="btn btn-brand w-full">
            <Shield size={18} />
            Activate Admin Access
          </button>
        )}

        {status === "loading" && (
          <div className="flex items-center justify-center gap-2 text-[var(--text-muted)]">
            <div className="w-5 h-5 border-2 border-[var(--violet)] border-t-transparent rounded-full animate-spin" />
            Setting up admin access...
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[var(--teal)]/10 flex items-center justify-center">
              <Check className="text-[var(--teal)]" size={24} />
            </div>
            <p className="text-[var(--teal)] font-medium">{message}</p>
            <p className="text-sm text-[var(--text-muted)]">
              Redirecting to admin dashboard...
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[var(--rose)]/10 flex items-center justify-center">
              <AlertTriangle className="text-[var(--rose)]" size={24} />
            </div>
            <p className="text-[var(--rose)] font-medium">{message}</p>
            <button
              onClick={() => setStatus("idle")}
              className="btn btn-secondary mt-2"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-[var(--text-muted)] mt-6">
        If you believe you should have admin access but are being denied,
        please contact the platform administrator.
      </p>
    </div>
  );
}
