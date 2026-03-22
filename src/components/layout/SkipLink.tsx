"use client";

/**
 * Skip to main content link for keyboard accessibility
 * Visible only when focused, allows keyboard users to skip navigation
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[var(--violet)] focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
    >
      Skip to main content
    </a>
  );
}
