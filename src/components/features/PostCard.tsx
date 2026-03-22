"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useClickOutside } from "@/hooks/useClickOutside";
import {
  MessageCircle,
  MoreHorizontal,
  Trash2,
  Flag,
  Check,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ReactionPicker } from "./ReactionPicker";
import type { PostWithAuthor } from "@/lib/types";
import { REACTIONS } from "@/lib/types/database";
import { getDisplayName, getDisplayAvatar } from "@/lib/utils/privacy";

interface PostCardProps {
  post: PostWithAuthor;
  index?: number;
  currentUserId: string;
  showCommunity?: boolean;
  isDetailView?: boolean;
  onDelete?: () => void;
  onReactionChange?: (reactions: number[], countDiff: number) => void;
}

export function PostCard({
  post,
  index = 0,
  currentUserId,
  showCommunity = false,
  isDetailView = false,
  onDelete,
  onReactionChange: onReactionChangeProp,
}: PostCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userReactions, setUserReactions] = useState<number[]>(
    post.user_reactions ?? []
  );
  const [reactionCount, setReactionCount] = useState(post.reaction_count);

  const closeMenu = useCallback(() => setShowMenu(false), []);
  const menuRef = useClickOutside<HTMLDivElement>(closeMenu, showMenu);

  const isAuthor = post.author_id === currentUserId;
  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
  });

  // Get display info based on author settings
  const authorProfile = {
    username: post.author.username,
    is_anonymous: post.is_anonymous || post.author.is_anonymous,
    anonymous_alias: post.author.anonymous_alias,
  };

  const displayName = post.is_anonymous
    ? "Anonymous"
    : getDisplayName(authorProfile);

  const avatarUrl =
    post.is_anonymous || post.author.is_anonymous
      ? null
      : getDisplayAvatar({
          avatar_url: post.author.avatar_url,
          show_photo: post.author.show_photo,
          is_anonymous: false,
        });

  const handleReactionChange = (reactions: number[], countDiff: number) => {
    setUserReactions(reactions);
    setReactionCount(reactionCount + countDiff);
    onReactionChangeProp?.(reactions, countDiff);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    setIsDeleting(true);
    setShowMenu(false);

    try {
      // Call delete action
      const { deletePost } = await import("@/app/(main)/feed/actions");
      const result = await deletePost(post.id);
      if (result.success) {
        onDelete?.();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.div
      className={`card relative ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      {/* Deleting overlay */}
      {isDeleting && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50 rounded-2xl z-10">
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Deleting...</span>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {/* Avatar */}
        <Link href={post.is_anonymous ? "#" : `/profile/${post.author_id}`}>
          <div className="w-10 h-10 rounded-full bg-[var(--bg-input)] flex items-center justify-center text-lg overflow-hidden">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              post.author.avatar_emoji
            )}
          </div>
        </Link>

        {/* Author info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={post.is_anonymous ? "#" : `/profile/${post.author_id}`}
              className="font-medium hover:underline truncate"
            >
              {displayName}
            </Link>
            {post.author.is_verified && !post.is_anonymous && (
              <span className="w-4 h-4 rounded-full bg-[var(--teal)] flex items-center justify-center flex-shrink-0">
                <Check size={10} className="text-white" />
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span>{timeAgo}</span>
            {showCommunity && post.community && (
              <>
                <span>•</span>
                <Link
                  href={`/communities/${post.community.slug}`}
                  className="hover:underline"
                >
                  {post.community.avatar_emoji} {post.community.name}
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
          >
            <MoreHorizontal size={18} className="text-[var(--text-muted)]" />
          </button>

          {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-[var(--bg-card)] rounded-xl shadow-lg border border-[var(--border-color)] z-20 overflow-hidden">
                {isAuthor && (
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-[var(--bg-hover)] flex items-center gap-2 text-red-500 disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 size={16} />
                        Delete post
                      </>
                    )}
                  </button>
                )}
                {!isAuthor && (
                  <button className="w-full px-4 py-2.5 text-left text-sm hover:bg-[var(--bg-hover)] flex items-center gap-2">
                    <Flag size={16} />
                    Report post
                  </button>
                )}
              </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mb-3">
        <p className="whitespace-pre-wrap break-words">{post.content}</p>
      </div>

      {/* Images */}
      {post.image_urls && post.image_urls.length > 0 && (
        <div
          className={`mb-3 grid gap-2 ${
            post.image_urls.length === 1
              ? "grid-cols-1"
              : post.image_urls.length === 2
                ? "grid-cols-2"
                : post.image_urls.length === 3
                  ? "grid-cols-2"
                  : "grid-cols-2"
          }`}
        >
          {post.image_urls.slice(0, 4).map((url, i) => (
            <div
              key={i}
              className={`relative rounded-xl overflow-hidden bg-[var(--bg-input)] ${
                post.image_urls.length === 3 && i === 0 ? "row-span-2" : ""
              }`}
              style={{
                aspectRatio:
                  post.image_urls.length === 1
                    ? "16/9"
                    : post.image_urls.length === 3 && i === 0
                      ? "1/1"
                      : "4/3",
              }}
            >
              <img
                src={url}
                alt={`Post image ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* Reactions summary */}
      {reactionCount > 0 && (
        <div className="flex items-center gap-1 mb-3 text-sm text-[var(--text-muted)]">
          {REACTIONS.slice(0, 3).map((r) => (
            <span key={r.index} className="text-base">
              {r.emoji}
            </span>
          ))}
          <span className="ml-1">{reactionCount}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-[var(--border-color)]">
        <ReactionPicker
          postId={post.id}
          userReactions={userReactions}
          onReactionChange={handleReactionChange}
        />

        {isDetailView ? (
          <div className="flex items-center gap-2 px-4 py-2 text-[var(--text-muted)]">
            <MessageCircle size={18} />
            <span className="text-sm">
              {post.comment_count > 0 ? post.comment_count : "Comments"}
            </span>
          </div>
        ) : (
          <Link
            href={`/posts/${post.id}`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-muted)]"
          >
            <MessageCircle size={18} />
            <span className="text-sm">
              {post.comment_count > 0 ? post.comment_count : "Comment"}
            </span>
          </Link>
        )}
      </div>
    </motion.div>
  );
}
