import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Auth callback handler for email verification
 * Exchanges the code for a session and redirects to the app
 */
export async function GET(request: NextRequest) {
  try {
    // Validate request
    if (!request?.url) {
      return NextResponse.redirect(new URL("/login?error=invalid_request", "http://localhost:3000"));
    }

    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams?.get("code") ?? null;
    const redirectTo = requestUrl.searchParams?.get("redirectTo") ?? "/feed";

    // Validate redirectTo to prevent open redirect attacks
    const safeRedirectTo = redirectTo?.startsWith("/") ? redirectTo : "/feed";

    if (code && typeof code === "string" && code.length > 0) {
      const supabase = await createClient();

      if (!supabase) {
        console.error("Failed to create Supabase client");
        return NextResponse.redirect(
          new URL("/login?error=server_error", request.url)
        );
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Auth callback error:", error?.message ?? "Unknown error");
        return NextResponse.redirect(
          new URL("/login?error=auth_callback_error", request.url)
        );
      }
    }

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(new URL(safeRedirectTo, request.url));
  } catch (error) {
    console.error("Auth callback exception:", error);
    return NextResponse.redirect(
      new URL("/login?error=unexpected_error", request.url)
    );
  }
}
