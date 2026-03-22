'use client'

import { useEffect, useRef, useCallback } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
  alpha: number
  targetAlpha: number
}

interface Orb {
  x: number
  y: number
  radius: number
  color: string
  vx: number
  vy: number
  pulsePhase: number
}

const PRIDE_COLORS = [
  'rgba(228, 3, 3, 0.6)',    // Red
  'rgba(255, 140, 0, 0.6)',  // Orange
  'rgba(255, 237, 0, 0.6)',  // Yellow
  'rgba(0, 128, 38, 0.6)',   // Green
  'rgba(36, 64, 142, 0.6)',  // Blue
  'rgba(115, 41, 130, 0.6)', // Purple
  'rgba(255, 175, 200, 0.6)', // Pink (trans flag)
  'rgba(91, 206, 250, 0.6)', // Light blue (trans flag)
]

const SOFT_PRIDE_COLORS = [
  'rgba(255, 182, 193, 0.4)', // Soft pink
  'rgba(255, 218, 185, 0.4)', // Soft peach
  'rgba(255, 255, 200, 0.4)', // Soft yellow
  'rgba(200, 255, 214, 0.4)', // Soft mint
  'rgba(200, 220, 255, 0.4)', // Soft sky
  'rgba(230, 200, 255, 0.4)', // Soft lavender
]

export function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const orbsRef = useRef<Orb[]>([])
  const mouseRef = useRef({ x: 0, y: 0, isActive: false })
  const animationRef = useRef<number>()
  const lastSpawnRef = useRef(0)

  const createOrbs = useCallback((width: number, height: number) => {
    const orbs: Orb[] = []
    const orbCount = Math.floor((width * height) / 120000) + 3 // Adaptive count

    for (let i = 0; i < orbCount; i++) {
      orbs.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 80 + Math.random() * 150,
        color: SOFT_PRIDE_COLORS[i % SOFT_PRIDE_COLORS.length]!,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        pulsePhase: Math.random() * Math.PI * 2,
      })
    }
    return orbs
  }, [])

  const spawnParticles = useCallback((x: number, y: number, count: number = 5) => {
    const particles = particlesRef.current
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1 + Math.random() * 3
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 3 + Math.random() * 6,
        color: PRIDE_COLORS[Math.floor(Math.random() * PRIDE_COLORS.length)]!,
        alpha: 1,
        targetAlpha: 1,
      })
    }
    // Limit particles
    if (particles.length > 150) {
      particlesRef.current = particles.slice(-150)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      orbsRef.current = createOrbs(rect.width, rect.height)
    }

    resize()
    window.addEventListener('resize', resize)

    // Mouse/touch handlers
    const handleMove = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = {
        x: clientX - rect.left,
        y: clientY - rect.top,
        isActive: true,
      }

      // Spawn particles on move (throttled)
      const now = Date.now()
      if (now - lastSpawnRef.current > 50) {
        spawnParticles(mouseRef.current.x, mouseRef.current.y, 2)
        lastSpawnRef.current = now
      }
    }

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY)
    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (touch) {
        handleMove(touch.clientX, touch.clientY)
      }
    }
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      spawnParticles(x, y, 15) // Burst on click
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true })
    canvas.addEventListener('click', handleClick)
    canvas.addEventListener('mouseleave', () => {
      mouseRef.current.isActive = false
    })

    // Animation loop
    let time = 0
    const animate = () => {
      const rect = canvas.getBoundingClientRect()
      ctx.clearRect(0, 0, rect.width, rect.height)
      time += 0.016 // ~60fps

      // Draw and update orbs (gradient blobs)
      orbsRef.current.forEach((orb) => {
        // Gentle movement
        orb.x += orb.vx
        orb.y += orb.vy

        // Bounce off edges
        if (orb.x < -orb.radius) orb.x = rect.width + orb.radius
        if (orb.x > rect.width + orb.radius) orb.x = -orb.radius
        if (orb.y < -orb.radius) orb.y = rect.height + orb.radius
        if (orb.y > rect.height + orb.radius) orb.y = -orb.radius

        // Mouse interaction - orbs are attracted slightly
        if (mouseRef.current.isActive) {
          const dx = mouseRef.current.x - orb.x
          const dy = mouseRef.current.y - orb.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 300) {
            orb.vx += (dx / dist) * 0.02
            orb.vy += (dy / dist) * 0.02
          }
        }

        // Limit velocity
        const maxSpeed = 0.8
        const speed = Math.sqrt(orb.vx * orb.vx + orb.vy * orb.vy)
        if (speed > maxSpeed) {
          orb.vx = (orb.vx / speed) * maxSpeed
          orb.vy = (orb.vy / speed) * maxSpeed
        }

        // Pulsing radius
        const pulseRadius = orb.radius * (1 + Math.sin(time * 2 + orb.pulsePhase) * 0.1)

        // Draw orb with radial gradient
        const gradient = ctx.createRadialGradient(
          orb.x,
          orb.y,
          0,
          orb.x,
          orb.y,
          pulseRadius
        )
        gradient.addColorStop(0, orb.color)
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

        ctx.beginPath()
        ctx.arc(orb.x, orb.y, pulseRadius, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()
      })

      // Draw and update particles
      particlesRef.current = particlesRef.current.filter((p) => {
        // Update position
        p.x += p.vx
        p.y += p.vy

        // Gravity and friction
        p.vy += 0.05
        p.vx *= 0.99
        p.vy *= 0.99

        // Fade out
        p.alpha -= 0.015
        if (p.alpha <= 0) return false

        // Draw particle
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = p.color.replace(/[\d.]+\)$/, `${p.alpha})`)
        ctx.fill()

        // Sparkle effect
        if (Math.random() > 0.95) {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.radius * 0.3, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.8})`
          ctx.fill()
        }

        return true
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('click', handleClick)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [createOrbs, spawnParticles])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none -z-10"
      style={{
        background: 'transparent',
        touchAction: 'none',
      }}
      aria-hidden="true"
    />
  )
}

export default InteractiveBackground
