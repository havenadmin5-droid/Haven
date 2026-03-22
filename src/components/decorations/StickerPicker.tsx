'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Haven's curated sticker reactions
const STICKERS = [
  { id: 'heart', emoji: '❤️', label: 'Love', color: '#FF6B8A' },
  { id: 'rainbow', emoji: '🌈', label: 'Pride', color: '#7C5CFC' },
  { id: 'fire', emoji: '🔥', label: 'Hot', color: '#FFB84D' },
  { id: 'sparkles', emoji: '✨', label: 'Magic', color: '#FFE066' },
  { id: 'purple_heart', emoji: '💜', label: 'Queer Love', color: '#B4A7FF' },
  { id: 'butterfly', emoji: '🦋', label: 'Transform', color: '#4DA6FF' },
  { id: 'hug', emoji: '🫂', label: 'Support', color: '#FFAA85' },
  { id: 'muscle', emoji: '💪', label: 'Strong', color: '#00C9A7' },
  { id: 'party', emoji: '🎉', label: 'Celebrate', color: '#FF6B8A' },
  { id: 'flower', emoji: '🌸', label: 'Bloom', color: '#FFB4C4' },
];

interface StickerPickerProps {
  onSelect: (sticker: { id: string; emoji: string }) => void;
  isOpen: boolean;
  onClose: () => void;
  position?: 'top' | 'bottom';
}

export function StickerPicker({ onSelect, isOpen, onClose, position = 'top' }: StickerPickerProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, pointerEvents: "none" }}
            className="fixed inset-0 z-40"
            onClick={onClose}
          />

          {/* Picker */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: position === 'top' ? 10 : -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: position === 'top' ? 10 : -10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`absolute ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} left-0 z-50`}
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-3 backdrop-blur-xl">
              {/* Floating sparkle decoration */}
              <div className="absolute -top-2 -right-2">
                <motion.span
                  animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-lg"
                >
                  ✨
                </motion.span>
              </div>

              <div className="flex gap-1.5 flex-wrap max-w-[280px]">
                {STICKERS.map((sticker, index) => (
                  <motion.button
                    key={sticker.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    whileHover={{ scale: 1.3, y: -4 }}
                    whileTap={{ scale: 0.9 }}
                    onHoverStart={() => setHoveredId(sticker.id)}
                    onHoverEnd={() => setHoveredId(null)}
                    onClick={() => {
                      onSelect({ id: sticker.id, emoji: sticker.emoji });
                      onClose();
                    }}
                    className="relative w-10 h-10 flex items-center justify-center rounded-xl transition-colors"
                    style={{
                      backgroundColor: hoveredId === sticker.id ? `${sticker.color}20` : 'transparent',
                    }}
                  >
                    <span className="text-2xl">{sticker.emoji}</span>

                    {/* Tooltip */}
                    <AnimatePresence>
                      {hoveredId === sticker.id && (
                        <motion.span
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
                          style={{
                            backgroundColor: sticker.color,
                            color: 'white',
                          }}
                        >
                          {sticker.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Sticker display component for showing reactions
interface StickerDisplayProps {
  stickerId: string;
  count?: number;
  isSelected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export function StickerDisplay({ stickerId, count, isSelected, onClick, size = 'md' }: StickerDisplayProps) {
  const sticker = STICKERS.find(s => s.id === stickerId);
  if (!sticker) return null;

  const sizeClasses = {
    sm: 'text-sm px-1.5 py-0.5 gap-0.5',
    md: 'text-base px-2 py-1 gap-1',
    lg: 'text-lg px-3 py-1.5 gap-1.5',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`inline-flex items-center rounded-full border transition-all ${sizeClasses[size]}`}
      style={{
        backgroundColor: isSelected ? `${sticker.color}20` : 'transparent',
        borderColor: isSelected ? sticker.color : 'var(--color-border, #e5e7eb)',
      }}
    >
      <span>{sticker.emoji}</span>
      {count !== undefined && count > 0 && (
        <span
          className="font-medium"
          style={{ color: isSelected ? sticker.color : 'var(--color-text-muted)' }}
        >
          {count}
        </span>
      )}
    </motion.button>
  );
}

// Reaction button that opens the picker
interface ReactionButtonProps {
  onReact: (sticker: { id: string; emoji: string }) => void;
}

export function ReactionButton({ onReact }: ReactionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <span className="text-gray-500">😊</span>
      </motion.button>

      <StickerPicker
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSelect={onReact}
      />
    </div>
  );
}

export { STICKERS };
