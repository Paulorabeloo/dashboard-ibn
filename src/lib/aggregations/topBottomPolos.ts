import type { Filter } from '@/lib/filters';
import type { DashboardData, Matricula, Polo } from '@/types/domain';

import { selectAnterior, selectAtual } from './helpers';

/*
 * NS-4 (T-305) — Top 3 / Bottom 3 polos por crescimento absoluto vs
 * mesmo ponto do ciclo anterior.
 *
 * Empate é resolvido pela ordem alfabética do nome canônico.
 */

export interface PoloRank {
  readonly polo: Polo;
  readonly atual: number;
  readonly anterior: number;
  readonly deltaAbs: number;
}

export interface TopBottomPolosResult {
  readonly top: ReadonlyArray<PoloRank>;
  readonly bottom: ReadonlyArray<PoloRank>;
}

function countByPolo(matriculas: ReadonlyArray<Matricula>): Map<string, number> {
  const m = new Map<string, number>();
  for (const mat of matriculas) m.set(mat.poloId, (m.get(mat.poloId) ?? 0) + 1);
  return m;
}

export function topBottomPolos(
  data: DashboardData,
  filter: Filter,
  k: number = 3,
): TopBottomPolosResult {
  const atualList = selectAtual(data, filter);
  const anteriorList = selectAnterior(data, filter);

  const cAtual = countByPolo(atualList);
  const cAnterior = countByPolo(anteriorList);

  const polosMap = new Map(data.polos.map((p) => [p.id, p]));
  const allIds = new Set<string>();
  for (const id of cAtual.keys()) allIds.add(id);
  for (const id of cAnterior.keys()) allIds.add(id);

  const ranking: PoloRank[] = Array.from(allIds).map((id) => {
    const polo = polosMap.get(id) ?? { id, nomeCanonico: id, aliases: [] };
    const atual = cAtual.get(id) ?? 0;
    const anterior = cAnterior.get(id) ?? 0;
    return { polo, atual, anterior, deltaAbs: atual - anterior };
  });

  ranking.sort((a, b) => {
    if (a.deltaAbs !== b.deltaAbs) return b.deltaAbs - a.deltaAbs;
    return a.polo.nomeCanonico.localeCompare(b.polo.nomeCanonico);
  });

  const top = ranking.slice(0, k);
  // Bottom = pior primeiro (mais negativo). Inverte a ordem desc.
  const bottom = ranking.slice(-k).reverse();
  return { top, bottom };
}
