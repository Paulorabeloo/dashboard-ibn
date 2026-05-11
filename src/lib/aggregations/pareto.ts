import type { Filter } from '@/lib/filters';
import type { DashboardData } from '@/types/domain';

import { selectAtual } from './helpers';

/*
 * Pareto de vendedoras — barras ordenadas por volume + linha do
 * percentual acumulado. Útil pra visualizar concentração ("top 5
 * vendedoras = 42% do total").
 */

export interface ParetoEntry {
  readonly vendedoraId: string;
  readonly nome: string;
  readonly total: number;
  readonly pct: number;
  readonly acumuladoPct: number;
}

export interface ParetoResult {
  readonly totalGeral: number;
  readonly entries: ReadonlyArray<ParetoEntry>;
  /** % do total nas top N (pra exibir em destaque). */
  readonly top5Pct: number;
  readonly top10Pct: number;
}

export function paretoVendedoras(
  data: DashboardData,
  filter: Filter,
  limit: number = 25,
): ParetoResult {
  const matr = selectAtual(data, filter);

  const byVend = new Map<string, number>();
  const nomeMap = new Map<string, string>();
  for (const m of matr) {
    if (m.vendedoraId === 'desconhecido') continue;
    byVend.set(m.vendedoraId, (byVend.get(m.vendedoraId) ?? 0) + 1);
    nomeMap.set(m.vendedoraId, m.vendedoraNome || m.vendedoraId);
  }

  const sorted = Array.from(byVend.entries()).sort((a, b) => b[1] - a[1]);
  const totalGeral = sorted.reduce((s, [, v]) => s + v, 0);

  let acumulado = 0;
  const entries: ParetoEntry[] = sorted.slice(0, limit).map(([id, total]) => {
    acumulado += total;
    return {
      vendedoraId: id,
      nome: nomeMap.get(id) ?? id,
      total,
      pct: totalGeral === 0 ? 0 : (total / totalGeral) * 100,
      acumuladoPct: totalGeral === 0 ? 0 : (acumulado / totalGeral) * 100,
    };
  });

  const totalAt = (n: number) =>
    sorted.slice(0, n).reduce((s, [, v]) => s + v, 0);
  const top5Pct = totalGeral === 0 ? 0 : (totalAt(5) / totalGeral) * 100;
  const top10Pct = totalGeral === 0 ? 0 : (totalAt(10) / totalGeral) * 100;

  return { totalGeral, entries, top5Pct, top10Pct };
}
