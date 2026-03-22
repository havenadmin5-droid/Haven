"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Image, X, Loader2, Eye, EyeOff } from "lucide-react";
import { createPost } from "@/app/(main)/feed/actions";
import type { PostWithAuthor } from "@/lib/types";

interface CreatePostFormProps {
  communityId?: string;
  communityName?: string;
  onPostCreated: (post: PostWithAuthor) => void;
  onCancel: () => void;
}

export function CreatePostForm({
  communityId,
  communityName,
  onPostCreated,
  onCancel,
}: CreatePostFormProps) {
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length + images.length > 4) {
      setError("Maximum 4 images allowed");
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        setError("Only image files are allowed");
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Images must be less than 5MB");
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setImages([...images, ...validFiles]);

    // Create previews
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    setError(null);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() && images.length === 0) {
      setError("Please add some content or images");
      return;
    }

    if (content.length > 2000) {
      setError("Content must be 2000 characters or less");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("content", content.trim());
      formData.append("is_anonymous", String(isAnonymous));
      if (communityId) {
        formData.append("community_id", communityId);
      }
      images.forEach((image) => {
        formData.append("images", image);
      });

      const result = await createPost(formData);

      if (!result.success) {
        setError(result.error ?? "Failed to create post");
      } else if (result.post) {
        onPostCreated(result.post);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">
          {communityName ? `Post to ${communityName}` : "Create a Post"}
        </h3>
        <button
          onClick={onCancel}
          className="p-1 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Content */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind?"
        className="w-full h-32 resize-none mb-3"
        maxLength={2000}
      />
      <p className="text-xs text-[var(--text-muted)] mb-4">
        {content.length}/2000 characters
      </p>

      {/* Image previews */}
      {imagePreviews.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-4">
          {imagePreviews.map((preview, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          {/* Add image */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={images.length >= 4}
            className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Add images"
          >
            <Image size={20} className="text-[var(--teal)]" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />

          {/* Anonymous toggle */}
          <button
            onClick={() => setIsAnonymous(!isAnonymous)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              isAnonymous
                ? "bg-[var(--violet)]/10 text-[var(--violet)]"
                : "hover:bg-[var(--bg-hover)] text-[var(--text-muted)]"
            }`}
          >
            {isAnonymous ? <EyeOff size={16} /> : <Eye size={16} />}
            {isAnonymous ? "Anonymous" : "Public"}
          </button>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || (!content.trim() && images.length === 0)}
          className="btn btn-brand px-6"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              Posting...
            </>
          ) : (
            "Post"
          )}
        </button>
      </div>
    </motion.div>
  );
}
