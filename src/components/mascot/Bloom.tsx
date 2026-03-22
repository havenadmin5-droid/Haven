"use client";

import { motion } from "framer-motion";
import type { BloomMood } from "@/lib/types";

interface BloomProps {
  mood?: BloomMood;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  animate?: boolean;
}

const SIZES = {
  sm: 32,
  md: 50,
  lg: 70,
  xl: 80,
};

/**
 * Bloom - Haven's rainbow spirit mascot
 * Three moods: happy (default), wink, love
 */
export function Bloom({ mood = "happy", size = "md", className = "", animate = true }: BloomProps) {
  const pixelSize = SIZES[size];

  const moodLabels = {
    happy: "Bloom is smiling happily",
    wink: "Bloom is winking playfully",
    love: "Bloom has heart eyes showing love",
  };

  return (
    <motion.div
      className={`relative inline-flex items-center justify-center ${className}`}
      animate={animate ? { y: [0, -8, 0] } : undefined}
      transition={animate ? { duration: 3, repeat: Infinity, ease: "easeInOut" } : undefined}
      style={{ width: pixelSize, height: pixelSize }}
      aria-label={moodLabels[mood]}
      role="img"
    >
      {/* Sparkles */}
      {animate && (
        <>
          <Sparkle position="top-right" delay={0} size={pixelSize} />
          <Sparkle position="top-left" delay={0.5} size={pixelSize} />
          <Sparkle position="bottom-right" delay={1} size={pixelSize} />
        </>
      )}

      {/* Main SVG */}
      <svg
        width={pixelSize}
        height={pixelSize}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Rainbow gradient body */}
        <defs>
          <linearGradient id="bloom-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF6B8A" />
            <stop offset="25%" stopColor="#FFB84D" />
            <stop offset="50%" stopColor="#7C5CFC" />
            <stop offset="75%" stopColor="#00C9A7" />
            <stop offset="100%" stopColor="#4DA6FF" />
          </linearGradient>
          <filter id="bloom-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Body - rounded droplet shape */}
        <path
          d="M50 10 C70 10 85 30 85 55 C85 80 70 90 50 90 C30 90 15 80 15 55 C15 30 30 10 50 10"
          fill="url(#bloom-gradient)"
          filter="url(#bloom-glow)"
        />

        {/* Inner glow */}
        <ellipse cx="50" cy="50" rx="25" ry="30" fill="white" fillOpacity="0.2" />

        {/* Face based on mood */}
        {mood === "happy" && <HappyFace />}
        {mood === "wink" && <WinkFace />}
        {mood === "love" && <LoveFace />}

        {/* Blush marks */}
        <circle cx="30" cy="55" r="6" fill="#FF9EB5" fillOpacity="0.5" />
        <circle cx="70" cy="55" r="6" fill="#FF9EB5" fillOpacity="0.5" />
      </svg>
    </motion.div>
  );
}

function HappyFace() {
  return (
    <>
      {/* Eyes - simple dots */}
      <circle cx="38" cy="45" r="4" fill="#2D2640" />
      <circle cx="62" cy="45" r="4" fill="#2D2640" />
      {/* Eye shine */}
      <circle cx="40" cy="43" r="1.5" fill="white" />
      <circle cx="64" cy="43" r="1.5" fill="white" />
      {/* Smile */}
      <path
        d="M35 60 Q50 75 65 60"
        stroke="#2D2640"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </>
  );
}

function WinkFace() {
  return (
    <>
      {/* Left eye - open */}
      <circle cx="38" cy="45" r="4" fill="#2D2640" />
      <circle cx="40" cy="43" r="1.5" fill="white" />
      {/* Right eye - winking (curved line) */}
      <path
        d="M56 45 Q62 42 68 45"
        stroke="#2D2640"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* Playful smile */}
      <path
        d="M35 58 Q50 73 65 58"
        stroke="#2D2640"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </>
  );
}

function LoveFace() {
  return (
    <>
      {/* Heart eyes */}
      <path
        d="M32 45 L38 40 L44 45 L38 52 Z"
        fill="#FF6B8A"
      />
      <path
        d="M56 45 L62 40 L68 45 L62 52 Z"
        fill="#FF6B8A"
      />
      {/* Big happy smile */}
      <path
        d="M35 58 Q50 78 65 58"
        stroke="#2D2640"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </>
  );
}

function Sparkle({
  position,
  delay,
  size,
}: {
  position: "top-right" | "top-left" | "bottom-right";
  delay: number;
  size: number;
}) {
  const positions = {
    "top-right": { top: 0, right: 0 },
    "top-left": { top: "10%", left: 0 },
    "bottom-right": { bottom: "20%", right: 0 },
  };

  const sparkleSize = size * 0.15;

  return (
    <motion.div
      className="absolute"
      style={positions[position]}
      animate={{
        opacity: [0.6, 1, 0.6],
        scale: [1, 1.2, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        delay,
        ease: "easeInOut",
      }}
    >
      <svg
        width={sparkleSize}
        height={sparkleSize}
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M12 2L14 10L22 12L14 14L12 22L10 14L2 12L10 10L12 2Z"
          fill="#FFD700"
        />
      </svg>
    </motion.div>
  );
}

export default Bloom;
