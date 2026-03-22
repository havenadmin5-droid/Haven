"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Plus } from "lucide-react";
import { REACTIONS } from "@/lib/types/database";
import { toggleReaction } from "@/app/(main)/feed/actions";

interface ReactionPickerProps {
  postId: string;
  userReactions: number[];
  onReactionChange: (reactions: number[], countDiff: number) => void;
}

export function ReactionPicker({
  postId,
  userReactions,
  onReactionChange,
}: ReactionPickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      // Use click instead of mousedown to avoid race condition where
      // mousedown closes picker before click registers on buttons
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showPicker]);

  const handleReaction = async (reactionType: number) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const result = await toggleReaction(postId, reactionType);

      if (result.success) {
        const hasReaction = userReactions.includes(reactionType);
        let newReactions: number[];
        let countDiff: number;

        if (hasReaction) {
          newReactions = userReactions.filter((r) => r !== reactionType);
          countDiff = -1;
        } else {
          newReactions = [...userReactions, reactionType];
          countDiff = 1;
        }

        onReactionChange(newReactions, countDiff);
      }
    } finally {
      setIsLoading(false);
      setShowPicker(false);
    }
  };

  // Quick reaction (first one - heart)
  const handleQuickReaction = () => {
    handleReaction(0);
  };

  const hasAnyReaction = userReactions.length > 0;

  return (
    <div className="relative" ref={pickerRef}>
      {/* Main button */}
      <div className="flex items-center">
        {/* Quick reaction button */}
        <button
          onClick={handleQuickReaction}
          disabled={isLoading}
          className={`flex items-center gap-2 px-4 py-2 rounded-l-xl transition-colors ${
            hasAnyReaction
              ? "bg-[var(--rose)]/10 text-[var(--rose)]"
              : "hover:bg-[var(--bg-hover)] text-[var(--text-muted)]"
          }`}
        >
          {hasAnyReaction ? (
            <span className="text-lg">
              {REACTIONS[userReactions[0]!]?.emoji ?? "❤️"}
            </span>
          ) : (
            <Heart size={18} />
          )}
          {!hasAnyReaction && <span className="text-sm">React</span>}
        </button>

        {/* Expand picker button */}
        <button
          onClick={() => setShowPicker(!showPicker)}
          className={`px-2 py-2 rounded-r-xl border-l border-[var(--border-color)] transition-colors ${
            showPicker
              ? "bg-[var(--bg-hover)]"
              : "hover:bg-[var(--bg-hover)]"
          }`}
        >
          <Plus
            size={14}
            className={`transition-transform ${showPicker ? "rotate-45" : ""}`}
          />
        </button>
      </div>

      {/* Picker popup */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            className="absolute bottom-full left-0 mb-2 bg-[var(--bg-card)] rounded-2xl shadow-lg border border-[var(--border-color)] p-2 z-30"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex gap-1">
              {REACTIONS.map((reaction) => {
                const isSelected = userReactions.includes(reaction.index);
                return (
                  <button
                    key={reaction.index}
                    onClick={() => handleReaction(reaction.index)}
                    disabled={isLoading}
                    className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all hover:scale-110 ${
                      isSelected
                        ? "bg-[var(--violet)]/20 ring-2 ring-[var(--violet)]"
                        : "hover:bg-[var(--bg-hover)]"
                    }`}
                    title={reaction.label}
                  >
                    {reaction.emoji}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
