'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './useAuth'
import { maskProfileForPublic } from '@/lib/utils/privacy'
import type { PostWithAuthor, CommunityWithMembership, PublicProfile } from '@/lib/types'

/**
 * Hook to fetch feed posts client-side with caching.
 * Returns cached data immediately on subsequent navigations.
 */
export function useFeedPosts() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['feed', 'posts', user?.id],
    queryFn: async () => {
      if (!user) return []

      const supabase = createClient()

      // Get user's community memberships
      const { data: memberships } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('user_id', user.id)
        .eq('status', 'active')

      const communityIds = memberships?.map((m) => m.community_id) ?? []

      // Build posts query
      let postsQuery = supabase
        .from('posts')
        .select(`
          id,
          author_id,
          community_id,
          content,
          image_urls,
          is_anonymous,
          is_flagged,
          is_hidden,
          reaction_count,
          comment_count,
          created_at,
          updated_at,
          author:profiles!posts_author_id_fkey (
            id,
            username,
            avatar_emoji,
            avatar_url,
            show_photo,
            is_anonymous,
            anonymous_alias,
            is_verified
          ),
          community:communities (
            id,
            name,
            slug,
            avatar_emoji
          )
        `)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .limit(30)

      // Filter to user's communities or global
      if (communityIds.length > 0) {
        postsQuery = postsQuery.or(`community_id.is.null,community_id.in.(${communityIds.join(',')})`)
      } else {
        postsQuery = postsQuery.is('community_id', null)
      }

      const { data: posts } = await postsQuery

      // Fetch user's reactions
      const postIds = (posts ?? []).map((p) => p.id)
      const userReactions: Map<string, number[]> = new Map()

      if (postIds.length > 0) {
        const { data: reactions } = await supabase
          .from('post_reactions')
          .select('post_id, reaction_type')
          .eq('user_id', user.id)
          .in('post_id', postIds)

        reactions?.forEach((r) => {
          const existing = userReactions.get(r.post_id) ?? []
          existing.push(r.reaction_type)
          userReactions.set(r.post_id, existing)
        })
      }

      // Transform posts
      const postsWithAuthor: PostWithAuthor[] = (posts ?? []).map((post) => {
        const authorData = Array.isArray(post.author) ? post.author[0] : post.author
        const communityData = Array.isArray(post.community) ? post.community[0] : post.community
        return {
          id: post.id,
          author_id: post.author_id,
          community_id: post.community_id,
          content: post.content,
          image_urls: post.image_urls ?? [],
          is_anonymous: post.is_anonymous,
          is_flagged: post.is_flagged,
          is_hidden: post.is_hidden,
          reaction_count: post.reaction_count,
          comment_count: post.comment_count,
          created_at: post.created_at,
          updated_at: post.updated_at,
          author: authorData as PostWithAuthor['author'],
          community: communityData as PostWithAuthor['community'],
          user_reactions: userReactions.get(post.id) ?? [],
        }
      })

      return postsWithAuthor
    },
    enabled: !!user,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to fetch directory profiles client-side with caching.
 * Returns masked profiles for privacy.
 */
