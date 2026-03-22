"use client";

import { format } from "date-fns";
import { getDisplayName, getDisplayAvatar } from "@/lib/utils/privacy";
import type { MessageWithSender } from "@/lib/types";

interface MessageBubbleProps {
  message: MessageWithSender;
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const timestamp = format(new Date(message.created_at), "h:mm a");

  // System messages
  if (message.is_system) {
    return (
      <div className="flex justify-center">
        <p className="text-xs text-[var(--text-muted)] italic px-3 py-1 bg-[var(--bg-tertiary)] rounded-full">
          {message.sender.username} {message.content}
        </p>
      </div>
    );
  }

  // Get display info for sender
  const displayName = message.sender.is_anonymous
    ? message.sender.anonymous_alias || "Anonymous"
    : getDisplayName({
        username: message.sender.username,
        is_anonymous: false,
        anonymous_alias: null,
      });

  const avatarUrl = message.sender.is_anonymous
    ? null
    : getDisplayAvatar({
        avatar_url: message.sender.avatar_url,
        show_photo: message.sender.show_photo,
        is_anonymous: false,
      });

  return (
    <div className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
      {/* Avatar (only for others' messages) */}
      {!isOwn && (
        <div className="flex-shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-sm">
              {message.sender.avatar_emoji}
            </div>
          )}
        </div>
      )}

      {/* Message content */}
      <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
        {/* Sender name (only for others' messages) */}
        {!isOwn && (
          <p className="text-xs text-[var(--text-muted)] mb-1 ml-1">
            {displayName}
          </p>
        )}

        {/* Bubble */}
        <div
          className={`rounded-2xl px-4 py-2 ${
            isOwn
              ? "bg-gradient-to-r from-[var(--rose)] to-[var(--violet)] text-white rounded-br-md"
              : "bg-[var(--bg-tertiary)] rounded-bl-md"
          }`}
        >
          {/* Image */}
          {message.image_url && (
            <div className="mb-2">
              <img
                src={message.image_url}
                alt="Attachment"
                className="rounded-lg max-w-full max-h-60 object-cover cursor-pointer"
                onClick={() => window.open(message.image_url!, "_blank")}
              />
            </div>
          )}

          {/* Text content */}
          {message.content && (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          )}
        </div>

        {/* Timestamp */}
        <p
          className={`text-xs text-[var(--text-muted)] mt-1 ${
            isOwn ? "text-right mr-1" : "ml-1"
          }`}
        >
          {timestamp}
        </p>
      </div>
    </div>
  );
}
