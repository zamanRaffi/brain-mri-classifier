import { auth } from "../../../auth";
import { prisma } from "../../../lib/prisma";
import ChatPageClient from "../../../components/chat/chat-page-client";

export default async function DoctorChatPage({
  searchParams,
}: {
  searchParams: Promise<{ with?: string }>;
}) {
  const session = await auth();
  const { with: withId } = await searchParams;

  const appointments = await prisma.appointment.findMany({
    where: { doctorId: session!.user.id },
    distinct: ["patientId"],
    select: { patient: { select: { id: true, name: true } } },
  });
  const patients = appointments.map((a) => a.patient);

  return (
    <div className="flex flex-col gap-6 h-full">
      <ChatPageClient
        currentUserId={session!.user.id}
        basePath="/doctor/chat"
        listTitle="Patients"
        emptyMessage="No patients found."
        activeContactId={withId}
        contacts={patients.map((p) => ({
          id: p.id,
          name: p.name,
          displayName: p.name,
        }))}
      />
    </div>
  );
}
