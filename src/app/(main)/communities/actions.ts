"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult, CommunityTag } from "@/lib/types";
import { COMMUNITY_TAGS } from "@/lib/constants";

// Validation schemas
const createCommunitySchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(60, "Name must be 60 characters or less"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional(),
  tag: z.enum(COMMUNITY_TAGS as [CommunityTag, ...CommunityTag[]]),
  avatar_emoji: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
  is_private: z.boolean().default(false),
});

export type CreateCommunityData = z.infer<typeof createCommunitySchema>;

// Generate URL-safe slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 50);
}

export async function createCommunity(data: CreateCommunityData): Promise<ActionResult & { slug?: string }> {
  const parsed = createCommunitySchema.safeParse(data);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0];
    return { success: false, error: firstError?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Check if user is anonymous (can't create communities)
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_anonymous")
    .eq("id", user.id)
    .single();

  if (profile?.is_anonymous) {
    return { success: false, error: "Anonymous users cannot create communities" };
  }

  // Generate slug
  let slug = generateSlug(parsed.data.name);

  // Check if slug exists, append number if needed
  const serviceClient = createServiceClient();
  const { data: existing } = await serviceClient
    .from("communities")
    .select("slug")
    .ilike("slug", `${slug}%`);

  if (existing && existing.length > 0) {
    slug = `${slug}-${existing.length + 1}`;
  }

  // Create community
  const { data: community, error } = await serviceClient
    .from("communities")
    .insert({
      name: parsed.data.name,
      slug,
      description: parsed.data.description ?? null,
      tag: parsed.data.tag,
      avatar_emoji: parsed.data.avatar_emoji,
      color: parsed.data.color,
      is_private: parsed.data.is_private,
      created_by: user.id,
    })
    .select("id, slug")
    .single();

  if (error) {
    console.error("Create community error:", error);
    if (error.code === "23505") {
      return { success: false, error: "A community with this name already exists" };
    }
    return { success: false, error: "Failed to create community" };
  }

  // Add creator as admin member
  await serviceClient
    .from("community_members")
    .insert({
      community_id: community.id,
      user_id: user.id,
      role: "admin",
      status: "active",
    });

  revalidatePath("/communities");
  return { success: true, slug: community.slug };
}

export async function joinCommunity(communityId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Check if community exists and is not private
  const { data: community } = await supabase
    .from("communities")
    .select("is_private")
    .eq("id", communityId)
    .single();

  if (!community) {
    return { success: false, error: "Community not found" };
  }

  const serviceClient = createServiceClient();

  // Check if already a member
  const { data: existingMember } = await serviceClient
    .from("community_members")
    .select("status")
    .eq("community_id", communityId)
    .eq("user_id", user.id)
    .single();

  if (existingMember) {
    if (existingMember.status === "active") {
      return { success: false, error: "Already a member" };
    }
    if (existingMember.status === "banned") {
      return { success: false, error: "You have been banned from this community" };
    }
    // Update pending to active for public communities
    if (!community.is_private && existingMember.status === "pending") {
      await serviceClient
        .from("community_members")
        .update({ status: "active" })
        .eq("community_id", communityId)
        .eq("user_id", user.id);
      revalidatePath("/communities");
      return { success: true };
    }
  }

  // Join community
  const { error } = await serviceClient
    .from("community_members")
    .insert({
      community_id: communityId,
      user_id: user.id,
      role: "member",
      status: community.is_private ? "pending" : "active",
    });

  if (error) {
    console.error("Join community error:", error);
    return { success: false, error: "Failed to join community" };
  }

  revalidatePath("/communities");
  return { success: true };
}

export async function leaveCommunity(communityId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const serviceClient = createServiceClient();

  // Check if user is the only admin
  const { data: admins } = await serviceClient
    .from("community_members")
    .select("user_id")
    .eq("community_id", communityId)
    .eq("role", "admin")
    .eq("status", "active");

  if (admins && admins.length === 1 && admins[0]?.user_id === user.id) {
    return { success: false, error: "You're the only admin. Transfer admin role before leaving." };
  }

  const { error } = await serviceClient
    .from("community_members")
    .delete()
    .eq("community_id", communityId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Leave community error:", error);
    return { success: false, error: "Failed to leave community" };
  }

  revalidatePath("/communities");
  return { success: true };
}
