"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import { moderateContent } from "@/lib/moderation/perspective";
import type { ActionResult, CommentWithAuthor } from "@/lib/types";

/**
 * Create a new comment on a post
 */
export async function createComment(
  postId: string,
  content: string,
  parentId: string | null = null,
  isAnonymous: boolean = false
): Promise<ActionResult & { comment?: CommentWithAuthor }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Validate content
  if (!content?.trim()) {
    return { success: false, error: "Comment content is required" };
  }

  if (content.length > 1000) {
    return { success: false, error: "Comment must be 1000 characters or less" };
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "is_anonymous, anon_unlocked, is_banned, username, avatar_emoji, avatar_url, show_photo, anonymous_alias, is_verified"
    )
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
    return {
      success: false,
      error: "Anonymous mode is not available for your account",
    };
  }

  // Verify post exists
  const { data: post } = await supabase
    .from("posts")
    .select("id, community_id")
    .eq("id", postId)
    .single();

  if (!post) {
    return { success: false, error: "Post not found" };
  }

  // If replying to a comment, verify parent exists
  if (parentId) {
    const { data: parentComment } = await supabase
      .from("comments")
      .select("id")
      .eq("id", parentId)
      .eq("post_id", postId)
      .single();

    if (!parentComment) {
      return { success: false, error: "Parent comment not found" };
    }
  }

  // Content moderation
  const moderation = await moderateContent(content);
  if (!moderation.allowed) {
    return { success: false, error: moderation.message ?? "Content violates community guidelines" };
  }

  const serviceClient = createServiceClient();

  // Create comment (flagged content is allowed but will be reviewed by moderators)
  const { data: comment, error } = await serviceClient
    .from("comments")
    .insert({
      post_id: postId,
      author_id: user.id,
      parent_id: parentId,
      content: content.trim(),
      is_anonymous: isAnonymous,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Create comment error:", error);
    return { success: false, error: "Failed to create comment" };
  }

  // Increment comment count on post
  await serviceClient.rpc("increment_comment_count", { p_post_id: postId });

  // Build response with author info
  const commentWithAuthor: CommentWithAuthor = {
    ...comment,
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
    replies: [],
  };

  revalidatePath(`/posts/${postId}`);

  return { success: true, comment: commentWithAuthor };
}

/**
 * Delete a comment (author only)
 */
export async function deleteComment(
  commentId: string,
  postId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify ownership
  const { data: comment } = await supabase
    .from("comments")
    .select("author_id")
    .eq("id", commentId)
    .single();

  if (!comment) {
    return { success: false, error: "Comment not found" };
  }

  if (comment.author_id !== user.id) {
    return { success: false, error: "You can only delete your own comments" };
  }

  const serviceClient = createServiceClient();

  const { error } = await serviceClient
    .from("comments")
    .delete()
    .eq("id", commentId);

  if (error) {
    console.error("Delete comment error:", error);
    return { success: false, error: "Failed to delete comment" };
  }

  // Decrement comment count
  await serviceClient.rpc("decrement_comment_count", { p_post_id: postId });

  revalidatePath(`/posts/${postId}`);
  return { success: true };
}

/**
 * Fetch comments for a post
 */
export async function fetchComments(
  postId: string
): Promise<CommentWithAuthor[]> {
  const supabase = await createClient();

  const { data: comments, error } = await supabase
    .from("comments")
    .select(
      `
      id,
      post_id,
      author_id,
      parent_id,
      content,
      is_anonymous,
      is_hidden,
      created_at,
      author:profiles!comments_author_id_fkey (
        id,
        username,
        avatar_emoji,
        avatar_url,
        show_photo,
        is_anonymous,
        anonymous_alias,
        is_verified
      )
    `
    )
    .eq("post_id", postId)
    .eq("is_hidden", false)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Fetch comments error:", error);
    return [];
  }

  // Transform to CommentWithAuthor and build thread structure
  const commentsWithAuthor = (comments ?? []).map((comment) => {
    const authorData = Array.isArray(comment.author)
      ? comment.author[0]
      : comment.author;
    return {
      id: comment.id,
      post_id: comment.post_id,
      author_id: comment.author_id,
      parent_id: comment.parent_id,
      content: comment.content,
      is_anonymous: comment.is_anonymous,
      is_hidden: comment.is_hidden,
      created_at: comment.created_at,
      author: authorData as CommentWithAuthor["author"],
      replies: [] as CommentWithAuthor[],
    };
  });

  // Build threaded structure
  const commentMap = new Map<string, CommentWithAuthor>();
  const rootComments: CommentWithAuthor[] = [];

  // First pass: create map
  commentsWithAuthor.forEach((comment) => {
    commentMap.set(comment.id, comment);
  });

  // Second pass: build tree
  commentsWithAuthor.forEach((comment) => {
    if (comment.parent_id) {
      const parent = commentMap.get(comment.parent_id);
      if (parent) {
        parent.replies = parent.replies ?? [];
        parent.replies.push(comment);
      }
    } else {
      rootComments.push(comment);
    }
  });

  return rootComments;
}
