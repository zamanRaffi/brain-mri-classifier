import Link from "next/link";
import { auth } from "../../../auth";
import { prisma } from "../../../lib/prisma";
import { PageHeader, StatCard, Card, EmptyState } from "../../../components/dashboard/ui";
import { StatisticsCharts } from "../../../components/dashboard/statistics-charts";

export default async function DoctorDashboard() {
  const session = await auth();
  const doctorId = session!.user.id;

  const [
    upcomingCount,
    distinctPatients,
    recentPatientAppointments,
    todaysAppointments,
    confirmedPatientIds,
  ] = await Promise.all([
    prisma.appointment.count({
      where: { doctorId, scheduledAt: { gte: new Date() }, status: { not: "CANCELLED" } },
    }),
    prisma.appointment.findMany({
      where: { doctorId },
      distinct: ["patientId"],
      select: { patientId: true },
    }),
    prisma.appointment.findMany({
      where: { doctorId },
      distinct: ["patientId"],
      select: {
        patient: { select: { id: true, name: true, email: true } },
        scheduledAt: true,
      },
      orderBy: { scheduledAt: "desc" },
      take: 5,
    }),
    prisma.appointment.findMany({
      where: {
        doctorId,
        scheduledAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
      include: { patient: { select: { name: true } } },
      orderBy: { scheduledAt: "asc" },
    }),
    // Same "confirmed relationship" rule as patient-reports: only patients
    // the doctor has actually confirmed/completed appointments with count
    // toward this doctor's prediction stats.
    prisma.appointment.findMany({
      where: { doctorId, status: { in: ["CONFIRMED", "COMPLETED"] } },
      distinct: ["patientId"],
      select: { patientId: true },
    }),
  ]);

  const patientCount = distinctPatients.length;
  const patientIdList = confirmedPatientIds.map((p) => p.patientId);

  const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [predictionCount, todaysCases, resultGroups, recentPredictions] =
    patientIdList.length === 0
      ? [0, 0, [], []]
      : await Promise.all([
          prisma.prediction.count({ where: { patientId: { in: patientIdList } } }),
          prisma.prediction.count({
            where: { patientId: { in: patientIdList }, createdAt: { gte: startOfToday } },
          }),
          prisma.prediction.groupBy({
            by: ["result"],
            where: { patientId: { in: patientIdList } },
            _count: { _all: true },
          }),
          prisma.prediction.findMany({
            where: { patientId: { in: patientIdList }, createdAt: { gte: sixMonthsAgo } },
            select: { createdAt: true },
          }),
        ]);

  const tumorDistribution = resultGroups.map((g) => ({
    name: g.result.replace(/_/g, " "),
    value: g._count._all,
  }));

  // Bucket predictions into the last 6 calendar months, oldest first.
  const monthLabels: { key: string; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    monthLabels.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString("en-US", { month: "short" }),
    });
  }
  const monthCounts = new Map(monthLabels.map((m) => [m.key, 0]));
  for (const p of recentPredictions) {
    const d = p.createdAt;
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (monthCounts.has(key)) monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
  }
  const monthlyReports = monthLabels.map((m) => ({
    month: m.label,
    reports: monthCounts.get(m.key) ?? 0,
  }));

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader
        title=""
        subtitle="Here's what's happening with your patients today."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard icon="event" label="Upcoming Appointments" value={upcomingCount} tone="primary" />
        <StatCard icon="groups" label="Total Patients" value={patientCount} tone="secondary" />
        <StatCard icon="today" label="Today's Appointments" value={todaysAppointments.length} tone="tertiary" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard icon="description" label="Predictions" value={predictionCount} tone="primary" />
        <StatCard icon="event_available" label="Today's Cases" value={todaysCases} tone="secondary" />
        <StatCard
          icon="warning"
          label="Abnormal Findings"
          value={tumorDistribution
            .filter((t) => t.name !== "NO TUMOR" && t.name !== "INCONCLUSIVE")
            .reduce((sum, t) => sum + t.value, 0)}
          tone="tertiary"
        />
      </div>

      <StatisticsCharts tumorDistribution={tumorDistribution} monthlyReports={monthlyReports} />

      <Card className="overflow-hidden">
        <div className="p-5 border-b border-outline-variant/30">
          <h2 className="text-lg font-semibold text-on-surface">
            Today&apos;s Schedule
          </h2>
        </div>
        {todaysAppointments.length === 0 ? (
          <EmptyState icon="event_available" message="No appointments scheduled yet." />
        ) : (
          <div className="divide-y divide-outline-variant/20">
            {todaysAppointments.map((a) => (
              <div
                key={a.id}
                className="p-4 flex items-center justify-between hover:bg-surface-container-low transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-semibold text-xs shrink-0">
                    {a.patient.name.charAt(0).toUpperCase()}
                  </div>
                  <p className="font-medium text-on-surface">{a.patient.name}</p>
                </div>
                <span className="text-sm text-on-surface-variant">
                  {a.scheduledAt.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="p-5 border-b border-outline-variant/30">
            <h2 className="text-lg font-semibold text-on-surface">Recent Patients</h2>
          </div>
          {recentPatientAppointments.length === 0 ? (
            <EmptyState icon="groups" message="No patients yet." />
          ) : (
            <div className="divide-y divide-outline-variant/20">
              {recentPatientAppointments.map((a) => (
                <Link
                  key={a.patient.id}
                  href={`/patient/chat?with=${doctorId}`}
                  className="p-4 flex items-center justify-between hover:bg-surface-container-low transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary font-semibold text-xs shrink-0">
                      {a.patient.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-on-surface truncate">{a.patient.name}</p>
                      <p className="text-xs text-on-surface-variant truncate">{a.patient.email}</p>
                    </div>
                  </div>
                  <span className="text-sm text-on-surface-variant shrink-0">
                    {a.scheduledAt.toLocaleDateString()}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5 flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-on-surface mb-1">Quick Actions</h2>
          <Link
            href="/doctor/appointments"
            className="flex items-center gap-3 rounded-xl px-4 py-3 bg-primary-container/10 text-primary hover:bg-primary-container/20 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">event</span>
            <span className="text-sm font-medium">View Appointments</span>
          </Link>
          <Link
            href="/doctor/patient-reports"
            className="flex items-center gap-3 rounded-xl px-4 py-3 bg-tertiary-container/10 text-tertiary hover:bg-tertiary-container/20 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">description</span>
            <span className="text-sm font-medium">Patient Reports</span>
          </Link>
          <Link
            href="/doctor/chat"
            className="flex items-center gap-3 rounded-xl px-4 py-3 bg-secondary-container/20 text-secondary hover:bg-secondary-container/30 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">forum</span>
            <span className="text-sm font-medium">Message Patients</span>
          </Link>
        </Card>
      </div>
    </div>
  );
}
