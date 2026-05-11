/*
 * Delta indicator — número + sinal explícito + ícone + cor (RNF-06).
 * Cor sozinha NÃO carrega significado: também tem ícone e sinal.
 */

interface DeltaProps {
  /** Variação absoluta (positiva = cresceu, negativa = caiu). */
  readonly value: number;
  /** Variação percentual (formatada com 1 casa). Pode ser undefined se não houver base. */
  readonly pct?: number | undefined;
  /** "abs" mostra delta absoluto + pct entre parênteses. "pct" mostra só percentual. */
  readonly format?: 'abs' | 'pct';
}

export function Delta({ value, pct, format = 'abs' }: DeltaProps) {
  const isUp = value > 0;
  const isDown = value < 0;
  const sign = isUp ? '+' : isDown ? '−' : '±'; // U+2212 minus, U+00B1 plus-minus
  const arrow = isUp ? '↗' : isDown ? '↘' : '→'; // U+2197/2198/2192
  const colorClass = isUp
    ? 'text-emerald-600 dark:text-emerald-400'
    : isDown
      ? 'text-rose-600 dark:text-rose-400'
      : 'text-muted-foreground';

  const main = format === 'pct'
    ? pct == null
      ? '—'
      : `${sign}${Math.abs(pct).toFixed(1)}%`
    : `${sign}${Math.abs(value)}${pct != null ? ` (${sign}${Math.abs(pct).toFixed(1)}%)` : ''}`;

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs tabular ${colorClass}`}
      aria-label={`Variação ${isUp ? 'positiva' : isDown ? 'negativa' : 'neutra'}: ${main}`}
    >
      <span aria-hidden="true">{arrow}</span>
      <span>{main}</span>
    </span>
  );
}
