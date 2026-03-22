'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

// Floating decorative shapes that appear around the app
interface FloatingShape {
  id: number;
  type: 'heart' | 'star' | 'flower' | 'butterfly' | 'sparkle' | 'circle';
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
  delay: number;
  duration: number;
}

const HAVEN_COLORS = [
  '#FF6B8A', // Rose
  '#FFB84D', // Amber
  '#00C9A7', // Teal
  '#4DA6FF', // Sky
  '#7C5CFC', // Violet
  '#B4A7FF', // Lavender
  '#38D9A9', // Mint
  '#FFAA85', // Peach
];

function ShapeSVG({ type, color }: { type: FloatingShape['type']; color: string }) {
  switch (type) {
    case 'heart':
      return (
        <svg viewBox="0 0 24 24" fill={color}>
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      );
    case 'star':
      return (
        <svg viewBox="0 0 24 24" fill={color}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    case 'flower':
      return (
        <svg viewBox="0 0 24 24" fill={color}>
          <circle cx="12" cy="12" r="3" />
          <ellipse cx="12" cy="5" rx="2.5" ry="4" />
          <ellipse cx="12" cy="19" rx="2.5" ry="4" />
          <ellipse cx="5" cy="12" rx="4" ry="2.5" />
          <ellipse cx="19" cy="12" rx="4" ry="2.5" />
          <ellipse cx="7.05" cy="7.05" rx="2.5" ry="4" transform="rotate(-45 7.05 7.05)" />
          <ellipse cx="16.95" cy="16.95" rx="2.5" ry="4" transform="rotate(-45 16.95 16.95)" />
          <ellipse cx="7.05" cy="16.95" rx="2.5" ry="4" transform="rotate(45 7.05 16.95)" />
          <ellipse cx="16.95" cy="7.05" rx="2.5" ry="4" transform="rotate(45 16.95 7.05)" />
        </svg>
      );
    case 'butterfly':
      return (
        <svg viewBox="0 0 24 24" fill={color}>
          <path d="M12 22c-1 0-2-.5-2-2v-6c0-1 1-2 2-2s2 1 2 2v6c0 1.5-1 2-2 2z" />
          <ellipse cx="7" cy="10" rx="5" ry="7" opacity="0.8" />
          <ellipse cx="17" cy="10" rx="5" ry="7" opacity="0.8" />
          <ellipse cx="7" cy="8" rx="3" ry="4" />
          <ellipse cx="17" cy="8" rx="3" ry="4" />
        </svg>
      );
    case 'sparkle':
      return (
        <svg viewBox="0 0 24 24" fill={color}>
          <path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10L12 0Z" />
        </svg>
      );
    case 'circle':
    default:
      return (
        <svg viewBox="0 0 24 24" fill={color}>
          <circle cx="12" cy="12" r="10" opacity="0.6" />
        </svg>
      );
  }
}

interface FloatingDecorationsProps {
  count?: number;
  types?: FloatingShape['type'][];
  className?: string;
  speed?: 'slow' | 'normal' | 'fast';
}

export function FloatingDecorations({
  count = 15,
  types = ['heart', 'star', 'flower', 'sparkle'],
  className = '',
  speed = 'normal',
}: FloatingDecorationsProps) {
  const [shapes, setShapes] = useState<FloatingShape[]>([]);

  useEffect(() => {
    const generatedShapes: FloatingShape[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      type: types[Math.floor(Math.random() * types.length)]!,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 20 + 10,
      color: HAVEN_COLORS[Math.floor(Math.random() * HAVEN_COLORS.length)]!,
      rotation: Math.random() * 360,
      delay: Math.random() * 5,
      duration: speed === 'slow' ? 15 + Math.random() * 10 : speed === 'fast' ? 5 + Math.random() * 5 : 8 + Math.random() * 7,
    }));
    setShapes(generatedShapes);
  }, [count, types, speed]);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {shapes.map((shape) => (
        <motion.div
          key={shape.id}
          className="absolute"
          style={{
            left: `${shape.x}%`,
            top: `${shape.y}%`,
            width: shape.size,
            height: shape.size,
          }}
          animate={{
            y: [0, -30, 0, 30, 0],
            x: [0, 15, -15, 10, 0],
            rotate: [shape.rotation, shape.rotation + 180, shape.rotation],
            scale: [1, 1.1, 0.9, 1.05, 1],
            opacity: [0.3, 0.5, 0.3, 0.4, 0.3],
          }}
          transition={{
            duration: shape.duration,
            delay: shape.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <ShapeSVG type={shape.type} color={shape.color} />
        </motion.div>
      ))}
    </div>
  );
}

