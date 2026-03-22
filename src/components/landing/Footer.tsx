'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Heart, Github, Twitter, Instagram } from 'lucide-react'
import { Logo } from '@/components/brand'

const footerLinks = {
  product: [
    { label: 'Features', href: '#features' },
    { label: 'Why Haven', href: '#why' },
    { label: 'Safety', href: '#' },
    { label: 'Privacy', href: '#' },
  ],
  community: [
    { label: 'Guidelines', href: '#' },
    { label: 'Resources', href: '#' },
    { label: 'Events', href: '#' },
    { label: 'Blog', href: '#' },
  ],
  support: [
    { label: 'Help Center', href: '#' },
    { label: 'Contact Us', href: '#' },
    { label: 'Report Issue', href: '#' },
    { label: 'Feedback', href: '#' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy', href: '#' },
  ],
}

const socialLinks = [
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Github, href: '#', label: 'GitHub' },
]

export function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand column */}
          <div className="col-span-2">
            <Logo size="md" animated={false} />
            <p className="mt-4 text-text-secondary text-sm leading-relaxed max-w-xs">
              A safe, private space for India&apos;s LGBTQIA+ community to connect,
              grow, and thrive together.
            </p>

            {/* Social links */}
            <div className="flex gap-3 mt-6">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-text-secondary hover:text-violet-600 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links columns */}
          <FooterLinkColumn title="Product" links={footerLinks.product} />
          <FooterLinkColumn title="Community" links={footerLinks.community} />
          <FooterLinkColumn title="Support" links={footerLinks.support} />
          <FooterLinkColumn title="Legal" links={footerLinks.legal} />
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-text-secondary flex items-center gap-1">
              Made with <Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> for India&apos;s LGBTQIA+ community
            </p>
            <p className="text-sm text-text-secondary">
              © {new Date().getFullYear()} Haven. All rights reserved.
            </p>
          </div>

          {/* Pride ribbon */}
          <motion.div
            className="mt-8 h-1 rounded-full overflow-hidden"
            style={{
              background: 'linear-gradient(90deg, #E40303, #FF8C00, #FFED00, #008026, #24408E, #732982)',
            }}
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>
    </footer>
  )
}

function FooterLinkColumn({
  title,
  links,
}: {
  title: string
  links: { label: string; href: string }[]
}) {
  return (
    <div>
      <h3 className="font-heading font-semibold text-text-primary mb-4">{title}</h3>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm text-text-secondary hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Footer
