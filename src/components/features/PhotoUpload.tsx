"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Trash2, Loader2, X, Check } from "lucide-react";
import { uploadAvatar, removeAvatar } from "@/app/(main)/profile/upload-actions";

interface PhotoUploadProps {
  currentUrl: string | null;
  emoji: string;
  onUploadComplete: (url: string | null) => void;
}

export function PhotoUpload({ currentUrl, emoji, onUploadComplete }: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const result = await uploadAvatar(formData);

      if (!result.success) {
        setError(result.error ?? "Upload failed");
        setPreviewUrl(null);
      } else if (result.url) {
        onUploadComplete(result.url);
        setPreviewUrl(null);
      }
    } catch {
      setError("An unexpected error occurred");
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      URL.revokeObjectURL(objectUrl);
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    setError(null);

    try {
      const result = await removeAvatar();

      if (!result.success) {
        setError(result.error ?? "Failed to remove photo");
      } else {
        onUploadComplete(null);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsRemoving(false);
    }
  };

  const displayUrl = previewUrl || currentUrl;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar display */}
      <div className="relative group">
        <div className="w-28 h-28 rounded-2xl bg-[var(--bg-input)] flex items-center justify-center text-5xl overflow-hidden">
          {displayUrl ? (
            <img
              src={displayUrl}
              alt="Profile photo"
              className="w-full h-full object-cover"
            />
          ) : (
            emoji
          )}

          {/* Upload overlay */}
          <AnimatePresence>
            {isUploading && (
              <motion.div
                className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Loader2 className="animate-spin text-white" size={32} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Camera button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-[var(--violet)] text-white flex items-center justify-center shadow-lg hover:bg-[var(--violet-dark)] transition-colors disabled:opacity-50"
          title="Upload photo"
        >
          <Camera size={18} />
        </button>

        {/* Remove button (only show if photo exists) */}
        {currentUrl && !isUploading && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={isRemoving}
            className="absolute -bottom-2 -left-2 w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors disabled:opacity-50"
            title="Remove photo"
          >
            {isRemoving ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Trash2 size={16} />
            )}
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Helper text */}
      <p className="text-xs text-[var(--text-muted)] text-center">
        Upload a photo (JPEG, PNG, or WebP, max 5MB)
        <br />
        Photos are automatically cropped to 400×400px
      </p>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 text-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <X size={14} />
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
