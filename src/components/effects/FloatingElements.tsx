'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

// Reduced set of Pride-themed emojis for better performance
const FLOATING_ITEMS = [
  { emoji: '🌈', size: 'lg' },
  { emoji: '🦋', size: 'md' },
  { emoji: '✨', size: 'sm' },
  { emoji: '💜', size: 'md' },
  { emoji: '🏳️‍🌈', size: 'lg' },
  { emoji: '🦄', size: 'md' },
]

const sizes = {
  sm: 'text-xl',
  md: 'text-3xl',
  lg: 'text-4xl',
}

interface FloatingItem {
  id: number
  emoji: string
  size: 'sm' | 'md' | 'lg'
  x: number
  y: number
  duration: number
  delay: number
}

// Hook for detecting reduced motion preference
function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return prefersReducedMotion
}

export function FloatingElements({ count = 6 }: { count?: number }) {
  const [items, setItems] = useState<FloatingItem[]>([])
  const prefersReducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    if (prefersReducedMotion) {
      setItems([])
      return
    }

    // Generate random positions for floating items
    const generated: FloatingItem[] = []
    for (let i = 0; i < count; i++) {
      const item = FLOATING_ITEMS[i % FLOATING_ITEMS.length]!
      generated.push({
        id: i,
        emoji: item.emoji,
        size: item.size as 'sm' | 'md' | 'lg',
        x: Math.random() * 90 + 5, // 5% to 95%
        y: Math.random() * 80 + 10, // 10% to 90%
        duration: 20 + Math.random() * 15, // 20-35 seconds (slower = less CPU)
        delay: Math.random() * 5,
      })
    }
    setItems(generated)
  }, [count, prefersReducedMotion])

  if (prefersReducedMotion || items.length === 0) return null

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-5" aria-hidden="true">
      {items.map((item) => (
        <motion.div
          key={item.id}
          className={`absolute ${sizes[item.size]} opacity-60 will-change-transform`}
          style={{
            left: `${item.x}%`,
            top: `${item.y}%`,
          }}
          initial={{ opacity: 0.3 }}
          animate={{
            opacity: [0.3, 0.5, 0.3],
            y: [0, -30, 0],
          }}
          transition={{
            duration: item.duration,
            delay: item.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {item.emoji}
        </motion.div>
      ))}
    </div>
  )
}

// Animated pride ribbon that flows across the page
export function PrideRibbon() {
  return (
    <div className="absolute top-0 left-0 right-0 h-1 overflow-hidden">
      <motion.div
        className="h-full w-[200%]"
        style={{
          background: 'linear-gradient(90deg, #E40303, #FF8C00, #FFED00, #008026, #24408E, #732982, #E40303, #FF8C00, #FFED00, #008026, #24408E, #732982)',
        }}
        animate={{
          x: ['-50%', '0%'],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  )
}

// Sparkle burst effect (for celebrations)
export function SparklesBurst({ isActive }: { isActive: boolean }) {
  const prefersReducedMotion = usePrefersReducedMotion()

  // Reduced from 20 to 12 sparkles
  const sparkles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    angle: (i / 12) * 360,
    distance: 50 + Math.random() * 100,
    size: 4 + Math.random() * 8,
    delay: Math.random() * 0.3,
  }))

  if (!isActive || prefersReducedMotion) return null

  return (
    <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
      {sparkles.map((sparkle) => (
        <motion.div
          key={sparkle.id}
          className="absolute rounded-full"
          style={{
            width: sparkle.size,
            height: sparkle.size,
            background: `hsl(${(sparkle.angle / 360) * 300 + 300}, 80%, 60%)`,
          }}
          initial={{
            x: 0,
            y: 0,
            opacity: 1,
            scale: 0,
          }}
          animate={{
            x: Math.cos((sparkle.angle * Math.PI) / 180) * sparkle.distance,
            y: Math.sin((sparkle.angle * Math.PI) / 180) * sparkle.distance,
            opacity: 0,
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: 0.8,
            delay: sparkle.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  )
}

// Confetti effect
export function Confetti({ isActive }: { isActive: boolean }) {
  const [pieces, setPieces] = useState<Array<{
    id: number
    x: number
    color: string
    delay: number
    rotation: number
  }>>([])
  const prefersReducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    if (isActive && !prefersReducedMotion) {
      const colors = ['#E40303', '#FF8C00', '#FFED00', '#008026', '#24408E', '#732982'] as const
      // Reduced from 50 to 25 pieces
      const newPieces = Array.from({ length: 25 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)]!,
        delay: Math.random() * 0.5,
        rotation: Math.random() * 360,
      }))
      setPieces(newPieces)
    }
  }, [isActive, prefersReducedMotion])

  if (!isActive || prefersReducedMotion) return null

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map((piece) => (
        <motion.div
          key={piece.id}
          className="absolute w-3 h-3"
          style={{
            left: `${piece.x}%`,
            top: '-20px',
            backgroundColor: piece.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
          initial={{
            y: 0,
            rotate: 0,
            opacity: 1,
          }}
          animate={{
            y: window.innerHeight + 100,
            rotate: piece.rotation + 720,
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            delay: piece.delay,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        />
      ))}
    </div>
  )
}

export default FloatingElements
