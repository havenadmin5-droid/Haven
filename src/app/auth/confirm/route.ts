import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Email confirmation handler
 * Verifies the OTP token and redirects to the app
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const redirectTo = requestUrl.searchParams.get("redirectTo") ?? "/feed";

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
  }

  // Return to login with error if something went wrong
  return NextResponse.redirect(
    new URL("/login?error=email_verification_failed", request.url)
  );
}
