"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import type { ActionResult, AnonymousEligibility, BlockWithUser } from "@/lib/types";

/**
 * Check if current user is eligible for anonymous mode
 */
export async function checkAnonymousEligibility(): Promise<AnonymousEligibility> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { eligible: false, reason: "Not authenticated" };
  }

  const serviceClient = createServiceClient();

  // Use the database function to check eligibility
  const { data, error } = await serviceClient.rpc("check_anonymous_eligibility", {
    p_user_id: user.id,
  });

  if (error || !data || data.length === 0) {
    return { eligible: false, reason: "Unable to check eligibility" };
  }

  return {
    eligible: data[0].eligible,
    reason: data[0].reason,
  };
}

/**
 * Toggle anonymous mode
 */
export async function toggleAnonymousMode(
  enabled: boolean
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const serviceClient = createServiceClient();

  if (enabled) {
    // Check eligibility first
    const eligibility = await checkAnonymousEligibility();
    if (!eligibility.eligible) {
      return { success: false, error: eligibility.reason || "Not eligible for anonymous mode" };
    }

    // Generate anonymous alias
    const adjectives = ["Brave", "Gentle", "Wise", "Kind", "Bold", "Calm", "Swift", "Warm", "Free", "True"];
    const nouns = ["Phoenix", "Orchid", "River", "Moon", "Star", "Wave", "Cloud", "Leaf", "Bird", "Sun"];
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNum = Math.floor(Math.random() * 1000);
    const alias = `${randomAdj}${randomNoun}${randomNum}`;

    const { error } = await serviceClient
      .from("profiles")
      .update({
        is_anonymous: true,
        anonymous_alias: alias,
      })
      .eq("id", user.id);

    if (error) {
      return { success: false, error: "Failed to enable anonymous mode" };
    }
  } else {
    // Disable anonymous mode
    const { error } = await serviceClient
      .from("profiles")
      .update({
        is_anonymous: false,
        anonymous_alias: null,
      })
      .eq("id", user.id);

    if (error) {
      return { success: false, error: "Failed to disable anonymous mode" };
    }
  }

  revalidatePath("/safety");
  revalidatePath("/profile");
  return { success: true };
}

/**
 * Update privacy settings
 */
export async function updatePrivacySettings(settings: {
  show_real_name?: boolean;
  show_photo?: boolean;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("profiles")
    .update(settings)
    .eq("id", user.id);

  if (error) {
    return { success: false, error: "Failed to update settings" };
  }

  revalidatePath("/safety");
  revalidatePath("/profile");
  return { success: true };
}

/**
 * Get user's block list
 */
export async function getBlockList(): Promise<BlockWithUser[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("blocks")
    .select(`
      blocker_id,
      blocked_id,
      created_at,
      blocked_user:profiles!blocks_blocked_id_fkey (
        id,
        username,
        avatar_emoji,
        avatar_url,
        show_photo
      )
    `)
    .eq("blocker_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Get blocks error:", error);
    return [];
  }

  return (data ?? []).map((block) => ({
    blocker_id: block.blocker_id,
    blocked_id: block.blocked_id,
    created_at: block.created_at,
    blocked_user: (Array.isArray(block.blocked_user)
      ? block.blocked_user[0]
      : block.blocked_user) as BlockWithUser["blocked_user"],
  }));
}

/**
 * Block a user
 */
export async function blockUser(userId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  if (user.id === userId) {
    return { success: false, error: "Cannot block yourself" };
  }

  const { error } = await supabase
    .from("blocks")
    .insert({
      blocker_id: user.id,
      blocked_id: userId,
    });

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "User already blocked" };
    }
    return { success: false, error: "Failed to block user" };
  }

  revalidatePath("/safety");
  return { success: true };
}

/**
 * Unblock a user
 */
export async function unblockUser(userId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("blocks")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", userId);

  if (error) {
    return { success: false, error: "Failed to unblock user" };
  }

  revalidatePath("/safety");
  return { success: true };
}

/**
 * Export user data (GDPR-style)
 */
export async function exportUserData(): Promise<{ success: boolean; error?: string; data?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const serviceClient = createServiceClient();

  // Gather all user data
  const [
    { data: profile },
    { data: posts },
    { data: comments },
    { data: communityMemberships },
    { data: eventRsvps },
    { data: blocks },
  ] = await Promise.all([
    serviceClient.from("profiles").select("*").eq("id", user.id).single(),
    serviceClient.from("posts").select("*").eq("author_id", user.id),
    serviceClient.from("comments").select("*").eq("author_id", user.id),
    serviceClient.from("community_members").select("*, community:communities(name, slug)").eq("user_id", user.id),
    serviceClient.from("event_rsvps").select("*, event:events(title, event_date)").eq("user_id", user.id),
    serviceClient.from("blocks").select("*").eq("blocker_id", user.id),
  ]);

  const exportData = {
    exported_at: new Date().toISOString(),
    profile: profile ? {
      ...profile,
      // Exclude sensitive internal fields
      search_vector: undefined,
    } : null,
    posts: posts ?? [],
    comments: comments ?? [],
    community_memberships: communityMemberships ?? [],
    event_rsvps: eventRsvps ?? [],
    blocks: blocks ?? [],
  };

  return {
    success: true,
    data: JSON.stringify(exportData, null, 2),
  };
}

/**
 * Request account deletion (30-day soft delete)
 */
export async function requestAccountDeletion(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const serviceClient = createServiceClient();

  // Set deleted_at to start the 30-day countdown
  const { error } = await serviceClient
    .from("profiles")
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { success: false, error: "Failed to request deletion" };
  }

  // Sign out the user
  await supabase.auth.signOut();

  return { success: true };
}

/**
 * Cancel account deletion request
 */
export async function cancelAccountDeletion(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      deleted_at: null,
    })
    .eq("id", user.id);

  if (error) {
    return { success: false, error: "Failed to cancel deletion" };
  }

  revalidatePath("/safety");
  return { success: true };
}
