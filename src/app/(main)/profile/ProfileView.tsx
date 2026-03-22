"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  Edit2, Save, X, MapPin, Briefcase, Calendar,
  Shield, Eye, EyeOff, Check, Loader2, UserX, AlertCircle
} from "lucide-react";
import { profileUpdateSchema, type ProfileUpdateData } from "@/lib/validations/auth";
import { CITIES, PROFESSIONS, AVATAR_EMOJIS } from "@/lib/constants";
import { updateProfile } from "./actions";
import { PhotoUpload } from "@/components/features/PhotoUpload";
import { formatDistanceToNow } from "date-fns";
import type { Profile } from "@/lib/types";
import {
  getDisplayName,
  getDisplayAvatar,
  getDisplayRealName,
  isEligibleForAnonymousMode,
} from "@/lib/utils/privacy";

interface ProfileViewProps {
  profile: Profile;
}

export function ProfileView({ profile }: ProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileUpdateData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      username: profile.username,
      avatar_emoji: profile.avatar_emoji,
      real_name: profile.real_name ?? "",
      show_real_name: profile.show_real_name,
      show_photo: profile.show_photo,
      bio: profile.bio ?? "",
      city: profile.city,
      profession: profile.profession,
      pronouns: profile.pronouns ?? "",
      skills: profile.skills ?? [],
      is_available: profile.is_available,
    },
  });

  const watchedEmoji = watch("avatar_emoji");
  const selectedEmoji = watchedEmoji ?? profile.avatar_emoji;

  const onSubmit = async (data: ProfileUpdateData) => {
    setServerError(null);
    setSuccessMessage(null);

    const result = await updateProfile(data);

    if (!result.success) {
      setServerError(result.error ?? "Failed to update profile");
    } else {
      setSuccessMessage("Profile updated successfully!");
      setIsEditing(false);
      // Refresh the page to show updated data
      window.location.reload();
    }
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
    setServerError(null);
  };

  const memberSince = formatDistanceToNow(new Date(profile.created_at), { addSuffix: true });

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Your Profile</h1>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="btn btn-ghost"
          >
            <Edit2 size={18} />
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={handleCancel} className="btn btn-ghost">
              <X size={18} />
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      {serverError && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
          {serverError}
        </div>
      )}
      {successMessage && (
        <div className="mb-6 p-4 rounded-xl bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Profile Card */}
        <motion.div
          className="card mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Avatar & Basic Info */}
          <div className="flex items-start gap-6 mb-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-[var(--bg-input)] flex items-center justify-center text-5xl overflow-hidden">
                {profile.show_photo && avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={profile.username}
                    className="w-full h-full rounded-2xl object-cover"
                  />
                ) : (
                  selectedEmoji
                )}
              </div>
              {profile.is_verified && (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[var(--teal)] flex items-center justify-center">
                  <Check size={16} className="text-white" />
                </div>
              )}
            </div>

            {/* Name & Status */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold">{profile.username}</h2>
                {profile.is_available && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--teal)] text-white">
                    Available
                  </span>
                )}
              </div>
              {profile.show_real_name && profile.real_name && (
                <p className="text-[var(--text-secondary)]">{profile.real_name}</p>
              )}
              {profile.pronouns && (
                <p className="text-sm text-[var(--text-muted)]">{profile.pronouns}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-sm text-[var(--text-secondary)]">
                <span className="flex items-center gap-1">
                  <Briefcase size={14} />
                  {profile.profession}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin size={14} />
                  {profile.city}
                </span>
              </div>
            </div>
          </div>

          {/* Bio */}
          {isEditing ? (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Bio</label>
              <textarea
                {...register("bio")}
                className="w-full h-24 resize-none"
                placeholder="Tell the community about yourself..."
                maxLength={280}
              />
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {(watch("bio") ?? "").length}/280 characters
              </p>
              {errors.bio && (
                <p className="text-sm text-red-500 mt-1">{errors.bio.message}</p>
              )}
            </div>
          ) : profile.bio ? (
            <p className="text-[var(--text-secondary)] mb-4">{profile.bio}</p>
          ) : null}

          {/* Skills */}
          {profile.skills && profile.skills.length > 0 && !isEditing && (
            <div className="flex flex-wrap gap-2 mb-4">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 rounded-full text-sm bg-[var(--bg-input)] text-[var(--text-secondary)]"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}

          {/* Member info */}
          <div className="flex items-center gap-4 text-sm text-[var(--text-muted)] pt-4 border-t border-[var(--border-color)]">
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              Member {memberSince}
            </span>
            <span className="flex items-center gap-1">
              <Shield size={14} />
              Trust score: {profile.trust_score}
            </span>
          </div>
        </motion.div>

        {/* How Others See You */}
        {!isEditing && (
          <motion.div
            className="card mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Eye size={18} className="text-[var(--violet)]" />
              <h3 className="font-bold">How Others See You</h3>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-input)]">
              {/* Preview Avatar */}
              <div className="w-12 h-12 rounded-xl bg-[var(--bg-card)] flex items-center justify-center text-2xl overflow-hidden">
                {profile.is_anonymous ? (
                  <UserX size={24} className="text-[var(--text-muted)]" />
                ) : getDisplayAvatar(profile) ? (
                  <img
                    src={getDisplayAvatar(profile)!}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profile.avatar_emoji
                )}
              </div>

              {/* Preview Info */}
              <div className="flex-1">
                <p className="font-medium">
                  {getDisplayName(profile)}
                </p>
                {getDisplayRealName(profile) && (
                  <p className="text-sm text-[var(--text-secondary)]">
                    {getDisplayRealName(profile)}
                  </p>
                )}
                <p className="text-xs text-[var(--text-muted)]">
                  {profile.is_anonymous ? "Location hidden" : profile.city} • {profile.profession}
                </p>
              </div>
            </div>

            {/* Anonymous Mode Status */}
            <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
              {profile.is_anonymous ? (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--violet)]/10">
                  <EyeOff size={18} className="text-[var(--violet)] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[var(--violet)]">
                      Anonymous Mode Active
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      You appear as &quot;{profile.anonymous_alias}&quot; to others. Some features like contacting professionals are restricted.
                    </p>
                  </div>
                </div>
              ) : isEligibleForAnonymousMode(profile) ? (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-input)]">
                  <Shield size={18} className="text-[var(--teal)] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">
                      Anonymous Mode Available
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      You can enable anonymous mode in the Safety Center to browse privately.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-input)]">
                  <AlertCircle size={18} className="text-[var(--amber)] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">
                      Anonymous Mode Not Available Yet
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Requires 14+ days membership and trust score of 20+. Keep participating positively to unlock.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Edit Form Fields */}
        {isEditing && (
          <motion.div
            className="card space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 className="text-lg font-bold">Edit Details</h3>

            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium mb-3">Profile Photo</label>
              <PhotoUpload
                currentUrl={avatarUrl}
                emoji={selectedEmoji}
                onUploadComplete={(url) => setAvatarUrl(url)}
              />
              <div className="flex items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  id="show_photo"
                  {...register("show_photo")}
                  className="w-4 h-4"
                />
                <label htmlFor="show_photo" className="text-sm text-[var(--text-secondary)]">
                  {avatarUrl ? "Show photo on profile (instead of emoji)" : "Photo will be shown when uploaded"}
                </label>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-[var(--border-color)]" />

            {/* Avatar Emoji */}
            <div>
              <label className="block text-sm font-medium mb-2">Fallback Emoji</label>
              <p className="text-xs text-[var(--text-muted)] mb-3">
                Shown when photo is hidden or not uploaded
              </p>
              <div className="grid grid-cols-8 gap-2">
                {AVATAR_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setValue("avatar_emoji", emoji, { shouldDirty: true })}
                    className={`w-10 h-10 text-xl rounded-lg flex items-center justify-center transition-all ${
                      selectedEmoji === emoji
                        ? "bg-[var(--violet)] ring-2 ring-[var(--violet)] ring-offset-2"
                        : "bg-[var(--bg-input)] hover:bg-[var(--bg-hover)]"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium mb-2">Username</label>
              <input
                {...register("username")}
                className="w-full"
                placeholder="your_username"
              />
              {errors.username && (
                <p className="text-sm text-red-500 mt-1">{errors.username.message}</p>
              )}
            </div>

            {/* Real Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Real Name (Optional)</label>
              <input
                {...register("real_name")}
                className="w-full"
                placeholder="Your real name"
              />
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="show_real_name"
                  {...register("show_real_name")}
                  className="w-4 h-4"
                />
                <label htmlFor="show_real_name" className="text-sm text-[var(--text-secondary)]">
                  Show real name on profile
                </label>
              </div>
            </div>

            {/* Pronouns */}
            <div>
              <label className="block text-sm font-medium mb-2">Pronouns</label>
              <input
                {...register("pronouns")}
                className="w-full"
                placeholder="e.g., they/them, she/her, he/him"
              />
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium mb-2">City</label>
              <select {...register("city")} className="w-full">
                {CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* Profession */}
            <div>
              <label className="block text-sm font-medium mb-2">Profession</label>
              <select {...register("profession")} className="w-full">
                {PROFESSIONS.map((profession) => (
                  <option key={profession} value={profession}>
                    {profession}
                  </option>
                ))}
              </select>
            </div>

            {/* Availability */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_available"
                {...register("is_available")}
                className="w-4 h-4"
              />
              <label htmlFor="is_available" className="text-sm">
                Available for connections
              </label>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="btn btn-brand w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </button>
          </motion.div>
        )}
      </form>
    </div>
  );
}
