'use client'

import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface Profile {
  id: string
  username: string | null
  avatar_emoji: string | null
  avatar_url: string | null
  role: string | null
  is_anonymous: boolean | null
  is_verified: boolean | null
  city: string | null
  profession: string | null
  theme_pref: string | null
}

/**
 * Client-side auth hook with React Query caching.
 * Provides instant access to cached auth state across navigations.
 */
export function useAuth() {
  const queryClient = useQueryClient()
  const [initialLoading, setInitialLoading] = useState(true)

  // Get user from Supabase (cached)
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      return user
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  // Get profile (cached, depends on user)
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['auth', 'profile', user?.id],
    queryFn: async () => {
      if (!user) return null
      const supabase = createClient()
      const { data } = await supabase
        .from('profiles')
        .select('id, username, avatar_emoji, avatar_url, role, is_anonymous, is_verified, city, profession, theme_pref')
        .eq('id', user.id)
        .single()
      return data as Profile | null
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  // Listen for auth state changes
  useEffect(() => {
    const supabase = createClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          queryClient.invalidateQueries({ queryKey: ['auth'] })
        } else if (event === 'SIGNED_OUT') {
          queryClient.setQueryData(['auth', 'user'], null)
          queryClient.setQueryData(['auth', 'profile'], null)
        }
        setInitialLoading(false)
      }
    )

    // Set initial loading to false after first check
    const timer = setTimeout(() => setInitialLoading(false), 100)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timer)
    }
  }, [queryClient])

  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'
  const isLoading = initialLoading || userLoading || (!!user && profileLoading)

  return {
    user,
    profile,
    isAdmin,
    isLoading,
    isAuthenticated: !!user,
  }
}

/**
 * Hook to prefetch auth data on app load.
 * Call this in a layout to ensure auth data is cached before navigation.
 */
export function usePrefetchAuth() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const prefetch = async () => {
      const supabase = createClient()

      // Prefetch user
      const { data: { user } } = await supabase.auth.getUser()
      queryClient.setQueryData(['auth', 'user'], user)

      // Prefetch profile if user exists
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, username, avatar_emoji, avatar_url, role, is_anonymous, is_verified, city, profession, theme_pref')
          .eq('id', user.id)
          .single()
        queryClient.setQueryData(['auth', 'profile', user.id], profile)
      }
    }

    prefetch()
  }, [queryClient])
}
