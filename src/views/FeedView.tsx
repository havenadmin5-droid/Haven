'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Plus, Rss } from 'lucide-react'
import { PostCard } from '@/components/features/PostCard'
import { CreatePostForm } from '@/components/features/CreatePostForm'
import { Bloom } from '@/components/mascot'
import { WelcomeModal } from '@/components/features/WelcomeModal'
import { useAuthStore } from '@/stores/authStore'
import { useFeedPosts } from '@/hooks'
import { containerVariants, itemVariants } from '@/components/app/PageTransition'
import { createClient } from '@/lib/supabase/client'
import type { PostWithAuthor } from '@/lib/types'

/**
 * FeedView - Main feed page for the SPA.
 * Uses React Query for cached data fetching.
 */
export function FeedView() {
  const { user, profile, refreshProfile } = useAuthStore()
  const { data: feedPosts, isLoading } = useFeedPosts()
  const [posts, setPosts] = useState<PostWithAuthor[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)

  // Check for new user flag to show welcome modal
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isNewUser = localStorage.getItem('haven_new_user')
      if (isNewUser === 'true') {
        setShowWelcomeModal(true)
      }
    }
  }, [])

  // Sync posts state with fetched data
  useEffect(() => {
    if (feedPosts) {
      setPosts(feedPosts)
    }
  }, [feedPosts])

  const handlePostCreated = (newPost: PostWithAuthor) => {
    setPosts([newPost, ...posts])
    setShowCreateForm(false)
  }

  const handleWelcomeClose = () => {
    localStorage.removeItem('haven_new_user')
    setShowWelcomeModal(false)
  }

  const handleWelcomeSave = async (data: { realName: string; showRealName: boolean; showPhoto: boolean }) => {
    if (!user?.id) return

    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({
        real_name: data.realName || null,
        show_real_name: data.showRealName,
        show_photo: data.showPhoto,
      })
      .eq('id', user.id)

    if (error) {
      console.error('Error updating profile:', error)
      throw error
    }

    // Refresh profile in store
    await refreshProfile()
    localStorage.removeItem('haven_new_user')
  }

  // Show skeleton only on initial load (no cached data)
  if (isLoading && posts.length === 0) {
    return <FeedSkeleton />
  }

  const username = profile?.username ?? 'friend'
  const avatarEmoji = profile?.avatar_emoji ?? '🌈'
  const currentUserId = user?.id ?? ''

  return (
    <>
    {/* Welcome Modal for new users */}
    <WelcomeModal
      isOpen={showWelcomeModal}
      onClose={handleWelcomeClose}
      onSave={handleWelcomeSave}
      username={username}
    />

    <motion.div
      className="max-w-2xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Welcome header */}
      <motion.div variants={itemVariants} className="mb-6">
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
        <motion.div variants={itemVariants} className="mb-6">
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
        <motion.div variants={itemVariants} className="mb-6">
          <CreatePostForm
            onPostCreated={handlePostCreated}
            onCancel={() => setShowCreateForm(false)}
          />
        </motion.div>
      )}

      {/* Posts feed */}
      {posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post) => (
            <motion.div key={post.id} variants={itemVariants}>
              <PostCard post={post} currentUserId={currentUserId} />
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div variants={itemVariants} className="card text-center py-12">
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
    </motion.div>
    </>
  )
}

function FeedSkeleton() {
  return (
    <div className="max-w-2xl mx-auto animate-pulse">
      <div className="mb-6">
        <div className="h-8 w-32 bg-[var(--bg-hover)] rounded-lg mb-2" />
        <div className="h-4 w-48 bg-[var(--bg-hover)] rounded-lg" />
      </div>
      <div className="mb-6">
        <div className="h-16 bg-[var(--bg-hover)] rounded-2xl border-2 border-dashed border-[var(--border-color)]" />
      </div>
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
  )
}
