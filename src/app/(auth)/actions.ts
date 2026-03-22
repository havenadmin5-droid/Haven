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
  const data = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Invalid credentials" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    // Generic error message to prevent enumeration
    return { success: false, error: "Invalid credentials" };
  }

  // Redirect happens after successful login
  redirect("/feed");
}

/**
 * Register action
 * Creates user account and triggers profile creation via database trigger
 */
export async function register(formData: FormData): Promise<ActionResult> {
  const data = {
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    username: formData.get("username"),
    city: formData.get("city"),
    profession: formData.get("profession"),
    avatarEmoji: formData.get("avatarEmoji"),
  };

  const parsed = registerSchema.safeParse(data);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return { success: false, error: firstError?.message ?? "Invalid input" };
  }

  const supabase = await createClient();

  // Check if username is taken (case-insensitive)
  const { data: existingUser } = await supabase
    .from("profiles")
    .select("id")
    .ilike("username", parsed.data.username)
    .single();

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
    console.error("Auth signup error:", authError);
    // Show actual error for debugging (change to generic in production)
    return { success: false, error: authError.message };
  }

  if (!authData.user) {
    return { success: false, error: "Unable to create account. Please try again." };
  }

  // Create profile using service role (bypasses RLS)
  const serviceClient = createServiceClient();
  const { error: profileError } = await serviceClient
    .from("profiles")
    .insert({
      id: authData.user.id,
      email: parsed.data.email,
      username: parsed.data.username.toLowerCase(),
      city: parsed.data.city,
      profession: parsed.data.profession,
      avatar_emoji: parsed.data.avatarEmoji,
    });

  if (profileError) {
    console.error("Profile creation error:", profileError);
    return { success: false, error: "Failed to create profile: " + profileError.message };
  }

  return {
    success: true,
    data: undefined,
  };
}

/**
 * Logout action
 */
export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

/**
 * Request password reset
 */
export async function requestPasswordReset(formData: FormData): Promise<ActionResult> {
  const email = formData.get("email");

  if (!email || typeof email !== "string") {
    // Always return success to prevent enumeration
    return { success: true };
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/reset-password`,
  });

  // Always return success to prevent enumeration
  return { success: true };
}
