"use client";

import { usePathname } from "next/navigation";
import SidebarNav, { NavItem } from "../../components/dashboard/sidebar-nav";
import MobileNav from "../../components/dashboard/mobile-nav";
import NotificationBell from "../../components/dashboard/notification-bell";
import ThemeToggle from "../../components/theme-toggle";
import { PageHeader } from "../../components/dashboard/ui";

// Maps a nav item's label to the title that should show in the header.
// Separate maps per role, since the same sidebar label can need different
// header text for a doctor vs a patient. Add/edit entries here any time
// you want a page's header text to differ from its sidebar label.
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getPageTitle(navLabel: string | undefined, userName: string, roleLabel: string) {
  const isDoctor = roleLabel.trim().toLowerCase().startsWith("dr");

  if (navLabel === "Dashboard") {
    return isDoctor ? `${getGreeting()}, Dr. ${userName}` : `${getGreeting()}, ${userName}`;
  }

  const patientTitleMap: Record<string, string> = {
    "Predict MRI": "Predict MRI",
    "History": "Prediction History",
    "Appointments": "BOOK Appointments",
    "Chat": "Chat",
    "Profile": "Profile",
  };

  const doctorTitleMap: Record<string, string> = {
    "Appointments": "Appointments",
    "Reports": "Patient Reports",
    "Chat": "Chat",
    "Profile": "Profile",
  };

  const titleMap = isDoctor ? doctorTitleMap : patientTitleMap;

  if (navLabel && titleMap[navLabel]) {
    return titleMap[navLabel];
  }

  return navLabel ?? `${roleLabel} workspace`;
}

export default function DashboardShell({
  navItems,
  userName,
  roleLabel,
  userId,
  children,
}: {
  navItems: NavItem[];
  userName: string;
  roleLabel: string;
  userId: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Find the nav item whose href matches the current route (longest match wins,
  // so /doctor/patients/123 still matches /doctor/patients instead of the root).
  const activeItem = [...navItems]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => pathname === item.href || pathname.startsWith(item.href + "/"));

  const pageTitle = getPageTitle(activeItem?.label, userName, roleLabel);

  return (
    <div className="flex flex-1 h-[calc(100vh-0px)] min-h-screen overflow-hidden">
      <SidebarNav navItems={navItems} userName={userName} roleLabel={roleLabel} />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 md:h-20 flex items-center justify-between px-4 md:px-12 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/30 shrink-0 z-10">
          <div className="flex items-center gap-2 md:hidden">
            <span
              className="material-symbols-outlined text-primary text-2xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              neurology
            </span>
            <span className="font-bold text-primary">NeuroBrain</span>
          </div>
          <div className="hidden md:block">
            <PageHeader title={pageTitle} className="" />
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <NotificationBell userId={userId} />
            <div className="h-10 w-10 rounded-full bg-primary-fixed flex items-center justify-center border border-outline-variant/30 text-primary font-semibold text-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-12 pb-24 md:pb-12">
          {children}
        </div>

        <MobileNav navItems={navItems} />
      </main>
    </div>
  );
}
