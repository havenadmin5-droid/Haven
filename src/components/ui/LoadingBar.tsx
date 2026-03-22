'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'

/**
 * LoadingBar - Fast, non-blocking progress indicator
 * Shows on route change, completes instantly when new route loads
 */
export function LoadingBar() {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)
  const previousPathRef = useRef(pathname)

  useEffect(() => {
    // If path changed, we've arrived - hide the loader
    if (pathname !== previousPathRef.current) {
      setIsLoading(false)
      previousPathRef.current = pathname
    }
  }, [pathname])

  // This component is now just a fallback - NavigationProgress handles the main loading
  // Keep it minimal to avoid double loading bars
  if (!isLoading) return null

  return null // Disabled - using NavigationProgress instead
}
