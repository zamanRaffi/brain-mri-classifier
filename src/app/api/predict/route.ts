import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { predictMri, type TumorClass } from "@/lib/model";
import { generateGradCamPng } from "@/lib/gradcam";
import type { PredictionResult } from "@prisma/client";

const RESULT_MAP: Record<TumorClass | "inconclusive", PredictionResult> = {
  glioma: "GLIOMA",
  meningioma: "MENINGIOMA",
  pituitary: "PITUITARY",
  notumor: "NO_TUMOR",
  inconclusive: "INCONCLUSIVE",
};

export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "PATIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("image") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Image not found." }, { status: 400 });
  }

  try {
    const bytes = Buffer.from(await file.arrayBuffer());

    // Run the trained model (server-side, via @tensorflow/tfjs-node).
    const outcome = await predictMri(bytes);

    // Save the uploaded scan to local disk so it can be reviewed later.
    // For a serverless deployment (Vercel etc.) swap this for S3/Cloudinary,
    // since local disk storage doesn't persist between invocations there.
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `${Date.now()}-${safeName}`;
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      session.user.id
    );
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, fileName), bytes);
    const imageUrl = `/uploads/${session.user.id}/${fileName}`;

    // Best-effort Grad-CAM overlay showing which regions of the scan drove
    // the model's top prediction. Never let a Grad-CAM failure block saving
    // the prediction itself.
    let gradCamUrl: string | null = null;
    try {
      const gradCamPng = await generateGradCamPng(bytes, outcome.topClass);
      const gradCamFileName = `${Date.now()}-gradcam-${safeName.replace(/\.[^.]+$/, "")}.png`;
      await writeFile(path.join(uploadDir, gradCamFileName), gradCamPng);
      gradCamUrl = `/uploads/${session.user.id}/${gradCamFileName}`;
    } catch (gradCamErr) {
      console.error("Grad-CAM generation failed:", gradCamErr);
    }

    const prediction = await prisma.prediction.create({
      data: {
        patientId: session.user.id,
        imageUrl,
        gradCamUrl,
        result: RESULT_MAP[outcome.label],
        confidence: outcome.confidence,
        probabilities: outcome.probabilities,
      },
    });

    return NextResponse.json({ prediction }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create the prediction." },
      { status: 500 }
    );
  }
}
