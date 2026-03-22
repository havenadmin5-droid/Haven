'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { Heart, Shield, Eye, Users } from 'lucide-react'

const values = [
  {
    icon: Shield,
    title: 'Safety First',
    description: 'Every feature designed with your protection in mind. Your identity, your choice.',
    emoji: '🛡️',
  },
  {
    icon: Eye,
    title: 'Privacy by Design',
    description: 'End-to-end encryption. No data selling. What happens in Haven, stays in Haven.',
    emoji: '🔐',
  },
  {
    icon: Heart,
    title: 'Built with Love',
    description: 'Created by the community, for the community. Every voice matters here.',
    emoji: '💜',
  },
  {
    icon: Users,
    title: 'Inclusive Always',
    description: 'A space for every identity, every expression, every journey. You belong.',
    emoji: '🌈',
  },
]

export function Vision() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="py-24 px-4 relative overflow-hidden" ref={ref}>
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-rose-600" />

      {/* Animated pattern */}
      <div className="absolute inset-0 opacity-10">
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
          animate={{ backgroundPosition: ['0px 0px', '32px 32px'] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      <div className="max-w-6xl mx-auto relative">
        {/* Vision statement */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.span
            className="text-6xl mb-6 block"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            🌱
          </motion.span>
          <h2 className="text-3xl md:text-5xl font-heading font-bold text-white mb-6">
            Our Vision
          </h2>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            A world where every LGBTQIA+ individual in India can connect, grow, and thrive
            — without fear, without hiding, without compromise.
          </p>
        </motion.div>

        {/* Values grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((value, index) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20"
            >
              <motion.span
                className="text-4xl block mb-4"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
              >
                {value.emoji}
              </motion.span>
              <h3 className="text-lg font-heading font-bold text-white mb-2">
                {value.title}
              </h3>
              <p className="text-white/80 text-sm leading-relaxed">
                {value.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Mission statement */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="inline-block bg-white/10 backdrop-blur-sm rounded-2xl px-8 py-6 border border-white/20">
            <p className="text-white/90 text-lg md:text-xl italic">
              &ldquo;We&apos;re not just building a platform. We&apos;re cultivating a sanctuary
              where authenticity flourishes and connections bloom.&rdquo;
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Vision
