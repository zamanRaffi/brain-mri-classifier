import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  doctorId: z.string(),
  scheduledAt: z.string(), // ISO date string
  reason: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const where =
    session.user.role === "PATIENT"
      ? { patientId: session.user.id }
      : { doctorId: session.user.id };

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      patient: { select: { id: true, name: true, email: true } },
      doctor: { select: { id: true, name: true, specialization: true } },
    },
    orderBy: { scheduledAt: "asc" },
  });

  return NextResponse.json({ appointments });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "PATIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { doctorId, scheduledAt, reason } = parsed.data;

  const appointment = await prisma.appointment.create({
    data: {
      patientId: session.user.id,
      doctorId,
      scheduledAt: new Date(scheduledAt),
      reason,
    },
  });

  return NextResponse.json({ appointment }, { status: 201 });
}
