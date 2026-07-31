"use client";

import { useMemo, useState } from "react";
import { Badge, EmptyState } from "@/components/dashboard/ui";
import { ExpandablePredictionRow } from "@/components/expandable-prediction-row";
import { DoctorFeedbackControls } from "@/components/doctor-feedback-controls";

type PredictionHistoryItem = {
  id: string;
  result: string;
  confidence: number;
  probabilities: Record<string, number> | null;
  gradCamUrl: string | null;
  createdAt: string;
  patientName?: string | null;
  feedback?: string | null;
  doctorStatus?: string | null;
  doctorComment?: string | null;
};

const RESULT_OPTIONS = [
  "GLIOMA",
  "MENINGIOMA",
  "PITUITARY",
  "NO_TUMOR",
  "INCONCLUSIVE",
];

function getSeverityMeta(result: string) {
  switch (result.toUpperCase()) {
    case "NO_TUMOR":
      return { label: "Low", tone: "tertiary" as const };
    case "INCONCLUSIVE":
      return { label: "Medium", tone: "secondary" as const };
    default:
      return { label: "High", tone: "error" as const };
  }
}

function getDoctorStatusMeta(status?: string | null) {
  switch (status) {
    case "APPROVED":
      return { label: "Approved by Doctor", tone: "primary" as const };
    case "REJECTED":
      return { label: "Rejected by Doctor", tone: "error" as const };
    case "NEEDS_REVIEW":
      return { label: "Needs Review", tone: "secondary" as const };
    default:
      return { label: "Pending Review", tone: "outline" as const };
  }
}

export function PredictionHistoryList({
  predictions,
  view = "patient",
}: {
  predictions: PredictionHistoryItem[];
  view?: "doctor" | "patient";
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedResult, setSelectedResult] = useState("");
  const [reviewStates, setReviewStates] = useState<Record<string, { status?: string | null; comment?: string | null }>>(() =>
    Object.fromEntries(
      predictions.map((prediction) => [prediction.id, { status: prediction.doctorStatus, comment: prediction.doctorComment }])
    )
  );

  const filteredPredictions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return predictions.filter((prediction) => {
      const createdDate = new Date(prediction.createdAt).toISOString().slice(0, 10);
      const searchText = [
        prediction.patientName ?? "",
        prediction.result.replace(/_/g, " "),
        createdDate,
        prediction.result,
      ]
        .join(" ")
        .toLowerCase();
      const matchSearch =
        normalizedQuery.length === 0 || searchText.includes(normalizedQuery);
      const matchDate = selectedDate.length === 0 || createdDate === selectedDate;
      const matchResult =
        selectedResult.length === 0 || prediction.result === selectedResult;

      return matchSearch && matchDate && matchResult;
    });
  }, [predictions, searchQuery, selectedDate, selectedResult]);

  if (predictions.length === 0) {
    return <EmptyState icon="history" message="No predictions available yet." />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low/70 p-4">
        <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr]">
          <label className="flex flex-col gap-2 text-sm font-medium text-on-surface-variant">
            <span>Search Patient</span>
            <div className="flex items-center gap-2 rounded-xl border border-outline-variant/40 bg-surface px-3 py-2">
              <span className="material-symbols-outlined text-base">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by patient, result, or date"
                className="w-full border-none bg-transparent text-sm text-on-surface outline-none"
              />
            </div>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-on-surface-variant">
            <span>Filter by Date</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="rounded-xl border border-outline-variant/40 bg-surface px-3 py-2 text-sm text-on-surface outline-none"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-on-surface-variant">
            <span>Filter by Result</span>
            <select
              value={selectedResult}
              onChange={(event) => setSelectedResult(event.target.value)}
              className="rounded-xl border border-outline-variant/40 bg-surface px-3 py-2 text-sm text-on-surface outline-none"
            >
              <option value="">All Results</option>
              {RESULT_OPTIONS.map((result) => (
                <option key={result} value={result}>
                  {result.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {filteredPredictions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-outline-variant/40 bg-surface-container-low/50 p-8 text-center text-sm text-on-surface-variant">
          No predictions match the current filters.
        </div>
      ) : (
        <div className="divide-y divide-outline-variant/20 overflow-hidden rounded-2xl border border-outline-variant/20">
          {filteredPredictions.map((prediction) => {
            const severity = getSeverityMeta(prediction.result);
            const isAbnormal =
              prediction.result.toUpperCase() !== "NO_TUMOR" &&
              prediction.result.toUpperCase() !== "NORMAL";
            const reviewState = reviewStates[prediction.id] ?? {
              status: prediction.doctorStatus,
              comment: prediction.doctorComment,
            };

            return (
              <div key={prediction.id}>
              <ExpandablePredictionRow
                probabilities={prediction.probabilities}
                gradCamUrl={prediction.gradCamUrl}
                result={prediction.result}
                confidence={prediction.confidence}
                createdAt={prediction.createdAt}
              >
                {view === "doctor" ? (
                  <div className="flex w-full items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                        {prediction.patientName?.charAt(0).toUpperCase() ?? "P"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-on-surface truncate">
                          {prediction.patientName}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          {new Date(prediction.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <DoctorFeedbackControls
                        predictionId={prediction.id}
                        initialStatus={reviewState.status}
                        initialComment={reviewState.comment}
                        onStatusChange={(status, comment) => {
                          setReviewStates((current) => ({
                            ...current,
                            [prediction.id]: { status, comment },
                          }));
                        }}
                      />
                      <div className="text-right">
                        <p className="font-medium text-on-surface">
                          {prediction.result.replace(/_/g, " ")}
                        </p>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            isAbnormal
                              ? "bg-error-container text-on-error-container"
                              : "bg-tertiary-container/10 text-tertiary"
                          }`}
                        >
                          {(prediction.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
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
                        {new Date(prediction.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                <div className="ml-auto flex shrink-0 items-center gap-2">
                  {reviewState.status ? (
                    <Badge tone={getDoctorStatusMeta(reviewState.status).tone}>
                      {getDoctorStatusMeta(reviewState.status).label}
                    </Badge>
                  ) : null}
                  <Badge tone={severity.tone}>Severity: {severity.label}</Badge>
                </div>
              </ExpandablePredictionRow>
              {view === "patient" && reviewState.comment ? (
                <div className="px-4 pb-4 -mt-1 md:px-5">
                  <div className="rounded-xl border border-outline-variant/40 bg-surface-container-low/70 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                      Doctor note
                    </p>
                    <p className="mt-1 text-sm text-on-surface">{reviewState.comment}</p>
                  </div>
                </div>
              ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
