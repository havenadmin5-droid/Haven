'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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
  bio: string | null
  skills: string[] | null
  pronouns: string | null
}

interface AuthState {
  user: User | null
  profile: Profile | null
  isAuthenticated: boolean
  isLoading: boolean
  isAdmin: boolean

  // Actions
  initialize: () => Promise<void>
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

/**
 * Zustand auth store with localStorage persistence.
 * This enables instant auth state on page load without server roundtrip.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      isAuthenticated: false,
      isLoading: true,
      isAdmin: false,

      initialize: async () => {
        try {
          const supabase = createClient()
          const { data: { user } } = await supabase.auth.getUser()

          if (user) {
            // Fetch profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, username, avatar_emoji, avatar_url, role, is_anonymous, is_verified, city, profession, theme_pref, bio, skills, pronouns')
              .eq('id', user.id)
              .single()

            const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'

            set({
              user,
              profile,
              isAuthenticated: true,
              isLoading: false,
              isAdmin,
            })
          } else {
            set({
              user: null,
              profile: null,
              isAuthenticated: false,
              isLoading: false,
              isAdmin: false,
            })
          }
        } catch (error) {
          console.error('Auth initialization error:', error)
          set({ isLoading: false })
        }
      },

      setUser: (user) => {
        set({ user, isAuthenticated: !!user })
      },

      setProfile: (profile) => {
        const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'
        set({ profile, isAdmin })
      },

      logout: async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        set({
          user: null,
          profile: null,
          isAuthenticated: false,
          isAdmin: false,
        })
      },

      refreshProfile: async () => {
        const { user } = get()
        if (!user) return

        const supabase = createClient()
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, username, avatar_emoji, avatar_url, role, is_anonymous, is_verified, city, profession, theme_pref, bio, skills, pronouns')
          .eq('id', user.id)
          .single()

        if (profile) {
          const isAdmin = profile.role === 'admin' || profile.role === 'super_admin'
          set({ profile, isAdmin })
        }
      },
    }),
    {
      name: 'haven-auth',
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin,
      }),
    }
  )
)

// Auto-initialize on client side
if (typeof window !== 'undefined') {
  // Set up auth state listener
  const supabase = createClient()
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      useAuthStore.getState().initialize()
    } else if (event === 'SIGNED_OUT') {
      useAuthStore.setState({
        user: null,
        profile: null,
        isAuthenticated: false,
        isAdmin: false,
      })
    }
  })
}
