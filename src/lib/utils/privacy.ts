/**
 * Privacy masking utilities for Haven
 *
 * These functions handle the display transformation for profiles
 * based on privacy settings (anonymous mode, show_real_name, etc.)
 */

import type { PublicProfile } from "@/lib/types";

/**
 * Mask a profile for public display
 * Applies privacy rules based on the profile's settings
 */
export function maskProfileForPublic(profile: {
  id: string;
  username: string;
  avatar_emoji: string;
  avatar_url: string | null;
  show_photo: boolean;
  real_name: string | null;
  show_real_name: boolean;
  city: string;
  profession: string;
  bio: string | null;
  skills: string[] | null;
  is_verified: boolean;
  is_available: boolean;
  is_anonymous: boolean;
  anonymous_alias: string | null;
  pronouns: string | null;
}): PublicProfile {
  const isAnonymous = profile.is_anonymous;

  return {
    id: profile.id,
    // Display name: anonymous alias if anonymous, otherwise username
    display_name: isAnonymous
      ? (profile.anonymous_alias ?? "Anonymous")
      : profile.username,
    // Avatar: hide if anonymous or if show_photo is false
    display_avatar: isAnonymous
      ? null
      : profile.show_photo
        ? profile.avatar_url
        : null,
    avatar_emoji: profile.avatar_emoji,
    // Real name: only show if explicitly enabled AND not anonymous
    display_real_name: profile.show_real_name && !isAnonymous
      ? profile.real_name
      : null,
    // City: hide if anonymous for privacy
    display_city: isAnonymous ? null : (profile.city as PublicProfile["display_city"]),
    profession: profile.profession as PublicProfile["profession"],
    bio: profile.bio,
    skills: profile.skills ?? [],
    is_verified: profile.is_verified,
    is_available: profile.is_available,
    pronouns: profile.pronouns,
    created_at: "",
  };
}

/**
 * Get the display name for a profile
 * Respects anonymous mode and real name settings
 */
export function getDisplayName(profile: {
  username: string;
  is_anonymous: boolean;
  anonymous_alias: string | null;
}): string {
  if (profile.is_anonymous) {
    return profile.anonymous_alias ?? "Anonymous";
  }
  return profile.username;
}

/**
 * Get the display avatar URL for a profile
 * Returns null if anonymous or show_photo is disabled
 */
export function getDisplayAvatar(profile: {
  avatar_url: string | null;
  show_photo: boolean;
  is_anonymous: boolean;
}): string | null {
  if (profile.is_anonymous || !profile.show_photo) {
    return null;
  }
  return profile.avatar_url;
}

/**
 * Get the display real name for a profile
 * Returns null if not enabled or if anonymous
 */
export function getDisplayRealName(profile: {
  real_name: string | null;
  show_real_name: boolean;
  is_anonymous: boolean;
}): string | null {
  if (profile.is_anonymous || !profile.show_real_name) {
    return null;
  }
  return profile.real_name;
}

/**
 * Check if a user can contact another user
 * Anonymous users cannot initiate contact
 */
export function canContact(viewer: { is_anonymous: boolean }): boolean {
  return !viewer.is_anonymous;
}

/**
 * Check if a user is eligible for anonymous mode
 * Requirements per CLAUDE.md:
 * - Account >= 14 days old
 * - trust_score >= 20
 * - Zero unresolved reports
 * - anon_suspended = FALSE
 */
export function isEligibleForAnonymousMode(profile: {
  created_at: string;
  trust_score: number;
  anon_suspended: boolean;
}): boolean {
  const accountAge = Date.now() - new Date(profile.created_at).getTime();
  const fourteenDays = 14 * 24 * 60 * 60 * 1000;

  return (
    accountAge >= fourteenDays &&
    profile.trust_score >= 20 &&
    !profile.anon_suspended
  );
}

/**
 * Mask identity for display (simplified version for components)
 * Returns display information based on anonymous settings
 */
export function maskIdentity(profile: {
  id: string;
  username: string;
  avatar_emoji: string;
  avatar_url: string | null;
  show_photo: boolean;
  is_anonymous: boolean;
  anonymous_alias: string | null;
  is_verified: boolean;
}): {
  displayName: string;
  displayEmoji: string;
  displayPhoto: string | null;
  isAnonymous: boolean;
} {
  if (profile.is_anonymous) {
    return {
      displayName: profile.anonymous_alias ?? "Anonymous",
      displayEmoji: "👤",
      displayPhoto: null,
      isAnonymous: true,
    };
  }

  return {
    displayName: profile.username,
    displayEmoji: profile.avatar_emoji,
    displayPhoto: profile.show_photo ? profile.avatar_url : null,
    isAnonymous: false,
  };
}

/**
 * Generate a random anonymous alias
 * Format: Adjective + Nature word + 2-digit number
 */
export function generateAnonymousAlias(): string {
  const adjectives = [
    "Gentle", "Brave", "Quiet", "Bright", "Swift",
    "Calm", "Kind", "Soft", "Wild", "Free",
    "Bold", "Warm", "Cool", "True", "Pure",
  ];

  const nouns = [
    "River", "Cloud", "Moon", "Star", "Wave",
    "Forest", "Mountain", "Meadow", "Garden", "Sky",
    "Breeze", "Dawn", "Dusk", "Rain", "Sun",
  ];

  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]!;
  const noun = nouns[Math.floor(Math.random() * nouns.length)]!;
  const number = Math.floor(Math.random() * 90) + 10; // 10-99

  return `${adjective}${noun}${number}`;
}
