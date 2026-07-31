import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ProfileForm from "@/components/profile-form";
import { PageHeader } from "@/components/dashboard/ui";

export default async function PatientProfilePage() {
  const session = await auth();
  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { name: true, email: true, phone: true, avatarUrl: true },
  });

  return (
    <div className="flex flex-col gap-gutter max-w-[1024px] mx-auto w-full">
      <PageHeader title="" subtitle="Manage your personal information." />
      <ProfileForm initial={user!} />
    </div>
  );
}