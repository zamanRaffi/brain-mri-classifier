import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, EmptyState } from "@/components/dashboard/ui";
import { ExpandablePredictionRow } from "@/components/expandable-prediction-row";
import { DeletePredictionButton } from "@/components/delete-prediction-button";

export default async function HistoryPage() {
  const session = await auth();
  const predictions = await prisma.prediction.findMany({
    where: { patientId: session!.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title=""
        subtitle="A longitudinal record of every MRI scan you've analyzed with NeuroBrain."
      />

      <Card className="overflow-hidden">
        {predictions.length === 0 ? (
          <EmptyState icon="history" message="No predictions available yet." />
        ) : (
          <div className="divide-y divide-outline-variant/20">
            {predictions.map((prediction) => {
              const isAbnormal =
                prediction.result.toUpperCase() !== "NO_TUMOR" &&
                prediction.result.toUpperCase() !== "NORMAL";
              const severity =
                prediction.result.toUpperCase() === "NO_TUMOR"
                  ? { label: "Low", tone: "tertiary" as const }
                  : prediction.result.toUpperCase() === "INCONCLUSIVE"
                    ? { label: "Medium", tone: "secondary" as const }
                    : { label: "High", tone: "error" as const };
              const doctorStatusMeta =
                prediction.doctorStatus === "APPROVED"
                  ? { label: "Approved by Doctor", tone: "primary" as const }
                  : prediction.doctorStatus === "REJECTED"
                    ? { label: "Rejected by Doctor", tone: "error" as const }
                    : prediction.doctorStatus === "NEEDS_REVIEW"
                      ? { label: "Needs Review", tone: "secondary" as const }
                      : { label: "Pending Review", tone: "outline" as const };

              return (
                <ExpandablePredictionRow
                  key={prediction.id}
                  probabilities={
                    prediction.probabilities as Record<string, number> | null
                  }
                  gradCamUrl={prediction.gradCamUrl}
                  result={prediction.result}
                  confidence={prediction.confidence}
                  createdAt={prediction.createdAt.toISOString()}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        isAbnormal
                          ? "bg-error-container text-on-error-container"
                          : "bg-tertiary-container/10 text-tertiary"
                      }`}
                    >
                      <span className="material-symbols-outlined">
                        {isAbnormal ? "warning" : "check_circle"}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-on-surface truncate">
                        {prediction.result.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {prediction.createdAt.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      {prediction.doctorStatus ? (
                        <Badge tone={doctorStatusMeta.tone}>{doctorStatusMeta.label}</Badge>
                      ) : null}
                      <Badge tone={severity.tone}>Severity: {severity.label}</Badge>
                      <Badge tone={isAbnormal ? "error" : "tertiary"}>
                        {(prediction.confidence * 100).toFixed(1)}%
                      </Badge>
                      <DeletePredictionButton predictionId={prediction.id} />
                    </div>
                    {prediction.doctorComment ? (
                      <div className="rounded-xl border border-outline-variant/40 bg-surface-container-low/70 px-3 py-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                          Doctor note
                        </p>
                        <p className="mt-1 text-sm text-on-surface">{prediction.doctorComment}</p>
                      </div>
                    ) : null}
                  </div>
                </ExpandablePredictionRow>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
