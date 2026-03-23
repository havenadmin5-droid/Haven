"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { profileUpdateSchema, type ProfileUpdateData } from "@/lib/validations/auth";
import type { ActionResult, Profile } from "@/lib/types";

/**
 * Fetch a public profile by ID (for viewing other users).
 * Uses service client to bypass RLS for reliable fetching.
 */
export async function getPublicProfile(userId: string): Promise<{ success: boolean; profile?: Profile; error?: string }> {
  if (!userId) {
    return { success: false, error: "No user ID provided" };
  }

  // Verify the requester is authenticated
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Use service client to bypass RLS for fetching public profile data
  const serviceClient = createServiceClient();

  const { data, error } = await serviceClient
    .from("profiles")
    .select(`
      id, username, avatar_emoji, avatar_url, show_photo,
      real_name, show_real_name, pronouns, city, profession,
      bio, skills, interests, looking_for, is_verified, is_available,
      is_anonymous, anonymous_alias, created_at,
      is_banned, deleted_at
    `)
    .eq("id", userId)
    .single();

  if (error) {
    console.error("[getPublicProfile] Database error:", error);
    return { success: false, error: "Profile not found" };
  }

  if (!data) {
    return { success: false, error: "Profile not found" };
  }

  // Check if profile should be hidden (only for viewing OTHER users)
  if (userId !== user.id && (data.deleted_at || data.is_banned)) {
    return { success: false, error: "This profile is not available" };
  }

  // Return sanitized profile (without deleted_at and is_banned flags)
  const { deleted_at, is_banned, ...publicProfile } = data;

  return { success: true, profile: publicProfile as Profile };
}

/**
 * Fetch own profile with full details.
 * Uses service client to bypass RLS.
 * Creates profile if it doesn't exist (handles trigger failure).
 */
export async function getOwnProfile(): Promise<{ success: boolean; profile?: Profile; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const serviceClient = createServiceClient();

  // First, try to fetch the profile
  const { data, error } = await serviceClient
    .from("profiles")
    .select(`
      id, username, avatar_emoji, avatar_url, show_photo,
      real_name, show_real_name, email, pronouns, city, profession,
      bio, skills, interests, looking_for, is_verified, is_available, is_banned, ban_reason,
      is_anonymous, anonymous_alias, anon_unlocked, anon_suspended,
      trust_score, role, theme_pref, deleted_at, created_at, updated_at
    `)
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[getOwnProfile] Query error:", error);
    return { success: false, error: "Failed to load profile" };
  }

  // If no profile exists, return an error
  // Profile should be created during registration - if missing, something went wrong
  if (!data) {
    console.error("[getOwnProfile] No profile found for user:", user.id);
    return { success: false, error: "Profile not found. Please try logging out and signing up again." };
  }

  return { success: true, profile: data as Profile };
}

export async function updateProfile(data: ProfileUpdateData): Promise<ActionResult> {
  const parsed = profileUpdateSchema.safeParse(data);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return { success: false, error: firstError?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Check if username is being changed and if it's taken
  if (parsed.data.username) {
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .ilike("username", parsed.data.username)
      .neq("id", user.id)
      .single();

    if (existingUser) {
      return { success: false, error: "Username is already taken" };
    }
  }

  // Build update object with only provided fields
  const updateData: Record<string, unknown> = {};

  if (parsed.data.username !== undefined) {
    updateData.username = parsed.data.username.toLowerCase();
  }
  if (parsed.data.avatar_emoji !== undefined) {
    updateData.avatar_emoji = parsed.data.avatar_emoji;
  }
  if (parsed.data.real_name !== undefined) {
    updateData.real_name = parsed.data.real_name || null;
  }
  if (parsed.data.show_real_name !== undefined) {
    updateData.show_real_name = parsed.data.show_real_name;
  }
  if (parsed.data.bio !== undefined) {
    updateData.bio = parsed.data.bio || null;
  }
  if (parsed.data.city !== undefined) {
    updateData.city = parsed.data.city;
  }
  if (parsed.data.profession !== undefined) {
    updateData.profession = parsed.data.profession;
  }
  if (parsed.data.pronouns !== undefined) {
    updateData.pronouns = parsed.data.pronouns || null;
  }
  if (parsed.data.skills !== undefined) {
    updateData.skills = parsed.data.skills;
  }
  if (parsed.data.interests !== undefined) {
    updateData.interests = parsed.data.interests;
  }
  if (parsed.data.looking_for !== undefined) {
    updateData.looking_for = parsed.data.looking_for;
  }
  if (parsed.data.is_available !== undefined) {
    updateData.is_available = parsed.data.is_available;
  }
  if (parsed.data.show_photo !== undefined) {
    updateData.show_photo = parsed.data.show_photo;
  }
  if (parsed.data.theme_pref !== undefined) {
    updateData.theme_pref = parsed.data.theme_pref;
  }

  const { error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", user.id);

  if (error) {
    console.error("Profile update error:", error);
    return { success: false, error: "Failed to update profile" };
  }

  revalidatePath("/profile");
  revalidatePath("/directory");

  return { success: true };
}
