"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Icons from "lucide-react";
import { MOBILE_NAV_ITEMS } from "@/lib/constants";
import { useChatNotifications } from "@/hooks/useChatNotifications";
import type { NavItem } from "@/lib/types";

export function MobileNav() {
  const pathname = usePathname();
  const { totalCount: chatBadgeCount } = useChatNotifications();

  return (
    <nav className="fixed bottom-0 left-0 right-0 lg:hidden bg-[var(--bg-card)] border-t border-[var(--border-color)] z-50">
      <ul className="flex items-center justify-around py-2 px-4">
        {MOBILE_NAV_ITEMS.map((item) => (
          <MobileNavLink
            key={item.href}
            item={item}
            isActive={pathname === item.href}
            badge={item.href === '/chat' ? chatBadgeCount : undefined}
          />
        ))}
      </ul>
    </nav>
  );
}

function MobileNavLink({ item, isActive, badge }: { item: NavItem; isActive: boolean; badge?: number }) {
  const IconComponent = Icons[item.icon as keyof typeof Icons] as React.ComponentType<{
    size?: number;
    className?: string;
  }>;

  return (
    <li>
      <Link
        href={item.href}
        prefetch={true}
        className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl min-w-[56px] min-h-[56px] transition-colors ${
          isActive ? "bg-[var(--bg-hover)]" : ""
        }`}
        aria-label={item.name}
      >
        <span className="relative" style={{ color: isActive ? item.color : "var(--text-muted)" }}>
          {IconComponent && <IconComponent size={24} />}
          {/* Badge */}
          {badge !== undefined && badge > 0 && (
            <span className="absolute -top-1 -right-2 min-w-[16px] h-[16px] px-1 flex items-center justify-center rounded-full bg-[var(--rose)] text-white text-[9px] font-bold">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </span>
        <span
          className={`text-xs font-medium ${
            isActive ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"
          }`}
        >
          {item.name}
        </span>
      </Link>
    </li>
  );
}
