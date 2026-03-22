"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Icons from "lucide-react";
import { MOBILE_NAV_ITEMS } from "@/lib/constants";
import type { NavItem } from "@/lib/types";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 lg:hidden bg-[var(--bg-card)] border-t border-[var(--border-color)] z-50">
      <ul className="flex items-center justify-around py-2 px-4">
        {MOBILE_NAV_ITEMS.map((item) => (
          <MobileNavLink
            key={item.href}
            item={item}
            isActive={pathname === item.href}
          />
        ))}
      </ul>
    </nav>
  );
}

function MobileNavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
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
        <span style={{ color: isActive ? item.color : "var(--text-muted)" }}>
          {IconComponent && <IconComponent size={24} />}
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
