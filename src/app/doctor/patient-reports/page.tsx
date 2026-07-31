import { auth } from "../../../auth";
import { prisma } from "../../../lib/prisma";
import { PageHeader, Card } from "../../../components/dashboard/ui";
import { PredictionHistoryList } from "../../../components/prediction-history-list";

export default async function PatientReportsPage() {
  const session = await auth();

  // Patients under this doctor's care. Only appointments the doctor has
  // actually CONFIRMED (or completed) count — a PENDING request that the
  // doctor hasn't approved yet must not grant access to that patient's
  // full report history. Without this filter, any patient could request an
  // appointment with any doctor and instantly expose their entire scan
  // history, regardless of whether the doctor ever accepted them.
  const patientIds = await prisma.appointment.findMany({
    where: {
      doctorId: session!.user.id,
      status: { in: ["CONFIRMED", "COMPLETED"] },
    },
    distinct: ["patientId"],
    select: { patientId: true },
  });

  const predictions = await prisma.prediction.findMany({
    where: { patientId: { in: patientIds.map((p) => p.patientId) } },
    include: { patient: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title=""
        subtitle="AI-assisted MRI analyses for patients under your care."
      />

      <Card className="overflow-hidden">
        <PredictionHistoryList
          view="doctor"
          predictions={predictions.map((prediction) => ({
            id: prediction.id,
            result: prediction.result,
            confidence: prediction.confidence,
            probabilities: prediction.probabilities as Record<string, number> | null,
            gradCamUrl: prediction.gradCamUrl,
            createdAt: prediction.createdAt.toISOString(),
            patientName: prediction.patient.name,
            feedback: prediction.notes,
            doctorStatus: prediction.doctorStatus,
            doctorComment: prediction.doctorComment,
          }))}
        />
      </Card>
    </div>
  );
}
