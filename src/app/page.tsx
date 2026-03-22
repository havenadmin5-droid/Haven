'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import {
  ArrowRight,
  Shield,
  Heart,
  Users,
  Sparkles,
  MapPin,
  MessageCircle,
  Calendar,
  Lock,
  Eye,
  Zap,
  Globe,
  Briefcase,
  CheckCircle2,
  Star,
  ChevronDown,
  Play,
  Loader2,
} from 'lucide-react'
import { BloomMascot } from '@/components/decorations/BloomMascot'
import { Logo, LogoIcon } from '@/components/brand/Logo'
import { useRouter } from 'next/navigation'

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
}

const fadeInScale = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

// Floating particles background - optimized for performance
function FloatingParticles() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  if (prefersReducedMotion) return null

  // Reduced from 20 to 8 particles for better performance
  const particles = [
    { left: '10%', top: '20%', color: '#FF6B8A', size: 6 },
    { left: '85%', top: '15%', color: '#7C5CFC', size: 8 },
    { left: '70%', top: '60%', color: '#00C9A7', size: 5 },
    { left: '25%', top: '80%', color: '#FFB84D', size: 7 },
    { left: '50%', top: '30%', color: '#4DA6FF', size: 6 },
    { left: '15%', top: '55%', color: '#7C5CFC', size: 5 },
    { left: '80%', top: '85%', color: '#FF6B8A', size: 7 },
    { left: '40%', top: '70%', color: '#00C9A7', size: 6 },
  ]

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full will-change-transform"
          style={{
            width: p.size,
            height: p.size,
            background: p.color,
            left: p.left,
            top: p.top,
            opacity: 0.3,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 5 + i * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// Animated gradient border card
function GlassCard({ children, className = '', gradient = false }: { children: React.ReactNode; className?: string; gradient?: boolean }) {
  return (
    <div className={`relative group ${className}`}>
      {gradient && (
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FF6B8A] via-[#7C5CFC] to-[#00C9A7] rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
      )}
      <div className="relative bg-white/80 dark:bg-[#1E1A2E]/80 backdrop-blur-xl rounded-3xl border border-white/50 dark:border-white/10 shadow-xl">
        {children}
      </div>
    </div>
  )
}

// Animated counter
function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          let start = 0
          const end = value
          const duration = 2000
          const increment = end / (duration / 16)

          const timer = setInterval(() => {
            start += increment
            if (start >= end) {
              setCount(end)
              clearInterval(timer)
            } else {
              setCount(Math.floor(start))
            }
          }, 16)
        }
      },
      { threshold: 0.5 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [value, hasAnimated])

  return <span ref={ref}>{count}{suffix}</span>
}

// Wave divider
function WaveDivider({ flip = false, variant = 'lavender' }: { flip?: boolean; variant?: 'lavender' | 'cream' }) {
  const fillClass = variant === 'cream'
    ? 'fill-[#FFFBF7] dark:fill-[#0D0B14]'
    : 'fill-[#F5F0FF] dark:fill-[#1A1625]';

  return (
    <div className={`w-full overflow-hidden ${flip ? 'rotate-180' : ''} bg-transparent`}>
      <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-16 md:h-24">
        <path
          d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
          className={fillClass}
        />
      </svg>
    </div>
  )
}

