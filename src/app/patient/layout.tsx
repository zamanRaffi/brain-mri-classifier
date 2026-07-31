import { redirect } from "next/navigation";
import { auth } from "@/auth";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import { NavItem } from "@/components/dashboard/sidebar-nav";

const navItems: NavItem[] = [
  { href: "/patient/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/patient/predict-mri", label: "Predict MRI", icon: "upload_file" },
  { href: "/patient/history", label: "History", icon: "history" },
  { href: "/patient/book-appointment", label: "Appointments", icon: "event" },
  { href: "/patient/chat", label: "Chat", icon: "chat" },
  { href: "/patient/profile", label: "Profile", icon: "person" },
];

export default async function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || session.user.role !== "PATIENT") {
    redirect("/login");
  }

  return (
    <DashboardShell
      navItems={navItems}
      userName={session.user.name ?? "Patient"}
      roleLabel="Patient"
      userId={session.user.id}
    >
      {children}
    </DashboardShell>
  );
}
