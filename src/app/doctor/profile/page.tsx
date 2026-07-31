import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ProfileForm from "@/components/profile-form";
import { PageHeader } from "@/components/dashboard/ui";

export default async function DoctorProfilePage() {
  const session = await auth();
  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { name: true, email: true, phone: true, specialization: true, bio: true, avatarUrl: true },
  });

  return (
      <div className="flex flex-col gap-gutter max-w-[1024px] mx-auto w-full">
      <PageHeader title="" subtitle="Manage your clinical profile and account details." />
      <ProfileForm initial={user!} />
    </div>
  );
}
