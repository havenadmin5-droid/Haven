import { ComponentType } from 'react'

// Lazy import views to be defined
// These will be dynamically imported in HavenApp

export interface RouteConfig {
  path: string
  name: string
  icon: string
  color: string
  adminOnly?: boolean
}

/**
 * Route configuration for the main app.
 * Maps paths to view names, icons, and colors.
 */
export const routes: RouteConfig[] = [
  { path: '/feed', name: 'Feed', icon: 'Rss', color: 'var(--teal)' },
  { path: '/directory', name: 'Directory', icon: 'Users', color: 'var(--violet)' },
  { path: '/communities', name: 'Communities', icon: 'Heart', color: 'var(--teal)' },
  { path: '/jobs', name: 'Jobs', icon: 'Briefcase', color: 'var(--rose)' },
  { path: '/events', name: 'Events', icon: 'Calendar', color: 'var(--amber)' },
  { path: '/chat', name: 'Messages', icon: 'MessageCircle', color: 'var(--sky)' },
  { path: '/map', name: 'Map', icon: 'Map', color: 'var(--teal)' },
  { path: '/resources', name: 'Resources', icon: 'BookOpen', color: 'var(--lavender)' },
  { path: '/profile', name: 'Profile', icon: 'User', color: 'var(--peach)' },
  { path: '/safety', name: 'Safety', icon: 'Shield', color: 'var(--mint)' },
  { path: '/admin', name: 'Admin', icon: 'Settings', color: 'var(--rose)', adminOnly: true },
]

/**
 * Get route config for a given pathname.
 * Returns Feed route as default.
 */
export function getRouteForPath(pathname: string): RouteConfig {
  // Check for exact match first
  const exactMatch = routes.find(r => r.path === pathname)
  if (exactMatch) return exactMatch

  // Check for prefix match (for nested routes like /communities/[slug])
  const prefixMatch = routes.find(r => pathname.startsWith(r.path + '/'))
  if (prefixMatch) return prefixMatch

  // Default to feed
  return routes[0]!
}

/**
 * Get the view name for a pathname.
 * Used for dynamic view loading.
 */
export function getViewNameForPath(pathname: string): string {
  const route = getRouteForPath(pathname)
  return route.name.replace(/\s+/g, '')
}
