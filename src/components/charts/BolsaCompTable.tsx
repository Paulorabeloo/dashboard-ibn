import type { BolsaComp } from '@/lib/aggregations/bolsaComparativa';

import { Delta } from '@/components/kpi/Delta';

/*
 * Tabela de bolsas: atual vs ciclo anterior com delta absoluto e %.
 */

interface Props {
  readonly rows: ReadonlyArray<BolsaComp>;
}

export function BolsaCompTable({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
        Sem dados.
      </div>
    );
  }

  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-border text-left text-muted-foreground">
          <th className="py-1.5 pr-2 font-medium">Bolsa / Convênio</th>
          <th className="py-1.5 pr-2 text-right font-medium">Atual</th>
          <th className="py-1.5 pr-2 text-right font-medium">% recorte</th>
          <th className="py-1.5 pr-2 text-right font-medium">Anterior</th>
          <th className="py-1.5 text-right font-medium">Δ vs anterior</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.bolsa} className="border-b border-border last:border-0">
            <td className="py-1.5 pr-2 truncate">{row.bolsa}</td>
            <td className="py-1.5 pr-2 text-right tabular font-medium">
              {row.atual.toLocaleString('pt-BR')}
            </td>
            <td className="py-1.5 pr-2 text-right tabular text-muted-foreground">
              {row.pctAtual.toFixed(1)}%
            </td>
            <td className="py-1.5 pr-2 text-right tabular text-muted-foreground">
              {row.anterior.toLocaleString('pt-BR')}
            </td>
            <td className="py-1.5 text-right">
              {row.anterior === 0 && row.atual === 0 ? (
                <span className="text-muted-foreground">—</span>
              ) : (
                <Delta value={row.deltaAbs} pct={row.anterior > 0 ? row.deltaPct : undefined} />
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
