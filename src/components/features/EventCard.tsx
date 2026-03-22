"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useClickOutside } from "@/hooks/useClickOutside";
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Lock,
  Check,
  Loader2,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { rsvpToEvent, cancelRsvp, deleteEvent } from "@/app/(main)/events/actions";
import { getDisplayName, getDisplayAvatar } from "@/lib/utils/privacy";
import { EVENT_CATEGORIES } from "@/lib/types/database";
import type { EventWithHost, RSVPStatus } from "@/lib/types";
import confetti from "canvas-confetti";

interface EventCardProps {
  event: EventWithHost;
  currentUserId: string;
  isAnonymous: boolean;
  onRsvpChange: (eventId: string, status: RSVPStatus | null, countDiff: number) => void;
  onDelete: () => void;
}

export function EventCard({
  event,
  currentUserId,
  isAnonymous,
  onRsvpChange,
  onDelete,
}: EventCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isRsvping, setIsRsvping] = useState(false);
  const [userRsvp, setUserRsvp] = useState<RSVPStatus | null>(event.user_rsvp ?? null);

  const closeMenu = useCallback(() => setShowMenu(false), []);
  const menuRef = useClickOutside<HTMLDivElement>(closeMenu, showMenu);

  const isHost = event.host_id === currentUserId;
  const isGoing = userRsvp === "going";
  const isWaitlisted = userRsvp === "waitlisted";
  const isFull = event.capacity !== null && event.attendee_count >= event.capacity;

  // Format date and time
  const eventDate = parseISO(event.event_date);
  const formattedDate = format(eventDate, "EEE, MMM d");
  const formattedTime = event.event_time.slice(0, 5); // HH:MM

  // Get display info for host
  const displayName = event.host?.is_anonymous
    ? "Anonymous"
    : getDisplayName({
        username: event.host?.username ?? "User",
        is_anonymous: false,
        anonymous_alias: null,
      });

  const avatarUrl = event.host?.is_anonymous
    ? null
    : getDisplayAvatar({
        avatar_url: event.host?.avatar_url ?? null,
        show_photo: event.host?.show_photo ?? false,
        is_anonymous: false,
      });

  const categoryInfo = EVENT_CATEGORIES.find((c) => c.value === event.category);

  // Can RSVP check
  const canRsvp = !isAnonymous || !event.is_private;

  const handleRsvp = async () => {
    if (isRsvping || !canRsvp) return;

    setIsRsvping(true);

    try {
      if (userRsvp) {
        // Cancel RSVP
        const result = await cancelRsvp(event.id);
        if (result.success) {
          const countDiff = userRsvp === "going" ? -1 : 0;
          setUserRsvp(null);
          onRsvpChange(event.id, null, countDiff);
        }
      } else {
        // New RSVP
        const result = await rsvpToEvent(event.id, "going");
        if (result.success && result.status) {
          const countDiff = result.status === "going" ? 1 : 0;
          setUserRsvp(result.status);
          onRsvpChange(event.id, result.status, countDiff);

          // Confetti on successful RSVP
          if (result.status === "going") {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
            });
          }
        }
      }
    } finally {
      setIsRsvping(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this event? This cannot be undone.")) return;
    const result = await deleteEvent(event.id);
    if (result.success) {
      onDelete();
    }
    setShowMenu(false);
  };

  return (
    <motion.div
      className="card overflow-hidden hover:border-[var(--amber)]/30 transition-all group"
      whileHover={{ y: -3 }}
    >
      {/* Cover image or emoji */}
      <div className="relative h-40 -mx-5 -mt-5 mb-4 bg-gradient-to-br from-[var(--amber)]/20 to-[var(--rose)]/20">
        {event.cover_url ? (
          <img
            src={event.cover_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            {event.emoji}
          </div>
        )}

        {/* Private badge */}
        {event.is_private && (
          <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-black/50 text-white text-xs flex items-center gap-1">
            <Lock size={12} />
            Private
          </div>
        )}

        {/* Category badge */}
        <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/50 text-white text-xs flex items-center gap-1">
          {categoryInfo?.emoji} {categoryInfo?.label}
        </div>
      </div>

      {/* Content */}
      <div>
        {/* Title and menu */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-lg group-hover:text-[var(--amber)] transition-colors line-clamp-1">
            {event.title}
          </h3>

          {isHost && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
              >
                <MoreHorizontal size={16} className="text-[var(--text-muted)]" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-[var(--bg-card)] rounded-xl shadow-lg border border-[var(--border-color)] z-20 overflow-hidden">
                  <button
                    onClick={handleDelete}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--bg-hover)] flex items-center gap-2 text-red-500"
                  >
                    <Trash2 size={14} />
                    Delete event
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Date, time, location */}
        <div className="space-y-1 text-sm text-[var(--text-secondary)] mb-3">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-[var(--amber)]" />
            {formattedDate}
            <Clock size={14} className="ml-2 text-[var(--amber)]" />
            {formattedTime}
            {event.end_time && ` - ${event.end_time.slice(0, 5)}`}
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-[var(--amber)]" />
            {event.venue_name || event.city}
            {event.is_private && !isGoing && (
              <span className="text-xs text-[var(--text-muted)]">
                (RSVP to see address)
              </span>
            )}
          </div>
        </div>

        {/* Description preview */}
        <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-3">
          {event.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)]">
          {/* Host and attendee count */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <span className="text-sm">{event.host?.avatar_emoji ?? "👤"}</span>
              )}
              <span>{displayName}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
              <Users size={14} />
              {event.attendee_count}
              {event.capacity && ` / ${event.capacity}`}
            </div>
          </div>

          {/* RSVP button */}
          <button
            onClick={handleRsvp}
            disabled={isRsvping || (!canRsvp && !userRsvp)}
            className={`btn btn-sm ${
              isGoing
                ? "bg-[var(--teal)] text-white"
                : isWaitlisted
                ? "bg-[var(--amber)] text-white"
                : isFull && !userRsvp
                ? "btn-secondary"
                : "btn-brand"
            }`}
            title={
              !canRsvp
                ? "Disable anonymous mode to RSVP to private events"
                : undefined
            }
          >
            {isRsvping ? (
              <Loader2 size={14} className="animate-spin" />
            ) : isGoing ? (
              <>
                <Check size={14} />
                Going
              </>
            ) : isWaitlisted ? (
              "Waitlisted"
            ) : isFull ? (
              "Join Waitlist"
            ) : (
              "RSVP"
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