// Pride ribbon that appears at the top of pages
interface PrideRibbonProps {
  height?: number;
  animated?: boolean;
  className?: string;
}

export function PrideRibbon({ height = 4, animated = true, className = '' }: PrideRibbonProps) {
  const colors = ['#FF6B8A', '#FFB84D', '#00C9A7', '#4DA6FF', '#7C5CFC', '#B4A7FF'];

  return (
    <motion.div
      className={`w-full flex ${className}`}
      style={{ height }}
      animate={animated ? { opacity: [0.9, 1, 0.9] } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      {colors.map((color, i) => (
        <motion.div
          key={i}
          className="flex-1"
          style={{ backgroundColor: color }}
          animate={animated ? { scaleY: [1, 1.5, 1] } : {}}
          transition={{
            duration: 2,
            delay: i * 0.1,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </motion.div>
  );
}

// Animated divider with decorations
interface DecoratedDividerProps {
  decoration?: 'flowers' | 'hearts' | 'stars' | 'rainbow';
  className?: string;
}

export function DecoratedDivider({ decoration = 'flowers', className = '' }: DecoratedDividerProps) {
  const getDecoration = () => {
    switch (decoration) {
      case 'hearts':
        return '❤️';
      case 'stars':
        return '✨';
      case 'rainbow':
        return '🌈';
      case 'flowers':
      default:
        return '🌸';
    }
  };

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
      <motion.span
        animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="text-lg"
      >
        {getDecoration()}
      </motion.span>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
    </div>
  );
}

// Rainbow wave animation for loading/transitions
interface RainbowWaveProps {
  className?: string;
}

export function RainbowWave({ className = '' }: RainbowWaveProps) {
  const colors = ['#FF6B8A', '#FFB84D', '#00C9A7', '#4DA6FF', '#7C5CFC', '#B4A7FF'];

  return (
    <div className={`flex gap-1 items-end h-8 ${className}`}>
      {colors.map((color, i) => (
        <motion.div
          key={i}
          className="w-2 rounded-full"
          style={{ backgroundColor: color }}
          animate={{
            height: ['16px', '32px', '16px'],
          }}
          transition={{
            duration: 0.6,
            delay: i * 0.1,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// Floating emoji cloud
interface EmojiCloudProps {
  emojis?: string[];
  className?: string;
}

export function EmojiCloud({
  emojis = ['💜', '🌈', '✨', '🦋', '💪', '🫂', '🌸', '❤️'],
  className = '',
}: EmojiCloudProps) {
  const positions = emojis.map((_, i) => ({
    x: (i / emojis.length) * 100,
    y: 20 + Math.sin(i) * 30,
    delay: i * 0.3,
  }));

  return (
    <div className={`relative h-20 ${className}`}>
      {emojis.map((emoji, i) => {
        const pos = positions[i]!;
        return (
          <motion.span
            key={i}
            className="absolute text-2xl"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
            }}
            animate={{
              y: [0, -10, 0],
              rotate: [-5, 5, -5],
            }}
            transition={{
              duration: 2,
              delay: pos.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {emoji}
          </motion.span>
        );
      })}
    </div>
  );
}
