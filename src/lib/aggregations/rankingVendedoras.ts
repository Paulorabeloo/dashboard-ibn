import type { Filter } from '@/lib/filters';
import type { DashboardData, Matricula } from '@/types/domain';

import { selectAnterior, selectAtual } from './helpers';

/*
 * RF-06 / T-402 — Ranking de vendedoras unificado.
 * Total no recorte + delta vs mesmo ponto do ciclo anterior.
 */

export interface RankingEntry {
  readonly vendedoraId: string;
  /** 🔒 PII — só renderizar para gestor logado. */
  readonly nome: string;
  readonly total: number;
  readonly anterior: number;
  readonly deltaAbs: number;
  readonly poloPrincipalNome: string | null;
}

function countByVendedora(matriculas: ReadonlyArray<Matricula>): Map<string, number> {
  const m = new Map<string, number>();
  for (const mat of matriculas) {
    if (mat.vendedoraId === 'desconhecido') continue;
    m.set(mat.vendedoraId, (m.get(mat.vendedoraId) ?? 0) + 1);
  }
  return m;
}

export function rankingVendedoras(data: DashboardData, filter: Filter): RankingEntry[] {
  const atualList = selectAtual(data, filter);
  const anteriorList = selectAnterior(data, filter);

  const cAtual = countByVendedora(atualList);
  const cAnt = countByVendedora(anteriorList);

  const ids = new Set<string>([...cAtual.keys(), ...cAnt.keys()]);
  const vendedoraMap = new Map(data.vendedoras.map((v) => [v.id, v]));
  const polosMap = new Map(data.polos.map((p) => [p.id, p]));

  const entries: RankingEntry[] = [];
  for (const id of ids) {
    const v = vendedoraMap.get(id);
    const total = cAtual.get(id) ?? 0;
    const anterior = cAnt.get(id) ?? 0;
    if (total === 0 && anterior === 0) continue;
    entries.push({
      vendedoraId: id,
      nome: v?.nome ?? id,
      total,
      anterior,
      deltaAbs: total - anterior,
      poloPrincipalNome: v?.poloPrincipalId
        ? polosMap.get(v.poloPrincipalId)?.nomeCanonico ?? null
        : null,
    });
  }

  entries.sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    return a.nome.localeCompare(b.nome);
  });

  return entries;
}
