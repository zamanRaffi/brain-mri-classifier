import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, EmptyState } from "@/components/dashboard/ui";

// Small circular confidence ring, similar in spirit to the Stitch mock's
// static ring but wired to the real prediction confidence.
function ConfidenceRing({
  percent,
  tone,
  label,
}: {
  percent: number;
  tone: "tertiary" | "error";
  label: string;
}) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = circumference - (clamped / 100) * circumference;
  const ringColor = tone === "tertiary" ? "var(--color-tertiary)" : "var(--color-error)";

  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={radius} fill="none" strokeWidth="8" className="stroke-outline-variant/20" />
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          stroke={ringColor}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-semibold leading-none" style={{ color: ringColor }}>
          {clamped}%
        </span>
        <span className="text-[10px] text-on-surface-variant mt-1">{label}</span>
      </div>
    </div>
  );
}

// Formats a timestamp the way the Stitch activity feed does: "Today",
// "Yesterday", or a plain date, plus a time on its own line.
function formatActivityDate(date: Date) {
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86400000);

  const day = diffDays === 0 ? "Today" : diffDays === 1 ? "Yesterday" : date.toLocaleDateString();
  const time = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return { day, time };
}

type ActivityItem = {
  id: string;
  icon: string;
  tone: "primary" | "secondary" | "tertiary" | "error";
  title: string;
  description: string;
  at: Date;
};

