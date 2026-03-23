'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { MessageCircle, ArrowLeft, Send, Loader2, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { Bloom } from '@/components/mascot'
import { getDisplayName, getDisplayAvatar } from '@/lib/utils/privacy'
import { useTypingIndicator } from '@/hooks/useTypingIndicator'
import { containerVariants, itemVariants } from '@/components/app/PageTransition'
import type { ConversationWithDetails, MessageWithSender } from '@/lib/types'

// Import actions from the chat folder
import { sendMessage, markConversationRead, acceptDM, declineDM, startDM, loadConversations as loadConversationsAction, getChatProfile } from '@/app/(main)/chat/actions'

/**
 * ChatView - Messages page for the SPA.
 * Handles real-time messaging with Supabase subscriptions.
 */
export function ChatView() {
  const { user, profile } = useAuthStore()
  const searchParams = useSearchParams()
  const targetUserId = searchParams.get('user')

  const [conversations, setConversations] = useState<ConversationWithDetails[]>([])
  const [isLoadingConversations, setIsLoadingConversations] = useState(true)
  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null)
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [remainingMessages, setRemainingMessages] = useState(20)
  const [isStartingDM, setIsStartingDM] = useState(false)
  const [dmError, setDmError] = useState<string | null>(null)
  const [realtimeConnected, setRealtimeConnected] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const processedTargetUser = useRef<string | null>(null)

  const currentUserId = user?.id ?? ''
  const isAnonymous = profile?.is_anonymous ?? false

  const selectedConvo = conversations.find((c) => c.id === selectedConvoId)

  // Typing indicator
  const { typingUsers, onInputChange, stopTyping } = useTypingIndicator(
    selectedConvoId,
    currentUserId,
    profile?.username ?? 'User'
  )

  // Load conversations using server action (bypasses RLS)
  useEffect(() => {
    const fetchConversations = async () => {
      if (!currentUserId) return

      const result = await loadConversationsAction()

      if (!result.success || !result.conversations) {
        console.error('Load conversations error:', result.error)
        setIsLoadingConversations(false)
        return
      }

      // Transform server action response to ConversationWithDetails format
      const conversationsWithDetails: ConversationWithDetails[] = result.conversations.map((conv) => ({
        id: conv.id,
        type: conv.type,
        name: conv.name,
        community_id: null,
        updated_at: conv.last_message?.created_at ?? new Date().toISOString(),
        community: null,
        members: [
          { user_id: currentUserId, dm_status: conv.dm_status },
          ...(conv.other_user ? [{ user_id: conv.other_user.id, dm_status: conv.other_dm_status ?? 'accepted' }] : []),
        ],
        other_user: conv.other_user ?? null,
        last_message: conv.last_message ? {
          content: conv.last_message.content,
          created_at: conv.last_message.created_at,
          sender_id: conv.last_message.sender_id,
        } : null,
        unread_count: conv.unread_count,
      }))

      setConversations(conversationsWithDetails)
      setIsLoadingConversations(false)
    }

    fetchConversations()
  }, [currentUserId])

  // Get display info for other user in DM
  const getOtherUserDisplay = (convo: ConversationWithDetails) => {
    if (convo.type === 'group') {
      return {
        name: convo.name || 'Group Chat',
        emoji: convo.community?.avatar_emoji || '👥',
        avatar: null,
      }
    }

    const otherUser = convo.other_user
    if (!otherUser) return { name: 'Unknown', emoji: '👤', avatar: null }

    const displayName = otherUser.is_anonymous
      ? otherUser.anonymous_alias || 'Anonymous'
      : getDisplayName({
          username: otherUser.username,
          is_anonymous: false,
          anonymous_alias: null,
        })

    const avatarUrl = otherUser.is_anonymous
      ? null
      : getDisplayAvatar({
          avatar_url: otherUser.avatar_url,
          show_photo: otherUser.show_photo,
          is_anonymous: false,
        })

    return {
      name: displayName,
      emoji: otherUser.avatar_emoji,
      avatar: avatarUrl,
    }
  }

  // Load messages for selected conversation
  const loadMessages = useCallback(async (conversationId: string, isInitialLoad = false) => {
    if (isInitialLoad) {
      setIsLoadingMessages(true)
    }
    const supabase = createClient()

    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        image_url,
        is_system,
        created_at,
        sender:profiles!messages_sender_id_fkey (
          id,
          username,
          avatar_emoji,
          avatar_url,
          show_photo,
          is_anonymous,
          anonymous_alias
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(100)

    if (error) {
      console.error('Load messages error:', error)
    } else {
      const newMessages = (data ?? []).map((msg) => ({
        ...msg,
        sender: (Array.isArray(msg.sender) ? msg.sender[0] : msg.sender) as MessageWithSender['sender'],
      }))

      // Merge with existing messages to preserve optimistic updates
      setMessages((prevMessages) => {
        // Create a map of existing messages by ID
        const existingMap = new Map(prevMessages.map(m => [m.id, m]))

        // Add all new messages, updating existing ones
        newMessages.forEach(msg => {
          existingMap.set(msg.id, msg)
        })

        // Convert back to array and sort by created_at
        const merged = Array.from(existingMap.values())
        merged.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

        return merged
      })
    }

    if (isInitialLoad) {
      setIsLoadingMessages(false)
    }
    await markConversationRead(conversationId)
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, unread_count: 0 } : c))
    )
  }, [])

  // Handle ?user= query parameter to start or open a DM
  useEffect(() => {
    const handleStartDM = async () => {
      // Skip if no target user, not loaded, or already processed this user
      if (!targetUserId || !currentUserId || isLoadingConversations) return
      if (processedTargetUser.current === targetUserId) return

      // Mark as processed to prevent re-running
      processedTargetUser.current = targetUserId

      // Don't try to DM yourself
      if (targetUserId === currentUserId) {
        setDmError("You can't message yourself")
        return
      }

      setIsStartingDM(true)
      setDmError(null)

      try {
        const result = await startDM(targetUserId)

        if (result.success && result.conversationId) {
          // Use server action to get profile (bypasses RLS)
          const profileResult = await getChatProfile(targetUserId)

          if (profileResult.success && profileResult.profile) {
            const otherProfile = profileResult.profile
            const newConvo: ConversationWithDetails = {
              id: result.conversationId,
              type: 'dm',
              name: null,
              community_id: null,
              updated_at: new Date().toISOString(),
              community: null,
              members: [
                { user_id: currentUserId, dm_status: 'accepted' },
                { user_id: targetUserId, dm_status: result.isNew ? 'pending' : 'accepted' }
              ],
              other_user: otherProfile,
              last_message: null,
              unread_count: 0,
            }

            // Add to conversations if not already there
            setConversations(prev => {
              const exists = prev.find(c => c.id === result.conversationId)
              return exists ? prev : [newConvo, ...prev]
            })
            setSelectedConvoId(result.conversationId)
            loadMessages(result.conversationId, true)
          } else {
            setDmError(profileResult.error ?? 'Failed to load user profile')
          }
        } else {
          setDmError(result.error ?? 'Failed to start conversation')
        }
      } catch (error) {
        console.error('Start DM error:', error)
        setDmError('Failed to start conversation')
      } finally {
        setIsStartingDM(false)
      }
    }

    handleStartDM()
  }, [targetUserId, currentUserId, isLoadingConversations, loadMessages])

  // Select conversation
  const handleSelectConversation = (convoId: string) => {
    setSelectedConvoId(convoId)
    setMessages([]) // Clear old messages first
    loadMessages(convoId, true)
  }

  // Store channel reference for broadcasting
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelRef = useRef<any>(null)

  // Subscribe to conversation via Supabase Realtime broadcast (WebSocket)
  // Using broadcast instead of postgres_changes for more reliable real-time messaging
  useEffect(() => {
    if (!selectedConvoId || !currentUserId) return

    const supabase = createClient()
    let isSubscribed = true

    // Use a consistent channel name for all users in this conversation
    const channelName = `chat:${selectedConvoId}`

    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false }, // Don't receive own broadcasts
      },
    })

    // Listen for broadcast messages
    channel.on('broadcast', { event: 'new_message' }, (payload) => {
      if (!isSubscribed) return

      const message = payload.payload as MessageWithSender
      console.log('📨 Broadcast received:', message.id)

      // Skip if message is from current user
      if (message.sender_id === currentUserId) return

      setMessages((prev) => {
        if (prev.some(m => m.id === message.id)) return prev
        const updated = [...prev, message]
        updated.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        return updated
      })

      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConvoId
            ? {
                ...c,
                last_message: {
                  content: message.content,
                  created_at: message.created_at,
                  sender_id: message.sender_id,
                },
                updated_at: message.created_at,
              }
            : c
        )
      )
    })

    channel.subscribe((status, err) => {
      if (!isSubscribed) return

      console.log('🔌 Realtime status:', status, err ? `Error: ${err.message}` : '')

      if (status === 'SUBSCRIBED') {
        console.log('✅ WebSocket connected to conversation:', selectedConvoId)
        setRealtimeConnected(true)
        channelRef.current = channel
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Realtime channel error:', err)
        setRealtimeConnected(false)
      } else if (status === 'TIMED_OUT') {
        console.warn('⏱️ Realtime timed out')
        setRealtimeConnected(false)
      } else if (status === 'CLOSED') {
        console.log('🔌 Realtime connection closed')
        setRealtimeConnected(false)
      }
    })

    return () => {
      isSubscribed = false
      channelRef.current = null
      supabase.removeChannel(channel)
      setRealtimeConnected(false)
    }
  }, [selectedConvoId, currentUserId])

  // Light fallback polling only when realtime fails (30s interval)
  useEffect(() => {
    if (!selectedConvoId || realtimeConnected) return

    console.log('Realtime not connected, using fallback polling')
    const pollInterval = setInterval(() => {
      loadMessages(selectedConvoId)
    }, 30000) // Only poll every 30s as fallback

    return () => clearInterval(pollInterval)
  }, [selectedConvoId, realtimeConnected, loadMessages])

  // Global subscription for new messages across all conversations (for notification badges)
  useEffect(() => {
    if (!currentUserId || conversations.length === 0) return

    const supabase = createClient()
    const conversationIds = conversations.map(c => c.id)

    // Subscribe to messages in all user's conversations
    const channel = supabase
      .channel(`global_messages:${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const messageConvoId = payload.new.conversation_id
          // Only process if it's one of user's conversations and not from current user
          if (!conversationIds.includes(messageConvoId)) return
          if (payload.new.sender_id === currentUserId) return

          // Update unread count for that conversation (if not currently selected)
          if (messageConvoId !== selectedConvoId) {
            setConversations((prev) =>
              prev.map((c) =>
                c.id === messageConvoId
                  ? {
                      ...c,
                      last_message: {
                        content: payload.new.content,
                        created_at: payload.new.created_at,
                        sender_id: payload.new.sender_id,
                      },
                      unread_count: c.unread_count + 1,
                      updated_at: payload.new.created_at,
                    }
                  : c
              )
            )
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Global notifications subscription active')
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, conversations.length, selectedConvoId])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Send message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConvoId || isSending) return

    if (selectedConvo?.type === 'dm') {
      const myMembership = selectedConvo.members.find((m) => m.user_id === currentUserId)
      if (myMembership?.dm_status === 'pending') return
    }

    setIsSending(true)
    const content = messageInput.trim()
    setMessageInput('')
    stopTyping()

    try {
      const result = await sendMessage(selectedConvoId, content)
      if (!result.success) {
        setMessageInput(content)
        console.error(result.error)
      } else if (result.message) {
        // Add sent message to UI immediately
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some(m => m.id === result.message!.id)) return prev
          return [...prev, result.message!]
        })

        // Update conversation's last message
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedConvoId
              ? {
                  ...c,
                  last_message: {
                    content: result.message!.content,
                    created_at: result.message!.created_at,
                    sender_id: result.message!.sender_id,
                  },
                  updated_at: result.message!.created_at,
                }
              : c
          )
        )

        // Broadcast the message to other users via WebSocket
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'new_message',
            payload: result.message,
          })
          console.log('📤 Message broadcasted:', result.message.id)
        }

        if (isAnonymous) {
          setRemainingMessages((prev) => Math.max(0, prev - 1))
        }
      } else {
        // Success but no message returned - reload to get it
        await loadMessages(selectedConvoId)
      }
    } catch (error) {
      setMessageInput(content)
      console.error('Send error:', error)
    } finally {
      setIsSending(false)
      inputRef.current?.focus()
    }
  }

  // Handle accept/decline DM
  const handleAcceptDM = async () => {
    if (!selectedConvoId) return
    const result = await acceptDM(selectedConvoId)
    if (result.success) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConvoId
            ? {
                ...c,
                members: c.members.map((m) =>
                  m.user_id === currentUserId ? { ...m, dm_status: 'accepted' as const } : m
                ),
              }
            : c
        )
      )
    }
  }

  const handleDeclineDM = async () => {
    if (!selectedConvoId) return
    const result = await declineDM(selectedConvoId)
    if (result.success) {
      setConversations((prev) => prev.filter((c) => c.id !== selectedConvoId))
      setSelectedConvoId(null)
      setMessages([])
    }
  }

  const needsToAcceptDM =
    selectedConvo?.type === 'dm' &&
    selectedConvo.members.find((m) => m.user_id === currentUserId)?.dm_status === 'pending'

  const waitingForAcceptance =
    selectedConvo?.type === 'dm' &&
    selectedConvo.members.find((m) => m.user_id !== currentUserId)?.dm_status === 'pending' &&
    selectedConvo.members.find((m) => m.user_id === currentUserId)?.dm_status === 'accepted'

  if (isLoadingConversations || isStartingDM) {
    return <ChatSkeleton />
  }

  // Show DM error if any
  if (dmError) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="text-center">
          <Bloom mood="wink" size="lg" className="mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2">Oops!</h3>
          <p className="text-[var(--text-muted)] mb-4">{dmError}</p>
          <button
            onClick={() => setDmError(null)}
            className="btn btn-ghost"
          >
            Go back to messages
          </button>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className="flex h-[calc(100vh-8rem)] -mx-4 md:-mx-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Conversation List */}
      <motion.div
        variants={itemVariants}
        className={`${
          selectedConvoId ? 'hidden md:flex' : 'flex'
        } w-full md:w-80 lg:w-96 flex-col border-r border-[var(--border-color)]`}
      >
        <div className="p-4 border-b border-[var(--border-color)]">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <MessageCircle className="text-[var(--sky)]" />
            Messages
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center">
              <Bloom mood="happy" size="md" className="mx-auto mb-2" />
              <p className="text-[var(--text-muted)] text-sm">No conversations yet</p>
            </div>
          ) : (
            <>
              {/* Separate pending message requests */}
              {conversations.some((c) => c.members.find((m) => m.user_id === currentUserId)?.dm_status === 'pending') && (
                <div className="px-4 py-2 bg-[var(--amber)]/10 border-b border-[var(--amber)]/20">
                  <p className="text-xs font-medium text-[var(--amber)]">Message Requests</p>
                </div>
              )}
              {conversations.map((convo) => {
                const display = getOtherUserDisplay(convo)
                const myMembership = convo.members.find((m) => m.user_id === currentUserId)
                const isPendingRequest = myMembership?.dm_status === 'pending'
                const isWaitingForResponse = convo.type === 'dm' &&
                  myMembership?.dm_status === 'accepted' &&
                  convo.members.find((m) => m.user_id !== currentUserId)?.dm_status === 'pending'

                return (
                  <button
                    key={convo.id}
                    onClick={() => handleSelectConversation(convo.id)}
                    className={`w-full flex items-center gap-3 p-4 hover:bg-[var(--bg-hover)] transition-colors ${
                      selectedConvoId === convo.id ? 'bg-[var(--bg-hover)]' : ''
                    } ${isPendingRequest ? 'bg-[var(--amber)]/5' : ''}`}
                  >
                    <div className="relative">
                      {display.avatar ? (
                        <img src={display.avatar} alt={display.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-xl">
                          {display.emoji}
                        </div>
                      )}
                      {isPendingRequest && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--amber)] flex items-center justify-center">
                          <span className="text-white text-[10px]">!</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate">{display.name}</span>
                        {convo.unread_count > 0 && !isPendingRequest && (
                          <span className="w-5 h-5 rounded-full bg-[var(--sky)] text-white text-xs flex items-center justify-center">
                            {convo.unread_count}
                          </span>
                        )}
                      </div>
                      {isPendingRequest ? (
                        <p className="text-sm text-[var(--amber)] truncate">
                          Wants to message you
                        </p>
                      ) : isWaitingForResponse ? (
                        <p className="text-sm text-[var(--text-muted)] truncate italic">
                          Request sent
                        </p>
                      ) : convo.last_message ? (
                        <p className="text-sm text-[var(--text-muted)] truncate">
                          {convo.last_message.content}
                        </p>
                      ) : (
                        <p className="text-sm text-[var(--text-muted)] truncate">
                          Start a conversation
                        </p>
                      )}
                    </div>
                  </button>
                )
              })}
            </>
          )}
        </div>
      </motion.div>

      {/* Message Area */}
      <motion.div
        variants={itemVariants}
        className={`${selectedConvoId ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}
      >
        {selectedConvo ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-[var(--border-color)]">
              <button
                onClick={() => setSelectedConvoId(null)}
                className="md:hidden p-2 rounded-lg hover:bg-[var(--bg-hover)]"
              >
                <ArrowLeft size={20} />
              </button>
              {(() => {
                const display = getOtherUserDisplay(selectedConvo)
                return (
                  <>
                    {display.avatar ? (
                      <img src={display.avatar} alt={display.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-xl">
                        {display.emoji}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="font-bold truncate">{display.name}</h2>
                        {/* Connection status indicator */}
                        <div
                          className={`w-2 h-2 rounded-full ${realtimeConnected ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`}
                          title={realtimeConnected ? 'Live connection' : 'Connecting...'}
                        />
                      </div>
                      {selectedConvo.type === 'group' && (
                        <p className="text-xs text-[var(--text-muted)]">{selectedConvo.members.length} members</p>
                      )}
                    </div>
                  </>
                )
              })()}
            </div>

            {/* DM Acceptance Banner */}
            {needsToAcceptDM && (
              <div className="p-4 bg-[var(--amber)]/10 border-b border-[var(--amber)]/20">
                <p className="text-sm mb-3">
                  <strong>{getOtherUserDisplay(selectedConvo).name}</strong> wants to message you
                </p>
                <div className="flex gap-2">
                  <button onClick={handleAcceptDM} className="btn btn-brand btn-sm">
                    <Check size={16} /> Accept
                  </button>
                  <button onClick={handleDeclineDM} className="btn btn-secondary btn-sm">
                    <X size={16} /> Decline
                  </button>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="animate-spin text-[var(--text-muted)]" size={32} />
                </div>
              ) : messages.length > 0 ? (
                <>
                  {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} isOwn={msg.sender_id === currentUserId} />
                  ))}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <Bloom mood="happy" size="md" className="mx-auto mb-4" />
                    <p className="text-[var(--text-muted)]">No messages yet. Say hello!</p>
                  </div>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-[var(--border-color)]">
              {needsToAcceptDM ? (
                <p className="text-center text-sm text-[var(--text-muted)]">
                  Accept the message request to reply
                </p>
              ) : (
                <>
                  {/* Waiting for acceptance banner (but still allow sending) */}
                  {waitingForAcceptance && (
                    <div className="text-center pb-3 mb-3 border-b border-[var(--border-color)]">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--amber)]/10 text-[var(--amber)]">
                        <div className="w-2 h-2 rounded-full bg-[var(--amber)] animate-pulse" />
                        <span className="text-xs font-medium">
                          Waiting for {getOtherUserDisplay(selectedConvo).name} to accept
                        </span>
                      </div>
                    </div>
                  )}
                  {typingUsers.length > 0 && (
                    <div className="text-xs text-[var(--text-muted)] mb-2">
                      {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                    </div>
                  )}
                  <div className="flex gap-2">
                    <textarea
                      ref={inputRef}
                      value={messageInput}
                      onChange={(e) => {
                        setMessageInput(e.target.value)
                        onInputChange()
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      placeholder={waitingForAcceptance ? "Say hello..." : "Type a message..."}
                      rows={1}
                      className="flex-1 resize-none max-h-32"
                      disabled={isSending}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={isSending || !messageInput.trim()}
                      className="btn btn-brand px-4"
                    >
                      {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                  </div>
                  {isAnonymous && (
                    <p className="text-xs text-[var(--text-muted)] mt-2 text-center">
                      {remainingMessages}/20 messages remaining today
                    </p>
                  )}
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Bloom mood="happy" size="lg" className="mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">Select a conversation</h3>
              <p className="text-[var(--text-muted)]">Choose a chat from the list to start messaging</p>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

function MessageBubble({ message, isOwn }: { message: MessageWithSender; isOwn: boolean }) {
  const displayName = message.sender?.is_anonymous
    ? message.sender.anonymous_alias || 'Anonymous'
    : message.sender?.username || 'Unknown'

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${isOwn ? 'order-2' : ''}`}>
        {!isOwn && (
          <p className="text-xs text-[var(--text-muted)] mb-1 ml-1">{displayName}</p>
        )}
        <div
          className={`p-3 rounded-2xl ${
            isOwn
              ? 'bg-[var(--sky)] text-white rounded-br-md'
              : 'bg-[var(--bg-secondary)] rounded-bl-md'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        </div>
      </div>
    </div>
  )
}

function ChatSkeleton() {
  return (
    <div className="flex h-[calc(100vh-8rem)] -mx-4 md:-mx-8 animate-pulse">
      <div className="w-full md:w-80 lg:w-96 border-r border-[var(--border-color)]">
        <div className="p-4 border-b border-[var(--border-color)]">
          <div className="h-6 w-32 bg-[var(--bg-hover)] rounded" />
        </div>
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--bg-hover)]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-[var(--bg-hover)] rounded" />
                <div className="h-3 w-32 bg-[var(--bg-hover)] rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="hidden md:flex flex-1 items-center justify-center">
        <div className="h-24 w-24 bg-[var(--bg-hover)] rounded-xl" />
      </div>
    </div>
  )
}
