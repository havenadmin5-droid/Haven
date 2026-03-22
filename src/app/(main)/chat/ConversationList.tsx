"use client";

import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Users, Lock } from "lucide-react";
import type { ConversationWithDetails } from "@/lib/types";

interface ConversationListProps {
  conversations: ConversationWithDetails[];
  selectedId: string | null;
  currentUserId: string;
  onSelect: (id: string) => void;
  getOtherUserDisplay: (convo: ConversationWithDetails) => {
    name: string;
    emoji: string;
    avatar: string | null;
  };
}

export function ConversationList({
  conversations,
  selectedId,
  currentUserId,
  onSelect,
  getOtherUserDisplay,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-[var(--text-muted)] text-center text-sm">
          No conversations yet
        </p>
      </div>
    );
  }

  // Sort by updated_at (most recent first)
  const sortedConvos = [...conversations].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  // Separate pending DMs
  const pendingDMs = sortedConvos.filter(
    (c) =>
      c.type === "dm" &&
      c.members.find((m) => m.user_id === currentUserId)?.dm_status === "pending"
  );

  const regularConvos = sortedConvos.filter(
    (c) =>
      !(
        c.type === "dm" &&
        c.members.find((m) => m.user_id === currentUserId)?.dm_status === "pending"
      )
  );

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Pending requests */}
      {pendingDMs.length > 0 && (
        <div className="p-2">
          <p className="px-3 py-2 text-xs font-medium text-[var(--amber)] uppercase">
            Message Requests ({pendingDMs.length})
          </p>
          {pendingDMs.map((convo) => (
            <ConversationItem
              key={convo.id}
              convo={convo}
              isSelected={selectedId === convo.id}
              currentUserId={currentUserId}
              onSelect={onSelect}
              getOtherUserDisplay={getOtherUserDisplay}
              isPending
            />
          ))}
        </div>
      )}

      {/* Regular conversations */}
      <div className="p-2">
        {pendingDMs.length > 0 && regularConvos.length > 0 && (
          <p className="px-3 py-2 text-xs font-medium text-[var(--text-muted)] uppercase">
            Messages
          </p>
        )}
        {regularConvos.map((convo) => (
          <ConversationItem
            key={convo.id}
            convo={convo}
            isSelected={selectedId === convo.id}
            currentUserId={currentUserId}
            onSelect={onSelect}
            getOtherUserDisplay={getOtherUserDisplay}
          />
        ))}
      </div>
    </div>
  );
}

interface ConversationItemProps {
  convo: ConversationWithDetails;
  isSelected: boolean;
  currentUserId: string;
  onSelect: (id: string) => void;
  getOtherUserDisplay: (convo: ConversationWithDetails) => {
    name: string;
    emoji: string;
    avatar: string | null;
  };
  isPending?: boolean;
}

function ConversationItem({
  convo,
  isSelected,
  currentUserId,
  onSelect,
  getOtherUserDisplay,
  isPending,
}: ConversationItemProps) {
  const display = getOtherUserDisplay(convo);
  const hasUnread = (convo.unread_count ?? 0) > 0;

  // Format last message preview
  let lastMessagePreview = "";
  if (convo.last_message?.content) {
    const isMine = convo.last_message.sender_id === currentUserId;
    const prefix = isMine ? "You: " : "";
    lastMessagePreview = prefix + convo.last_message.content.slice(0, 50);
    if (convo.last_message.content.length > 50) {
      lastMessagePreview += "...";
    }
  }

  const timeAgo = convo.last_message
    ? formatDistanceToNow(new Date(convo.last_message.created_at), { addSuffix: false })
    : formatDistanceToNow(new Date(convo.created_at), { addSuffix: false });

  return (
    <motion.button
      onClick={() => onSelect(convo.id)}
      className={`w-full p-3 rounded-xl flex items-center gap-3 text-left transition-colors ${
        isSelected
          ? "bg-[var(--sky)]/10"
          : "hover:bg-[var(--bg-hover)]"
      }`}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Avatar */}
      <div className="relative">
        {display.avatar ? (
          <img
            src={display.avatar}
            alt={display.name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-xl">
            {convo.type === "group" ? (
              <Users size={20} className="text-[var(--text-muted)]" />
            ) : (
              display.emoji
            )}
          </div>
        )}

        {/* Pending indicator */}
        {isPending && (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--amber)] flex items-center justify-center">
            <Lock size={10} className="text-white" />
          </div>
        )}

        {/* Unread indicator */}
        {hasUnread && !isPending && (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--rose)] flex items-center justify-center text-white text-xs">
            {convo.unread_count}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`font-medium truncate ${hasUnread ? "text-[var(--text-primary)]" : ""}`}>
            {display.name}
          </span>
          <span className="text-xs text-[var(--text-muted)] flex-shrink-0">
            {timeAgo}
          </span>
        </div>

        {lastMessagePreview && (
          <p
            className={`text-sm truncate ${
              hasUnread
                ? "text-[var(--text-primary)] font-medium"
                : "text-[var(--text-muted)]"
            }`}
          >
            {lastMessagePreview}
          </p>
        )}

        {isPending && (
          <p className="text-xs text-[var(--amber)]">New message request</p>
        )}
      </div>
    </motion.button>
  );
}