export default async function PatientDashboard() {
  const session = await auth();
  const patientId = session!.user.id;

  const [latestPrediction, recentPredictions, recentAppointments] =
    await Promise.all([
      prisma.prediction.findFirst({
        where: { patientId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.prediction.findMany({
        where: { patientId },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      prisma.appointment.findMany({
        where: { patientId },
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: { doctor: { select: { name: true } } },
      }),
    ]);

  // Bug fixes for the appointment card:
  //  1) It used to fetch a single appointment with `findFirst`, ordered by
  //     nearest date. That meant if a patient had booked with multiple
  //     doctors, only the single soonest one ever appeared — every other
  //     appointment (with other doctors, or later dates) was silently
  //     dropped from the dashboard entirely. Switched to `findMany` so every
  //     upcoming appointment, from every doctor, is fetched and shown.
  //  2) The query also had no status filter, so a CANCELLED appointment
  //     could still show up (and be mislabeled "Confirmed") while pushing
  //     out real appointments, and a PENDING appointment was always shown
  //     as "Confirmed" even before a doctor approved it. Filtering to
  //     PENDING/CONFIRMED and rendering each item's real status fixes this.
  const upcomingAppointments = await prisma.appointment.findMany({
    where: {
      patientId,
      scheduledAt: { gte: new Date() },
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    orderBy: { scheduledAt: "asc" },
    include: { doctor: { select: { name: true, specialization: true } } },
  });
  const isAbnormal =
    latestPrediction != null &&
    latestPrediction.result.toUpperCase() !== "NO_TUMOR" &&
    latestPrediction.result.toUpperCase() !== "NORMAL";

  // Build a lightweight "recent activity" feed out of the data we already
  // have: each analyzed scan is one event, and each appointment contributes
  // one event reflecting its current status (requested / confirmed /
  // cancelled), timestamped by when that status last changed.
  const activity: ActivityItem[] = [
    ...recentPredictions.map((p) => ({
      id: `prediction-${p.id}`,
      icon: "description",
      tone: "primary" as const,
      title: `MRI Report #${p.id.slice(-6).toUpperCase()} Published`,
      description: "Available for download and review.",
      at: p.createdAt,
    })),
    ...recentAppointments.map((a) => {
      if (a.status === "CONFIRMED") {
        return {
          id: `appointment-${a.id}`,
          icon: "check_circle",
          tone: "tertiary" as const,
          title: "Appointment Confirmed",
          description: `Consult with Dr. ${a.doctor.name}.`,
          at: a.updatedAt,
        };
      }
      if (a.status === "CANCELLED") {
        return {
          id: `appointment-${a.id}`,
          icon: "cancel",
          tone: "error" as const,
          title: "Appointment Cancelled",
          description: `Consult with Dr. ${a.doctor.name} was cancelled.`,
          at: a.updatedAt,
        };
      }
      return {
        id: `appointment-${a.id}`,
        icon: "upload",
        tone: "secondary" as const,
        title: "Appointment Requested",
        description: `Awaiting confirmation from Dr. ${a.doctor.name}.`,
        at: a.createdAt,
      };
    }),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 5);

  const activityToneClasses: Record<ActivityItem["tone"], string> = {
    primary: "bg-primary-container/10 text-primary",
    secondary: "bg-secondary-container/20 text-secondary",
    tertiary: "bg-tertiary-container/10 text-tertiary",
    error: "bg-error-container text-on-error-container",
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <PageHeader title="" subtitle="Here is your neurological health overview." />

      {/* Hero + Next appointment */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-gradient-to-br from-surface-container-low to-surface rounded-2xl p-8 border border-outline-variant/30 soft-shadow relative overflow-hidden flex flex-col justify-center">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-secondary-container/20 rounded-full blur-3xl" />
          <div className="relative z-10">
            <h2 className="text-xl md:text-2xl font-semibold text-on-surface mb-2">
              Ready for your next analysis?
            </h2>
            <p className="text-sm md:text-base text-on-surface-variant mb-6 max-w-md">
              Upload your latest MRI scan for an instant AI-powered
              preliminary analysis, reviewed by our top neurologists.
            </p>
            <Link
              href="/patient/predict-mri"
              className="h-12 px-6 bg-primary text-on-primary text-sm font-medium rounded-lg inline-flex items-center hover:opacity-90 transition-opacity shadow-sm w-fit"
            >
              <span className="material-symbols-outlined mr-2 text-[20px]">
                cloud_upload
              </span>
              Predict MRI Now
            </Link>
          </div>
        </div>

        <Card className="p-6 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2 text-secondary">
              <span className="material-symbols-outlined text-[20px]">
                calendar_month
              </span>
              <span className="text-xs font-medium tracking-wide uppercase">
                Upcoming Appointments
              </span>
            </div>
            {upcomingAppointments.length > 0 && (
              <Badge tone="outline">{upcomingAppointments.length}</Badge>
            )}
          </div>
          {upcomingAppointments.length > 0 ? (
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto max-h-64 pr-1">
              {upcomingAppointments.map((appt) => (
                <div key={appt.id} className="bg-surface-container p-3 rounded-lg">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-on-surface truncate">
                        Dr. {appt.doctor.name}
                      </p>
                      <p className="text-xs text-on-surface-variant truncate">
                        {appt.doctor.specialization ?? "Consult"}
                      </p>
                    </div>
                    <Badge tone={appt.status === "CONFIRMED" ? "tertiary" : "outline"}>
                      {appt.status === "CONFIRMED" ? "Confirmed" : "Pending"}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-sm font-medium text-on-surface">
                      {appt.scheduledAt.toLocaleDateString()}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {appt.scheduledAt.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-4">
              <p className="text-sm text-on-surface-variant">
                No upcoming appointments
              </p>
              <Link
                href="/patient/book-appointment"
                className="text-primary text-sm font-medium hover:underline"
              >
                Book one now
              </Link>
            </div>
          )}
        </Card>
      </div>

      {/* Recent scan status + quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-2 p-6 flex items-center gap-6">
          {latestPrediction ? (
            <>
              <ConfidenceRing
                percent={Math.round(latestPrediction.confidence * 100)}
                tone={isAbnormal ? "error" : "tertiary"}
                label={isAbnormal ? "Review" : "Clear"}
              />
              <div className="min-w-0">
                <Badge tone={isAbnormal ? "error" : "tertiary"}>
                  <span className="material-symbols-outlined text-[14px]">
                    {isAbnormal ? "warning" : "check_circle"}
                  </span>
                  AI {isAbnormal ? "Flagged" : "Confirmed"}
                </Badge>
                <h3 className="text-lg font-semibold text-on-surface mt-2">
                  Scan #{latestPrediction.id.slice(-6).toUpperCase()} Analysis
                </h3>
                <p className="text-sm text-on-surface-variant mt-1">
                  {isAbnormal
                    ? `Possible ${latestPrediction.result.replace(/_/g, " ").toLowerCase()} detected — please review the full report.`
                    : "No anomalies detected in your most recent MRI scan."}
                </p>
                <Link
                  href="/patient/history"
                  className="mt-2 text-primary text-sm font-medium hover:underline decoration-primary underline-offset-4 inline-flex items-center"
                >
                  View Full Report
                  <span className="material-symbols-outlined text-[16px] ml-1">
                    arrow_forward
                  </span>
                </Link>
              </div>
            </>
          ) : (
            <EmptyState icon="neurology" message="No scans analyzed yet." />
          )}
        </Card>

        <Link
          href="/patient/book-appointment"
          className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/30 soft-shadow hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center gap-2 group"
        >
          <div className="w-12 h-12 rounded-full bg-secondary-container/20 text-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined">event_available</span>
          </div>
          <h3 className="font-semibold text-on-surface">Book Visit</h3>
          <p className="text-sm text-on-surface-variant">Schedule a new consult</p>
        </Link>

        <Link
          href="/patient/chat"
          className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/30 soft-shadow hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center gap-2 group"
        >
          <div className="w-12 h-12 rounded-full bg-primary-container/20 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined">forum</span>
          </div>
          <h3 className="font-semibold text-on-surface">Message Dr.</h3>
          <p className="text-sm text-on-surface-variant">Response time: ~2hrs</p>
        </Link>
      </div>

      {/* Recent Activity */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-outline-variant/30 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-on-surface">Recent Activity</h3>
          <Link
            href="/patient/history"
            className="text-primary text-sm font-medium hover:underline decoration-primary underline-offset-4"
          >
            View All
          </Link>
        </div>
        {activity.length === 0 ? (
          <EmptyState icon="history" message="No recent activity yet." />
        ) : (
          <div className="divide-y divide-outline-variant/20">
            {activity.map((item) => {
              const { day, time } = formatActivityDate(item.at);
              return (
                <div
                  key={item.id}
                  className="p-4 flex items-center hover:bg-surface-container-low transition-colors"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 shrink-0 ${activityToneClasses[item.tone]}`}
                  >
                    <span className="material-symbols-outlined">{item.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-on-surface truncate">{item.title}</p>
                    <p className="text-sm text-on-surface-variant truncate">{item.description}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-sm text-on-surface-variant">{day}</p>
                    <p className="text-xs text-outline">{time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
