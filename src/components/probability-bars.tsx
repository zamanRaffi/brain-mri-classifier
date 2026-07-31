const CLASS_META: Record<
  string,
  { label: string; barClass: string; textClass: string }
> = {
  glioma: { label: "Glioma", barClass: "bg-error", textClass: "text-error" },
  meningioma: {
    label: "Meningioma",
    barClass: "bg-secondary",
    textClass: "text-secondary",
  },
  pituitary: {
    label: "Pituitary",
    barClass: "bg-primary",
    textClass: "text-primary",
  },
  notumor: {
    label: "No Tumor",
    barClass: "bg-tertiary",
    textClass: "text-tertiary",
  },
};

export function ProbabilityBars({
  probabilities,
  className = "",
}: {
  probabilities: Record<string, number>;
  className?: string;
}) {
  const rows = Object.entries(probabilities).sort((a, b) => b[1] - a[1]);

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {rows.map(([key, value]) => {
        const meta = CLASS_META[key] ?? {
          label: key,
          barClass: "bg-outline",
          textClass: "text-on-surface-variant",
        };
        const pct = Math.max(0, Math.min(1, value)) * 100;

        return (
          <div key={key} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-xs font-medium text-on-surface-variant">
              {meta.label}
            </span>
            <div className="flex-1 h-2 rounded-full bg-surface-container overflow-hidden">
              <div
                className={`h-full rounded-full ${meta.barClass} transition-all duration-500`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span
              className={`w-12 shrink-0 text-right text-xs font-semibold ${meta.textClass}`}
            >
              {pct.toFixed(1)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
