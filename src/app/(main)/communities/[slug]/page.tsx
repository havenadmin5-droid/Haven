import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { CommunityDetailClient } from "./CommunityDetailClient";
import type { PostWithAuthor, CommunityMemberRole } from "@/lib/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CommunityDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch community
  const { data: community, error: communityError } = await supabase
    .from("communities")
    .select("*")
    .eq("slug", slug)
    .single();

  if (communityError || !community) {
    notFound();
  }

  // Check membership
  const { data: membership } = await supabase
    .from("community_members")
    .select("role, status")
    .eq("community_id", community.id)
    .eq("user_id", user.id)
    .single();

  const isMember = membership?.status === "active";
  const memberRole = membership?.role as CommunityMemberRole | undefined;

  // If private and not a member, show restricted view
  if (community.is_private && !isMember) {
    return (
      <CommunityDetailClient
        community={community}
        posts={[]}
        isMember={false}
        memberRole={undefined}
        currentUserId={user.id}
        isPrivateRestricted={true}
      />
    );
  }

  // Fetch posts for this community
  const { data: posts, error: postsError } = await supabase
    .from("posts")
    .select(`
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
      )
    `)
    .eq("community_id", community.id)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .limit(20);

  if (postsError) {
    console.error("Posts fetch error:", postsError);
  }

  // Get user's reactions for these posts
  const postIds = (posts ?? []).map((p) => p.id);
  const userReactions: Map<string, number[]> = new Map();

  if (postIds.length > 0) {
    const { data: reactions } = await supabase
      .from("post_reactions")
      .select("post_id, reaction_type")
      .eq("user_id", user.id)
      .in("post_id", postIds);

    if (reactions) {
      reactions.forEach((r) => {
        const existing = userReactions.get(r.post_id) ?? [];
        existing.push(r.reaction_type);
        userReactions.set(r.post_id, existing);
      });
    }
  }

  // Transform posts with author info and user reactions
  const postsWithAuthor: PostWithAuthor[] = (posts ?? []).map((post) => {
    // Supabase returns the related record, handle both array and object cases
    const authorData = Array.isArray(post.author) ? post.author[0] : post.author;
    return {
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
      user_reactions: userReactions.get(post.id) ?? [],
    };
  });

  return (
    <CommunityDetailClient
      community={community}
      posts={postsWithAuthor}
      isMember={isMember}
      memberRole={memberRole}
      currentUserId={user.id}
      isPrivateRestricted={false}
    />
  );
}
