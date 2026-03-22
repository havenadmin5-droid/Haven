"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useClickOutside } from "@/hooks/useClickOutside";
import {
  MapPin,
  Clock,
  Wifi,
  Star,
  ExternalLink,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Trash2,
  XCircle,
  Check,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toggleSaveJob, deactivateJob, deleteJob } from "@/app/(main)/jobs/actions";
import { getDisplayName, getDisplayAvatar } from "@/lib/utils/privacy";
import { JOB_TYPES } from "@/lib/types/database";
import type { JobWithPoster } from "@/lib/types";

interface JobCardProps {
  job: JobWithPoster;
  currentUserId: string;
  onSaveToggle: (jobId: string, saved: boolean) => void;
  onDelete: () => void;
}

export function JobCard({
  job,
  currentUserId,
  onSaveToggle,
  onDelete,
}: JobCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(job.is_saved ?? false);

  const closeMenu = useCallback(() => setShowMenu(false), []);
  const menuRef = useClickOutside<HTMLDivElement>(closeMenu, showMenu);

  const isOwner = job.posted_by === currentUserId;
  const timeAgo = formatDistanceToNow(new Date(job.created_at), {
    addSuffix: true,
  });

  // Get display info for poster
  const displayName = job.poster?.is_anonymous
    ? "Anonymous"
    : getDisplayName({
        username: job.poster?.username ?? "User",
        is_anonymous: false,
        anonymous_alias: null,
      });

  const avatarUrl = job.poster?.is_anonymous
    ? null
    : getDisplayAvatar({
        avatar_url: job.poster?.avatar_url ?? null,
        show_photo: job.poster?.show_photo ?? false,
        is_anonymous: false,
      });

  const jobTypeLabel =
    JOB_TYPES.find((t) => t.value === job.job_type)?.label ?? job.job_type;

  const handleSave = async () => {
    if (isSaving) return;

    setIsSaving(true);
    const newSavedState = !isSaved;
    setIsSaved(newSavedState); // Optimistic update

    try {
      const result = await toggleSaveJob(job.id);
      if (result.success) {
        onSaveToggle(job.id, result.saved ?? false);
      } else {
        setIsSaved(!newSavedState); // Revert
      }
    } catch {
      setIsSaved(!newSavedState); // Revert
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm("Mark this job as filled/closed?")) return;
    const result = await deactivateJob(job.id);
    if (result.success) {
      onDelete();
    }
    setShowMenu(false);
  };

  const handleDelete = async () => {
    if (!confirm("Delete this job posting? This cannot be undone.")) return;
    const result = await deleteJob(job.id);
    if (result.success) {
      onDelete();
    }
    setShowMenu(false);
  };

  const handleApply = () => {
    if (job.apply_url) {
      window.open(job.apply_url, "_blank", "noopener,noreferrer");
    } else if (job.apply_email) {
      window.location.href = `mailto:${job.apply_email}?subject=Application for ${encodeURIComponent(job.title)} at ${encodeURIComponent(job.company)}`;
    } else {
      // TODO: Open DM with poster
      alert("DM feature coming soon!");
    }
  };

  return (
    <motion.div
      className="card hover:border-[var(--rose)]/30 transition-all group"
      whileHover={{ y: -3 }}
    >
      <div className="flex gap-4">
        {/* Company emoji/logo */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-xl bg-[var(--rose)]/10 flex items-center justify-center text-2xl">
            {job.poster?.avatar_emoji ?? "💼"}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-lg group-hover:text-[var(--rose)] transition-colors">
                {job.title}
              </h3>
              <p className="text-[var(--text-secondary)]">{job.company}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`p-2 rounded-lg transition-colors ${
                  isSaved
                    ? "text-[var(--rose)] bg-[var(--rose)]/10"
                    : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"
                }`}
                title={isSaved ? "Unsave" : "Save"}
              >
                <Star size={18} fill={isSaved ? "currentColor" : "none"} />
              </button>

              {/* Menu (owner only) */}
              {isOwner && (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
                  >
                    <MoreHorizontal size={18} className="text-[var(--text-muted)]" />
                  </button>

                  {showMenu && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-[var(--bg-card)] rounded-xl shadow-lg border border-[var(--border-color)] z-20 overflow-hidden">
                      <button
                        onClick={handleDeactivate}
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-[var(--bg-hover)] flex items-center gap-2"
                      >
                        <XCircle size={16} />
                        Mark as filled
                      </button>
                      <button
                        onClick={handleDelete}
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-[var(--bg-hover)] flex items-center gap-2 text-red-500"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-[var(--bg-tertiary)]">
              <MapPin size={12} />
              {job.city}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-[var(--violet)]/10 text-[var(--violet)]">
              <Clock size={12} />
              {jobTypeLabel}
            </span>
            {job.is_remote && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-[var(--teal)]/10 text-[var(--teal)]">
                <Wifi size={12} />
                Remote
              </span>
            )}
            {job.salary_range && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-[var(--amber)]/10 text-[var(--amber)]">
                {job.salary_range}
              </span>
            )}
          </div>

          {/* Description preview */}
          <p className="text-sm text-[var(--text-secondary)] mt-3 line-clamp-2">
            {job.description}
          </p>

          {/* Tags */}
          {job.tags && job.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {job.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-full text-xs bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--border-color)]">
            {/* Poster info */}
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <span className="text-sm">{job.poster?.avatar_emoji ?? "👤"}</span>
              )}
              <span>Posted by {displayName}</span>
              <span>•</span>
              <span>{timeAgo}</span>
            </div>

            {/* Apply button */}
            <button onClick={handleApply} className="btn btn-brand btn-sm">
              {job.apply_url ? (
                <>
                  <ExternalLink size={14} />
                  Apply
                </>
              ) : job.apply_email ? (
                <>
                  <Mail size={14} />
                  Email
                </>
              ) : (
                <>
                  <MessageCircle size={14} />
                  Message
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
