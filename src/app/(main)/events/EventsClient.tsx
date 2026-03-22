"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Calendar, Plus, MapPin, Filter } from "lucide-react";
import { EventCard } from "@/components/features/EventCard";
import { SearchInput } from "@/components/ui/SearchInput";
import { CreateEventModal } from "./CreateEventModal";
import { Bloom } from "@/components/mascot";
import { CITIES } from "@/lib/constants";
import { EVENT_CATEGORIES } from "@/lib/types/database";
import type { EventWithHost, City, EventCategory, RSVPStatus } from "@/lib/types";

interface EventsClientProps {
  initialEvents: EventWithHost[];
  currentUserId: string;
  isAnonymous: boolean;
}

export function EventsClient({
  initialEvents,
  currentUserId,
  isAnonymous,
}: EventsClientProps) {
  const [events, setEvents] = useState<EventWithHost[]>(initialEvents);
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState<City | "">("");
  const [categoryFilter, setCategoryFilter] = useState<EventCategory | "">("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !event.title.toLowerCase().includes(query) &&
          !event.description.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      // City filter
      if (cityFilter && event.city !== cityFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter && event.category !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [events, searchQuery, cityFilter, categoryFilter]);

  const handleEventCreated = (newEvent: EventWithHost) => {
    setEvents([newEvent, ...events].sort((a, b) =>
      new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
    ));
    setShowCreateModal(false);
  };

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
    );
  };

  const handleEventDeleted = (eventId: string) => {
    setEvents(events.filter((event) => event.id !== eventId));
  };

  const clearFilters = () => {
    setSearchQuery("");
    setCityFilter("");
    setCategoryFilter("");
  };

  const hasActiveFilters = searchQuery || cityFilter || categoryFilter;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
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
            title={isAnonymous ? "Disable anonymous mode to create events" : "Create an event"}
          >
            <Plus size={18} />
            Create Event
          </button>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search events..."
            className="flex-1"
          />

          {/* Filter toggle (mobile) */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden btn btn-secondary"
          >
            <Filter size={18} />
            Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-[var(--amber)]" />
            )}
          </button>

          {/* Filters */}
          <div
            className={`flex gap-3 ${showFilters ? "flex" : "hidden sm:flex"}`}
          >
            {/* City filter */}
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value as City | "")}
              className="px-3 py-2.5 rounded-xl min-w-[140px]"
            >
              <option value="">All Cities</option>
              {CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>

            {/* Category filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as EventCategory | "")}
              className="px-3 py-2.5 rounded-xl min-w-[140px]"
            >
              <option value="">All Categories</option>
              {EVENT_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.emoji} {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active filters indicator */}
        {hasActiveFilters && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-[var(--text-muted)]">
              {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}{" "}
              found
            </span>
            <button
              onClick={clearFilters}
              className="text-sm text-[var(--violet)] hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </motion.div>

      {/* Events grid */}
      {filteredEvents.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card text-center py-12"
        >
          <Bloom mood="wink" size="lg" className="mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2">
            {hasActiveFilters ? "No matching events" : "No upcoming events"}
          </h3>
          <p className="text-[var(--text-secondary)] mb-4">
            {hasActiveFilters
              ? "Try different filters or search terms"
              : "Be the first to create an event!"}
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
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
        <CreateEventModal
          onClose={() => setShowCreateModal(false)}
          onEventCreated={handleEventCreated}
        />
      )}
    </div>
  );
}
