export function PageHeader({
  title,
  subtitle,
  className = "mb-6 md:mb-8",
}: {
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <h1 className="text-2xl md:text-[28px] font-semibold text-on-surface leading-tight">
        {title}
      </h1>
      {subtitle && (
        <p className="text-sm text-on-surface-variant mt-1 max-w-2xl">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function StatCard({
  icon,
  label,
  value,
  tone = "primary",
}: {
  icon: string;
  label: string;
  value: React.ReactNode;
  tone?: "primary" | "secondary" | "tertiary";
}) {
  const toneClasses = {
    primary: "bg-primary-container/10 text-primary",
    secondary: "bg-secondary-container/20 text-secondary",
    tertiary: "bg-tertiary-container/10 text-tertiary",
  }[tone];

  return (
    <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/30 soft-shadow flex items-center gap-4">
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${toneClasses}`}
      >
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium tracking-wide text-on-surface-variant uppercase">
          {label}
        </p>
        <p className="text-xl font-semibold text-on-surface truncate">
          {value}
        </p>
      </div>
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-surface-container-lowest rounded-2xl border border-outline-variant/30 soft-shadow ${className}`}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "tertiary",
}: {
  children: React.ReactNode;
  tone?: "tertiary" | "primary" | "secondary" | "error" | "outline";
}) {
  const toneClasses = {
    tertiary: "bg-tertiary/10 text-tertiary",
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    error: "bg-error-container text-on-error-container",
    outline: "bg-surface-container text-on-surface-variant",
  }[tone];

  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${toneClasses}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  icon,
  message,
}: {
  icon: string;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-on-surface-variant">
      <span className="material-symbols-outlined text-4xl text-outline">
        {icon}
      </span>
      <p className="text-sm">{message}</p>
    </div>
  );
}