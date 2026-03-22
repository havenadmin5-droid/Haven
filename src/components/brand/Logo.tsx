'use client'

import { motion } from 'framer-motion'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero'
  animated?: boolean
  showText?: boolean
  className?: string
}

const sizes = {
  sm: { icon: 32, text: 14, gap: 8 },
  md: { icon: 48, text: 18, gap: 10 },
  lg: { icon: 64, text: 24, gap: 12 },
  xl: { icon: 80, text: 32, gap: 14 },
  hero: { icon: 120, text: 48, gap: 16 },
}

export function Logo({ size = 'md', animated = true, showText = true, className = '' }: LogoProps) {
  const s = sizes[size]

  const pathVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (i: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { delay: i * 0.1, duration: 0.5, ease: 'easeInOut' },
        opacity: { delay: i * 0.1, duration: 0.2 },
      },
    }),
  }

  const petalVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: (i: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: i * 0.08,
        duration: 0.4,
        type: 'spring',
        stiffness: 200,
      },
    }),
  }

  const textVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { delay: 0.6, duration: 0.4 },
    },
  }

  const MotionComponent = animated ? motion.svg : 'svg'
  const MotionPath = animated ? motion.path : 'path'
  const MotionCircle = animated ? motion.circle : 'circle'
  const MotionG = animated ? motion.g : 'g'
  const MotionSpan = animated ? motion.span : 'span'

  return (
    <div className={`flex items-center ${className}`} style={{ gap: s.gap }}>
      {/* Logo Icon - A blooming flower/safe haven symbol */}
      <MotionComponent
        width={s.icon}
        height={s.icon}
        viewBox="0 0 100 100"
        fill="none"
        initial={animated ? 'hidden' : undefined}
        animate={animated ? 'visible' : undefined}
      >
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="logo-gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E40303" />
            <stop offset="100%" stopColor="#FF8C00" />
          </linearGradient>
          <linearGradient id="logo-gradient-2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF8C00" />
            <stop offset="100%" stopColor="#FFED00" />
          </linearGradient>
          <linearGradient id="logo-gradient-3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFED00" />
            <stop offset="100%" stopColor="#008026" />
          </linearGradient>
          <linearGradient id="logo-gradient-4" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#008026" />
            <stop offset="100%" stopColor="#24408E" />
          </linearGradient>
          <linearGradient id="logo-gradient-5" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#24408E" />
            <stop offset="100%" stopColor="#732982" />
          </linearGradient>
          <linearGradient id="logo-gradient-6" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#732982" />
            <stop offset="100%" stopColor="#E40303" />
          </linearGradient>
          <radialGradient id="center-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F8E1F4" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Outer protective circle - the "haven" */}
        <MotionCircle
          cx="50"
          cy="50"
          r="46"
          stroke="url(#logo-gradient-1)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          variants={pathVariants}
          custom={0}
          style={animated ? { pathLength: 0 } : undefined}
        />

        {/* Rainbow petals forming a flower/safe space */}
        <MotionG filter="url(#glow)">
          {/* Petal 1 - Red to Orange */}
          <MotionPath
            d="M50 50 L50 15 Q65 20 70 35 Q65 45 50 50"
            fill="url(#logo-gradient-1)"
            variants={petalVariants}
            custom={1}
          />
          {/* Petal 2 - Orange to Yellow */}
          <MotionPath
            d="M50 50 L70 35 Q80 45 80 60 Q70 65 50 50"
            fill="url(#logo-gradient-2)"
            variants={petalVariants}
            custom={2}
          />
          {/* Petal 3 - Yellow to Green */}
          <MotionPath
            d="M50 50 L80 60 Q75 80 60 85 Q55 75 50 50"
            fill="url(#logo-gradient-3)"
            variants={petalVariants}
            custom={3}
          />
          {/* Petal 4 - Green to Blue */}
          <MotionPath
            d="M50 50 L60 85 Q45 90 30 85 Q35 70 50 50"
            fill="url(#logo-gradient-4)"
            variants={petalVariants}
            custom={4}
          />
          {/* Petal 5 - Blue to Purple */}
          <MotionPath
            d="M50 50 L30 85 Q15 75 15 55 Q25 50 50 50"
            fill="url(#logo-gradient-5)"
            variants={petalVariants}
            custom={5}
          />
          {/* Petal 6 - Purple to Red */}
          <MotionPath
            d="M50 50 L15 55 Q15 35 30 20 Q40 25 50 50"
            fill="url(#logo-gradient-6)"
            variants={petalVariants}
            custom={6}
          />
        </MotionG>

        {/* Center heart/home shape */}
        <MotionPath
          d="M50 38 C45 32 35 32 35 42 C35 50 50 58 50 58 C50 58 65 50 65 42 C65 32 55 32 50 38"
          fill="url(#center-glow)"
          stroke="#FFFFFF"
          strokeWidth="1"
          variants={petalVariants}
          custom={7}
        />

        {/* Inner sparkle */}
        <MotionCircle
          cx="50"
          cy="45"
          r="3"
          fill="#FFFFFF"
          variants={petalVariants}
          custom={8}
        />
      </MotionComponent>

      {/* Logo Text */}
      {showText && (
        <MotionSpan
          className="font-heading font-bold tracking-tight"
          style={{
            fontSize: s.text,
            background: 'linear-gradient(135deg, #E40303, #FF8C00, #FFED00, #008026, #24408E, #732982)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundSize: '200% 200%',
            animation: animated ? 'gradient-flow 4s ease infinite' : undefined,
          }}
          variants={textVariants}
        >
          Haven
        </MotionSpan>
      )}
    </div>
  )
}

// Compact logo for favicon/small spaces
export function LogoIcon({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
    >
      <defs>
        <linearGradient id="mini-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E40303" />
          <stop offset="20%" stopColor="#FF8C00" />
          <stop offset="40%" stopColor="#FFED00" />
          <stop offset="60%" stopColor="#008026" />
          <stop offset="80%" stopColor="#24408E" />
          <stop offset="100%" stopColor="#732982" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill="url(#mini-gradient)" />
      <path
        d="M50 30 C42 22 28 22 28 36 C28 48 50 62 50 62 C50 62 72 48 72 36 C72 22 58 22 50 30"
        fill="white"
      />
    </svg>
  )
}

export default Logo
