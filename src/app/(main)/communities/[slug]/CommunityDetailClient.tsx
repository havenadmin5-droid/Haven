"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Lock, Settings, Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PostCard } from "@/components/features/PostCard";
import { CreatePostForm } from "@/components/features/CreatePostForm";
import { Bloom } from "@/components/mascot";
import { COMMUNITY_TAG_COLORS } from "@/lib/constants";
import { joinCommunity, leaveCommunity } from "../actions";
import type { Community, PostWithAuthor, CommunityMemberRole } from "@/lib/types";

interface CommunityDetailClientProps {
  community: Community;
  posts: PostWithAuthor[];
  isMember: boolean;
  memberRole?: CommunityMemberRole;
  currentUserId: string;
  isPrivateRestricted: boolean;
}

export function CommunityDetailClient({
  community,
  posts,
  isMember,
  memberRole,
  currentUserId,
  isPrivateRestricted,
}: CommunityDetailClientProps) {
  const [isJoining, setIsJoining] = useState(false);
  const [memberStatus, setMemberStatus] = useState(isMember);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [localPosts, setLocalPosts] = useState(posts);

  const tagColor = COMMUNITY_TAG_COLORS[community.tag];
  const isAdmin = memberRole === "admin";
  const isMod = memberRole === "moderator" || isAdmin;

  const handleJoinLeave = async () => {
    setIsJoining(true);
    try {
      if (memberStatus) {
        const result = await leaveCommunity(community.id);
        if (result.success) {
          setMemberStatus(false);
        }
      } else {
        const result = await joinCommunity(community.id);
        if (result.success) {
          setMemberStatus(true);
        }
      }
    } finally {
      setIsJoining(false);
    }
  };

  const handlePostCreated = (newPost: PostWithAuthor) => {
    setLocalPosts([newPost, ...localPosts]);
    setShowCreatePost(false);
  };

  // Private restricted view
  if (isPrivateRestricted) {
    return (
      <div className="max-w-2xl mx-auto">
        <Link
          href="/communities"
          className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-6"
        >
          <ArrowLeft size={18} />
          Back to Communities
        </Link>

        <div className="card text-center py-12">
          <div
            className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center text-4xl"
            style={{ backgroundColor: `${tagColor}20` }}
          >
            {community.avatar_emoji}
          </div>
          <h1 className="text-2xl font-bold mb-2">{community.name}</h1>
          <div className="flex items-center justify-center gap-2 text-[var(--text-muted)] mb-4">
            <Lock size={16} />
            <span>Private Community</span>
          </div>
          <p className="text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
            {community.description ?? "This is a private community. Request to join to see posts and interact with members."}
          </p>
          <button
            onClick={handleJoinLeave}
            disabled={isJoining}
            className="btn btn-brand"
          >
            Request to Join
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back link */}
      <Link
        href="/communities"
        className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-6"
      >
        <ArrowLeft size={18} />
        Back to Communities
      </Link>

      {/* Community Header */}
      <motion.div
        className="card mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Color bar */}
        <div
          className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl"
          style={{ backgroundColor: tagColor }}
        />

        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
            style={{ backgroundColor: `${tagColor}20` }}
          >
            {community.avatar_emoji}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold truncate">{community.name}</h1>
              {community.is_private && (
                <Lock size={16} className="text-[var(--text-muted)] flex-shrink-0" />
              )}
            </div>

            <div className="flex items-center gap-3 text-sm text-[var(--text-muted)] mb-2">
              <span
                className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ backgroundColor: `${tagColor}20`, color: tagColor }}
              >
                {community.tag}
              </span>
              <span className="flex items-center gap-1">
                <Users size={14} />
                {community.member_count} members
              </span>
            </div>

            {community.description && (
              <p className="text-sm text-[var(--text-secondary)]">
                {community.description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isMod && (
              <button className="btn btn-ghost p-2" title="Settings">
                <Settings size={18} />
              </button>
            )}
            <button
              onClick={handleJoinLeave}
              disabled={isJoining}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                memberStatus
                  ? "bg-[var(--bg-input)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                  : "text-white"
              }`}
              style={!memberStatus ? { backgroundColor: tagColor } : undefined}
            >
              {isJoining ? "..." : memberStatus ? "Leave" : "Join"}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Create Post */}
      {memberStatus && (
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {showCreatePost ? (
            <CreatePostForm
              communityId={community.id}
              communityName={community.name}
              onPostCreated={handlePostCreated}
              onCancel={() => setShowCreatePost(false)}
            />
          ) : (
            <button
              onClick={() => setShowCreatePost(true)}
              className="card w-full text-left hover:bg-[var(--bg-hover)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--bg-input)] flex items-center justify-center">
                  <Plus size={20} className="text-[var(--text-muted)]" />
                </div>
                <span className="text-[var(--text-muted)]">
                  Share something with the community...
                </span>
              </div>
            </button>
          )}
        </motion.div>
      )}

      {/* Posts Feed */}
      {localPosts.length > 0 ? (
        <div className="space-y-4">
          {localPosts.map((post, index) => (
            <PostCard
              key={post.id}
              post={post}
              index={index}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Bloom mood="wink" size="lg" className="mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2">No posts yet</h3>
          <p className="text-[var(--text-secondary)]">
            {memberStatus
              ? "Be the first to share something!"
              : "Join this community to see and create posts."}
          </p>
        </div>
      )}
    </div>
  );
}
