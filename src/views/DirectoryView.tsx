'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Filter, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ProfessionalCard } from '@/components/features/ProfessionalCard'
import { SearchInput } from '@/components/ui/SearchInput'
import { Bloom } from '@/components/mascot'
import { CITIES, PROFESSIONS } from '@/lib/constants'
import { useAuthStore } from '@/stores/authStore'
import { useDirectoryProfiles } from '@/hooks'
import { containerVariants, itemVariants } from '@/components/app/PageTransition'

/**
 * DirectoryView - Professional directory page for the SPA.
 * Uses React Query for cached data fetching.
 */
export function DirectoryView() {
  const router = useRouter()
  const { user, profile: currentProfile } = useAuthStore()
  const { data: profiles, isLoading } = useDirectoryProfiles()
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState<string>('All')
  const [professionFilter, setProfessionFilter] = useState<string>('All')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const isAnonymousViewer = currentProfile?.is_anonymous ?? false
  const currentUserId = user?.id

  // Debounce search
  const handleSearchChange = (value: string) => {
    setSearch(value)
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(value)
    }, 300)
    return () => clearTimeout(timeoutId)
  }

  // Filter profiles
  const filteredProfiles = useMemo(() => {
    if (!profiles) return []
    return profiles.filter((profile) => {
      if (debouncedSearch) {
        const searchLower = debouncedSearch.toLowerCase()
        const matchesSearch =
          profile.display_name.toLowerCase().includes(searchLower) ||
          profile.profession.toLowerCase().includes(searchLower) ||
          (profile.display_real_name?.toLowerCase().includes(searchLower) ?? false) ||
          (profile.bio?.toLowerCase().includes(searchLower) ?? false) ||
          (profile.skills?.some((s) => s.toLowerCase().includes(searchLower)) ?? false)
        if (!matchesSearch) return false
      }
      if (cityFilter !== 'All' && profile.display_city !== cityFilter) return false
      if (professionFilter !== 'All' && profile.profession !== professionFilter) return false
      return true
    })
  }, [profiles, debouncedSearch, cityFilter, professionFilter])

  const handleContact = (profileId: string) => {
    router.push(`/chat?user=${profileId}`)
  }

  if (isLoading && !profiles) {
    return <DirectorySkeleton />
  }

  const allProfiles = profiles ?? []

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Users className="text-[var(--violet)]" />
          Professional Directory
        </h1>
        <p className="text-[var(--text-secondary)]">
          Connect with {allProfiles.length} queer professionals and allies
        </p>
      </motion.div>

      {/* Search & Filters */}
      <motion.div variants={itemVariants} className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <SearchInput
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by name, profession, skills..."
            className="flex-1"
          />
          <div className="relative">
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full md:w-48 appearance-none pr-10"
            >
              <option value="All">All Cities</option>
              {CITIES.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            <Filter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={professionFilter}
              onChange={(e) => setProfessionFilter(e.target.value)}
              className="w-full md:w-48 appearance-none pr-10"
            >
              <option value="All">All Professions</option>
              {PROFESSIONS.map((profession) => (
                <option key={profession} value={profession}>{profession}</option>
              ))}
            </select>
            <Filter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          </div>
        </div>

        {/* Active filters */}
        {(cityFilter !== 'All' || professionFilter !== 'All' || debouncedSearch) && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[var(--border-color)]">
            <span className="text-sm text-[var(--text-muted)]">Filters:</span>
            {debouncedSearch && (
              <span className="px-2 py-1 rounded-full text-xs bg-[var(--violet)] text-white">
                &quot;{debouncedSearch}&quot;
              </span>
            )}
            {cityFilter !== 'All' && (
              <span className="px-2 py-1 rounded-full text-xs bg-[var(--teal)] text-white">{cityFilter}</span>
            )}
            {professionFilter !== 'All' && (
              <span className="px-2 py-1 rounded-full text-xs bg-[var(--amber)] text-white">{professionFilter}</span>
            )}
            <button
              onClick={() => {
                setSearch('')
                setDebouncedSearch('')
                setCityFilter('All')
                setProfessionFilter('All')
              }}
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] underline"
            >
              Clear all
            </button>
          </div>
        )}
      </motion.div>

      {/* Anonymous viewer warning */}
      {isAnonymousViewer && (
        <motion.div variants={itemVariants} className="mb-6 p-4 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)]">
          <p className="text-sm text-[var(--text-secondary)]">
            <strong>Anonymous mode is on.</strong> You can browse the directory but cannot contact professionals.
            Disable anonymous mode in the Safety Center to connect.
          </p>
        </motion.div>
      )}

      {/* Results count */}
      <motion.p variants={itemVariants} className="text-sm text-[var(--text-muted)] mb-4">
        Showing {filteredProfiles.length} of {allProfiles.length} professionals
      </motion.p>

      {/* Results Grid */}
      {filteredProfiles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProfiles.map((profile, index) => (
            <motion.div key={profile.id} variants={itemVariants}>
              <ProfessionalCard
                profile={profile}
                index={index}
                isAnonymousViewer={isAnonymousViewer}
                currentUserId={currentUserId}
                onContact={() => handleContact(profile.id)}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div variants={itemVariants} className="card text-center py-12">
          <Bloom mood="wink" size="lg" className="mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2">No professionals found</h3>
          <p className="text-[var(--text-secondary)]">
            Try adjusting your filters or search terms
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}

function DirectorySkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-8">
        <div className="h-8 w-48 bg-[var(--bg-hover)] rounded-lg mb-2" />
        <div className="h-4 w-64 bg-[var(--bg-hover)] rounded-lg" />
      </div>
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="h-10 flex-1 bg-[var(--bg-hover)] rounded-lg" />
          <div className="h-10 w-48 bg-[var(--bg-hover)] rounded-lg" />
          <div className="h-10 w-48 bg-[var(--bg-hover)] rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="card p-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-[var(--bg-hover)]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-[var(--bg-hover)] rounded" />
                <div className="h-3 w-32 bg-[var(--bg-hover)] rounded" />
                <div className="h-3 w-20 bg-[var(--bg-hover)] rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
