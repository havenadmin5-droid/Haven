'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

// Animated rainbow gradient background
interface RainbowGradientProps {
  className?: string;
  intensity?: 'subtle' | 'medium' | 'vibrant';
  animated?: boolean;
  direction?: 'horizontal' | 'vertical' | 'diagonal';
}

export function RainbowGradient({
  className = '',
  intensity = 'medium',
  animated = true,
  direction = 'diagonal',
}: RainbowGradientProps) {
  const opacityMap = {
    subtle: 0.1,
    medium: 0.25,
    vibrant: 0.4,
  };

  const directionMap = {
    horizontal: '90deg',
    vertical: '180deg',
    diagonal: '135deg',
  };

  return (
    <motion.div
      className={`absolute inset-0 ${className}`}
      style={{
        background: `linear-gradient(${directionMap[direction]},
          rgba(255, 107, 138, ${opacityMap[intensity]}),
          rgba(255, 184, 77, ${opacityMap[intensity]}),
          rgba(0, 201, 167, ${opacityMap[intensity]}),
          rgba(77, 166, 255, ${opacityMap[intensity]}),
          rgba(124, 92, 252, ${opacityMap[intensity]}),
          rgba(180, 167, 255, ${opacityMap[intensity]})
        )`,
        backgroundSize: animated ? '200% 200%' : '100% 100%',
      }}
      animate={
        animated
          ? {
              backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
            }
          : {}
      }
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
}

// Mesh gradient background
interface MeshGradientProps {
  className?: string;
  colors?: string[];
  animated?: boolean;
}

// Deterministic positions to avoid hydration mismatch
const MESH_POSITIONS = [
  { left: 5, top: 10 },
  { left: 55, top: 5 },
  { left: 10, top: 55 },
  { left: 60, top: 60 },
];

export function MeshGradient({
  className = '',
  colors = ['#FF6B8A', '#7C5CFC', '#00C9A7', '#4DA6FF'],
  animated = true,
}: MeshGradientProps) {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {colors.map((color, index) => {
        const pos = MESH_POSITIONS[index % MESH_POSITIONS.length]!;
        return (
          <motion.div
            key={index}
            className="absolute rounded-full blur-3xl opacity-30"
            style={{
              backgroundColor: color,
              width: '40%',
              height: '40%',
              left: `${pos.left}%`,
              top: `${pos.top}%`,
            }}
            animate={
              animated
                ? {
                    x: [0, 50, -50, 0],
                    y: [0, -50, 50, 0],
                    scale: [1, 1.2, 0.8, 1],
                  }
                : {}
            }
            transition={{
              duration: 10 + index * 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        );
      })}
    </div>
  );
}

// Pride text gradient
interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  animated?: boolean;
  colors?: string[];
}

export function GradientText({
  children,
  className = '',
  animated = true,
  colors = ['#FF6B8A', '#FFB84D', '#00C9A7', '#4DA6FF', '#7C5CFC'],
}: GradientTextProps) {
  return (
    <motion.span
      className={`bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage: `linear-gradient(90deg, ${colors.join(', ')})`,
        backgroundSize: animated ? '200% 100%' : '100% 100%',
      }}
      animate={
        animated
          ? {
              backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'],
            }
          : {}
      }
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      {children}
    </motion.span>
  );
}

// Pride border gradient
interface GradientBorderProps {
  children: React.ReactNode;
  className?: string;
  borderWidth?: number;
  animated?: boolean;
  rounded?: string;
}

export function GradientBorder({
  children,
  className = '',
  borderWidth = 2,
  animated = true,
  rounded = 'rounded-xl',
}: GradientBorderProps) {
  return (
    <div className={`relative ${className}`}>
      {/* Gradient border */}
      <motion.div
        className={`absolute inset-0 ${rounded}`}
        style={{
          padding: borderWidth,
          background: 'linear-gradient(135deg, #FF6B8A, #FFB84D, #00C9A7, #4DA6FF, #7C5CFC, #B4A7FF, #FF6B8A)',
          backgroundSize: animated ? '300% 300%' : '100% 100%',
        }}
        animate={
          animated
            ? {
                backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
              }
            : {}
        }
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      {/* Inner content */}
      <div className={`relative ${rounded} bg-white dark:bg-gray-900`}>{children}</div>
    </div>
  );
}

// Glowing orb effect
interface GlowOrbProps {
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  pulsing?: boolean;
}

export function GlowOrb({
  color = '#7C5CFC',
  size = 'md',
  className = '',
  pulsing = true,
}: GlowOrbProps) {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-16 h-16',
  };

  return (
    <motion.div
      className={`rounded-full ${sizeMap[size]} ${className}`}
      style={{
        backgroundColor: color,
        boxShadow: `0 0 30px ${color}80, 0 0 60px ${color}40`,
      }}
      animate={
        pulsing
          ? {
              scale: [1, 1.2, 1],
              opacity: [0.8, 1, 0.8],
            }
          : {}
      }
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

// Floating sparkles decoration
interface SparkleFieldProps {
  count?: number;
  colors?: string[];
  className?: string;
}

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
}

export function SparkleField({
  count = 20,
  colors = ['#FFE066', '#FF6B8A', '#7C5CFC', '#4DA6FF'],
  className = '',
}: SparkleFieldProps) {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    // Generate random sparkles only on client side
    const generated = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      color: colors[Math.floor(Math.random() * colors.length)]!,
      delay: Math.random() * 2,
    }));
    setSparkles(generated);
  }, [count, colors]);

  if (sparkles.length === 0) return null;

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {sparkles.map((sparkle) => (
        <motion.div
          key={sparkle.id}
          className="absolute"
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
            width: sparkle.size,
            height: sparkle.size,
          }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
            rotate: [0, 180],
          }}
          transition={{
            duration: 2,
            delay: sparkle.delay,
            repeat: Infinity,
            repeatDelay: 1 + sparkle.id * 0.1,
          }}
        >
          <svg viewBox="0 0 24 24" fill={sparkle.color}>
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}
