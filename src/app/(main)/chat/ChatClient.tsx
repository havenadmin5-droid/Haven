"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, ArrowLeft, Send, Loader2, Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ConversationList } from "./ConversationList";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { sendMessage, markConversationRead, acceptDM, declineDM } from "./actions";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { Bloom } from "@/components/mascot";
import { getDisplayName, getDisplayAvatar } from "@/lib/utils/privacy";
import type { ConversationWithDetails, MessageWithSender } from "@/lib/types";

interface ChatClientProps {
  initialConversations: ConversationWithDetails[];
  currentUserId: string;
  isAnonymous: boolean;
  remainingMessages: number;
}

export function ChatClient({
  initialConversations,
  currentUserId,
  isAnonymous,
  remainingMessages: initialRemainingMessages,
}: ChatClientProps) {
  const [conversations, setConversations] = useState<ConversationWithDetails[]>(initialConversations);
  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [remainingMessages, setRemainingMessages] = useState(initialRemainingMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const selectedConvo = conversations.find((c) => c.id === selectedConvoId);

  // Typing indicator
  const { typingUsers, onInputChange, stopTyping } = useTypingIndicator(
    selectedConvoId,
    currentUserId,
    "User" // Would ideally be current user's username
  );

  // Get display info for other user in DM
  const getOtherUserDisplay = (convo: ConversationWithDetails) => {
    if (convo.type === "group") {
      return {
        name: convo.name || "Group Chat",
        emoji: convo.community?.avatar_emoji || "👥",
        avatar: null,
      };
    }

    const otherUser = convo.other_user;
    if (!otherUser) return { name: "Unknown", emoji: "👤", avatar: null };

    const displayName = otherUser.is_anonymous
      ? otherUser.anonymous_alias || "Anonymous"
      : getDisplayName({
          username: otherUser.username,
          is_anonymous: false,
          anonymous_alias: null,
        });

    const avatarUrl = otherUser.is_anonymous
      ? null
      : getDisplayAvatar({
          avatar_url: otherUser.avatar_url,
          show_photo: otherUser.show_photo,
          is_anonymous: false,
        });

    return {
      name: displayName,
      emoji: otherUser.avatar_emoji,
      avatar: avatarUrl,
    };
  };

  // Load messages for selected conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    setIsLoadingMessages(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("messages")
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
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      console.error("Load messages error:", error);
    } else {
      const messagesWithSender = (data ?? []).map((msg) => ({
        ...msg,
        sender: (Array.isArray(msg.sender) ? msg.sender[0] : msg.sender) as MessageWithSender["sender"],
      }));
      setMessages(messagesWithSender);
    }

    setIsLoadingMessages(false);

    // Mark as read
    await markConversationRead(conversationId);

    // Update unread count in conversations list
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId ? { ...c, unread_count: 0 } : c
      )
    );
  }, []);

  // Select conversation
  const handleSelectConversation = (convoId: string) => {
    setSelectedConvoId(convoId);
    loadMessages(convoId);
  };

  // Subscribe to new messages
  useEffect(() => {
    if (!selectedConvoId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`conversation_${selectedConvoId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedConvoId}`,
        },
        async (payload) => {
          // Fetch sender details
          const { data: sender } = await supabase
            .from("profiles")
            .select("id, username, avatar_emoji, avatar_url, show_photo, is_anonymous, anonymous_alias")
            .eq("id", payload.new.sender_id)
            .single();

          const newMessage: MessageWithSender = {
            ...(payload.new as MessageWithSender),
            sender: sender as MessageWithSender["sender"],
          };

          setMessages((prev) => [...prev, newMessage]);

          // Update conversation's last message
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
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConvoId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConvoId || isSending) return;

    // Check if DM is pending acceptance from current user
    if (selectedConvo?.type === "dm") {
      const myMembership = selectedConvo.members.find((m) => m.user_id === currentUserId);
      if (myMembership?.dm_status === "pending") {
        return;
      }
    }

    setIsSending(true);
    const content = messageInput.trim();
    setMessageInput("");
    stopTyping(); // Stop typing indicator when sending

    try {
      const result = await sendMessage(selectedConvoId, content);

      if (!result.success) {
        setMessageInput(content); // Restore on error
        console.error(result.error);
      } else if (result.message) {
        // Message will be added via realtime subscription
        if (isAnonymous) {
          setRemainingMessages((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      setMessageInput(content);
      console.error("Send error:", error);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  // Handle accept/decline DM
  const handleAcceptDM = async () => {
    if (!selectedConvoId) return;
    const result = await acceptDM(selectedConvoId);
    if (result.success) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConvoId
            ? {
                ...c,
                members: c.members.map((m) =>
                  m.user_id === currentUserId ? { ...m, dm_status: "accepted" as const } : m
                ),
              }
            : c
        )
      );
    }
  };

  const handleDeclineDM = async () => {
    if (!selectedConvoId) return;
    const result = await declineDM(selectedConvoId);
    if (result.success) {
      setConversations((prev) => prev.filter((c) => c.id !== selectedConvoId));
      setSelectedConvoId(null);
      setMessages([]);
    }
  };

  // Check if current user needs to accept DM
  const needsToAcceptDM =
    selectedConvo?.type === "dm" &&
    selectedConvo.members.find((m) => m.user_id === currentUserId)?.dm_status === "pending";

  // Check if waiting for other user to accept
  const waitingForAcceptance =
    selectedConvo?.type === "dm" &&
    selectedConvo.members.find((m) => m.user_id !== currentUserId)?.dm_status === "pending" &&
    selectedConvo.members.find((m) => m.user_id === currentUserId)?.dm_status === "accepted";

  return (
    <div className="flex h-[calc(100vh-8rem)] -mx-4 md:-mx-8">
      {/* Conversation List (left panel) */}
      <div
        className={`${
          selectedConvoId ? "hidden md:flex" : "flex"
        } w-full md:w-80 lg:w-96 flex-col border-r border-[var(--border-color)]`}
      >
        <div className="p-4 border-b border-[var(--border-color)]">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <MessageCircle className="text-[var(--sky)]" />
            Messages
          </h1>
        </div>

        <ConversationList
          conversations={conversations}
          selectedId={selectedConvoId}
          currentUserId={currentUserId}
          onSelect={handleSelectConversation}
          getOtherUserDisplay={getOtherUserDisplay}
        />
      </div>

      {/* Message Area (right panel) */}
      <div className={`${selectedConvoId ? "flex" : "hidden md:flex"} flex-1 flex-col`}>
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
                const display = getOtherUserDisplay(selectedConvo);
                return (
                  <>
                    {display.avatar ? (
                      <img
                        src={display.avatar}
                        alt={display.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-xl">
                        {display.emoji}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h2 className="font-bold truncate">{display.name}</h2>
                      {selectedConvo.type === "group" && (
                        <p className="text-xs text-[var(--text-muted)]">
                          {selectedConvo.members.length} members
                        </p>
                      )}
                    </div>
                  </>
                );
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
                    <Check size={16} />
                    Accept
                  </button>
                  <button onClick={handleDeclineDM} className="btn btn-secondary btn-sm">
                    <X size={16} />
                    Decline
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
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isOwn={msg.sender_id === currentUserId}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <Bloom mood="happy" size="md" className="mx-auto mb-4" />
                    <p className="text-[var(--text-muted)]">
                      No messages yet. Say hello!
                    </p>
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
                  {/* Typing indicator */}
                  {typingUsers.length > 0 && (
                    <TypingIndicator users={typingUsers} />
                  )}

                  <div className="flex gap-2">
                  <textarea
                    ref={inputRef}
                    value={messageInput}
                    onChange={(e) => {
                      setMessageInput(e.target.value);
                      onInputChange();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
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
                    {isSending ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
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
          /* No conversation selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Bloom mood="happy" size="lg" className="mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">Select a conversation</h3>
              <p className="text-[var(--text-muted)]">
                Choose a chat from the list to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
