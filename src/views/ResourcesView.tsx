'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen, Phone, Heart, Scale, Shield, ExternalLink, Sparkles,
  AlertCircle, Users, Brain, Briefcase, Home, Stethoscope,
} from 'lucide-react'
import { SearchInput } from '@/components/ui/SearchInput'
import { CRISIS_HELPLINES } from '@/lib/constants'
import { Bloom } from '@/components/mascot'
import { containerVariants, itemVariants } from '@/components/app/PageTransition'

interface Resource {
  title: string
  description: string
  link?: string
  phone?: string
  category: 'mental_health' | 'legal' | 'healthcare' | 'community' | 'employment' | 'housing'
}

const RESOURCES: Resource[] = [
  { title: 'iCall - TISS', description: 'Free professional counseling service by TISS. Mon-Sat, 8 AM - 10 PM.', phone: '9152987821', category: 'mental_health' },
  { title: 'Vandrevala Foundation', description: '24/7 free mental health helpline with multilingual support.', phone: '1860-2662-345', category: 'mental_health' },
  { title: 'The Humsafar Trust', description: 'LGBTQIA+ support, counseling, and community resources.', link: 'https://humsafar.org', category: 'mental_health' },
  { title: 'Queer Chennai Chronicles', description: 'Support network for LGBTQIA+ individuals in Chennai.', link: 'https://queerchennaichron.com', category: 'mental_health' },
  { title: 'Lawyers Collective', description: 'Legal aid for marginalized communities including LGBTQIA+ rights.', link: 'https://lawyerscollective.org', category: 'legal' },
  { title: 'Alternative Law Forum', description: 'Legal resources for queer and trans communities in Bangalore.', link: 'https://altlawforum.org', category: 'legal' },
  { title: 'Know Your Rights', description: 'Section 377 was struck down in 2018. Same-sex relations are legal in India.', category: 'legal' },
  { title: 'Sappho for Equality', description: 'Health resources for lesbian, bisexual women, and trans men.', link: 'https://sapphokolkata.in', category: 'healthcare' },
  { title: 'SAATHII', description: 'Sexual health and HIV/AIDS support for LGBTQIA+ communities.', link: 'https://saathii.org', category: 'healthcare' },
  { title: 'Swabhava Trust', description: 'Bangalore-based support group with helpline and counseling.', phone: '080-22230959', category: 'community' },
  { title: 'Pride Circle', description: 'Corporate diversity, job fairs, and professional networking.', link: 'https://pridecircle.in', category: 'community' },
  { title: 'Pride Circle Jobs', description: 'Job board connecting LGBTQIA+ professionals with inclusive employers.', link: 'https://pridecircle.in/jobs', category: 'employment' },
  { title: 'Housing Rights', description: 'Landlords cannot discriminate based on sexual orientation or gender identity.', category: 'housing' },
]

const CATEGORIES = [
  { id: 'all', name: 'All Resources', icon: BookOpen, color: 'var(--lavender)' },
  { id: 'mental_health', name: 'Mental Health', icon: Brain, color: 'var(--violet)' },
  { id: 'legal', name: 'Legal Rights', icon: Scale, color: 'var(--amber)' },
  { id: 'healthcare', name: 'Healthcare', icon: Stethoscope, color: 'var(--teal)' },
  { id: 'community', name: 'Community', icon: Users, color: 'var(--rose)' },
  { id: 'employment', name: 'Employment', icon: Briefcase, color: 'var(--sky)' },
  { id: 'housing', name: 'Housing', icon: Home, color: 'var(--mint)' },
]

/**
 * ResourcesView - Resources hub page for the SPA.
 */
