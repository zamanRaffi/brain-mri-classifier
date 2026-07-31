import { auth } from "../../../auth";
import { prisma } from "../../../lib/prisma";
import AppointmentActions from "../../../components/appointment-actions";
import { PageHeader, Card, Badge, EmptyState } from "../../../components/dashboard/ui";

const statusTone: Record<string, "primary" | "tertiary" | "error" | "outline"> = {
  PENDING: "outline",
  CONFIRMED: "tertiary",
  CANCELLED: "error",
};

export default async function DoctorAppointmentsPage() {
  const session = await auth();
  const appointments = await prisma.appointment.findMany({
    where: { doctorId: session!.user.id },
    include: { patient: { select: { name: true, email: true } } },
    orderBy: { scheduledAt: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="" subtitle="Review and manage your patient bookings." />

      <Card className="overflow-hidden">
        {appointments.length === 0 ? (
          <EmptyState icon="event_busy" message="No appointments scheduled yet." />
        ) : (
          <div className="divide-y divide-outline-variant/20">
            {appointments.map((a) => (
              <div
                key={a.id}
                className="p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-container-low transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                    {a.patient.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-on-surface truncate">
                      {a.patient.name}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {a.scheduledAt.toLocaleString()}
                    </p>
                    {a.reason && (
                      <p className="text-sm text-on-surface-variant mt-1">
                        {a.reason}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge tone={statusTone[a.status] ?? "outline"}>
                    {a.status}
                  </Badge>
                  <AppointmentActions appointmentId={a.id} status={a.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
