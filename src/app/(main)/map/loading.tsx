"use client";

import { motion } from "framer-motion";
import { Map, MapPin } from "lucide-react";

export default function MapLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-10 h-10 rounded-xl bg-[var(--mint)]/20 flex items-center justify-center"
          >
            <Map className="text-[var(--mint)]" size={22} />
          </motion.div>
          <div>
            <div className="h-6 w-48 bg-[var(--bg-tertiary)] rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="h-4 w-24 bg-[var(--bg-tertiary)] rounded animate-pulse" />
      </div>

      {/* Filters skeleton */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="h-4 w-16 bg-[var(--bg-tertiary)] rounded animate-pulse" />
        <div className="h-10 w-32 bg-[var(--bg-secondary)] rounded-lg animate-pulse" />
        <div className="h-10 w-40 bg-[var(--bg-secondary)] rounded-lg animate-pulse" />
      </div>

      {/* Map skeleton with animated pins */}
      <div className="relative h-[50vh] md:h-[60vh] rounded-xl overflow-hidden bg-gradient-to-br from-[var(--mint)]/10 to-[var(--teal)]/10 border border-[var(--border-color)]">
        {/* Map grid pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: 'linear-gradient(var(--border-color) 1px, transparent 1px), linear-gradient(90deg, var(--border-color) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        {/* Animated location pins */}
        {[
          { left: '20%', top: '30%', delay: 0 },
          { left: '60%', top: '25%', delay: 0.2 },
          { left: '45%', top: '50%', delay: 0.4 },
          { left: '75%', top: '60%', delay: 0.6 },
          { left: '30%', top: '70%', delay: 0.8 },
        ].map((pin, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{ left: pin.left, top: pin.top }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: pin.delay, duration: 0.5 }}
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: pin.delay }}
              className="w-10 h-10 rounded-full bg-[var(--bg-primary)] shadow-lg border-2 border-[var(--mint)] flex items-center justify-center"
            >
              <MapPin className="text-[var(--mint)]" size={18} />
            </motion.div>
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: pin.delay }}
              className="absolute top-full left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[var(--mint)]/30"
            />
          </motion.div>
        ))}

        {/* Center loading indicator */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--bg-card)]/90 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-xl border border-[var(--border-color)]"
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 rounded-full border-2 border-[var(--mint)] border-t-transparent"
              />
              <span className="text-[var(--text-secondary)] font-medium">Loading map...</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Privacy notice skeleton */}
      <div className="h-4 w-72 mx-auto bg-[var(--bg-tertiary)] rounded animate-pulse" />

      {/* Professional cards header */}
      <div className="h-6 w-48 bg-[var(--bg-tertiary)] rounded animate-pulse" />

      {/* Professional cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.05 }}
            className="card"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-[var(--bg-tertiary)] animate-pulse" />
              <div className="flex-1">
                <div className="h-4 w-24 bg-[var(--bg-tertiary)] rounded animate-pulse mb-1" />
                <div className="h-3 w-32 bg-[var(--bg-tertiary)] rounded animate-pulse" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="h-3 w-16 bg-[var(--bg-tertiary)] rounded animate-pulse" />
              <div className="h-5 w-16 bg-[var(--teal)]/20 rounded-full animate-pulse" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
