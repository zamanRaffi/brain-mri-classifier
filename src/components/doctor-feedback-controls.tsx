"use client";

import { useState, useTransition } from "react";

type FeedbackStatus = "APPROVE" | "REJECT" | "NEEDS_REVIEW";

function normalizeFeedbackStatus(status?: string | null): FeedbackStatus | null {
  switch (status) {
    case "APPROVED":
      return "APPROVE";
    case "REJECTED":
      return "REJECT";
    case "NEEDS_REVIEW":
      return "NEEDS_REVIEW";
    default:
      return null;
  }
}

function toPersistedStatus(status: FeedbackStatus) {
  switch (status) {
    case "APPROVE":
      return "APPROVED";
    case "REJECT":
      return "REJECTED";
    case "NEEDS_REVIEW":
      return "NEEDS_REVIEW";
  }
}

type ReviewPayload = {
  feedback: FeedbackStatus;
  comment: string;
};

const options: Array<{ value: FeedbackStatus; label: string }> = [
  { value: "APPROVE", label: "Approve" },
  { value: "REJECT", label: "Reject" },
  { value: "NEEDS_REVIEW", label: "Needs Review" },
];

export function DoctorFeedbackControls({
  predictionId,
  initialStatus,
  initialComment,
  onStatusChange,
}: {
  predictionId: string;
  initialStatus?: string | null;
  initialComment?: string | null;
  onStatusChange?: (status: string | null, comment: string | null) => void;
}) {
  const [feedback, setFeedback] = useState<FeedbackStatus | null>(() =>
    normalizeFeedbackStatus(initialStatus)
  );
  const [comment, setComment] = useState(initialComment ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [savedComment, setSavedComment] = useState(initialComment ?? "");
  const shouldShowCommentBox = feedback === "NEEDS_REVIEW";
  const hasUnsavedComment = shouldShowCommentBox && comment.trim() !== (savedComment ?? "").trim();

  const submitFeedback = (nextFeedback: FeedbackStatus, nextComment: string) => {
    setError(null);

    startTransition(async () => {
      try {
        const trimmedComment = nextComment.trim();
        const payload: ReviewPayload = { feedback: nextFeedback, comment: trimmedComment };
        const response = await fetch(`/api/predict/${predictionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.error || "Failed to update feedback.");
        }

        setFeedback(nextFeedback);
        setSavedComment(trimmedComment);
        onStatusChange?.(toPersistedStatus(nextFeedback), trimmedComment || null);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update feedback.");
      }
    });
  };

  // Approve/Reject don't need a note, so they submit immediately on click.
  // Needs Review, though, should only open the note box — it must NOT
  // submit right away, otherwise it fires off to the server before the
  // doctor has typed anything, and there was never a way to send the note
  // afterwards. Submitting it now happens explicitly via the Save button
  // (or Ctrl/Cmd+Enter) below.
  const handleFeedback = (nextFeedback: FeedbackStatus) => {
    setError(null);
    if (nextFeedback === "NEEDS_REVIEW") {
      setFeedback("NEEDS_REVIEW");
      return;
    }
    submitFeedback(nextFeedback, comment);
  };

  const handleSaveNote = () => {
    submitFeedback("NEEDS_REVIEW", comment);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {options.map((option) => {
          const isActive = feedback === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                void handleFeedback(option.value);
              }}
              disabled={isPending}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-on-primary"
                  : "border border-outline-variant/50 bg-surface text-on-surface hover:bg-surface-container-low"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      {shouldShowCommentBox ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              // Stop Space/Enter (and every other key) from bubbling up to
              // the expandable row's own keydown handler, so typing here
              // never gets hijacked into an expand/collapse toggle.
              event.stopPropagation();
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                if (comment.trim().length > 0) handleSaveNote();
              }
            }}
            placeholder="Add reason or note"
            disabled={isPending}
            className="min-h-16 w-full rounded-xl border border-outline-variant/40 bg-surface px-3 py-2 text-sm text-on-surface outline-none disabled:opacity-60"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleSaveNote();
              }}
              disabled={isPending || comment.trim().length === 0 || !hasUnsavedComment}
              className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-on-primary transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Saving…" : "Save note"}
            </button>
            <span className="text-[11px] text-on-surface-variant">
              {hasUnsavedComment ? "Unsaved changes" : "Ctrl/Cmd + Enter to save"}
            </span>
          </div>
        </div>
      ) : null}
      {error ? <span className="text-xs text-error">{error}</span> : null}
    </div>
  );
}