// Feature card with hover effect
function FeatureCard({
  icon: Icon,
  title,
  description,
  gradient,
  delay,
}: {
  icon: React.ElementType
  title: string
  description: string
  gradient: string
  delay: number
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={fadeInUp}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className="group relative"
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FF6B8A]/50 via-[#7C5CFC]/50 to-[#00C9A7]/50 rounded-3xl blur opacity-0 group-hover:opacity-30 transition duration-500" />
      <div className="relative bg-white/90 dark:bg-[#1E1A2E]/90 backdrop-blur-sm rounded-3xl p-6 md:p-8 border border-gray-100 dark:border-white/10 shadow-lg h-full">
        <motion.div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 relative overflow-hidden"
          style={{ background: gradient }}
          whileHover={{ scale: 1.1, rotate: 5 }}
        >
          <Icon className="w-7 h-7 text-white relative z-10" />
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-[#7C5CFC] transition-colors">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{description}</p>
      </div>
    </motion.div>
  )
}

// Scroll indicator
function ScrollIndicator() {
  return (
    <motion.div
      className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      animate={{ y: [0, 8, 0] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      <span className="text-sm text-gray-500 dark:text-gray-400">Scroll to explore</span>
      <ChevronDown className="w-5 h-5 text-gray-400" />
    </motion.div>
  )
}

export default function LandingPage() {
  const [mounted, setMounted] = useState(false)
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleNavigation = (href: string) => {
    setNavigatingTo(href)
    router.push(href)
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#FFFBF7] dark:bg-[#0D0B14] flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Logo size="xl" animated className="mx-auto mb-6" />
          <p className="text-gray-600 dark:text-gray-300 font-medium">Loading Haven...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFFBF7] dark:bg-[#0D0B14] overflow-x-hidden">


      {/* ========== HEADER / NAVBAR ========== */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4">
        <nav className="max-w-6xl mx-auto flex items-center justify-between bg-white/70 dark:bg-[#0D0B14]/70 backdrop-blur-xl rounded-2xl px-5 py-3 border border-white/50 dark:border-white/10 shadow-lg">
          {/* Logo */}
          <Link href="/" className="group">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Logo size="sm" animated={false} />
            </motion.div>
          </Link>

          {/* Right side - Auth buttons */}
          <div className="flex items-center gap-3">
            <motion.button
              onClick={() => handleNavigation('/login')}
              disabled={navigatingTo === '/login'}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-[#7C5CFC] transition-colors disabled:opacity-70 flex items-center gap-2"
              whileHover={navigatingTo ? {} : { scale: 1.05 }}
              whileTap={navigatingTo ? {} : { scale: 0.95 }}
            >
              {navigatingTo === '/login' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </motion.button>
            <motion.button
              onClick={() => handleNavigation('/register')}
              disabled={navigatingTo === '/register'}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#7C5CFC] to-[#FF6B8A] rounded-xl shadow-md hover:shadow-lg transition-shadow disabled:opacity-70 flex items-center gap-2"
              whileHover={navigatingTo ? {} : { scale: 1.05 }}
              whileTap={navigatingTo ? {} : { scale: 0.95 }}
            >
              {navigatingTo === '/register' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Get Started'
              )}
            </motion.button>
          </div>
        </nav>
      </header>

      {/* ========== HERO SECTION ========== */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-24 pb-32 overflow-hidden bg-gradient-to-b from-[#FEFCFA] via-[#FFF8F3] to-[#F5F0FF] dark:from-[#0D0B14] dark:via-[#141020] dark:to-[#1A1625]">
        <FloatingParticles />

        {/* Animated gradient orbs */}
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #FF6B8A 0%, transparent 70%)', top: '-20%', left: '-15%' }}
          animate={{ scale: [1, 1.2, 1], x: [0, 30, 0], y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #7C5CFC 0%, transparent 70%)', top: '10%', right: '-10%' }}
          animate={{ scale: [1.2, 1, 1.2], x: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #00C9A7 0%, transparent 70%)', bottom: '5%', left: '10%' }}
          animate={{ scale: [1, 1.3, 1], y: [0, -30, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />

        <div className="max-w-6xl mx-auto text-center relative z-10">
          {/* Animated badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/70 dark:bg-white/10 backdrop-blur-sm border border-white/50 dark:border-white/20 shadow-lg mb-8"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00C9A7] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00C9A7]"></span>
            </span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">India&apos;s First Privacy-First LGBTQIA+ Platform</span>
            <span className="text-lg">🏳️‍🌈</span>
          </motion.div>

          {/* Main headline with animated gradient */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
          >
            <span className="text-gray-900 dark:text-white">Your Safe Space</span>
            <br />
            <motion.span
              className="bg-gradient-to-r from-[#FF6B8A] via-[#7C5CFC] to-[#00C9A7] bg-clip-text text-transparent bg-[length:200%_auto]"
              animate={{ backgroundPosition: ['0% center', '200% center'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              to Connect & Thrive
            </motion.span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Connect with LGBTQIA+ professionals, find supportive communities,
            and build meaningful relationships — all with privacy-first encryption.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          >
            <motion.button
              onClick={() => handleNavigation('/register')}
              disabled={!!navigatingTo}
              className="group relative px-8 py-4 bg-gradient-to-r from-[#7C5CFC] to-[#FF6B8A] text-white font-semibold rounded-2xl shadow-xl shadow-[#7C5CFC]/30 flex items-center gap-3 text-lg overflow-hidden disabled:opacity-80"
              whileHover={navigatingTo ? {} : { scale: 1.05 }}
              whileTap={navigatingTo ? {} : { scale: 0.98 }}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[#FF6B8A] to-[#7C5CFC] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              {navigatingTo === '/register' ? (
                <>
                  <Loader2 className="relative w-5 h-5 animate-spin" />
                  <span className="relative">Loading...</span>
                </>
              ) : (
                <>
                  <span className="relative">Get Started Free</span>
                  <ArrowRight className="relative w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>
            <Link href="#features">
              <motion.button
                className="group px-8 py-4 bg-white/80 dark:bg-white/10 backdrop-blur-sm text-gray-900 dark:text-white font-semibold rounded-2xl border border-gray-200 dark:border-white/20 flex items-center gap-3 text-lg"
                whileHover={{ scale: 1.05, borderColor: '#7C5CFC' }}
                whileTap={{ scale: 0.98 }}
              >
                <Play className="w-5 h-5 text-[#7C5CFC]" />
                See How It Works
              </motion.button>
            </Link>
          </motion.div>

          {/* Trust indicators with icons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-4 md:gap-8"
          >
            {[
              { icon: Lock, text: 'End-to-End Encrypted', color: '#7C5CFC' },
              { icon: Eye, text: 'Anonymous Mode', color: '#00C9A7' },
              { icon: Shield, text: 'Zero Data Selling', color: '#FF6B8A' },
            ].map((item) => (
              <motion.div
                key={item.text}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10 transition-colors"
                whileHover={{ scale: 1.05 }}
              >
                <item.icon className="w-4 h-4" style={{ color: item.color }} />
                <span className="text-sm text-gray-600 dark:text-gray-400">{item.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Bloom mascot with floating animation */}
        <motion.div
          className="absolute bottom-32 right-8 md:right-20 hidden md:block"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0, y: [0, -10, 0] }}
          transition={{
            opacity: { delay: 0.6, duration: 0.5 },
            x: { delay: 0.6, duration: 0.5 },
            y: { delay: 1, duration: 3, repeat: Infinity }
          }}
        >
          <BloomMascot mood="happy" size="lg" />
        </motion.div>

        <ScrollIndicator />
      </section>

      {/* ========== STATS SECTION ========== */}
      <section className="py-16 px-4 relative -mt-16 bg-[#F5F0FF] dark:bg-[#1A1625]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInScale}
          >
            <GlassCard gradient className="p-8 md:p-10">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  { value: 50, suffix: '+', label: 'Cities Covered', icon: MapPin, color: '#FF6B8A' },
                  { value: 100, suffix: '%', label: 'Privacy Focused', icon: Shield, color: '#7C5CFC' },
                  { value: 24, suffix: '/7', label: 'Support Available', icon: Heart, color: '#00C9A7' },
                  { value: 0, suffix: '', label: 'Ads or Data Selling', icon: Lock, color: '#FFB84D' },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <div className="flex justify-center mb-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${stat.color}15` }}>
                        <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                      </div>
                    </div>
                    <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                      <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* ========== VISUAL SHOWCASE SECTION ========== */}
      <section id="features" className="py-20 px-4 relative overflow-hidden bg-[#F5F0FF] dark:bg-[#1A1625]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 gap-10 items-center"
          >
            {/* Left: Animated phone mockup */}
            <motion.div variants={fadeInUp} className="relative order-2 md:order-1">
              <div className="relative mx-auto w-[280px] md:w-[320px]">
                {/* Phone frame */}
                <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-[3rem] p-3 shadow-2xl">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-900 rounded-b-2xl" />
                  <div className="bg-gradient-to-br from-[#7C5CFC]/10 via-[#FF6B8A]/10 to-[#00C9A7]/10 rounded-[2.5rem] overflow-hidden aspect-[9/19]">
                    {/* App screen content */}
                    <div className="p-4 space-y-3">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <LogoIcon size={28} />
                          <span className="font-semibold text-gray-800 dark:text-white text-sm">Haven</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-[#7C5CFC]/20 flex items-center justify-center">
                          <span className="text-sm">👤</span>
                        </div>
                      </div>

                      {/* Cards */}
                      {[
                        { emoji: '💜', title: 'Queer Coders', members: '2.4k', color: '#7C5CFC' },
                        { emoji: '🏳️‍🌈', title: 'Pride Mumbai', members: '5.1k', color: '#FF6B8A' },
                        { emoji: '✨', title: 'Art & Design', members: '1.8k', color: '#00C9A7' },
                      ].map((card, i) => (
                        <motion.div
                          key={i}
                          className="bg-white/80 dark:bg-white/10 rounded-xl p-3 flex items-center gap-3"
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + i * 0.2 }}
                          viewport={{ once: true }}
                        >
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: `${card.color}20` }}>
                            {card.emoji}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-800 dark:text-white text-xs">{card.title}</p>
                            <p className="text-gray-500 dark:text-gray-400 text-[10px]">{card.members} members</p>
                          </div>
                          <motion.div
                            className="w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${card.color}20` }}
                            whileHover={{ scale: 1.2 }}
                          >
                            <ArrowRight className="w-3 h-3" style={{ color: card.color }} />
                          </motion.div>
                        </motion.div>
                      ))}

                      {/* Bottom nav */}
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="bg-white/90 dark:bg-gray-800/90 rounded-2xl p-2 flex justify-around">
                          {[Users, MessageCircle, Calendar, MapPin].map((Icon, i) => (
                            <div key={i} className={`p-2 rounded-xl ${i === 0 ? 'bg-[#7C5CFC]/20' : ''}`}>
                              <Icon className={`w-5 h-5 ${i === 0 ? 'text-[#7C5CFC]' : 'text-gray-400'}`} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating elements around phone */}
                <motion.div
                  className="absolute -top-4 -right-4 w-16 h-16 rounded-2xl bg-[#FF6B8A] flex items-center justify-center shadow-xl"
                  animate={{ y: [0, -8, 0], rotate: [0, 5, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Heart className="w-8 h-8 text-white" />
                </motion.div>
                <motion.div
                  className="absolute -bottom-2 -left-6 w-14 h-14 rounded-2xl bg-[#00C9A7] flex items-center justify-center shadow-xl"
                  animate={{ y: [0, -6, 0], rotate: [0, -5, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                >
                  <Shield className="w-7 h-7 text-white" />
                </motion.div>
                <motion.div
                  className="absolute top-1/3 -left-10 w-12 h-12 rounded-xl bg-[#7C5CFC] flex items-center justify-center shadow-xl"
                  animate={{ y: [0, -5, 0], x: [0, 3, 0] }}
                  transition={{ duration: 2.8, repeat: Infinity, delay: 0.3 }}
                >
                  <Lock className="w-6 h-6 text-white" />
                </motion.div>
              </div>
            </motion.div>

            {/* Right: Key highlights */}
            <motion.div variants={fadeInUp} className="space-y-6 order-1 md:order-2">
              <div>
                <motion.span
                  className="inline-block px-4 py-1.5 rounded-full bg-[#7C5CFC]/10 text-[#7C5CFC] text-sm font-medium mb-4"
                  whileHover={{ scale: 1.05 }}
                >
                  Why Haven?
                </motion.span>
                <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                  Built for{' '}
                  <span className="bg-gradient-to-r from-[#FF6B8A] to-[#7C5CFC] bg-clip-text text-transparent">Safety</span>
                  {' '}&{' '}
                  <span className="bg-gradient-to-r from-[#7C5CFC] to-[#00C9A7] bg-clip-text text-transparent">Connection</span>
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Every feature is designed with privacy and community safety at its core.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { icon: Shield, text: 'Privacy-first design with end-to-end encryption', color: '#7C5CFC' },
                  { icon: Users, text: 'Verified LGBTQIA+ friendly professionals', color: '#00C9A7' },
                  { icon: Heart, text: 'Safe communities moderated by the community', color: '#FF6B8A' },
                  { icon: MapPin, text: 'Connect with people across all of India', color: '#FFB84D' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    className="flex items-start gap-4 p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:border-[#7C5CFC]/30 hover:bg-[#7C5CFC]/5 dark:hover:bg-[#7C5CFC]/10 transition-colors"
                    whileHover={{ x: 5 }}
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${item.color}15` }}>
                      <item.icon className="w-6 h-6" style={{ color: item.color }} />
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 font-medium pt-3">{item.text}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <WaveDivider />

      {/* ========== PROBLEMS WE SOLVE ========== */}
      <section className="py-20 px-4 bg-[#F5F0FF] dark:bg-[#1A1625]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-12"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-[#FF6B8A]/10 text-[#FF6B8A] text-sm font-medium mb-4">
              Why We Exist
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              The Challenges We&apos;re{' '}
              <span className="bg-gradient-to-r from-[#FF6B8A] to-[#7C5CFC] bg-clip-text text-transparent">Solving</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              LGBTQIA+ individuals face unique, compounding challenges. Haven is built to address them.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 gap-5"
          >
            {[
              { icon: Heart, color: '#FF6B8A', title: 'Healthcare Access', description: 'Finding a queer-affirming therapist, psychiatrist, or doctor is a gamble. One wrong choice can mean misgendering or refusal of care.' },
              { icon: Briefcase, color: '#7C5CFC', title: 'Employment Discrimination', description: 'Queer individuals face disproportionate hiring bias and hostile workplaces. Finding safe, inclusive employers is nearly impossible.' },
              { icon: MapPin, color: '#00C9A7', title: 'Isolation in New Cities', description: 'Moving to a new city means starting from zero. No community, no trusted contacts, no safe spaces.' },
              { icon: Shield, color: '#FFB84D', title: 'Privacy & Safety Risks', description: 'Existing platforms expose identity by default. Being outed can mean family rejection, workplace termination, or danger.' },
            ].map((problem, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                whileHover={{ scale: 1.02, y: -5 }}
                className="bg-white/70 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 dark:border-white/10 hover:shadow-xl transition-all"
              >
                <motion.div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${problem.color}15` }}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <problem.icon className="w-7 h-7" style={{ color: problem.color }} />
                </motion.div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{problem.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{problem.description}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Haven's Answer */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="mt-12 text-center"
          >
            <motion.div
              className="inline-flex items-center gap-4 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#7C5CFC]/10 via-[#FF6B8A]/10 to-[#00C9A7]/10 border border-[#7C5CFC]/20"
              whileHover={{ scale: 1.02 }}
            >
              <BloomMascot mood="wink" size="sm" animated={false} />
              <span className="text-gray-700 dark:text-gray-300 font-medium text-lg">
                Haven&apos;s answer: One platform that solves all of this — safely and privately.
              </span>
              <Sparkles className="w-5 h-5 text-[#FFB84D]" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      <WaveDivider flip variant="cream" />

      {/* ========== FEATURES ========== */}
      <section className="py-20 px-4 bg-[#FFFBF7] dark:bg-[#0D0B14]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-12"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-[#7C5CFC]/10 text-[#7C5CFC] text-sm font-medium mb-4">
              Platform Features
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need to{' '}
              <span className="bg-gradient-to-r from-[#FF6B8A] via-[#7C5CFC] to-[#00C9A7] bg-clip-text text-transparent">Thrive</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Six core modules designed for safety, privacy, and genuine connection.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard icon={Users} title="Professional Directory" description="Discover verified queer-friendly professionals — therapists, doctors, lawyers, and more." gradient="linear-gradient(135deg, #7C5CFC, #B4A7FF)" delay={0} />
            <FeatureCard icon={Sparkles} title="Community Spaces" description="Join interest-based micro-communities — Tech, Art, Fitness, Books. Find your tribe." gradient="linear-gradient(135deg, #00C9A7, #38D9A9)" delay={0.1} />
            <FeatureCard icon={Briefcase} title="Job Board" description="Find inclusive employers who value you. Community-verified job listings." gradient="linear-gradient(135deg, #FF6B8A, #FFAA85)" delay={0.2} />
            <FeatureCard icon={Calendar} title="Events Platform" description="Discover city-based meetups, workshops, pride celebrations, and support groups." gradient="linear-gradient(135deg, #FFB84D, #FFE066)" delay={0.3} />
            <FeatureCard icon={MessageCircle} title="Encrypted Chat" description="Private conversations with end-to-end encryption. DMs and group chats — all secure." gradient="linear-gradient(135deg, #4DA6FF, #7CC4FA)" delay={0.4} />
            <FeatureCard icon={Heart} title="Resource Hub" description="Crisis helplines, mental health resources, legal rights — always one tap away." gradient="linear-gradient(135deg, #B4A7FF, #D4CFFF)" delay={0.5} />
          </div>
        </div>
      </section>

      {/* ========== VISION SECTION ========== */}
      <section className="py-20 px-4 bg-[#FFFBF7] dark:bg-[#0D0B14]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-12"
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <BloomMascot mood="love" size="lg" className="mx-auto mb-6" />
            </motion.div>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Our{' '}
              <span className="bg-gradient-to-r from-[#FF6B8A] via-[#7C5CFC] to-[#00C9A7] bg-clip-text text-transparent">Vision</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg">
              A world where every LGBTQIA+ individual in India can connect, grow, and thrive
            </p>
          </motion.div>

          {/* Vision Cards */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            {[
              { icon: Shield, title: 'Safety First', desc: 'Every feature starts with: "Is this safe for our community?"', gradient: 'from-[#7C5CFC] to-[#5B3FD9]' },
              { icon: Lock, title: 'Privacy by Design', desc: 'End-to-end encryption. Zero data selling. Your data, your control.', gradient: 'from-[#00C9A7] to-[#00A88A]' },
              { icon: Heart, title: 'Built with Love', desc: 'Created by the community, for the community. Every voice matters.', gradient: 'from-[#FF6B8A] to-[#E84D6D]' },
              { icon: Globe, title: 'Pan-India Network', desc: 'From Mumbai to Manipur — connecting queer individuals everywhere.', gradient: 'from-[#FFB84D] to-[#FF9500]' },
            ].map((card, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                whileHover={{ scale: 1.03, y: -5 }}
                className={`bg-gradient-to-br ${card.gradient} rounded-3xl p-8 text-white relative overflow-hidden cursor-pointer`}
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-xl" />
                <div className="relative z-10">
                  <motion.div
                    className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-5"
                    whileHover={{ rotate: 10, scale: 1.1 }}
                  >
                    <card.icon className="w-7 h-7" />
                  </motion.div>
                  <h3 className="text-2xl font-bold mb-3">{card.title}</h3>
                  <p className="text-white/90">{card.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Quote */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="mt-16 text-center"
          >
            <div className="flex justify-center gap-1.5 mb-8">
              {['#FF6B8A', '#FFB84D', '#00C9A7', '#4DA6FF', '#7C5CFC', '#B4A7FF'].map((color, i) => (
                <motion.div
                  key={i}
                  className="w-12 h-2 rounded-full"
                  style={{ backgroundColor: color }}
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                />
              ))}
            </div>
            <p className="text-2xl md:text-4xl font-bold text-gray-800 dark:text-white italic">
              &quot;Without fear. Without hiding. Without compromise.&quot;
            </p>
            <p className="text-gray-500 dark:text-gray-400 mt-4 flex items-center justify-center gap-2">
              <Star className="w-4 h-4 text-[#FFB84D] fill-[#FFB84D]" />
              The Haven Promise
              <Star className="w-4 h-4 text-[#FFB84D] fill-[#FFB84D]" />
            </p>
          </motion.div>
        </div>
      </section>

      {/* ========== USER JOURNEYS ========== */}
      <section className="py-20 px-4 bg-[#FFFBF7] dark:bg-[#0D0B14]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-12"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-[#FFB84D]/10 text-[#FFB84D] text-sm font-medium mb-4">
              Real Stories
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              How Haven{' '}
              <span className="bg-gradient-to-r from-[#FFB84D] to-[#FF6B8A] bg-clip-text text-transparent">Transforms</span>
              {' '}Lives
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="space-y-5"
          >
            {[
              { emoji: '🏙️', title: 'New in Town', scenario: 'Arjun moves to Bangalore, not knowing anyone.', outcome: 'Within weeks, he finds a queer-affirming therapist, a gym buddy, and joins the Queer Coders community.', color: '#7C5CFC' },
              { emoji: '💼', title: 'Job Seeker', scenario: 'Priya faces discrimination after coming out at work.', outcome: 'She discovers inclusive employers on Haven\'s job board and lands a role where she\'s valued.', color: '#FF6B8A' },
              { emoji: '🩺', title: 'Professional Offering Help', scenario: 'Dr. Meera wants to serve the queer community.', outcome: 'She gets verified, appears in directory searches, and hosts monthly support groups.', color: '#00C9A7' },
            ].map((journey, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                whileHover={{ scale: 1.02, x: 10 }}
                className="bg-white/80 dark:bg-white/5 backdrop-blur-sm rounded-3xl p-6 md:p-8 border border-gray-100 dark:border-white/10 hover:shadow-2xl transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-5">
                  <motion.div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                    style={{ backgroundColor: `${journey.color}15` }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    {journey.emoji}
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{journey.title}</h3>
                    <p className="text-gray-500 dark:text-gray-400 italic mb-3">&quot;{journey.scenario}&quot;</p>
                    <p className="text-gray-700 dark:text-gray-300 flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: journey.color }} />
                      {journey.outcome}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ========== FINAL CTA ========== */}
      <section className="py-32 px-4 relative overflow-hidden bg-[#FFFBF7] dark:bg-[#0D0B14]">
        <FloatingParticles />

        {/* Animated orbs */}
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full blur-3xl opacity-40 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #7C5CFC 0%, transparent 70%)', top: '0%', left: '-10%' }}
          animate={{ scale: [1, 1.2, 1], x: [0, 50, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full blur-3xl opacity-40 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #FF6B8A 0%, transparent 70%)', bottom: '0%', right: '-5%' }}
          animate={{ scale: [1.2, 1, 1.2], y: [0, -30, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="max-w-4xl mx-auto text-center relative z-10"
        >
          {/* Animated emoji row */}
          <motion.div
            className="flex justify-center gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {['🏳️‍🌈', '✨', '💜', '🦋', '🌈', '💖'].map((emoji, i) => (
              <motion.span
                key={i}
                className="text-3xl md:text-4xl"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
              >
                {emoji}
              </motion.span>
            ))}
          </motion.div>

          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Ready to Find Your{' '}
            <motion.span
              className="bg-gradient-to-r from-[#FF6B8A] via-[#7C5CFC] to-[#00C9A7] bg-clip-text text-transparent bg-[length:200%_auto]"
              animate={{ backgroundPosition: ['0% center', '200% center'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              Community
            </motion.span>
            ?
          </h2>

          <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
            A safe space is waiting. Connect with LGBTQIA+ professionals, find your tribe, and build meaningful relationships.
          </p>

          <motion.button
            onClick={() => handleNavigation('/register')}
            disabled={!!navigatingTo}
            className="group relative px-12 py-6 bg-gradient-to-r from-[#7C5CFC] via-[#FF6B8A] to-[#00C9A7] text-white font-bold rounded-2xl shadow-2xl shadow-[#7C5CFC]/30 text-xl overflow-hidden disabled:opacity-80"
            whileHover={navigatingTo ? {} : { scale: 1.05 }}
            whileTap={navigatingTo ? {} : { scale: 0.98 }}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-[#00C9A7] via-[#7C5CFC] to-[#FF6B8A] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <span className="relative flex items-center gap-3">
              {navigatingTo === '/register' ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  Join Haven Today
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Zap className="w-6 h-6" />
                  </motion.span>
                </>
              )}
            </span>
          </motion.button>

          <div className="mt-8 flex flex-wrap justify-center gap-6 text-gray-500 dark:text-gray-400">
            {[
              { icon: Shield, text: 'Privacy First', color: '#7C5CFC' },
              { icon: Heart, text: 'Free Forever', color: '#FF6B8A' },
              { icon: Lock, text: 'No Ads Ever', color: '#00C9A7' },
            ].map((item, i) => (
              <motion.span
                key={i}
                className="flex items-center gap-2"
                whileHover={{ scale: 1.1 }}
              >
                <item.icon className="w-5 h-5" style={{ color: item.color }} />
                {item.text}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="py-12 px-4 border-t border-gray-200/50 dark:border-white/10 bg-[#FFFBF7] dark:bg-[#0D0B14]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.05 }}
            >
              <Logo size="md" animated={false} />
            </motion.div>

            <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
              Made with{' '}
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Heart className="w-5 h-5 text-[#FF6B8A] fill-[#FF6B8A]" />
              </motion.span>
              {' '}for India&apos;s LGBTQIA+ community
            </p>
          </div>

          {/* Pride gradient line */}
          <motion.div
            className="mt-8 h-1.5 rounded-full overflow-hidden"
            style={{
              background: 'linear-gradient(90deg, #FF6B8A, #FFB84D, #00C9A7, #4DA6FF, #7C5CFC, #B4A7FF)',
            }}
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          />

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            © {new Date().getFullYear()} Haven. All rights reserved. Built with privacy at the core.
          </p>
        </div>
      </footer>
    </div>
  )
}
