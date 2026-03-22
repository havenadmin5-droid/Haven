"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import { LogOut } from "lucide-react";
import { NAV_ITEMS, BOTTOM_NAV_ITEMS } from "@/lib/constants";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/authStore";
import { Logo } from "@/components/brand/Logo";
import type { NavItem } from "@/lib/types";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin } = useAuth();
  const { logout, profile } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen bg-[var(--bg-card)] border-r border-[var(--border-color)] fixed left-0 top-0">
      {/* Logo & Theme Toggle */}
      <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
        <Link href="/feed">
          <Logo size="sm" animated={false} />
        </Link>
        <ThemeToggle />
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto">
        <ul className="space-y-2">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} isActive={pathname === item.href} />
          ))}
        </ul>
      </nav>

      {/* Bottom Navigation */}
      <div className="px-4 py-6 border-t border-[var(--border-color)]">
        <ul className="space-y-2">
          {BOTTOM_NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin).map((item) => (
            <NavLink key={item.href} item={item} isActive={pathname === item.href} />
          ))}
        </ul>

        {/* User info & Logout */}
        <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
          <div className="flex items-center gap-3 px-4 py-2 mb-2">
            <span className="text-2xl">{profile?.avatar_emoji || '🌈'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-[var(--text-primary)]">
                {profile?.username || 'User'}
              </p>
              <p className="text-xs text-[var(--text-muted)] truncate">
                {profile?.city || 'Haven member'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-[var(--rose)] hover:bg-[var(--rose)]/10 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const IconComponent = Icons[item.icon as keyof typeof Icons] as React.ComponentType<{
    size?: number;
    className?: string;
  }>;

  return (
    <li>
      <Link
        href={item.href}
        prefetch={true}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
          isActive
            ? "bg-[var(--bg-hover)]"
            : "hover:bg-[var(--bg-hover)] hover:translate-x-1"
        }`}
      >
        {/* Icon */}
        <span
          className="transition-colors"
          style={{ color: isActive ? item.color : "var(--text-secondary)" }}
        >
          {IconComponent && <IconComponent size={22} />}
        </span>

        {/* Label */}
        <span
          className={`font-medium transition-colors ${
            isActive ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
          } group-hover:text-[var(--text-primary)]`}
        >
          {item.name}
        </span>

        {/* Active indicator */}
        {isActive && (
          <motion.div
            layoutId="sidebar-active"
            className="absolute left-0 w-1 h-6 rounded-r-full"
            style={{ backgroundColor: item.color }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        )}
      </Link>
    </li>
  );
}
