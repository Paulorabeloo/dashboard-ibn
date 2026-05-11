import type { Filter } from '@/lib/filters';
import type { DashboardData } from '@/types/domain';

import { safePct, selectAnterior, selectAtual } from './helpers';

/*
 * NS-1 (T-302) — Matrículas no ciclo atual com delta vs mesmo ponto
 * do ciclo anterior.
 */

export interface TotalMatriculasResult {
  readonly atual: number;
  readonly anterior: number;
  readonly deltaAbs: number;
  /** Variação percentual; 0 quando não há base de comparação. */
  readonly deltaPct: number;
  /** True se conseguimos comparar com ciclo anterior. */
  readonly hasComparison: boolean;
}

export function totalMatriculas(data: DashboardData, filter: Filter): TotalMatriculasResult {
  const atual = selectAtual(data, filter).length;
  const anterior = selectAnterior(data, filter).length;
  const deltaAbs = atual - anterior;
  const deltaPct = safePct(deltaAbs, anterior);
  return {
    atual,
    anterior,
    deltaAbs,
    deltaPct,
    hasComparison: filter.cicloId !== 'all' && anterior > 0,
  };
}
