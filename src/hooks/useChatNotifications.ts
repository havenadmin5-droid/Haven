'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { getPendingRequestsCount } from '@/app/(main)/chat/actions'

/**
 * Hook to track chat notifications (pending requests + unread messages).
 * Updates in realtime when new messages arrive.
 */
export function useChatNotifications() {
  const { user } = useAuthStore()
  const [pendingRequests, setPendingRequests] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const totalCount = pendingRequests + unreadMessages

  // Fetch initial counts
  useEffect(() => {
    const fetchCounts = async () => {
      if (!user?.id) {
        setIsLoading(false)
        return
      }

      try {
        // Get pending DM requests
        const requestsResult = await getPendingRequestsCount()
        if (requestsResult.success) {
          setPendingRequests(requestsResult.count ?? 0)
        }

        // Get unread messages count from conversation_members
        const supabase = createClient()
        const { data: memberships } = await supabase
          .from('conversation_members')
          .select('conversation_id, last_read_at')
          .eq('user_id', user.id)
          .eq('dm_status', 'accepted')

        if (memberships && memberships.length > 0) {
          // Count unread messages across all conversations
          let totalUnread = 0
          for (const membership of memberships) {
            const query = supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', membership.conversation_id)
              .neq('sender_id', user.id)

            if (membership.last_read_at) {
              query.gt('created_at', membership.last_read_at)
            }

            const { count } = await query
            totalUnread += count ?? 0
          }
          setUnreadMessages(totalUnread)
        }
      } catch (error) {
        console.error('Failed to fetch chat notifications:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCounts()
  }, [user?.id])

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user?.id) return

    const supabase = createClient()

    // Subscribe to new messages
    const channel = supabase
      .channel('chat_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          // Increment unread if message is not from current user
          if (payload.new.sender_id !== user.id) {
            setUnreadMessages((prev) => prev + 1)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_members',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // New DM request received
          if (payload.new.dm_status === 'pending') {
            setPendingRequests((prev) => prev + 1)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversation_members',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // DM request accepted - decrement pending count
          if (payload.old?.dm_status === 'pending' && payload.new.dm_status === 'accepted') {
            setPendingRequests((prev) => Math.max(0, prev - 1))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  // Function to clear unread count (call when user views chat)
  const clearUnread = () => {
    setUnreadMessages(0)
  }

  return {
    pendingRequests,
    unreadMessages,
    totalCount,
    isLoading,
    clearUnread,
  }
}
