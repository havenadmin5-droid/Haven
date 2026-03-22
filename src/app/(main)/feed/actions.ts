"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import { moderateContent } from "@/lib/moderation/perspective";
import type { ActionResult, PostWithAuthor } from "@/lib/types";

/**
 * Create a new post
 */
export async function createPost(
  formData: FormData
): Promise<ActionResult & { post?: PostWithAuthor }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const content = formData.get("content") as string;
  const isAnonymous = formData.get("is_anonymous") === "true";
  const communityId = formData.get("community_id") as string | null;

  // Validate content
  if (!content?.trim()) {
    return { success: false, error: "Content is required" };
  }

  if (content.length > 2000) {
    return { success: false, error: "Content must be 2000 characters or less" };
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_anonymous, anon_unlocked, is_banned, username, avatar_emoji, avatar_url, show_photo, anonymous_alias, is_verified")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { success: false, error: "Profile not found" };
  }

  if (profile.is_banned) {
    return { success: false, error: "Your account has been suspended" };
  }

  // Anonymous mode check
  if (isAnonymous && !profile.anon_unlocked) {
    return { success: false, error: "Anonymous mode is not available for your account" };
  }

  // If posting to a community, verify membership
  if (communityId) {
    const { data: membership } = await supabase
      .from("community_members")
      .select("status")
      .eq("community_id", communityId)
      .eq("user_id", user.id)
      .single();

    if (!membership || membership.status !== "active") {
      return { success: false, error: "You must be an active member to post in this community" };
    }
  }

  // Content moderation
  const moderation = await moderateContent(content);
  if (!moderation.allowed) {
    return { success: false, error: moderation.message ?? "Content violates community guidelines" };
  }

  const serviceClient = createServiceClient();

  // Create post
  const { data: post, error } = await serviceClient
    .from("posts")
    .insert({
      author_id: user.id,
      community_id: communityId || null,
      content: content.trim(),
      image_urls: [],
      is_anonymous: isAnonymous,
      is_flagged: moderation.flagged ?? false,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Create post error:", error);
    return { success: false, error: "Failed to create post" };
  }

  // Fetch community info if applicable
  let community = null;
  if (communityId) {
    const { data: communityData } = await supabase
      .from("communities")
      .select("id, name, slug, avatar_emoji")
      .eq("id", communityId)
      .single();
    community = communityData;
  }

  // Build response with author info
  const postWithAuthor: PostWithAuthor = {
    ...post,
    author: {
      id: user.id,
      username: profile.username,
      avatar_emoji: profile.avatar_emoji,
      avatar_url: profile.avatar_url,
      show_photo: profile.show_photo,
      is_anonymous: isAnonymous,
      anonymous_alias: profile.anonymous_alias,
      is_verified: profile.is_verified,
    },
    community,
    user_reactions: [],
  };

  revalidatePath("/feed");
  if (communityId) {
    revalidatePath("/communities");
  }

  return { success: true, post: postWithAuthor };
}

/**
 * Toggle a reaction on a post
 */
export async function toggleReaction(
  postId: string,
  reactionType: number
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Validate reaction type (0-9)
  if (reactionType < 0 || reactionType > 9) {
    return { success: false, error: "Invalid reaction type" };
  }

  const serviceClient = createServiceClient();

  // Check if reaction already exists
  const { data: existingReaction } = await serviceClient
    .from("post_reactions")
    .select("*")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .eq("reaction_type", reactionType)
    .single();

  if (existingReaction) {
    // Remove reaction
    const { error } = await serviceClient
      .from("post_reactions")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .eq("reaction_type", reactionType);

    if (error) {
      console.error("Remove reaction error:", error);
      return { success: false, error: "Failed to remove reaction" };
    }

    // Decrement reaction count
    await serviceClient.rpc("decrement_reaction_count", { post_id: postId });
  } else {
    // Add reaction
    const { error } = await serviceClient
      .from("post_reactions")
      .insert({
        post_id: postId,
        user_id: user.id,
        reaction_type: reactionType,
      });

    if (error) {
      console.error("Add reaction error:", error);
      return { success: false, error: "Failed to add reaction" };
    }

    // Increment reaction count
    await serviceClient.rpc("increment_reaction_count", { post_id: postId });
  }

  return { success: true };
}

/**
 * Delete a post (author only)
 */
export async function deletePost(postId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify ownership
  const { data: post } = await supabase
    .from("posts")
    .select("author_id")
    .eq("id", postId)
    .single();

  if (!post) {
    return { success: false, error: "Post not found" };
  }

  if (post.author_id !== user.id) {
    return { success: false, error: "You can only delete your own posts" };
  }

  const serviceClient = createServiceClient();

  const { error } = await serviceClient.from("posts").delete().eq("id", postId);

  if (error) {
    console.error("Delete post error:", error);
    return { success: false, error: "Failed to delete post" };
  }

  revalidatePath("/feed");
  return { success: true };
}
