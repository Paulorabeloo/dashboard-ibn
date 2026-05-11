/*
 * Section — card branco simples com título e hint.
 */
interface SectionProps {
  readonly title: string;
  readonly hint?: string;
  readonly action?: React.ReactNode;
  readonly children: React.ReactNode;
}

export function Section({ title, hint, action, children }: SectionProps) {
  return (
    <section className="rounded-lg border border-border bg-surface p-4">
      <header className="mb-3 flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
