"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, MessageCircle, Send, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PostCard } from "@/components/features/PostCard";
import { CommentCard } from "@/components/features/CommentCard";
import { createComment } from "./actions";
import type { PostWithAuthor, CommentWithAuthor } from "@/lib/types";

interface PostDetailClientProps {
  post: PostWithAuthor;
  comments: CommentWithAuthor[];
  currentUserId: string;
  canPostAnonymous: boolean;
}

export function PostDetailClient({
  post,
  comments: initialComments,
  currentUserId,
  canPostAnonymous,
}: PostDetailClientProps) {
  const router = useRouter();
  const [comments, setComments] = useState<CommentWithAuthor[]>(initialComments);
  const [commentContent, setCommentContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyAnonymous, setReplyAnonymous] = useState(false);
  const [postData, setPostData] = useState(post);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!commentContent.trim()) {
      setError("Please enter a comment");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createComment(
        post.id,
        commentContent.trim(),
        null,
        isAnonymous
      );

      if (!result.success) {
        setError(result.error ?? "Failed to post comment");
      } else if (result.comment) {
        setComments([...comments, result.comment]);
        setCommentContent("");
        setPostData({
          ...postData,
          comment_count: postData.comment_count + 1,
        });
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createComment(
        post.id,
        replyContent.trim(),
        parentId,
        replyAnonymous
      );

      if (!result.success) {
        setError(result.error ?? "Failed to post reply");
      } else if (result.comment) {
        // Add reply to parent comment
        const updateReplies = (
          commentsList: CommentWithAuthor[]
        ): CommentWithAuthor[] => {
          return commentsList.map((comment) => {
            if (comment.id === parentId) {
              return {
                ...comment,
                replies: [...(comment.replies ?? []), result.comment!],
              };
            }
            if (comment.replies && comment.replies.length > 0) {
              return {
                ...comment,
                replies: updateReplies(comment.replies),
              };
            }
            return comment;
          });
        };

        setComments(updateReplies(comments));
        setReplyContent("");
        setReplyingTo(null);
        setPostData({
          ...postData,
          comment_count: postData.comment_count + 1,
        });
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    // Remove comment from state
    const removeComment = (
      commentsList: CommentWithAuthor[]
    ): CommentWithAuthor[] => {
      return commentsList
        .filter((c) => c.id !== commentId)
        .map((c) => ({
          ...c,
          replies: removeComment(c.replies ?? []),
        }));
    };

    setComments(removeComment(comments));
    setPostData({
      ...postData,
      comment_count: Math.max(0, postData.comment_count - 1),
    });
  };

  const handlePostDeleted = () => {
    router.push("/feed");
  };

  const handleReactionChange = (reactions: number[], countDiff: number) => {
    setPostData({
      ...postData,
      user_reactions: reactions,
      reaction_count: postData.reaction_count + countDiff,
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back button */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-4"
      >
        <Link
          href="/feed"
          className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft size={18} />
          Back to feed
        </Link>
      </motion.div>

      {/* Post */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <PostCard
          post={postData}
          currentUserId={currentUserId}
          onDelete={handlePostDeleted}
          onReactionChange={handleReactionChange}
          showCommunity={true}
          isDetailView={true}
        />
      </motion.div>

      {/* Comments section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <MessageCircle size={20} className="text-[var(--teal)]" />
          Comments ({postData.comment_count})
        </h2>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Comment form */}
        <form onSubmit={handleSubmitComment} className="mb-6">
          <div className="flex gap-3">
            <div className="flex-1">
              <textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Write a comment..."
                className="w-full resize-none h-20"
                maxLength={1000}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              {canPostAnonymous && (
                <button
                  type="button"
                  onClick={() => setIsAnonymous(!isAnonymous)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    isAnonymous
                      ? "bg-[var(--violet)]/10 text-[var(--violet)]"
                      : "hover:bg-[var(--bg-hover)] text-[var(--text-muted)]"
                  }`}
                >
                  {isAnonymous ? <EyeOff size={16} /> : <Eye size={16} />}
                  {isAnonymous ? "Anonymous" : "Public"}
                </button>
              )}
              <span className="text-xs text-[var(--text-muted)]">
                {commentContent.length}/1000
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !commentContent.trim()}
              className="btn btn-brand px-4"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  <Send size={16} />
                  Comment
                </>
              )}
            </button>
          </div>
        </form>

        {/* Comments list */}
        {comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                postId={post.id}
                currentUserId={currentUserId}
                canPostAnonymous={canPostAnonymous}
                onDelete={handleDeleteComment}
                onReply={() => setReplyingTo(comment.id)}
                replyingTo={replyingTo}
                replyContent={replyContent}
                replyAnonymous={replyAnonymous}
                onReplyContentChange={setReplyContent}
                onReplyAnonymousChange={setReplyAnonymous}
                onSubmitReply={handleSubmitReply}
                onCancelReply={() => {
                  setReplyingTo(null);
                  setReplyContent("");
                }}
                isSubmitting={isSubmitting}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-[var(--text-muted)]">
            <MessageCircle
              size={32}
              className="mx-auto mb-2 opacity-50"
            />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
