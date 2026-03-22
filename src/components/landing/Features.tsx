'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import {
  Users,
  Briefcase,
  Calendar,
  MessageCircle,
  MapPin,
  Shield,
  Heart,
  Sparkles,
} from 'lucide-react'

const features = [
  {
    icon: Users,
    title: 'Professional Directory',
    description: 'Connect with LGBTQIA+ professionals and allies across industries. Find mentors, collaborators, and friends.',
    gradient: 'from-violet-500 to-purple-600',
    illustration: '👥',
  },
  {
    icon: Briefcase,
    title: 'Inclusive Job Board',
    description: 'Discover opportunities at companies that truly celebrate diversity. Every listing is from a verified ally.',
    gradient: 'from-amber-500 to-orange-600',
    illustration: '💼',
  },
  {
    icon: Calendar,
    title: 'Community Events',
    description: 'From pride parades to professional meetups, find events that matter. Virtual and in-person across India.',
    gradient: 'from-teal-500 to-emerald-600',
    illustration: '🎉',
  },
  {
    icon: MessageCircle,
    title: 'Safe Conversations',
    description: 'End-to-end encrypted messaging. Your conversations are yours alone. No data mining, ever.',
    gradient: 'from-sky-500 to-blue-600',
    illustration: '💬',
  },
  {
    icon: MapPin,
    title: 'Fuzzy Location Map',
    description: 'See who\'s nearby without revealing exact locations. Privacy-first design protects everyone.',
    gradient: 'from-rose-500 to-pink-600',
    illustration: '📍',
  },
  {
    icon: Shield,
    title: 'Anonymous Mode',
    description: 'Explore and engage without revealing your identity. Your safety is our priority.',
    gradient: 'from-indigo-500 to-violet-600',
    illustration: '🛡️',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
}

export function Features() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="py-24 px-4 relative overflow-hidden" id="features">
      {/* Section background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-50/50 to-transparent dark:via-violet-950/20" />

      <div className="max-w-6xl mx-auto relative">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Everything you need
          </div>
          <h2 className="text-3xl md:text-5xl font-heading font-bold mb-4">
            Built for <span className="gradient-rainbow-text">Our Community</span>
          </h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Every feature designed with your privacy, safety, and connection in mind.
          </p>
        </motion.div>

        {/* Features grid */}
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </motion.div>

        {/* Bottom decorative element */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex justify-center mt-16"
        >
          <div className="flex items-center gap-4 text-text-secondary">
            <Heart className="w-5 h-5 text-rose-500" />
            <span className="text-sm">Made with love for India&apos;s LGBTQIA+ community</span>
            <Heart className="w-5 h-5 text-rose-500" />
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  gradient,
  illustration,
}: {
  icon: React.ElementType
  title: string
  description: string
  gradient: string
  illustration: string
}) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -5, scale: 1.02 }}
      className="group relative bg-white/80 dark:bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 dark:border-gray-800 hover:border-violet-300 dark:hover:border-violet-700 transition-all duration-300 shadow-sm hover:shadow-xl"
    >
      {/* Gradient overlay on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />

      {/* Icon */}
      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-lg`}>
        <Icon className="w-7 h-7 text-white" />
      </div>

      {/* Floating illustration */}
      <motion.span
        className="absolute top-4 right-4 text-4xl opacity-20 group-hover:opacity-40 transition-opacity"
        animate={{
          y: [0, -5, 0],
          rotate: [0, 5, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {illustration}
      </motion.span>

      {/* Content */}
      <h3 className="text-xl font-heading font-semibold text-text-primary mb-2">
        {title}
      </h3>
      <p className="text-text-secondary leading-relaxed">
        {description}
      </p>

      {/* Learn more link */}
      <motion.div
        className="mt-4 flex items-center gap-1 text-sm font-medium text-violet-600 dark:text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity"
        initial={{ x: -10 }}
        whileHover={{ x: 0 }}
      >
        Learn more
        <motion.span
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          →
        </motion.span>
      </motion.div>
    </motion.div>
  )
}

export default Features
