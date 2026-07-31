import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const feedbackSchema = z.object({
  feedback: z.enum(["APPROVE", "REJECT", "NEEDS_REVIEW"]),
  comment: z.string().trim().max(500).optional().or(z.literal("")),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "DOCTOR") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = feedbackSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  try {
    const doctorStatus = parsed.data.feedback === "APPROVE"
      ? "APPROVED"
      : parsed.data.feedback === "REJECT"
        ? "REJECTED"
        : "NEEDS_REVIEW";

    const isNeedsReview = parsed.data.feedback === "NEEDS_REVIEW";
    const commentText = parsed.data.comment?.trim() || null;

    const result = await prisma.$executeRawUnsafe(
      `
        UPDATE "predictions"
        SET "doctorStatus" = $1,
            "doctorComment" = $2,
            "reviewedBy" = $3,
            "reviewedAt" = $4,
            "notes" = $5
        WHERE "id" = $6
      `,
      doctorStatus,
      isNeedsReview ? commentText : null,
      session.user.id,
      new Date(),
      isNeedsReview ? commentText : null,
      id
    );

    if (result === 0) {
      return NextResponse.json(
        { error: "Prediction not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update feedback." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "PATIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const deletedPrediction = await prisma.prediction.deleteMany({
      where: {
        id,
        patientId: session.user.id,
      },
    });

    if (deletedPrediction.count === 0) {
      return NextResponse.json(
        { error: "Prediction not found or you do not have permission to delete it." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete the prediction." },
      { status: 500 }
    );
  }
}
