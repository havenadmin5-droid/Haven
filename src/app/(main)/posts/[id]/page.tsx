import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { PostDetailClient } from "./PostDetailClient";
import type { PostWithAuthor, CommentWithAuthor } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PostDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch post
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select(
      `
      id,
      author_id,
      community_id,
      content,
      image_urls,
      is_anonymous,
      is_flagged,
      is_hidden,
      reaction_count,
      comment_count,
      created_at,
      updated_at,
      author:profiles!posts_author_id_fkey (
        id,
        username,
        avatar_emoji,
        avatar_url,
        show_photo,
        is_anonymous,
        anonymous_alias,
        is_verified
      ),
      community:communities (
        id,
        name,
        slug,
        avatar_emoji
      )
    `
    )
    .eq("id", id)
    .single();

  if (postError || !post) {
    notFound();
  }

  // Check if post is hidden
  if (post.is_hidden) {
    notFound();
  }

  // Get user's reactions for this post
  const { data: reactions } = await supabase
    .from("post_reactions")
    .select("reaction_type")
    .eq("post_id", id)
    .eq("user_id", user.id);

  const userReactions = reactions?.map((r) => r.reaction_type) ?? [];

  // Fetch comments
  const { data: comments, error: commentsError } = await supabase
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
    .eq("post_id", id)
    .eq("is_hidden", false)
    .order("created_at", { ascending: true });

  if (commentsError) {
    console.error("Comments fetch error:", commentsError);
  }

  // Transform post
  const authorData = Array.isArray(post.author) ? post.author[0] : post.author;
  const communityData = Array.isArray(post.community)
    ? post.community[0]
    : post.community;

  const postWithAuthor: PostWithAuthor = {
    id: post.id,
    author_id: post.author_id,
    community_id: post.community_id,
    content: post.content,
    image_urls: post.image_urls ?? [],
    is_anonymous: post.is_anonymous,
    is_flagged: post.is_flagged,
    is_hidden: post.is_hidden,
    reaction_count: post.reaction_count,
    comment_count: post.comment_count,
    created_at: post.created_at,
    updated_at: post.updated_at,
    author: authorData as PostWithAuthor["author"],
    community: communityData as PostWithAuthor["community"],
    user_reactions: userReactions,
  };

  // Transform comments and build thread structure
  const commentsWithAuthor = (comments ?? []).map((comment) => {
    const commentAuthorData = Array.isArray(comment.author)
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
      author: commentAuthorData as CommentWithAuthor["author"],
      replies: [] as CommentWithAuthor[],
    };
  });

  // Build threaded structure
  const commentMap = new Map<string, CommentWithAuthor>();
  const rootComments: CommentWithAuthor[] = [];

  commentsWithAuthor.forEach((comment) => {
    commentMap.set(comment.id, comment);
  });

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

  // Get user profile for anonymous status
  const { data: profile } = await supabase
    .from("profiles")
    .select("anon_unlocked")
    .eq("id", user.id)
    .single();

  return (
    <PostDetailClient
      post={postWithAuthor}
      comments={rootComments}
      currentUserId={user.id}
      canPostAnonymous={profile?.anon_unlocked ?? false}
    />
  );
}
