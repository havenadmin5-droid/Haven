'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Rocket } from 'lucide-react'
import { Confetti } from '@/components/effects'
import { Bloom } from '@/components/mascot'

export function CTA() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [showConfetti, setShowConfetti] = useState(false)

  const handleButtonHover = () => {
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 3000)
  }

  return (
    <section className="py-24 px-4 relative overflow-hidden" ref={ref}>
      {/* Confetti effect */}
      <Confetti isActive={showConfetti} />

      {/* Background decorations */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-100 via-rose-100 to-amber-100 dark:from-violet-950/50 dark:via-rose-950/50 dark:to-amber-950/50" />

        {/* Animated shapes */}
        <motion.div
          className="absolute top-20 left-10 w-20 h-20 rounded-full bg-gradient-to-r from-pink-400 to-rose-400 opacity-20 blur-xl"
          animate={{
            scale: [1, 1.5, 1],
            x: [0, 30, 0],
          }}
          transition={{ duration: 5, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-32 h-32 rounded-full bg-gradient-to-r from-violet-400 to-purple-400 opacity-20 blur-xl"
          animate={{
            scale: [1, 1.3, 1],
            y: [0, -20, 0],
          }}
          transition={{ duration: 7, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-1/2 left-1/4 w-24 h-24 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 opacity-15 blur-xl"
          animate={{
            scale: [1, 1.4, 1],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      <div className="max-w-4xl mx-auto text-center relative">
        {/* Bloom mascot */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6, type: 'spring' }}
          className="flex justify-center mb-8"
        >
          <Bloom mood="love" size="xl" />
        </motion.div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-card/80 backdrop-blur-sm shadow-sm text-violet-700 dark:text-violet-300 text-sm font-medium mb-6"
        >
          <Rocket className="w-4 h-4" />
          Be a Founding Member
        </motion.div>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl md:text-6xl font-heading font-bold mb-6"
        >
          Help Us Build{' '}
          <span className="gradient-rainbow-text">Your Haven</span>
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-lg md:text-xl text-text-secondary mb-10 max-w-2xl mx-auto"
        >
          We&apos;re just getting started, and we want you to be part of shaping this community.
          Join early, share your voice, and help us build something meaningful together.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link href="/register">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              onHoverStart={handleButtonHover}
              className="group px-10 py-5 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-rose-500 text-white font-bold rounded-full shadow-xl shadow-violet-500/30 flex items-center gap-3 text-lg relative overflow-hidden"
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ['-200%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              />
              <span className="relative">Join as Founding Member</span>
              <ArrowRight className="w-5 h-5 relative group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </Link>

          <motion.p className="text-sm text-text-secondary">
            Free forever • Shape the future of Haven
          </motion.p>
        </motion.div>

        {/* Founding member benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12"
        >
          <p className="text-text-secondary text-sm mb-4">As a founding member, you&apos;ll get:</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { emoji: '🏆', text: 'Founding badge on your profile' },
              { emoji: '💬', text: 'Direct input on features' },
              { emoji: '🎁', text: 'Early access to everything' },
              { emoji: '💜', text: 'Our eternal gratitude' },
            ].map((benefit, i) => (
              <motion.div
                key={benefit.text}
                initial={{ scale: 0 }}
                animate={isInView ? { scale: 1 } : {}}
                transition={{ delay: 0.6 + i * 0.1, type: 'spring' }}
                className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-card/80 rounded-full text-sm"
              >
                <span>{benefit.emoji}</span>
                <span className="text-text-primary">{benefit.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default CTA
