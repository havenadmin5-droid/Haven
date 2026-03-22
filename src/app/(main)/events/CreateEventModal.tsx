"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Loader2, Calendar, MapPin, Clock, Users, Lock, Image } from "lucide-react";
import { createEvent } from "./actions";
import { CITIES } from "@/lib/constants";
import { EVENT_CATEGORIES } from "@/lib/types/database";
import type { EventWithHost, City, EventCategory } from "@/lib/types";

interface CreateEventModalProps {
  onClose: () => void;
  onEventCreated: (event: EventWithHost) => void;
}

const EMOJI_OPTIONS = ["🎉", "🎨", "🎵", "💻", "🧘", "💃", "📚", "💪", "💜", "🔧", "🌈", "✨"];

export function CreateEventModal({ onClose, onEventCreated }: CreateEventModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState<City | "">("");
  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [category, setCategory] = useState<EventCategory | "">("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [capacity, setCapacity] = useState("");
  const [emoji, setEmoji] = useState("🎉");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid =
    title.trim() &&
    description.trim() &&
    city &&
    eventDate &&
    eventTime &&
    category;

  // Minimum date is today
  const today = new Date().toISOString().split("T")[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) {
      setError("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("city", city);
      if (venueName.trim()) {
        formData.append("venue_name", venueName.trim());
      }
      if (venueAddress.trim()) {
        formData.append("venue_address", venueAddress.trim());
      }
      formData.append("event_date", eventDate);
      formData.append("event_time", eventTime);
      if (endTime) {
        formData.append("end_time", endTime);
      }
      formData.append("category", category);
      formData.append("is_private", String(isPrivate));
      if (capacity) {
        formData.append("capacity", capacity);
      }
      formData.append("emoji", emoji);

      const result = await createEvent(formData);

      if (!result.success) {
        setError(result.error ?? "Failed to create event");
      } else if (result.event) {
        onEventCreated(result.event);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[var(--bg-card)] rounded-2xl shadow-xl"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="text-[var(--amber)]" size={24} />
              Create Event
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Emoji selector */}
            <div>
              <label className="block text-sm font-medium mb-2">Event Icon</label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_OPTIONS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                      emoji === e
                        ? "bg-[var(--amber)]/20 ring-2 ring-[var(--amber)]"
                        : "hover:bg-[var(--bg-hover)]"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Pride Art Workshop"
                maxLength={120}
                className="w-full"
              />
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {title.length}/120
              </p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as EventCategory)}
                className="w-full"
              >
                <option value="">Select category</option>
                {EVENT_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.emoji} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  min={today}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            {/* End time (optional) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  End Time (optional)
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value as City)}
                  className="w-full"
                >
                  <option value="">Select city</option>
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Venue */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Venue Name
                </label>
                <input
                  type="text"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="e.g., The Art Gallery"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Venue Address
                </label>
                <input
                  type="text"
                  value={venueAddress}
                  onChange={(e) => setVenueAddress(e.target.value)}
                  placeholder="e.g., 123 Main St"
                  className="w-full"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your event..."
                rows={4}
                maxLength={2000}
                className="w-full resize-none"
              />
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {description.length}/2000
              </p>
            </div>

            {/* Capacity and Privacy */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Capacity (optional)
                </label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="Leave empty for unlimited"
                  min="1"
                  max="10000"
                  className="w-full"
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="w-4 h-4 rounded border-[var(--border-color)]"
                  />
                  <Lock size={16} className="text-[var(--text-muted)]" />
                  <span className="text-sm">Private event</span>
                </label>
              </div>
            </div>

            {isPrivate && (
              <p className="text-xs text-[var(--text-muted)] -mt-2">
                Private events hide the venue address until users RSVP. Anonymous users cannot RSVP to private events.
              </p>
            )}

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !isValid}
                className="flex-1 btn btn-brand"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Creating...
                  </>
                ) : (
                  <>
                    <Calendar size={18} />
                    Create Event
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}
