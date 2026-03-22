'use client'

import { useState, useMemo, useEffect, lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import { Filter, Plus, Heart } from 'lucide-react'
import { CommunityCard } from '@/components/features/CommunityCard'
import { SearchInput } from '@/components/ui/SearchInput'
import { Bloom } from '@/components/mascot'
import { COMMUNITY_TAGS, COMMUNITY_TAG_COLORS } from '@/lib/constants'
import { useAuthStore } from '@/stores/authStore'
import { useCommunities } from '@/hooks'
import { containerVariants, itemVariants } from '@/components/app/PageTransition'
import type { CommunityWithMembership, CommunityTag } from '@/lib/types'

// Lazy load CreateCommunityModal
const CreateCommunityModal = lazy(() =>
  import('@/app/(main)/communities/CreateCommunityModal').then(m => ({ default: m.CreateCommunityModal }))
)

/**
 * CommunitiesView - Communities page for the SPA.
 * Uses React Query for cached data fetching.
 */
export function CommunitiesView() {
  const { user } = useAuthStore()
  const { data: fetchedCommunities, isLoading } = useCommunities()
  const [communities, setCommunities] = useState<CommunityWithMembership[]>([])
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState<CommunityTag | 'All'>('All')
  const [showMyCommunitiesOnly, setShowMyCommunitiesOnly] = useState(false)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  const isAuthenticated = !!user

  // Sync communities with fetched data
  useEffect(() => {
    if (fetchedCommunities) {
      setCommunities(fetchedCommunities)
    }
  }, [fetchedCommunities])

  // Debounce search
  const handleSearchChange = (value: string) => {
    setSearch(value)
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(value)
    }, 300)
    return () => clearTimeout(timeoutId)
  }

  // Filter communities
  const filteredCommunities = useMemo(() => {
    return communities.filter((community) => {
      if (showMyCommunitiesOnly && !community.is_member) return false
      if (debouncedSearch) {
        const searchLower = debouncedSearch.toLowerCase()
        const matchesSearch =
          community.name.toLowerCase().includes(searchLower) ||
          (community.description?.toLowerCase().includes(searchLower) ?? false)
        if (!matchesSearch) return false
      }
      if (tagFilter !== 'All' && community.tag !== tagFilter) return false
      return true
    })
  }, [communities, debouncedSearch, tagFilter, showMyCommunitiesOnly])

  const myCommunities = communities.filter((c) => c.is_member)

  if (isLoading && communities.length === 0) {
    return <CommunitiesSkeleton />
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Heart className="text-[var(--teal)]" />
            Communities
          </h1>
          <p className="text-[var(--text-secondary)]">
            Join {communities.length} communities of like-minded people
          </p>
        </div>
        {isAuthenticated && (
          <button onClick={() => setShowCreateModal(true)} className="btn btn-brand">
            <Plus size={18} />
            Create Community
          </button>
        )}
      </motion.div>

      {/* My Communities Quick Access */}
      {myCommunities.length > 0 && (
        <motion.div variants={itemVariants} className="mb-6">
          <h2 className="text-sm font-medium text-[var(--text-muted)] mb-3">
            Your Communities ({myCommunities.length})
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {myCommunities.slice(0, 8).map((community) => (
              <a
                key={community.id}
                href={`/communities/${community.slug}`}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-input)] hover:bg-[var(--bg-hover)] transition-colors flex-shrink-0"
              >
                <span className="text-lg">{community.avatar_emoji}</span>
                <span className="text-sm font-medium truncate max-w-[120px]">{community.name}</span>
              </a>
            ))}
          </div>
        </motion.div>
      )}

      {/* Search & Filters */}
      <motion.div variants={itemVariants} className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <SearchInput
            value={search}
            onChange={handleSearchChange}
            placeholder="Search communities..."
            className="flex-1"
          />
          <div className="relative">
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value as CommunityTag | 'All')}
              className="w-full md:w-48 appearance-none pr-10"
            >
              <option value="All">All Categories</option>
              {COMMUNITY_TAGS.map((tag) => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
            <Filter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          </div>
          {myCommunities.length > 0 && (
            <button
              onClick={() => setShowMyCommunitiesOnly(!showMyCommunitiesOnly)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                showMyCommunitiesOnly
                  ? 'bg-[var(--teal)] text-white'
                  : 'bg-[var(--bg-input)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              My Communities
            </button>
          )}
        </div>

        {/* Active filters */}
        {(tagFilter !== 'All' || debouncedSearch) && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[var(--border-color)]">
            <span className="text-sm text-[var(--text-muted)]">Filters:</span>
            {debouncedSearch && (
              <span className="px-2 py-1 rounded-full text-xs bg-[var(--violet)] text-white">
                &quot;{debouncedSearch}&quot;
              </span>
            )}
            {tagFilter !== 'All' && (
              <span
                className="px-2 py-1 rounded-full text-xs text-white"
                style={{ backgroundColor: COMMUNITY_TAG_COLORS[tagFilter] }}
              >
                {tagFilter}
              </span>
            )}
            <button
              onClick={() => {
                setSearch('')
                setDebouncedSearch('')
                setTagFilter('All')
                setShowMyCommunitiesOnly(false)
              }}
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] underline"
            >
              Clear all
            </button>
          </div>
        )}
      </motion.div>

      {/* Results count */}
      <motion.p variants={itemVariants} className="text-sm text-[var(--text-muted)] mb-4">
        Showing {filteredCommunities.length} of {communities.length} communities
      </motion.p>

      {/* Results Grid */}
      {filteredCommunities.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredCommunities.map((community, index) => (
            <motion.div key={community.id} variants={itemVariants}>
              <CommunityCard community={community} index={index} />
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div variants={itemVariants} className="card text-center py-12">
          <Bloom mood="wink" size="lg" className="mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2">No communities found</h3>
          <p className="text-[var(--text-secondary)] mb-4">
            {showMyCommunitiesOnly
              ? "You haven't joined any communities yet"
              : 'Try adjusting your filters or search terms'}
          </p>
          {showMyCommunitiesOnly && (
            <button onClick={() => setShowMyCommunitiesOnly(false)} className="btn btn-ghost">
              Browse all communities
            </button>
          )}
        </motion.div>
      )}

      {/* Create Community Modal */}
      {showCreateModal && (
        <Suspense fallback={null}>
          <CreateCommunityModal onClose={() => setShowCreateModal(false)} />
        </Suspense>
      )}
    </motion.div>
  )
}

function CommunitiesSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-8 w-40 bg-[var(--bg-hover)] rounded-lg mb-2" />
          <div className="h-4 w-56 bg-[var(--bg-hover)] rounded-lg" />
        </div>
        <div className="h-10 w-36 bg-[var(--bg-hover)] rounded-lg" />
      </div>
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="h-10 flex-1 bg-[var(--bg-hover)] rounded-lg" />
          <div className="h-10 w-48 bg-[var(--bg-hover)] rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-[var(--bg-hover)]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-[var(--bg-hover)] rounded" />
                <div className="h-3 w-full bg-[var(--bg-hover)] rounded" />
                <div className="h-3 w-20 bg-[var(--bg-hover)] rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
