"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface TypingUser {
  id: string;
  username: string;
}

export function useTypingIndicator(
  conversationId: string | null,
  currentUserId: string,
  currentUsername: string
) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  // Set up presence channel
  useEffect(() => {
    if (!conversationId) {
      setTypingUsers([]);
      return;
    }

    const supabase = createClient();

    const channel = supabase.channel(`typing:${conversationId}`, {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const typing: TypingUser[] = [];

        Object.entries(state).forEach(([userId, presence]) => {
          if (userId !== currentUserId) {
            const presenceData = presence[0] as { typing?: boolean; username?: string };
            if (presenceData?.typing) {
              typing.push({
                id: userId,
                username: presenceData.username || "Someone",
              });
            }
          }
        });

        setTypingUsers(typing);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // Initial presence
          await channel.track({
            typing: false,
            username: currentUsername,
          });
        }
      });

    channelRef.current = channel;

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId, currentUserId, currentUsername]);

  // Start typing
  const startTyping = useCallback(async () => {
    if (!channelRef.current || isTypingRef.current) return;

    isTypingRef.current = true;

    await channelRef.current.track({
      typing: true,
      username: currentUsername,
    });

    // Auto-stop after 3 seconds of no input
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [currentUsername]);

  // Stop typing
  const stopTyping = useCallback(async () => {
    if (!channelRef.current) return;

    isTypingRef.current = false;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    await channelRef.current.track({
      typing: false,
      username: currentUsername,
    });
  }, [currentUsername]);

  // Handle input change
  const onInputChange = useCallback(() => {
    startTyping();

    // Reset timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [startTyping, stopTyping]);

  return {
    typingUsers,
    onInputChange,
    stopTyping,
  };
}
