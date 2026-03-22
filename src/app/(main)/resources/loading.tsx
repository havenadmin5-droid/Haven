"use client";

import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";

export default function ResourcesLoading() {
  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Animated header */}
      <div className="flex items-center gap-3 mb-8">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-10 h-10 rounded-xl bg-[var(--lavender)]/20 flex items-center justify-center"
        >
          <BookOpen className="text-[var(--lavender)]" size={22} />
        </motion.div>
        <div>
          <div className="h-6 w-36 bg-[var(--bg-tertiary)] rounded-lg animate-pulse" />
          <div className="h-4 w-48 bg-[var(--bg-tertiary)] rounded mt-2 animate-pulse" />
        </div>
      </div>

      {/* Crisis banner skeleton */}
      <div className="h-20 bg-gradient-to-r from-[var(--rose)]/10 to-[var(--violet)]/10 rounded-xl mb-6 animate-pulse" />

      {/* Helplines skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--teal)]/20 animate-pulse" />
              <div className="flex-1">
                <div className="h-4 w-24 bg-[var(--bg-tertiary)] rounded animate-pulse mb-2" />
                <div className="h-3 w-32 bg-[var(--bg-tertiary)] rounded animate-pulse" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search skeleton */}
      <div className="h-12 bg-[var(--bg-secondary)] rounded-xl mb-4 animate-pulse" />

      {/* Category pills skeleton */}
      <div className="flex gap-2 mb-6 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="h-9 rounded-full bg-[var(--bg-secondary)] animate-pulse"
            style={{ width: `${80 + Math.random() * 40}px` }}
          />
        ))}
      </div>

      {/* Resource cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="card"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--lavender)]/20 animate-pulse" />
              <div className="flex-1">
                <div className="h-5 w-32 bg-[var(--bg-tertiary)] rounded animate-pulse mb-2" />
                <div className="h-3 w-full bg-[var(--bg-tertiary)] rounded animate-pulse mb-1" />
                <div className="h-3 w-3/4 bg-[var(--bg-tertiary)] rounded animate-pulse mb-3" />
                <div className="h-6 w-24 bg-[var(--violet)]/20 rounded-full animate-pulse" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
