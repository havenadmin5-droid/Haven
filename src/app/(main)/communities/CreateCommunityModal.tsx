"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Sparkles, Lock, Globe } from "lucide-react";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { COMMUNITY_TAGS, COMMUNITY_EMOJIS, COMMUNITY_TAG_COLORS } from "@/lib/constants";
import type { CommunityTag } from "@/lib/types";
import { createCommunity, type CreateCommunityData } from "./actions";

const createCommunitySchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(60, "Name must be 60 characters or less"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional(),
  tag: z.enum(COMMUNITY_TAGS as [CommunityTag, ...CommunityTag[]]),
  avatar_emoji: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
  is_private: z.boolean().default(false),
});

interface CreateCommunityModalProps {
  onClose: () => void;
}

export function CreateCommunityModal({ onClose }: CreateCommunityModalProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateCommunityData>({
    resolver: zodResolver(createCommunitySchema),
    defaultValues: {
      name: "",
      description: "",
      tag: "Social",
      avatar_emoji: "🌈",
      color: COMMUNITY_TAG_COLORS.Social,
      is_private: false,
    },
  });

  const selectedEmoji = watch("avatar_emoji");
  const selectedTag = watch("tag");
  const isPrivate = watch("is_private");

  const handleTagChange = (tag: CommunityTag) => {
    setValue("tag", tag);
    setValue("color", COMMUNITY_TAG_COLORS[tag]);
  };

  const onSubmit = async (data: CreateCommunityData) => {
    setServerError(null);
    const result = await createCommunity(data);
    if (!result.success) {
      setServerError(result.error ?? "Failed to create community");
    } else if (result.slug) {
      onClose();
      router.push(`/communities/${result.slug}`);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-[var(--bg-card)] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-[var(--teal)]" />
              <h2 className="text-xl font-bold">Create Community</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {serverError && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
                {serverError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Community Icon</label>
              <div className="grid grid-cols-8 gap-2">
                {COMMUNITY_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setValue("avatar_emoji", emoji)}
                    className={`w-10 h-10 text-xl rounded-lg flex items-center justify-center transition-all ${
                      selectedEmoji === emoji
                        ? "bg-[var(--teal)] ring-2 ring-[var(--teal)] ring-offset-2"
                        : "bg-[var(--bg-input)] hover:bg-[var(--bg-hover)]"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Community Name</label>
              <input {...register("name")} className="w-full" placeholder="e.g., Mumbai Queer Tech" maxLength={60} />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description (Optional)</label>
              <textarea {...register("description")} className="w-full h-24 resize-none" placeholder="What is this community about?" maxLength={500} />
              <p className="text-xs text-[var(--text-muted)] mt-1">{(watch("description") ?? "").length}/500 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <div className="flex flex-wrap gap-2">
                {COMMUNITY_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagChange(tag)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedTag === tag ? "text-white" : "bg-[var(--bg-input)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                    }`}
                    style={selectedTag === tag ? { backgroundColor: COMMUNITY_TAG_COLORS[tag] } : undefined}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">Privacy</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setValue("is_private", false)}
                  className={`flex-1 p-4 rounded-xl border-2 transition-colors ${!isPrivate ? "border-[var(--teal)] bg-[var(--teal)]/10" : "border-[var(--border-color)]"}`}
                >
                  <Globe size={24} className={`mx-auto mb-2 ${!isPrivate ? "text-[var(--teal)]" : "text-[var(--text-muted)]"}`} />
                  <p className="font-medium text-sm">Public</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Anyone can join and see posts</p>
                </button>
                <button
                  type="button"
                  onClick={() => setValue("is_private", true)}
                  className={`flex-1 p-4 rounded-xl border-2 transition-colors ${isPrivate ? "border-[var(--violet)] bg-[var(--violet)]/10" : "border-[var(--border-color)]"}`}
                >
                  <Lock size={24} className={`mx-auto mb-2 ${isPrivate ? "text-[var(--violet)]" : "text-[var(--text-muted)]"}`} />
                  <p className="font-medium text-sm">Private</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Approval required to join</p>
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onClose} className="btn btn-ghost flex-1">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="btn btn-brand flex-1">
                {isSubmitting ? (<><Loader2 className="animate-spin" size={18} />Creating...</>) : "Create Community"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
