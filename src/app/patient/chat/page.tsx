import Link from "next/link";
import { auth } from "../../../../src/auth";
import { prisma } from "../../../lib/prisma";
import ChatWindow from "../../../components/chat-window";
import {  EmptyState } from "../../../components/dashboard/ui";

export default async function PatientChatPage({
  searchParams,
}: {
  searchParams: Promise<{ with?: string }>;
}) {
  const session = await auth();
  const { with: withId } = await searchParams;

  const doctors = await prisma.user.findMany({
    where: { role: "DOCTOR" },
    select: { id: true, name: true, specialization: true },
    orderBy: { name: "asc" },
  });

  const activeDoctor = doctors.find((d) => d.id === withId) ?? doctors[0];

  return (
    <div className="flex flex-col gap-6 h-full">

      <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0">
        <aside className="w-full md:w-72 shrink-0 bg-surface-container-lowest rounded-2xl shadow-[0_4px_20px_rgba(0,74,198,0.05)] border border-outline-variant/30 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-outline-variant/20">
            <h2 className="font-semibold text-on-surface">Doctors</h2>
          </div>
          <div className="flex flex-col overflow-y-auto">
            {doctors.map((d) => {
              const isActive = activeDoctor?.id === d.id;
              return (
                <Link
                  key={d.id}
                  href={`/patient/chat?with=${d.id}`}
                  className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                    isActive
                      ? "bg-primary/5 text-primary font-medium"
                      : "hover:bg-surface-container-low text-on-surface"
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-semibold text-xs shrink-0">
                    {d.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate">Dr. {d.name}</p>
                    {d.specialization && (
                      <p className="text-xs text-on-surface-variant truncate">
                        {d.specialization}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </aside>

        {activeDoctor ? (
          <ChatWindow
            currentUserId={session!.user.id}
            otherUserId={activeDoctor.id}
            otherUserName={`Dr. ${activeDoctor.name}`}
          />
        ) : (
          <div className="flex-1 bg-surface-container-lowest rounded-2xl border border-outline-variant/30">
            <EmptyState icon="forum" message="No doctors available yet." />
          </div>
        )}
      </div>
    </div>
  );
}
