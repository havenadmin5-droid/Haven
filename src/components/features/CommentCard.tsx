"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Reply,
  Trash2,
  MoreHorizontal,
  Eye,
  EyeOff,
  Send,
  X,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { deleteComment } from "@/app/(main)/posts/[id]/actions";
import { maskIdentity } from "@/lib/utils/privacy";
import type { CommentWithAuthor } from "@/lib/types";

interface CommentCardProps {
  comment: CommentWithAuthor;
  postId: string;
  currentUserId: string;
  canPostAnonymous: boolean;
  onDelete: (commentId: string) => void;
  onReply: () => void;
  replyingTo: string | null;
  replyContent: string;
  replyAnonymous: boolean;
  onReplyContentChange: (content: string) => void;
  onReplyAnonymousChange: (isAnonymous: boolean) => void;
  onSubmitReply: (parentId: string) => void;
  onCancelReply: () => void;
  isSubmitting: boolean;
  depth?: number;
}

export function CommentCard({
  comment,
  postId,
  currentUserId,
  canPostAnonymous,
  onDelete,
  onReply,
  replyingTo,
  replyContent,
  replyAnonymous,
  onReplyContentChange,
  onReplyAnonymousChange,
  onSubmitReply,
  onCancelReply,
  isSubmitting,
  depth = 0,
}: CommentCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAuthor = comment.author_id === currentUserId;
  const isReplyingToThis = replyingTo === comment.id;
  const maxDepth = 3;

  // Get display info
  const displayInfo = comment.is_anonymous
    ? maskIdentity({
        id: comment.author.id,
        username: comment.author.username,
        avatar_emoji: comment.author.avatar_emoji,
        avatar_url: comment.author.avatar_url,
        show_photo: comment.author.show_photo,
        is_anonymous: true,
        anonymous_alias: comment.author.anonymous_alias,
        is_verified: comment.author.is_verified,
      })
    : {
        displayName: comment.author.username,
        displayEmoji: comment.author.avatar_emoji,
        displayPhoto: comment.author.show_photo ? comment.author.avatar_url : null,
        isAnonymous: false,
      };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    setIsDeleting(true);
    try {
      const result = await deleteComment(comment.id, postId);
      if (result.success) {
        onDelete(comment.id);
      }
    } finally {
      setIsDeleting(false);
      setShowMenu(false);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(comment.created_at), {
    addSuffix: true,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={depth > 0 ? "ml-8 pl-4 border-l-2 border-[var(--border-color)]" : ""}
    >
      <div className="group">
        {/* Comment header */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {displayInfo.displayPhoto ? (
              <img
                src={displayInfo.displayPhoto}
                alt={displayInfo.displayName}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-lg">
                {displayInfo.displayEmoji}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">
                {displayInfo.displayName}
              </span>
              {comment.is_anonymous && (
                <span className="text-xs text-[var(--violet)] bg-[var(--violet)]/10 px-1.5 py-0.5 rounded">
                  anonymous
                </span>
              )}
              <span className="text-xs text-[var(--text-muted)]">{timeAgo}</span>
            </div>

            <p className="text-sm mt-1 whitespace-pre-wrap break-words">
              {comment.content}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-2">
              {depth < maxDepth && (
                <button
                  onClick={onReply}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--teal)] flex items-center gap-1 transition-colors"
                >
                  <Reply size={14} />
                  Reply
                </button>
              )}

              {isAuthor && (
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <MoreHorizontal size={14} />
                  </button>

                  {showMenu && (
                    <div className="absolute top-full left-0 mt-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg shadow-lg py-1 z-20">
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="w-full px-3 py-1.5 text-left text-sm text-red-500 hover:bg-[var(--bg-hover)] flex items-center gap-2"
                      >
                        {isDeleting ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reply form */}
        {isReplyingToThis && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-3 ml-11"
          >
            <div className="flex gap-2">
              <textarea
                value={replyContent}
                onChange={(e) => onReplyContentChange(e.target.value)}
                placeholder={`Reply to ${displayInfo.displayName}...`}
                className="flex-1 resize-none h-16 text-sm"
                maxLength={1000}
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                {canPostAnonymous && (
                  <button
                    type="button"
                    onClick={() => onReplyAnonymousChange(!replyAnonymous)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                      replyAnonymous
                        ? "bg-[var(--violet)]/10 text-[var(--violet)]"
                        : "hover:bg-[var(--bg-hover)] text-[var(--text-muted)]"
                    }`}
                  >
                    {replyAnonymous ? <EyeOff size={12} /> : <Eye size={12} />}
                    {replyAnonymous ? "Anon" : "Public"}
                  </button>
                )}
                <span className="text-xs text-[var(--text-muted)]">
                  {replyContent.length}/1000
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onCancelReply}
                  className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)]"
                  disabled={isSubmitting}
                >
                  <X size={16} />
                </button>
                <button
                  onClick={() => onSubmitReply(comment.id)}
                  disabled={isSubmitting || !replyContent.trim()}
                  className="btn btn-brand btn-sm px-3"
                >
                  {isSubmitting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              postId={postId}
              currentUserId={currentUserId}
              canPostAnonymous={canPostAnonymous}
              onDelete={onDelete}
              onReply={() => {
                /* Handle nested reply */
              }}
              replyingTo={replyingTo}
              replyContent={replyContent}
              replyAnonymous={replyAnonymous}
              onReplyContentChange={onReplyContentChange}
              onReplyAnonymousChange={onReplyAnonymousChange}
              onSubmitReply={onSubmitReply}
              onCancelReply={onCancelReply}
              isSubmitting={isSubmitting}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
