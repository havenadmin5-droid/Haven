import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

// Valid OTP types for email verification
const VALID_OTP_TYPES: EmailOtpType[] = ["signup", "recovery", "invite", "magiclink", "email_change", "email"];

/**
 * Email confirmation handler
 * Verifies the OTP token and redirects to the app
 */
export async function GET(request: NextRequest) {
  try {
    // Validate request
    if (!request?.url) {
      return NextResponse.redirect(new URL("/login?error=invalid_request", "http://localhost:3000"));
    }

    const requestUrl = new URL(request.url);
    const token_hash = requestUrl.searchParams?.get("token_hash") ?? null;
    const typeParam = requestUrl.searchParams?.get("type") ?? null;
    const redirectTo = requestUrl.searchParams?.get("redirectTo") ?? "/feed";

    // Validate redirectTo to prevent open redirect attacks
    const safeRedirectTo = redirectTo?.startsWith("/") ? redirectTo : "/feed";

    // Validate type is a valid EmailOtpType
    const type: EmailOtpType | null = typeParam && VALID_OTP_TYPES.includes(typeParam as EmailOtpType)
      ? (typeParam as EmailOtpType)
      : null;

    if (token_hash && typeof token_hash === "string" && token_hash.length > 0 && type) {
      const supabase = await createClient();

      if (!supabase) {
        console.error("Failed to create Supabase client");
        return NextResponse.redirect(
          new URL("/login?error=server_error", request.url)
        );
      }

      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      });

      if (!error) {
        return NextResponse.redirect(new URL(safeRedirectTo, request.url));
      }

      console.error("OTP verification error:", error?.message ?? "Unknown error");
    }

    // Return to login with error if something went wrong
    return NextResponse.redirect(
      new URL("/login?error=email_verification_failed", request.url)
    );
  } catch (error) {
    console.error("Email confirmation exception:", error);
    return NextResponse.redirect(
      new URL("/login?error=unexpected_error", request.url)
    );
  }
}
