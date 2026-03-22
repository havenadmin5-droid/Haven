'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { AlertTriangle, Zap, Lock, Heart, ArrowRight } from 'lucide-react'

const problems = [
  {
    problem: 'Mainstream platforms aren\'t built for us',
    solution: 'Haven is designed from the ground up with LGBTQIA+ needs at its core',
    icon: AlertTriangle,
    color: 'rose',
  },
  {
    problem: 'Privacy is an afterthought elsewhere',
    solution: 'Here, privacy is the foundation. Anonymous mode, encrypted chats, fuzzy locations',
    icon: Lock,
    color: 'violet',
  },
  {
    problem: 'Finding allies and community is hard',
    solution: 'Professional directory, verified inclusive employers, community spaces',
    icon: Heart,
    color: 'teal',
  },
  {
    problem: 'Safety concerns limit authentic connection',
    solution: 'Moderation tools, block systems, and accountable anonymity protect everyone',
    icon: Zap,
    color: 'amber',
  },
]

export function WhyHaven() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="py-24 px-4 relative overflow-hidden" id="why" ref={ref}>
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-50/50 to-transparent dark:via-violet-950/20" />

      <div className="max-w-5xl mx-auto relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.span
            className="text-5xl block mb-4"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            💡
          </motion.span>
          <h2 className="text-3xl md:text-5xl font-heading font-bold mb-4">
            Why We&apos;re Building <span className="gradient-rainbow-text">Haven</span>
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Because our community deserves better than making do with platforms that weren&apos;t designed for us.
          </p>
        </motion.div>

        {/* Problem/Solution cards */}
        <div className="space-y-6">
          {problems.map((item, index) => (
            <motion.div
              key={item.problem}
              initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="bg-white/80 dark:bg-card/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                {/* Problem */}
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wide">
                        The Problem
                      </span>
                      <p className="text-text-primary font-medium">
                        {item.problem}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <motion.div
                  className="hidden md:block"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="w-6 h-6 text-violet-400" />
                </motion.div>

                {/* Solution */}
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">✨</span>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-teal-600 dark:text-teal-400 uppercase tracking-wide">
                        Our Solution
                      </span>
                      <p className="text-text-primary font-medium">
                        {item.solution}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 text-center"
        >
          <p className="text-text-secondary text-lg">
            This is just the beginning. We&apos;re building Haven{' '}
            <span className="text-violet-600 dark:text-violet-400 font-medium">
              with the community, for the community
            </span>.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

export default WhyHaven
