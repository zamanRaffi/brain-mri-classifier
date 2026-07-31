"use client";

import { useState } from "react";
import { ProbabilityBars } from "../components/probability-bars";
import { ReportButton } from "../components/report-button";

export function ExpandablePredictionRow({
  children,
  probabilities,
  gradCamUrl,
  patientName,
  result,
  confidence,
  createdAt,
}: {
  children: React.ReactNode;
  probabilities: Record<string, number> | null;
  gradCamUrl?: string | null;
  patientName?: string;
  result?: string;
  confidence?: number;
  createdAt?: string | Date;
}) {
  const [open, setOpen] = useState(false);
  const hasBreakdown = probabilities && Object.keys(probabilities).length > 0;
  const hasReport = typeof result === "string" && typeof confidence === "number";
  const canExpand = hasBreakdown || !!gradCamUrl || hasReport;

  const handleToggle = () => {
    if (canExpand) {
      setOpen((v) => !v);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!canExpand) {
      return;
    }

    // Only treat Enter/Space as "toggle the row" when the row itself is
    // focused. Without this check, Enter/Space presses inside nested
    // interactive elements (the doctor feedback textarea, buttons, etc.)
    // bubble up to this handler and get swallowed by preventDefault()
    // here — which is why typing a space or pressing Enter in the note
    // box did nothing.
    if (event.target !== event.currentTarget) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleToggle();
    }
  };

  return (
    <div>
      <div
        role={canExpand ? "button" : undefined}
        tabIndex={canExpand ? 0 : -1}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={`w-full text-left ${canExpand ? "cursor-pointer" : "cursor-default"}`}
        aria-expanded={canExpand ? open : undefined}
      >
        <div className="p-4 md:p-5 flex items-center justify-between gap-4 hover:bg-surface-container-low transition-colors">
          {children}
          {canExpand && (
            <span
              className={`material-symbols-outlined text-on-surface-variant shrink-0 transition-transform ${
                open ? "rotate-180" : ""
              }`}
            >
              expand_more
            </span>
          )}
        </div>
      </div>

      {open && canExpand && (
        <div className="px-4 md:px-5 pb-5 -mt-1 flex flex-col gap-4 md:flex-row">
          {hasBreakdown && (
            <div className="bg-surface-container-low rounded-xl p-4 flex-1">
              <p className="text-xs font-medium tracking-wide text-on-surface-variant uppercase mb-3">
                Probability Breakdown
              </p>
              <ProbabilityBars probabilities={probabilities!} />
            </div>
          )}

          {gradCamUrl && (
            <div className="bg-surface-container-low rounded-xl p-4 flex-1">
              <p className="text-xs font-medium tracking-wide text-on-surface-variant uppercase mb-3">
                Grad-CAM Heatmap
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={gradCamUrl}
                alt="Grad-CAM heatmap overlay showing the regions of the scan the model weighted most heavily"
                className="w-full max-h-56 rounded-lg object-contain border border-outline-variant/30"
              />
            </div>
          )}

          {hasReport && (
            <div className="flex md:items-end">
              <ReportButton
                result={result!}
                confidence={confidence!}
                gradCamUrl={gradCamUrl}
                createdAt={createdAt}
                patientName={patientName}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
