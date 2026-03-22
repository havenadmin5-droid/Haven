"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { profileUpdateSchema, type ProfileUpdateData } from "@/lib/validations/auth";
import type { ActionResult } from "@/lib/types";

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
