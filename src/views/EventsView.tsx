'use client'

import { useState, useEffect, useMemo, lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Plus, MapPin, Filter } from 'lucide-react'
import { EventCard } from '@/components/features/EventCard'
import { SearchInput } from '@/components/ui/SearchInput'
import { Bloom } from '@/components/mascot'
import { CITIES } from '@/lib/constants'
import { EVENT_CATEGORIES } from '@/lib/types/database'
import { useAuthStore } from '@/stores/authStore'
import { useEvents } from '@/hooks'
import { containerVariants, itemVariants } from '@/components/app/PageTransition'
import type { EventWithHost, City, EventCategory, RSVPStatus } from '@/lib/types'

// Lazy load CreateEventModal
const CreateEventModal = lazy(() =>
  import('@/app/(main)/events/CreateEventModal').then(m => ({ default: m.CreateEventModal }))
)

/**
 * EventsView - Events page for the SPA.
 * Uses React Query for cached data fetching.
 */
export function EventsView() {
  const { user, profile } = useAuthStore()
  const { data: fetchedEvents, isLoading } = useEvents()
  const [events, setEvents] = useState<EventWithHost[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [cityFilter, setCityFilter] = useState<City | ''>('')
  const [categoryFilter, setCategoryFilter] = useState<EventCategory | ''>('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const currentUserId = user?.id ?? ''
  const isAnonymous = profile?.is_anonymous ?? false

  // Sync events with fetched data
  useEffect(() => {
    if (fetchedEvents) {
      setEvents(fetchedEvents as EventWithHost[])
    }
  }, [fetchedEvents])

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (
          !event.title.toLowerCase().includes(query) &&
          !event.description.toLowerCase().includes(query)
        ) {
          return false
        }
      }
      if (cityFilter && event.city !== cityFilter) return false
      if (categoryFilter && event.category !== categoryFilter) return false
      return true
    })
  }, [events, searchQuery, cityFilter, categoryFilter])

  const handleEventCreated = (newEvent: EventWithHost) => {
    setEvents([newEvent, ...events].sort((a, b) =>
      new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
    ))
    setShowCreateModal(false)
  }

  const handleRsvpChange = (eventId: string, status: RSVPStatus | null, countDiff: number) => {
    setEvents(
      events.map((event) =>
        event.id === eventId
          ? {
              ...event,
              user_rsvp: status,
              attendee_count: event.attendee_count + countDiff,
            }
          : event
      )
    )
  }

  const handleEventDeleted = (eventId: string) => {
    setEvents(events.filter((event) => event.id !== eventId))
  }

  const clearFilters = () => {
    setSearchQuery('')
    setCityFilter('')
    setCategoryFilter('')
  }

  const hasActiveFilters = searchQuery || cityFilter || categoryFilter

  if (isLoading && events.length === 0) {
    return <EventsSkeleton />
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
              <Calendar className="text-[var(--amber)]" />
              Events
            </h1>
            <p className="text-[var(--text-secondary)] text-sm mt-1">
              Discover and join community events
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={isAnonymous}
            className="btn btn-brand"
            title={isAnonymous ? 'Disable anonymous mode to create events' : 'Create an event'}
          >
            <Plus size={18} />
            Create Event
          </button>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search events..."
            className="flex-1"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden btn btn-secondary"
          >
            <Filter size={18} />
            Filters
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-[var(--amber)]" />}
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
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as EventCategory | '')}
              className="px-3 py-2.5 rounded-xl min-w-[140px]"
            >
              <option value="">All Categories</option>
              {EVENT_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.emoji} {cat.label}</option>
              ))}
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-[var(--text-muted)]">
              {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
            </span>
            <button onClick={clearFilters} className="text-sm text-[var(--violet)] hover:underline">
              Clear filters
            </button>
          </div>
        )}
      </motion.div>

      {/* Events grid */}
      {filteredEvents.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredEvents.map((event) => (
            <motion.div key={event.id} variants={itemVariants}>
              <EventCard
                event={event}
                currentUserId={currentUserId}
                isAnonymous={isAnonymous}
                onRsvpChange={handleRsvpChange}
                onDelete={() => handleEventDeleted(event.id)}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div variants={itemVariants} className="card text-center py-12">
          <Bloom mood="wink" size="lg" className="mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2">
            {hasActiveFilters ? 'No matching events' : 'No upcoming events'}
          </h3>
          <p className="text-[var(--text-secondary)] mb-4">
            {hasActiveFilters
              ? 'Try different filters or search terms'
              : 'Be the first to create an event!'}
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
              Create Event
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
                You can RSVP to public events only. Disable anonymous mode to create events or RSVP to private events.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Create event modal */}
      {showCreateModal && (
        <Suspense fallback={null}>
          <CreateEventModal
            onClose={() => setShowCreateModal(false)}
            onEventCreated={handleEventCreated}
          />
        </Suspense>
      )}
    </motion.div>
  )
}

function EventsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="h-8 w-32 bg-[var(--bg-hover)] rounded-lg mb-2" />
            <div className="h-4 w-56 bg-[var(--bg-hover)] rounded-lg" />
          </div>
          <div className="h-10 w-32 bg-[var(--bg-hover)] rounded-lg" />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="h-10 flex-1 bg-[var(--bg-hover)] rounded-xl" />
          <div className="h-10 w-36 bg-[var(--bg-hover)] rounded-xl" />
          <div className="h-10 w-36 bg-[var(--bg-hover)] rounded-xl" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-4">
            <div className="space-y-3">
              <div className="h-5 w-48 bg-[var(--bg-hover)] rounded" />
              <div className="h-4 w-32 bg-[var(--bg-hover)] rounded" />
              <div className="h-3 w-full bg-[var(--bg-hover)] rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
