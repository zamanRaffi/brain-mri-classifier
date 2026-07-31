import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type NotificationItem = {
  id: string;
  type: "message" | "appointment" | "prediction";
  title: string;
  description: string;
  href: string;
  createdAt: string;
  unread: boolean;
};

// GET /api/notifications?since=<ISO date> -> 
export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sinceParam = searchParams.get("since");
  const since = sinceParam && !isNaN(Date.parse(sinceParam)) ? new Date(sinceParam) : new Date(0);

  const userId = session.user.id;
  const isDoctor = session.user.role === "DOCTOR";

  const unreadMessages = await prisma.chatMessage.findMany({
    where: { receiverId: userId, read: false },
    include: { sender: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const messageItems: NotificationItem[] = unreadMessages.map((m) => ({
    id: `message-${m.id}`,
    type: "message",
    title: `New message from ${m.sender.name}`,
    description: m.content.length > 80 ? `${m.content.slice(0, 80)}…` : m.content,
    href: isDoctor ? `/doctor/chat?with=${m.sender.id}` : `/patient/chat?with=${m.sender.id}`,
    createdAt: m.createdAt.toISOString(),
    unread: true, // 
  }));

  let appointmentItems: NotificationItem[] = [];
  let predictionItems: NotificationItem[] = [];

  if (isDoctor) {
    const pendingAppointments = await prisma.appointment.findMany({
      where: { doctorId: userId, status: "PENDING" },
      include: { patient: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    appointmentItems = pendingAppointments.map((a) => ({
      id: `appointment-${a.id}`,
      type: "appointment",
      title: "New appointment request",
      description: `${a.patient.name} requested a visit on ${a.scheduledAt.toLocaleDateString()}`,
      href: "/doctor/appointments",
      createdAt: a.createdAt.toISOString(),
      unread: a.createdAt > since,
    }));
  } else {
    const [changedAppointments, recentPredictions] = await Promise.all([
      prisma.appointment.findMany({
        where: { patientId: userId, status: { in: ["CONFIRMED", "CANCELLED"] } },
        include: { doctor: { select: { name: true } } },
        orderBy: { updatedAt: "desc" },
        take: 10,
      }),
      prisma.prediction.findMany({
        where: { patientId: userId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    appointmentItems = changedAppointments.map((a) => ({
      id: `appointment-${a.id}`,
      type: "appointment",
      title: a.status === "CONFIRMED" ? "Appointment confirmed" : "Appointment cancelled",
      description: `Dr. ${a.doctor.name} — ${a.scheduledAt.toLocaleDateString()}`,
      href: "/patient/dashboard",
      createdAt: a.updatedAt.toISOString(),
      unread: a.updatedAt > since,
    }));

    predictionItems = recentPredictions.map((p) => ({
      id: `prediction-${p.id}`,
      type: "prediction",
      title: "MRI analysis ready",
      description: `Result: ${p.result.replace("_", " ")}`,
      href: "/patient/history",
      createdAt: p.createdAt.toISOString(),
      unread: p.createdAt > since,
    }));
  }

  const items = [...messageItems, ...appointmentItems, ...predictionItems]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20);

  const unreadCount = items.filter((i) => i.unread).length;

  return NextResponse.json({ items, unreadCount });
}

// PATCH /api/notifications -> 
export async function PATCH() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.chatMessage.updateMany({
    where: { receiverId: session.user.id, read: false },
    data: { read: true },
  });

  return NextResponse.json({ success: true });
}