export function useDirectoryProfiles(): { data: PublicProfile[] | undefined; isLoading: boolean } {
  const result = useQuery({
    queryKey: ['directory', 'profiles'],
    queryFn: async () => {
      const supabase = createClient()

      const { data: profiles } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          avatar_emoji,
          avatar_url,
          show_photo,
          real_name,
          show_real_name,
          city,
          profession,
          bio,
          skills,
          is_verified,
          is_available,
          is_anonymous,
          anonymous_alias,
          pronouns
        `)
        .eq('is_banned', false)
        .is('deleted_at', null)
        .order('is_verified', { ascending: false })
        .order('is_available', { ascending: false })
        .limit(50)

      // Apply privacy masking
      const maskedProfiles = (profiles ?? []).map((p) => maskProfileForPublic(p))
      return maskedProfiles
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,
  })

  return { data: result.data, isLoading: result.isLoading }
}

/**
 * Hook to fetch communities client-side with caching.
 */
export function useCommunities() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['communities', 'list', user?.id],
    queryFn: async () => {
      const supabase = createClient()

      // Parallel fetch: communities and user memberships
      const [communitiesResult, membershipsResult] = await Promise.all([
        supabase
          .from('communities')
          .select(`
            id,
            name,
            slug,
            description,
            tag,
            avatar_emoji,
            color,
            is_private,
            member_count,
            created_by,
            created_at
          `)
          .order('member_count', { ascending: false })
          .limit(50),
        user
          ? supabase
              .from('community_members')
              .select('community_id, role')
              .eq('user_id', user.id)
              .eq('status', 'active')
          : Promise.resolve({ data: null }),
      ])

      // Build membership lookup
      const userMemberships = new Set<string>()
      const memberRoles = new Map<string, string>()

      membershipsResult.data?.forEach((m) => {
        userMemberships.add(m.community_id)
        memberRoles.set(m.community_id, m.role)
      })

      // Transform communities with membership info
      const communities: CommunityWithMembership[] = (communitiesResult.data ?? []).map((c) => ({
        ...c,
        is_member: userMemberships.has(c.id),
        member_role: memberRoles.get(c.id) as CommunityWithMembership['member_role'],
      }))

      return communities
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to fetch jobs client-side with caching.
 */
export function useJobsList() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['jobs', 'list', user?.id],
    queryFn: async () => {
      const supabase = createClient()

      // Parallel fetch: jobs and saved jobs
      const [jobsResult, savedJobsResult] = await Promise.all([
        supabase
          .from('jobs')
          .select(`
            id,
            posted_by,
            title,
            company,
            description,
            city,
            job_type,
            is_remote,
            salary_range,
            tags,
            apply_url,
            apply_email,
            is_active,
            expires_at,
            created_at,
            poster:profiles!jobs_posted_by_fkey (
              id,
              username,
              avatar_emoji,
              avatar_url,
              show_photo,
              is_anonymous,
              is_verified
            )
          `)
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(50),
        user
          ? supabase
              .from('job_saves')
              .select('job_id')
              .eq('user_id', user.id)
          : Promise.resolve({ data: null }),
      ])

      const savedJobIds = new Set(savedJobsResult.data?.map((s) => s.job_id) ?? [])

      // Transform jobs with saved status
      const jobs = (jobsResult.data ?? []).map((job) => {
        const posterData = Array.isArray(job.poster) ? job.poster[0] : job.poster
        return {
          ...job,
          tags: job.tags ?? [],
          poster: posterData,
          is_saved: savedJobIds.has(job.id),
        }
      })

      return jobs
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to fetch events client-side with caching.
 */
export function useEvents() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['events', 'list', user?.id],
    queryFn: async () => {
      const supabase = createClient()

      const [eventsResult, rsvpsResult] = await Promise.all([
        supabase
          .from('events')
          .select(`
            id,
            title,
            description,
            location,
            is_online,
            event_url,
            start_time,
            end_time,
            capacity,
            attendee_count,
            cover_url,
            created_by,
            community_id,
            is_featured,
            status,
            created_at,
            organizer:profiles!events_created_by_fkey (
              id,
              username,
              avatar_emoji,
              is_verified
            ),
            community:communities (
              id,
              name,
              slug,
              avatar_emoji
            )
          `)
          .eq('status', 'published')
          .gte('end_time', new Date().toISOString())
          .order('start_time', { ascending: true })
          .limit(50),
        user
          ? supabase
              .from('event_rsvps')
              .select('event_id, status')
              .eq('user_id', user.id)
          : Promise.resolve({ data: null }),
      ])

      // Build RSVP lookup
      const userRsvps = new Map<string, string>()
      rsvpsResult.data?.forEach((r) => {
        userRsvps.set(r.event_id, r.status)
      })

      // Transform events with RSVP info
      const events = (eventsResult.data ?? []).map((e) => ({
        ...e,
        user_rsvp_status: userRsvps.get(e.id),
      }))

      return events
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}
