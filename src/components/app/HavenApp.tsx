'use client'

import { useEffect, Suspense, lazy } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/authStore'
import { Sidebar, MobileNav, TopBar } from '@/components/layout'
import { Logo } from '@/components/brand/Logo'
import { PageTransition } from './PageTransition'
import { getRouteForPath } from './routes'

// Lazy load views for code splitting
const FeedView = lazy(() => import('@/views/FeedView').then(m => ({ default: m.FeedView })))
const DirectoryView = lazy(() => import('@/views/DirectoryView').then(m => ({ default: m.DirectoryView })))
const CommunitiesView = lazy(() => import('@/views/CommunitiesView').then(m => ({ default: m.CommunitiesView })))
const JobsView = lazy(() => import('@/views/JobsView').then(m => ({ default: m.JobsView })))
const EventsView = lazy(() => import('@/views/EventsView').then(m => ({ default: m.EventsView })))
const ChatView = lazy(() => import('@/views/ChatView').then(m => ({ default: m.ChatView })))
const ProfileView = lazy(() => import('@/views/ProfileView').then(m => ({ default: m.ProfileView })))
const SafetyView = lazy(() => import('@/views/SafetyView').then(m => ({ default: m.SafetyView })))
const ResourcesView = lazy(() => import('@/views/ResourcesView').then(m => ({ default: m.ResourcesView })))
const MapView = lazy(() => import('@/views/MapView').then(m => ({ default: m.MapView })))
const AdminView = lazy(() => import('@/views/AdminView').then(m => ({ default: m.AdminView })))

/**
 * App skeleton shown during initial auth load.
 */
function AppSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--bg-main)]">
      {/* Sidebar skeleton */}
      <aside className="hidden lg:flex flex-col w-64 h-screen bg-[var(--bg-card)] border-r border-[var(--border-color)] fixed left-0 top-0">
        <div className="p-6 border-b border-[var(--border-color)]">
          <Logo size="sm" animated />
        </div>
        <nav className="flex-1 px-4 py-6">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-12 bg-[var(--bg-hover)] rounded-xl animate-pulse" />
            ))}
          </div>
        </nav>
      </aside>

      {/* Mobile header skeleton */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[var(--bg-card)] border-b border-[var(--border-color)] z-50 flex items-center justify-center">
        <Logo size="sm" animated />
      </header>

      {/* Main content skeleton */}
      <main className="lg:ml-64 pt-16 lg:pt-0 pb-20 lg:pb-0 min-h-screen">
        <div className="max-w-4xl mx-auto p-6">
          <div className="space-y-4 animate-pulse">
            <div className="h-8 w-48 bg-[var(--bg-hover)] rounded-lg" />
            <div className="h-4 w-72 bg-[var(--bg-hover)] rounded-lg" />
            <div className="grid gap-4 mt-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-[var(--bg-hover)] rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

/**
 * View loading fallback - minimal skeleton for lazy loaded views.
 */
function ViewSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-48 bg-[var(--bg-hover)] rounded-lg" />
      <div className="h-4 w-72 bg-[var(--bg-hover)] rounded-lg" />
      <div className="grid gap-4 mt-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-[var(--bg-hover)] rounded-2xl" />
        ))}
      </div>
    </div>
  )
}

/**
 * Get the view component for a given pathname.
 */
function getViewForPath(pathname: string) {
  // Match pathname to view
  if (pathname === '/feed' || pathname === '/') return FeedView
  if (pathname === '/directory') return DirectoryView
  if (pathname.startsWith('/communities')) return CommunitiesView
  if (pathname === '/jobs') return JobsView
  if (pathname === '/events') return EventsView
  if (pathname === '/chat') return ChatView
  if (pathname === '/profile') return ProfileView
  if (pathname === '/safety') return SafetyView
  if (pathname === '/resources') return ResourcesView
  if (pathname === '/map') return MapView
  if (pathname === '/admin') return AdminView

  // Default to feed
  return FeedView
}

/**
 * HavenApp - Main SPA container.
 *
 * Handles:
 * - Auth state initialization and persistence
 * - Client-side routing with AnimatePresence transitions
 * - Lazy loading of view components
 * - Zero server roundtrips on navigation
 */
export function HavenApp() {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, isLoading, initialize, isAdmin } = useAuthStore()

  // Initialize auth on mount
  useEffect(() => {
    initialize()
  }, [initialize])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

  // Show skeleton during initial auth check
  if (isLoading) {
    return <AppSkeleton />
  }

  // Don't render if not authenticated (redirect in progress)
  if (!isAuthenticated) {
    return <AppSkeleton />
  }

  // Get current route config for admin check
  const currentRoute = getRouteForPath(pathname)

  // Redirect from admin if not admin
  if (currentRoute.adminOnly && !isAdmin) {
    router.push('/feed')
    return <AppSkeleton />
  }

  // Get the view component for current path
  const CurrentView = getViewForPath(pathname)

  return (
    <div className="min-h-screen bg-[var(--bg-main)]">
      {/* Sidebar (desktop) */}
      <Sidebar />

      {/* Top bar (mobile/tablet) */}
      <TopBar />

      {/* Main content with page transitions */}
      <main
        id="main-content"
        className="lg:ml-64 pt-16 lg:pt-0 pb-20 lg:pb-0 min-h-screen"
      >
        <AnimatePresence mode="wait">
          <PageTransition key={pathname}>
            <Suspense fallback={<ViewSkeleton />}>
              <CurrentView />
            </Suspense>
          </PageTransition>
        </AnimatePresence>
      </main>

      {/* Mobile navigation */}
      <MobileNav />
    </div>
  )
}
