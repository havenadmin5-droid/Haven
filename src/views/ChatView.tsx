'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
import { sendMessage, markConversationRead, acceptDM, declineDM } from '@/app/(main)/chat/actions'

/**
 * ChatView - Messages page for the SPA.
 * Handles real-time messaging with Supabase subscriptions.
 */
export function ChatView() {
  const { user, profile } = useAuthStore()
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([])
  const [isLoadingConversations, setIsLoadingConversations] = useState(true)
  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null)
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [remainingMessages, setRemainingMessages] = useState(20)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const currentUserId = user?.id ?? ''
  const isAnonymous = profile?.is_anonymous ?? false

  const selectedConvo = conversations.find((c) => c.id === selectedConvoId)

  // Typing indicator
  const { typingUsers, onInputChange, stopTyping } = useTypingIndicator(
    selectedConvoId,
    currentUserId,
    profile?.username ?? 'User'
  )

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      if (!currentUserId) return

      const supabase = createClient()
      const { data, error } = await supabase
        .from('conversation_members')
        .select(`
          conversation_id,
          dm_status,
          conversations!inner (
            id,
            type,
            name,
            community_id,
            updated_at,
            community:communities (
              id,
              name,
              avatar_emoji
            )
          )
        `)
        .eq('user_id', currentUserId)
        .order('conversations(updated_at)', { ascending: false })

      if (error) {
        console.error('Load conversations error:', error)
        setIsLoadingConversations(false)
        return
      }

      // Fetch additional details for each conversation
      const conversationsWithDetails = await Promise.all(
        (data ?? []).map(async (item: unknown) => {
          const typedItem = item as {
            conversation_id: string
            dm_status: string
            conversations: {
              id: string
              type: string
              name: string | null
              community_id: string | null
              updated_at: string
              community: { id: string; name: string; avatar_emoji: string } | null
            }
          }
          const conv = typedItem.conversations

          // Get members
          const { data: members } = await supabase
            .from('conversation_members')
            .select('user_id, dm_status')
            .eq('conversation_id', conv.id)

          // Get other user for DMs
          let other_user = null
          if (conv.type === 'dm') {
            const otherUserId = members?.find((m) => m.user_id !== currentUserId)?.user_id
            if (otherUserId) {
              const { data: otherProfile } = await supabase
                .from('profiles')
                .select('id, username, avatar_emoji, avatar_url, show_photo, is_anonymous, anonymous_alias')
                .eq('id', otherUserId)
                .single()
              other_user = otherProfile
            }
          }

          // Get last message
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('content, created_at, sender_id')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          // Get unread count
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', currentUserId)
            .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

          return {
            id: conv.id,
            type: conv.type as 'dm' | 'group',
            name: conv.name,
            community_id: conv.community_id,
            updated_at: conv.updated_at,
            community: conv.community,
            members: members ?? [],
            other_user,
            last_message: lastMsg,
            unread_count: unreadCount ?? 0,
          }
        })
      )

      setConversations(conversationsWithDetails)
      setIsLoadingConversations(false)
    }

    loadConversations()
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
  const loadMessages = useCallback(async (conversationId: string) => {
    setIsLoadingMessages(true)
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
      const messagesWithSender = (data ?? []).map((msg) => ({
        ...msg,
        sender: (Array.isArray(msg.sender) ? msg.sender[0] : msg.sender) as MessageWithSender['sender'],
      }))
      setMessages(messagesWithSender)
    }

    setIsLoadingMessages(false)
    await markConversationRead(conversationId)
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, unread_count: 0 } : c))
    )
  }, [])

  // Select conversation
  const handleSelectConversation = (convoId: string) => {
    setSelectedConvoId(convoId)
    loadMessages(convoId)
  }

  // Subscribe to new messages
  useEffect(() => {
    if (!selectedConvoId) return

    const supabase = createClient()
    const channel = supabase
      .channel(`conversation_${selectedConvoId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConvoId}`,
        },
        async (payload) => {
          const { data: sender } = await supabase
            .from('profiles')
            .select('id, username, avatar_emoji, avatar_url, show_photo, is_anonymous, anonymous_alias')
            .eq('id', payload.new.sender_id)
            .single()

          const newMessage: MessageWithSender = {
            ...(payload.new as MessageWithSender),
            sender: sender as MessageWithSender['sender'],
          }

          setMessages((prev) => [...prev, newMessage])
          setConversations((prev) =>
            prev.map((c) =>
              c.id === selectedConvoId
                ? {
                    ...c,
                    last_message: {
                      content: newMessage.content,
                      created_at: newMessage.created_at,
                      sender_id: newMessage.sender_id,
                    },
                    updated_at: newMessage.created_at,
                  }
                : c
            )
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedConvoId])

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
      } else if (result.message && isAnonymous) {
        setRemainingMessages((prev) => Math.max(0, prev - 1))
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

  if (isLoadingConversations) {
    return <ChatSkeleton />
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
            conversations.map((convo) => {
              const display = getOtherUserDisplay(convo)
              return (
                <button
                  key={convo.id}
                  onClick={() => handleSelectConversation(convo.id)}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-[var(--bg-hover)] transition-colors ${
                    selectedConvoId === convo.id ? 'bg-[var(--bg-hover)]' : ''
                  }`}
                >
                  {display.avatar ? (
                    <img src={display.avatar} alt={display.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-xl">
                      {display.emoji}
                    </div>
                  )}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">{display.name}</span>
                      {convo.unread_count > 0 && (
                        <span className="w-5 h-5 rounded-full bg-[var(--sky)] text-white text-xs flex items-center justify-center">
                          {convo.unread_count}
                        </span>
                      )}
                    </div>
                    {convo.last_message && (
                      <p className="text-sm text-[var(--text-muted)] truncate">
                        {convo.last_message.content}
                      </p>
                    )}
                  </div>
                </button>
              )
            })
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
                      <h2 className="font-bold truncate">{display.name}</h2>
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
              {waitingForAcceptance ? (
                <p className="text-center text-sm text-[var(--text-muted)]">
                  Message request sent. Waiting for response...
                </p>
              ) : needsToAcceptDM ? (
                <p className="text-center text-sm text-[var(--text-muted)]">
                  Accept the message request to reply
                </p>
              ) : (
                <>
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
                      placeholder="Type a message..."
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
                </>
              )}
              {isAnonymous && !needsToAcceptDM && !waitingForAcceptance && (
                <p className="text-xs text-[var(--text-muted)] mt-2 text-center">
                  {remainingMessages}/20 messages remaining today
                </p>
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
