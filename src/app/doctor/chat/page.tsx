import Link from "next/link";
import { auth } from "../../../auth";
import { prisma } from "../../../lib/prisma";
import ChatWindow from "../../../components/chat-window";
import { EmptyState } from "../../../components/dashboard/ui";

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

  const activePatient = patients.find((p) => p.id === withId) ?? patients[0];

  return (
    <div className="flex flex-col gap-6 h-full">

      <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0">
        <aside className="w-full md:w-72 shrink-0 bg-surface-container-lowest rounded-2xl shadow-[0_4px_20px_rgba(0,74,198,0.05)] border border-outline-variant/30 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-outline-variant/20">
            <h2 className="font-semibold text-on-surface">Patients</h2>
          </div>
          <div className="flex flex-col overflow-y-auto">
            {patients.map((p) => {
              const isActive = activePatient?.id === p.id;
              return (
                <Link
                  key={p.id}
                  href={`/doctor/chat?with=${p.id}`}
                  className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                    isActive
                      ? "bg-primary/5 text-primary font-medium"
                      : "hover:bg-surface-container-low text-on-surface"
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-semibold text-xs shrink-0">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <p className="truncate">{p.name}</p>
                </Link>
              );
            })}
          </div>
        </aside>

        {activePatient ? (
          <ChatWindow
            currentUserId={session!.user.id}
            otherUserId={activePatient.id}
            otherUserName={activePatient.name}
          />
        ) : (
          <div className="flex-1 bg-surface-container-lowest rounded-2xl border border-outline-variant/30">
            <EmptyState icon="forum" message="No patients found." />
          </div>
        )}
      </div>
    </div>
  );
}
