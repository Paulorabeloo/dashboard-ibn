import type { Outlier } from '@/lib/aggregations/outliers';

/*
 * Badge visual pra destacar outliers — vermelho pra queda anormal,
 * verde pra performance fora da curva.
 */

interface AnomalyBadgeProps {
  readonly outlier: Outlier;
  readonly compact?: boolean;
}

export function AnomalyBadge({ outlier, compact = false }: AnomalyBadgeProps) {
  const isAlto = outlier.tipo === 'alto';
  const cor = isAlto
    ? 'border-positive/30 bg-positive/10 text-positive'
    : 'border-negative/30 bg-negative/10 text-negative';
  const icone = isAlto ? '↑' : '↓';
  const titulo = isAlto ? 'Acima do padrão' : 'Abaixo do padrão';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium tabular ${cor}`}
      title={`${titulo} · z-score ${outlier.zscore.toFixed(2)}`}
    >
      <span aria-hidden="true">{icone}</span>
      {!compact && <span>{outlier.zscore.toFixed(1)}σ</span>}
    </span>
  );
}

interface AnomalySummaryProps {
  readonly altos: ReadonlyArray<Outlier>;
  readonly baixos: ReadonlyArray<Outlier>;
  readonly label?: string;
}

export function AnomalySummary({ altos, baixos, label = 'no recorte' }: AnomalySummaryProps) {
  if (altos.length === 0 && baixos.length === 0) {
    return (
      <div className="text-xs text-muted-foreground">
        Distribuição dentro do esperado {label}.
      </div>
    );
  }
  return (
    <div className="space-y-2 text-xs">
      {altos.length > 0 && (
        <div>
          <span className="font-medium text-positive">↑ Acima do padrão:</span>{' '}
          <span className="text-foreground">
            {altos.map((o) => `${o.label} (${o.zscore.toFixed(1)}σ)`).join(' · ')}
          </span>
        </div>
      )}
      {baixos.length > 0 && (
        <div>
          <span className="font-medium text-negative">↓ Abaixo do padrão:</span>{' '}
          <span className="text-foreground">
            {baixos.map((o) => `${o.label} (${o.zscore.toFixed(1)}σ)`).join(' · ')}
          </span>
        </div>
      )}
    </div>
  );
}
