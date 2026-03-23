"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Briefcase, Check, MessageCircle } from "lucide-react";
import type { PublicProfile } from "@/lib/types";

interface ProfessionalCardProps {
  profile: PublicProfile;
  index?: number;
  onContact?: () => void;
  isAnonymousViewer?: boolean;
  currentUserId?: string;
}

export function ProfessionalCard({
  profile,
  index = 0,
  onContact,
  isAnonymousViewer = false,
  currentUserId,
}: ProfessionalCardProps) {
  const isOwnProfile = currentUserId === profile.id;

  return (
    <motion.div
      className="card group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      {/* Rainbow gradient bar (hidden, shows on hover) */}
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl gradient-rainbow opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-14 h-14 rounded-xl bg-[var(--bg-input)] flex items-center justify-center text-2xl">
            {profile.display_avatar ? (
              <img
                src={profile.display_avatar}
                alt={profile.display_name}
                className="w-full h-full rounded-xl object-cover"
              />
            ) : (
              profile.avatar_emoji
            )}
          </div>
          {profile.is_verified && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[var(--teal)] flex items-center justify-center">
              <Check size={12} className="text-white" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold truncate">{profile.display_name}</h3>
            {profile.is_available && (
              <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--teal)] text-white">
                Available
              </span>
            )}
          </div>

          {profile.display_real_name && (
            <p className="text-sm text-[var(--text-secondary)] truncate">
              {profile.display_real_name}
            </p>
          )}

          <div className="flex items-center gap-3 mt-2 text-sm text-[var(--text-muted)]">
            <span className="flex items-center gap-1">
              <Briefcase size={14} />
              {profile.profession}
            </span>
            {profile.display_city && (
              <span className="flex items-center gap-1">
                <MapPin size={14} />
                {profile.display_city}
              </span>
            )}
          </div>

          {profile.bio && (
            <p className="mt-2 text-sm text-[var(--text-secondary)] line-clamp-2">
              {profile.bio}
            </p>
          )}

          {/* Skills */}
          {profile.skills && profile.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {profile.skills.slice(0, 4).map((skill) => (
                <span
                  key={skill}
                  className="px-2 py-0.5 rounded-full text-xs bg-[var(--bg-input)] text-[var(--text-secondary)]"
                >
                  {skill}
                </span>
              ))}
              {profile.skills.length > 4 && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-[var(--bg-input)] text-[var(--text-muted)]">
                  +{profile.skills.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[var(--border-color)]">
        <Link
          href={isOwnProfile ? "/profile" : `/profile/${profile.id}`}
          className="btn btn-ghost flex-1 text-sm py-2"
        >
          {isOwnProfile ? "Edit Profile" : "View Profile"}
        </Link>
        {!isOwnProfile && (
          <button
            onClick={onContact}
            disabled={isAnonymousViewer}
            className="btn btn-rose flex-1 text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title={isAnonymousViewer ? "Disable anonymous mode to contact" : "Send message"}
          >
            <MessageCircle size={16} />
            Contact
          </button>
        )}
      </div>
    </motion.div>
  );
}
