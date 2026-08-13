import { auth } from "../../../../src/auth";
import { prisma } from "../../../lib/prisma";
import ChatPageClient from "../../../components/chat/chat-page-client";

export default async function PatientChatPage({
  searchParams,
}: {
  searchParams: Promise<{ with?: string }>;
}) {
  const session = await auth();
  const { with: withId } = await searchParams;

  // Only show doctors the patient has a confirmed appointment with
  const confirmed = await prisma.appointment.findMany({
    where: { patientId: session!.user.id, status: "CONFIRMED" },
    select: { doctorId: true },
  });
  const doctorIds = confirmed.map((c) => c.doctorId);

  const doctors =
    doctorIds.length > 0
      ? await prisma.user.findMany({
          where: { role: "DOCTOR", id: { in: doctorIds } },
          select: { id: true, name: true, specialization: true },
          orderBy: { name: "asc" },
        })
      : [];

  return (
    <div className="flex flex-col gap-6 h-full">
      <ChatPageClient
        currentUserId={session!.user.id}
        basePath="/patient/chat"
        listTitle="Doctors"
        emptyMessage="No doctors available yet."
        activeContactId={withId}
        conversationStarters={[
          "Can you explain my MRI result?",
          "What does my diagnosis mean?",
          "What should I do next?",
          "Can you review my MRI scan?",
        ]}
        contacts={doctors.map((d) => ({
          id: d.id,
          name: d.name,
          displayName: `Dr. ${d.name}`,
          subtitle: d.specialization ?? undefined,
        }))}
      />
    </div>
  );
}
