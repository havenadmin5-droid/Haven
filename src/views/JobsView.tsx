'use client'

import { useState, useMemo, useEffect, lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import { Briefcase, Plus, MapPin, Filter } from 'lucide-react'
import { JobCard } from '@/components/features/JobCard'
import { SearchInput } from '@/components/ui/SearchInput'
import { Bloom } from '@/components/mascot'
import { CITIES } from '@/lib/constants'
import { JOB_TYPES } from '@/lib/types/database'
import { useAuthStore } from '@/stores/authStore'
import { useJobsList } from '@/hooks'
import { containerVariants, itemVariants } from '@/components/app/PageTransition'
import type { JobWithPoster, City, JobType } from '@/lib/types'

// Lazy load CreateJobModal
const CreateJobModal = lazy(() =>
  import('@/app/(main)/jobs/CreateJobModal').then(m => ({ default: m.CreateJobModal }))
)

/**
 * JobsView - Job board page for the SPA.
 * Uses React Query for cached data fetching.
 */
export function JobsView() {
  const { user, profile } = useAuthStore()
  const { data: fetchedJobs, isLoading } = useJobsList()
  const [jobs, setJobs] = useState<JobWithPoster[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [cityFilter, setCityFilter] = useState<City | ''>('')
  const [typeFilter, setTypeFilter] = useState<JobType | ''>('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const currentUserId = user?.id ?? ''
  const isAnonymous = profile?.is_anonymous ?? false

  // Sync jobs with fetched data
  useEffect(() => {
    if (fetchedJobs) {
      setJobs(fetchedJobs as JobWithPoster[])
    }
  }, [fetchedJobs])

  // Filter jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (!job.title.toLowerCase().includes(query) && !job.company.toLowerCase().includes(query)) {
          return false
        }
      }
      if (cityFilter && job.city !== cityFilter) return false
      if (typeFilter && job.job_type !== typeFilter) return false
      return true
    })
  }, [jobs, searchQuery, cityFilter, typeFilter])

  const handleJobCreated = (newJob: JobWithPoster) => {
    setJobs([newJob, ...jobs])
    setShowCreateModal(false)
  }

  const handleSaveToggle = (jobId: string, saved: boolean) => {
    setJobs(jobs.map((job) => (job.id === jobId ? { ...job, is_saved: saved } : job)))
  }

  const handleJobDeleted = (jobId: string) => {
    setJobs(jobs.filter((job) => job.id !== jobId))
  }

  const clearFilters = () => {
    setSearchQuery('')
    setCityFilter('')
    setTypeFilter('')
  }

  const hasActiveFilters = searchQuery || cityFilter || typeFilter

  if (isLoading && jobs.length === 0) {
    return <JobsSkeleton />
  }

  return (
    <motion.div
      className="max-w-4xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Briefcase className="text-[var(--rose)]" />
              Job Board
            </h1>
            <p className="text-[var(--text-secondary)] text-sm mt-1">
              Find opportunities at LGBTQIA+ friendly companies
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={isAnonymous}
            className="btn btn-brand"
            title={isAnonymous ? 'Disable anonymous mode to post jobs' : 'Post a job'}
          >
            <Plus size={18} />
            Post Job
          </button>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by title or company..."
            className="flex-1"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden btn btn-secondary"
          >
            <Filter size={18} />
            Filters
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-[var(--rose)]" />}
          </button>
          <div className={`flex gap-3 ${showFilters ? 'flex' : 'hidden sm:flex'}`}>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value as City | '')}
              className="px-3 py-2.5 rounded-xl min-w-[140px]"
            >
              <option value="">All Cities</option>
              {CITIES.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as JobType | '')}
              className="px-3 py-2.5 rounded-xl min-w-[140px]"
            >
              <option value="">All Types</option>
              {JOB_TYPES.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-[var(--text-muted)]">
              {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
            </span>
            <button onClick={clearFilters} className="text-sm text-[var(--violet)] hover:underline">
              Clear filters
            </button>
          </div>
        )}
      </motion.div>

      {/* Jobs list */}
      {filteredJobs.length > 0 ? (
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <motion.div key={job.id} variants={itemVariants}>
              <JobCard
                job={job}
                currentUserId={currentUserId}
                onSaveToggle={handleSaveToggle}
                onDelete={() => handleJobDeleted(job.id)}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div variants={itemVariants} className="card text-center py-12">
          <Bloom mood="wink" size="lg" className="mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2">
            {hasActiveFilters ? 'No matching jobs' : 'No jobs posted yet'}
          </h3>
          <p className="text-[var(--text-secondary)] mb-4">
            {hasActiveFilters
              ? 'Try different filters or search terms'
              : 'Be the first to post a job opportunity!'}
          </p>
          {hasActiveFilters ? (
            <button onClick={clearFilters} className="btn btn-secondary">
              Clear filters
            </button>
          ) : (
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={isAnonymous}
              className="btn btn-brand"
            >
              <Plus size={18} />
              Post a Job
            </button>
          )}
        </motion.div>
      )}

      {/* Anonymous mode warning */}
      {isAnonymous && (
        <motion.div
          variants={itemVariants}
          className="mt-6 p-4 rounded-xl bg-[var(--amber)]/10 border border-[var(--amber)]/20"
        >
          <div className="flex items-start gap-3">
            <MapPin className="text-[var(--amber)] flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-medium text-[var(--amber)]">Anonymous mode active</p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                You can browse jobs but cannot post while in anonymous mode.
                Disable anonymous mode in your profile to post jobs.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Create job modal */}
      {showCreateModal && (
        <Suspense fallback={null}>
          <CreateJobModal
            onClose={() => setShowCreateModal(false)}
            onJobCreated={handleJobCreated}
          />
        </Suspense>
      )}
    </motion.div>
  )
}

function JobsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="h-8 w-32 bg-[var(--bg-hover)] rounded-lg mb-2" />
            <div className="h-4 w-56 bg-[var(--bg-hover)] rounded-lg" />
          </div>
          <div className="h-10 w-28 bg-[var(--bg-hover)] rounded-lg" />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="h-10 flex-1 bg-[var(--bg-hover)] rounded-xl" />
          <div className="h-10 w-36 bg-[var(--bg-hover)] rounded-xl" />
          <div className="h-10 w-36 bg-[var(--bg-hover)] rounded-xl" />
        </div>
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[var(--bg-hover)]" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-48 bg-[var(--bg-hover)] rounded" />
                <div className="h-4 w-32 bg-[var(--bg-hover)] rounded" />
                <div className="h-3 w-full bg-[var(--bg-hover)] rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
