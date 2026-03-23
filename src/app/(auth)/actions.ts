"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { loginSchema, registerSchema } from "@/lib/validations/auth";
import type { ActionResult } from "@/lib/types";

/**
 * Login action
 * Returns generic error messages to prevent email enumeration
 */
export async function login(formData: FormData): Promise<ActionResult> {
  try {
    // Validate formData exists
    if (!formData) {
      return { success: false, error: "Invalid request" };
    }

    const data = {
      email: formData.get("email") ?? "",
      password: formData.get("password") ?? "",
    };

    const parsed = loginSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "Invalid credentials" };
    }

    const supabase = await createClient();
    if (!supabase) {
      console.error("Failed to create Supabase client");
      return { success: false, error: "Server error. Please try again." };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      // Generic error message to prevent enumeration
      console.error("Login error:", error?.message ?? "Unknown error");
      return { success: false, error: "Invalid credentials" };
    }

    // Redirect happens after successful login
    redirect("/feed");
  } catch (error) {
    // Re-throw redirect errors (Next.js uses throw for redirects)
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    console.error("Login exception:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Register action
 * Creates user account and triggers profile creation via database trigger
 */
export async function register(formData: FormData): Promise<ActionResult> {
  try {
    // Validate formData exists
    if (!formData) {
      return { success: false, error: "Invalid request" };
    }

    const data = {
      email: formData.get("email") ?? "",
      password: formData.get("password") ?? "",
      confirmPassword: formData.get("confirmPassword") ?? "",
      username: formData.get("username") ?? "",
      city: formData.get("city") ?? "",
      profession: formData.get("profession") ?? "",
      avatarEmoji: formData.get("avatarEmoji") ?? "🌈",
    };

    const parsed = registerSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error?.errors?.[0];
      return { success: false, error: firstError?.message ?? "Invalid input" };
    }

    const supabase = await createClient();
    const serviceClient = createServiceClient();

    // Validate clients were created
    if (!supabase || !serviceClient) {
      console.error("Failed to create Supabase clients");
      return { success: false, error: "Server error. Please try again." };
    }

    // Check if username is taken (case-insensitive)
    // Use service client because RLS requires authenticated user
    const { data: existingUser, error: usernameCheckError } = await serviceClient
      .from("profiles")
      .select("id")
      .ilike("username", parsed.data.username)
      .maybeSingle();

    if (usernameCheckError) {
      console.error("Username check error:", usernameCheckError?.message ?? "Unknown error");
      return { success: false, error: "Unable to verify username. Please try again." };
    }

    if (existingUser) {
      return { success: false, error: "Username is already taken" };
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
      },
    });

    if (authError) {
      console.error("Auth signup error:", authError?.message ?? "Unknown error");
      return { success: false, error: authError?.message ?? "Unable to create account" };
    }

    if (!authData?.user?.id) {
      return { success: false, error: "Unable to create account. Please try again." };
    }

    // Update profile with user-provided data using service role (bypasses RLS)
    // Note: A basic profile is already created by the handle_new_user trigger,
    // so we update it with the user's chosen username, city, profession, etc.
    const { error: profileError } = await serviceClient
      .from("profiles")
      .update({
        username: parsed.data.username?.toLowerCase() ?? "",
        city: parsed.data.city ?? "Other",
        profession: parsed.data.profession ?? "Other",
        avatar_emoji: parsed.data.avatarEmoji ?? "🌈",
      })
      .eq("id", authData.user.id);

    if (profileError) {
      console.error("Profile update error:", profileError?.message ?? "Unknown error");
      return { success: false, error: "Failed to update profile. Please try again." };
    }

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error("Registration exception:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Logout action
 */
export async function logout(): Promise<void> {
  try {
    const supabase = await createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    redirect("/");
  } catch (error) {
    // Re-throw redirect errors (Next.js uses throw for redirects)
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    console.error("Logout error:", error);
    redirect("/");
  }
}

/**
 * Request password reset
 */
export async function requestPasswordReset(formData: FormData): Promise<ActionResult> {
  try {
    const email = formData?.get("email") ?? null;

    if (!email || typeof email !== "string" || email.trim().length === 0) {
      // Always return success to prevent enumeration
      return { success: true };
    }

    const supabase = await createClient();
    if (!supabase) {
      console.error("Failed to create Supabase client");
      // Still return success to prevent enumeration
      return { success: true };
    }

    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/reset-password`,
    });

    // Always return success to prevent enumeration
    return { success: true };
  } catch (error) {
    console.error("Password reset error:", error);
    // Still return success to prevent enumeration
    return { success: true };
  }
}
