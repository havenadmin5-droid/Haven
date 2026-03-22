"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Users, Lock, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import type { CommunityWithMembership } from "@/lib/types";
import { COMMUNITY_TAG_COLORS } from "@/lib/constants";
import { joinCommunity, leaveCommunity } from "@/app/(main)/communities/actions";

interface CommunityCardProps {
  community: CommunityWithMembership;
  index?: number;
}

export function CommunityCard({ community, index = 0 }: CommunityCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isMember, setIsMember] = useState(community.is_member);
  const [error, setError] = useState<string | null>(null);

  const tagColor = COMMUNITY_TAG_COLORS[community.tag];

  const handleJoinLeave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoading(true);
    setError(null);

    try {
      if (isMember) {
        const result = await leaveCommunity(community.id);
        if (result.success) {
          setIsMember(false);
        } else {
          setError(result.error ?? "Failed to leave");
        }
      } else {
        const result = await joinCommunity(community.id);
        if (result.success) {
          setIsMember(true);
        } else {
          setError(result.error ?? "Failed to join");
        }
      }
    } catch {
      setError("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link href={`/communities/${community.slug}`} className="block">
        <div className="card group relative overflow-hidden">
          {/* Color bar at top */}
          <div
            className="absolute top-0 left-0 right-0 h-1 opacity-60 group-hover:opacity-100 transition-opacity"
            style={{ backgroundColor: tagColor }}
          />

          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ backgroundColor: `${tagColor}20` }}
            >
              {community.avatar_emoji}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold truncate">{community.name}</h3>
                {community.is_private && (
                  <Lock size={14} className="text-[var(--text-muted)] flex-shrink-0" />
                )}
              </div>

              <div className="flex items-center gap-3 text-sm text-[var(--text-muted)] mb-2">
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: `${tagColor}20`, color: tagColor }}
                >
                  {community.tag}
                </span>
                <span className="flex items-center gap-1">
                  <Users size={14} />
                  {community.member_count}
                </span>
              </div>

              {community.description && (
                <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
                  {community.description}
                </p>
              )}
            </div>

            {/* Join/Leave button */}
            <div className="flex-shrink-0">
              <button
                onClick={handleJoinLeave}
                disabled={isLoading}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${
                  isMember
                    ? "bg-[var(--bg-input)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                    : "text-white"
                }`}
                style={!isMember ? { backgroundColor: tagColor } : undefined}
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : isMember ? (
                  <span className="flex items-center gap-1">
                    <Check size={14} />
                    Joined
                  </span>
                ) : (
                  "Join"
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 mt-2">{error}</p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
