"use client";

import { motion } from "framer-motion";

interface TypingIndicatorProps {
  users: { id: string; username: string }[];
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  const text =
    users.length === 1
      ? `${users[0]?.username ?? "Someone"} is typing`
      : users.length === 2
        ? `${users[0]?.username ?? "Someone"} and ${users[1]?.username ?? "someone"} are typing`
        : `${users[0]?.username ?? "Someone"} and ${users.length - 1} others are typing`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-2"
    >
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]"
            animate={{
              y: [0, -4, 0],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      <span>{text}</span>
    </motion.div>
  );
}
