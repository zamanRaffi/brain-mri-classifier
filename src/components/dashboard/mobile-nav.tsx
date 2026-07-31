"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavItem } from "../../components/dashboard/sidebar-nav";

export default function MobileNav({ navItems }: { navItems: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant/30 flex justify-around py-2 z-20">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] ${
              isActive ? "text-primary" : "text-on-surface-variant"
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
  );
}
