/*
 * KPICard simples — card branco com label, valor e detalhe.
 */

interface KPICardProps {
  readonly label: string;
  readonly value: React.ReactNode;
  readonly detail?: React.ReactNode;
  readonly hint?: string | undefined;
  readonly icon?: React.ReactNode;
  readonly accentColor?: string;
  readonly sparkline?: React.ReactNode;
  readonly compact?: boolean;
}

export function KPICard({
  label,
  value,
  detail,
  hint,
  icon,
  accentColor,
  sparkline,
}: KPICardProps) {
  return (
    <div
      className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-4 transition-shadow hover:shadow-sm"
      style={accentColor ? { borderTop: `2px solid ${accentColor}` } : undefined}
    >
      <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {icon && (
          <span aria-hidden="true" style={{ color: accentColor ?? 'currentColor' }}>
            {icon}
          </span>
        )}
        <span>{label}</span>
      </div>
      <div className="text-3xl font-semibold tabular leading-tight">{value}</div>
      {detail && <div className="flex items-center gap-2 text-xs">{detail}</div>}
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
      {sparkline && <div className="mt-3">{sparkline}</div>}
    </div>
  );
}
