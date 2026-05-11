import type { RankingEntry } from '@/lib/aggregations/rankingVendedoras';

import { Delta } from '@/components/kpi/Delta';

/*
 * RF-06 — Ranking de vendedoras (tabela densa).
 * Server-renderable. 🔒 PII (nome) — só renderiza para gestor logado
 * (rota está dentro de /(protected)).
 */

interface Props {
  readonly data: ReadonlyArray<RankingEntry>;
  readonly limit?: number;
}

export function RankingTable({ data, limit = 15 }: Props) {
  const sliced = data.slice(0, limit);
  if (sliced.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
        Sem matrículas no recorte.
      </div>
    );
  }

  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-border text-left text-muted-foreground">
          <th className="w-6 py-1.5 pr-2 font-medium">#</th>
          <th className="py-1.5 pr-2 font-medium">Vendedora</th>
          <th className="py-1.5 pr-2 font-medium">Polo</th>
          <th className="py-1.5 pr-2 text-right font-medium">Total</th>
          <th className="w-20 py-1.5 text-right font-medium">Δ ciclo ant.</th>
        </tr>
      </thead>
      <tbody>
        {sliced.map((row, i) => (
          <tr key={row.vendedoraId} className="border-b border-border last:border-0">
            <td className="py-1.5 pr-2 tabular text-muted-foreground">{i + 1}</td>
            <td className="py-1.5 pr-2">{row.nome}</td>
            <td className="py-1.5 pr-2 truncate text-muted-foreground">
              {row.poloPrincipalNome ?? '—'}
            </td>
            <td className="py-1.5 pr-2 text-right tabular font-medium">
              {row.total.toLocaleString('pt-BR')}
            </td>
            <td className="py-1.5 text-right">
              <Delta value={row.deltaAbs} format="abs" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