export function ResourcesView() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredResources = RESOURCES.filter((resource) => {
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory
    const matchesSearch =
      searchQuery === '' ||
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <motion.div
      className="max-w-4xl mx-auto space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="text-[var(--lavender)]" />
            Resources Hub
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Helplines, support services, and information for the community
          </p>
        </div>
      </motion.div>

      {/* Emergency Banner */}
      <motion.div
        variants={itemVariants}
        className="bg-gradient-to-r from-[var(--rose)]/10 to-[var(--violet)]/10 border border-[var(--rose)]/30 rounded-xl p-4"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="text-[var(--rose)] flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-semibold text-[var(--rose)]">In Crisis?</p>
            <p className="text-sm text-[var(--text-secondary)]">
              If you&apos;re in immediate danger, call emergency services (112) or reach a helpline below.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Crisis Helplines */}
      <motion.div variants={itemVariants}>
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Phone className="text-[var(--teal)]" size={20} />
          Crisis Helplines
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CRISIS_HELPLINES.map((helpline) => (
            <motion.a
              key={helpline.name}
              href={`tel:${helpline.number.replace(/-/g, '')}`}
              variants={itemVariants}
              className="card hover:shadow-lg transition-all cursor-pointer group border-2 border-transparent hover:border-[var(--teal)]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--teal)]/10 flex items-center justify-center group-hover:bg-[var(--teal)]/20 transition-colors">
                  <Phone className="text-[var(--teal)]" size={18} />
                </div>
                <div>
                  <p className="font-semibold">{helpline.name}</p>
                  <p className="text-sm text-[var(--teal)] font-mono">{helpline.number}</p>
                  <p className="text-xs text-[var(--text-muted)]">{helpline.description}</p>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </motion.div>

      {/* Search */}
      <motion.div variants={itemVariants}>
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search resources..."
        />
      </motion.div>

      {/* Category Pills */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
        {CATEGORIES.map((category) => {
          const Icon = category.icon
          const isActive = selectedCategory === category.id
          return (
            <motion.button
              key={category.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[var(--lavender)] text-white shadow-md'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              <Icon size={16} style={{ color: isActive ? 'white' : category.color }} />
              {category.name}
            </motion.button>
          )
        })}
      </motion.div>

      {/* Resources Grid */}
      {filteredResources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredResources.map((resource) => {
            const category = CATEGORIES.find((c) => c.id === resource.category)
            const Icon = category?.icon || BookOpen
            const color = category?.color || 'var(--lavender)'

            return (
              <motion.div key={resource.title} variants={itemVariants} className="card hover:shadow-lg transition-all">
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <Icon size={20} style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold mb-1">{resource.title}</h3>
                    <p className="text-sm text-[var(--text-secondary)] mb-3">{resource.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {resource.phone && (
                        <a
                          href={`tel:${resource.phone.replace(/-/g, '')}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[var(--teal)]/10 text-[var(--teal)] rounded-full text-xs font-medium hover:bg-[var(--teal)]/20"
                        >
                          <Phone size={12} />
                          {resource.phone}
                        </a>
                      )}
                      {resource.link && (
                        <a
                          href={resource.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[var(--violet)]/10 text-[var(--violet)] rounded-full text-xs font-medium hover:bg-[var(--violet)]/20"
                        >
                          <ExternalLink size={12} />
                          Visit Website
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      ) : (
        <motion.div variants={itemVariants} className="card text-center py-12">
          <Bloom mood="wink" size="lg" className="mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2">No resources found</h3>
          <p className="text-[var(--text-secondary)]">Try adjusting your search or category filter.</p>
        </motion.div>
      )}

      {/* Footer */}
      <motion.div
        variants={itemVariants}
        className="card bg-gradient-to-r from-[var(--violet)]/5 to-[var(--lavender)]/5"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[var(--lavender)]/20 flex items-center justify-center">
            <Sparkles className="text-[var(--lavender)]" />
          </div>
          <div>
            <p className="font-semibold">Know a resource we should add?</p>
            <p className="text-sm text-[var(--text-secondary)]">
              Help us grow this list by suggesting verified LGBTQIA+ friendly resources.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Privacy reminder */}
      <motion.div
        variants={itemVariants}
        className="text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-1"
      >
        <Shield size={12} />
        Your browsing is private. We don&apos;t track which resources you view.
      </motion.div>
    </motion.div>
  )
}
