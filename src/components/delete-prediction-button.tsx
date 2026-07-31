"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function DeletePredictionButton({
  predictionId,
}: {
  predictionId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleDelete = async () => {
    startTransition(async () => {
      const response = await fetch(`/api/predict/${predictionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setIsConfirmOpen(false);
        router.refresh();
      } else {
        const data = await response.json().catch(() => null);
        setIsConfirmOpen(false);
        window.alert(data?.error || "Failed to delete prediction.");
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setIsConfirmOpen(true);
        }}
        className="inline-flex items-center gap-2 rounded-full border border-error/40 bg-error-container/40 px-3 py-1.5 text-sm font-medium text-error hover:bg-error-container/70 disabled:opacity-60"
        disabled={isPending}
      >
        <span className="material-symbols-outlined text-base">delete</span>
        {isPending ? "Removing..." : "Delete"}
      </button>

      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-outline-variant/40 bg-surface p-6 shadow-2xl">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-error-container text-error">
                <span className="material-symbols-outlined">delete_forever</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-on-surface">
                  Remove this prediction?
                </h3>
                <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                  This will delete the selected MRI prediction from your history.
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setIsConfirmOpen(false);
                }}
                className="rounded-full border border-outline-variant/50 px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container-low"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  void handleDelete();
                }}
                className="rounded-full bg-error px-4 py-2 text-sm font-medium text-on-error hover:opacity-90 disabled:opacity-60"
                disabled={isPending}
              >
                {isPending ? "Removing..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
