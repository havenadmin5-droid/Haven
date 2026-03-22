"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * NavigationProgress - Ultra-fast loading indicator
 * Shows instantly on click, completes as soon as route changes
 * Does NOT block navigation - purely visual feedback
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const previousPathRef = useRef(pathname);

  // Detect route changes - complete instantly
  useEffect(() => {
    if (pathname !== previousPathRef.current) {
      // Route changed - complete the animation instantly
      setIsComplete(true);

      // Reset after brief animation
      const timeout = setTimeout(() => {
        setIsNavigating(false);
        setIsComplete(false);
      }, 150);

      previousPathRef.current = pathname;
      return () => clearTimeout(timeout);
    }
  }, [pathname]);

  // Intercept link clicks - start instantly
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");

      if (!link) return;

      const href = link.getAttribute("href");
      if (!href) return;

      // Check if it's an internal navigation
      if (
        href.startsWith("/") &&
        !href.startsWith("//") &&
        !link.getAttribute("target") &&
        href !== pathname
      ) {
        // Start immediately
        setIsNavigating(true);
        setIsComplete(false);
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pathname]);

  if (!isNavigating) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] h-1 bg-transparent pointer-events-none"
      role="progressbar"
      aria-valuenow={isComplete ? 100 : 30}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full bg-gradient-to-r from-[var(--violet)] via-[var(--rose)] to-[var(--teal)] transition-all ${
          isComplete ? 'duration-100' : 'duration-200'
        } ease-out`}
        style={{
          width: isComplete ? '100%' : '30%',
          boxShadow: '0 0 10px var(--violet), 0 0 5px var(--violet)'
        }}
      />
    </div>
  );
}
