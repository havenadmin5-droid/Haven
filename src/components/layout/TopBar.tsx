"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, Bell, LogOut, User, ChevronDown } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/authStore";
import { Logo } from "@/components/brand/Logo";

export function TopBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { profile } = useAuth();
  const { logout } = useAuthStore();
  const username = profile?.username;
  const avatarEmoji = profile?.avatar_emoji || "🌈";

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[var(--bg-card)] border-b border-[var(--border-color)] z-50">
      <div className="flex items-center justify-between h-full px-4">
        {/* Menu button (for tablet) */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 rounded-lg hover:bg-[var(--bg-hover)] md:flex hidden"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>

        {/* Logo */}
        <Link href="/feed" className="md:hidden">
          <Logo size="sm" animated={false} />
        </Link>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {/* Notifications */}
          <button
            className="p-2 rounded-lg hover:bg-[var(--bg-hover)]"
            aria-label="Notifications"
          >
            <Bell size={22} className="text-[var(--text-secondary)]" />
          </button>

          {/* Profile dropdown */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex items-center gap-1 p-2 rounded-lg hover:bg-[var(--bg-hover)]"
            >
              <span className="text-xl">{avatarEmoji}</span>
              <ChevronDown size={16} className="text-[var(--text-muted)]" />
            </button>

            {/* Dropdown menu */}
            {profileMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] shadow-lg overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-[var(--border-color)]">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {username || 'User'}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] truncate">
                    {profile?.city || 'Haven member'}
                  </p>
                </div>
                <Link
                  href="/profile"
                  onClick={() => setProfileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <User size={18} className="text-[var(--text-secondary)]" />
                  <span className="text-sm">Profile</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 w-full hover:bg-[var(--rose)]/10 transition-colors text-[var(--rose)]"
                >
                  <LogOut size={18} />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
