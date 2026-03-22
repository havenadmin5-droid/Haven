'use client';

import { motion } from 'framer-motion';

interface BloomMascotProps {
  mood?: 'happy' | 'wink' | 'love';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  className?: string;
}

export function BloomMascot({
  mood = 'happy',
  size = 'md',
  animated = true,
  className = '',
}: BloomMascotProps) {
  const sizeMap = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48',
  };

  const eyeVariants = {
    happy: { d: 'M8 12 Q12 8 16 12' },
    wink: { d: 'M8 11 L16 11' },
    love: { d: 'M8 10 L12 14 L16 10' },
  };

  return (
    <motion.div
      className={`${sizeMap[size]} ${className}`}
      animate={animated ? {
        y: [0, -8, 0],
        rotate: [-2, 2, -2],
      } : {}}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          {/* Rainbow gradient for body */}
          <linearGradient id="bloomRainbow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF6B8A" />
            <stop offset="25%" stopColor="#FFB84D" />
            <stop offset="50%" stopColor="#00C9A7" />
            <stop offset="75%" stopColor="#4DA6FF" />
            <stop offset="100%" stopColor="#7C5CFC" />
          </linearGradient>

          {/* Glow effect */}
          <filter id="bloomGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Sparkle gradient */}
          <radialGradient id="sparkle" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFE066" stopOpacity="1" />
            <stop offset="100%" stopColor="#FFE066" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer glow */}
        <ellipse
          cx="50"
          cy="55"
          rx="30"
          ry="35"
          fill="url(#bloomRainbow)"
          opacity="0.3"
          filter="url(#bloomGlow)"
        />

        {/* Main body - cute blob shape */}
        <motion.path
          d="M50 15
             C75 15 85 35 85 55
             C85 80 70 90 50 90
             C30 90 15 80 15 55
             C15 35 25 15 50 15Z"
          fill="url(#bloomRainbow)"
          filter="url(#bloomGlow)"
          animate={animated ? {
            d: [
              'M50 15 C75 15 85 35 85 55 C85 80 70 90 50 90 C30 90 15 80 15 55 C15 35 25 15 50 15Z',
              'M50 13 C77 15 87 33 87 55 C87 82 68 92 50 92 C32 92 13 82 13 55 C13 33 23 15 50 13Z',
              'M50 15 C75 15 85 35 85 55 C85 80 70 90 50 90 C30 90 15 80 15 55 C15 35 25 15 50 15Z',
            ],
          } : {}}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Face area - lighter */}
        <ellipse
          cx="50"
          cy="50"
          rx="22"
          ry="25"
          fill="white"
          opacity="0.9"
        />

        {/* Eyes */}
        <g>
          {/* Left eye */}
          <ellipse cx="40" cy="45" rx="5" ry="6" fill="#1A1625" />
          <ellipse cx="41" cy="43" rx="2" ry="2" fill="white" />

          {/* Right eye */}
          {mood === 'wink' ? (
            <path d="M55 45 Q60 42 65 45" stroke="#1A1625" strokeWidth="2" fill="none" strokeLinecap="round" />
          ) : (
            <>
              <ellipse cx="60" cy="45" rx="5" ry="6" fill="#1A1625" />
              <ellipse cx="61" cy="43" rx="2" ry="2" fill="white" />
            </>
          )}
        </g>

        {/* Blush */}
        <ellipse cx="32" cy="55" rx="5" ry="3" fill="#FF6B8A" opacity="0.5" />
        <ellipse cx="68" cy="55" rx="5" ry="3" fill="#FF6B8A" opacity="0.5" />

        {/* Mouth */}
        {mood === 'love' ? (
          <path d="M45 58 Q50 65 55 58" stroke="#FF6B8A" strokeWidth="2" fill="none" strokeLinecap="round" />
        ) : (
          <path d="M43 60 Q50 68 57 60" stroke="#1A1625" strokeWidth="2" fill="none" strokeLinecap="round" />
        )}

        {/* Heart (for love mood) */}
        {mood === 'love' && (
          <motion.g
            animate={{ scale: [1, 1.2, 1], y: [0, -3, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <path
              d="M50 25 C45 20 38 22 38 28 C38 35 50 42 50 42 C50 42 62 35 62 28 C62 22 55 20 50 25Z"
              fill="#FF6B8A"
            />
          </motion.g>
        )}

        {/* Sparkles around */}
        <motion.g
          animate={animated ? { opacity: [0.5, 1, 0.5], scale: [0.8, 1, 0.8] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <circle cx="20" cy="25" r="3" fill="url(#sparkle)" />
          <circle cx="80" cy="30" r="2" fill="url(#sparkle)" />
          <circle cx="15" cy="70" r="2" fill="url(#sparkle)" />
          <circle cx="85" cy="65" r="3" fill="url(#sparkle)" />
          <circle cx="75" cy="85" r="2" fill="url(#sparkle)" />
          <circle cx="25" cy="88" r="2" fill="url(#sparkle)" />
        </motion.g>

        {/* Small stars */}
        <motion.g
          animate={animated ? { rotate: 360 } : {}}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '50px 50px' }}
        >
          <path d="M10 50 L12 48 L14 50 L12 52 Z" fill="#FFE066" />
          <path d="M88 45 L90 43 L92 45 L90 47 Z" fill="#FFE066" />
        </motion.g>
      </svg>
    </motion.div>
  );
}

// Bloom with message bubble
export function BloomWithMessage({
  message,
  mood = 'happy',
  size = 'md',
}: {
  message: string;
  mood?: 'happy' | 'wink' | 'love';
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <div className="flex items-end gap-3">
      <BloomMascot mood={mood} size={size} />
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-[#1E1A2E] rounded-2xl rounded-bl-none px-4 py-3 shadow-lg border border-gray-100 dark:border-white/10 max-w-xs"
      >
        <p className="text-sm text-gray-700 dark:text-gray-200">{message}</p>
      </motion.div>
    </div>
  );
}
