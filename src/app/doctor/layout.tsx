import { redirect } from "next/navigation";
import { auth } from "../../auth";
import DashboardShell from "../../components/dashboard/dashboard-shell";
import { NavItem } from "../../components/dashboard/sidebar-nav";

const navItems: NavItem[] = [
  { href: "/doctor/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/doctor/appointments", label: "Appointments", icon: "calendar_today" },
  { href: "/doctor/patient-reports", label: "Reports", icon: "analytics" },
  { href: "/doctor/chat", label: "Chat", icon: "chat" },
  { href: "/doctor/profile", label: "Profile", icon: "person" },
];

export default async function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || session.user.role !== "DOCTOR") {
    redirect("/login");
  }

  return (
    <DashboardShell
      navItems={navItems}
      userName={session.user.name ?? "Doctor"}
      roleLabel="Dr."
      userId={session.user.id}
    >
      {children}
    </DashboardShell>
  );
}
