"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

export type NavItem = {
  href: string;
  label: string;
  icon: string;
};

export default function SidebarNav({
  navItems,
}: {
  navItems: NavItem[];
  userName: string;
  roleLabel: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 bg-surface-container-low border-r border-outline-variant/30 flex-col hidden md:flex">
      <div className="h-20 flex items-center px-6 border-b border-outline-variant/30 gap-2">
        <span
          className="material-symbols-outlined text-primary text-3xl"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          neurology
        </span>
        <span className="text-lg font-bold text-primary tracking-tight">
          NeuroBrain
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "?");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
                isActive
                  ? "bg-primary-container text-on-primary-container font-semibold"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-primary"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-outline-variant/30 gap-1">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-error hover:bg-error-container/60 transition-colors text-left"
        >
          <span className="material-symbols-outlined text-[20px]">
            logout
          </span>
          Logout
        </button>
      </div>
    </aside>
  );
}
