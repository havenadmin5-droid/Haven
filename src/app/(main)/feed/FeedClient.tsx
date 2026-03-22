"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Plus, Rss } from "lucide-react";
import { PostCard } from "@/components/features/PostCard";
import { CreatePostForm } from "@/components/features/CreatePostForm";
import { Bloom } from "@/components/mascot";
import { useAuth, useFeedPosts } from "@/hooks";
import type { PostWithAuthor } from "@/lib/types";

/**
 * Feed skeleton for instant loading state
 */
function FeedSkeleton() {
  return (
    <div className="max-w-2xl mx-auto animate-pulse">
      {/* Header skeleton */}
      <div className="mb-6">
        <div className="h-8 w-32 bg-[var(--bg-hover)] rounded-lg mb-2" />
        <div className="h-4 w-48 bg-[var(--bg-hover)] rounded-lg" />
      </div>

      {/* Create post button skeleton */}
      <div className="mb-6">
        <div className="h-16 bg-[var(--bg-hover)] rounded-2xl border-2 border-dashed border-[var(--border-color)]" />
      </div>

      {/* Posts skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--bg-hover)]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-[var(--bg-hover)] rounded" />
                <div className="h-3 w-full bg-[var(--bg-hover)] rounded" />
                <div className="h-3 w-4/5 bg-[var(--bg-hover)] rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FeedClient() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const { data: feedPosts, isLoading: postsLoading } = useFeedPosts();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Sync posts state with fetched data
  useEffect(() => {
    if (feedPosts) {
      setPosts(feedPosts);
    }
  }, [feedPosts]);

  const handlePostCreated = (newPost: PostWithAuthor) => {
    setPosts([newPost, ...posts]);
    setShowCreateForm(false);
  };

  // Show skeleton during loading
  const isLoading = authLoading || postsLoading;

  // Show skeleton only on initial load (no cached data)
  if (isLoading && posts.length === 0) {
    return <FeedSkeleton />;
  }

  const username = profile?.username ?? "friend";
  const avatarEmoji = profile?.avatar_emoji ?? "🌈";
  const currentUserId = user?.id ?? "";

  return (
    <div className="max-w-2xl mx-auto">
      {/* Welcome header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-2">
          <Rss className="text-[var(--teal)]" />
          Your Feed
        </h1>
        <p className="text-[var(--text-secondary)]">
          Welcome back, <span className="text-[var(--violet)]">{avatarEmoji}</span> {username}!
        </p>
      </motion.div>

      {/* Create post button */}
      {!showCreateForm && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full card flex items-center gap-3 p-4 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer border-2 border-dashed border-[var(--border-color)] hover:border-[var(--violet)]"
          >
            <div className="w-10 h-10 rounded-full bg-[var(--violet)]/10 flex items-center justify-center">
              <Plus className="w-5 h-5 text-[var(--violet)]" />
            </div>
            <span className="text-[var(--text-muted)]">What&apos;s on your mind?</span>
          </button>
        </motion.div>
      )}

      {/* Create post form */}
      {showCreateForm && (
        <div className="mb-6">
          <CreatePostForm
            onPostCreated={handlePostCreated}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {/* Posts feed */}
      {posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <PostCard
                post={post}
                currentUserId={currentUserId}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card text-center py-12"
        >
          <Bloom mood="wink" size="lg" className="mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2">Your feed is empty</h3>
          <p className="text-[var(--text-secondary)] mb-4">
            Join communities to see posts from other members, or create your first post!
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn btn-brand"
            >
              <Sparkles size={18} />
              Create Post
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
