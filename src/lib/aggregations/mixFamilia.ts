import type { Filter } from '@/lib/filters';
import type { DashboardData, Familia, Matricula } from '@/types/domain';

import { safePct, selectAnterior, selectAtual } from './helpers';

/*
 * NS-3 (T-304) — Mix de família (Graduação / Pós / Técnicos / Outro).
 *
 * Retorna ordem estável (graduacao, pos, tecnico, outro) com totais
 * absolutos, percentuais e delta de pp vs mesmo ponto do ciclo anterior.
 */

const ORDEM_ESTAVEL: ReadonlyArray<Familia> = ['graduacao', 'pos', 'tecnico', 'outro'];

export interface MixFamiliaEntry {
  readonly familia: Familia;
  readonly atual: number;
  /** Percentual atual sobre o total filtrado. */
  readonly pct: number;
  /** Variação em pontos percentuais vs ciclo anterior (mesmo offset). */
  readonly deltaPp: number;
}

function counts(matriculas: ReadonlyArray<Matricula>): Map<Familia, number> {
  const m = new Map<Familia, number>();
  for (const mat of matriculas) m.set(mat.familia, (m.get(mat.familia) ?? 0) + 1);
  return m;
}

export function mixFamilia(data: DashboardData, filter: Filter): MixFamiliaEntry[] {
  const atualList = selectAtual(data, filter);
  const anteriorList = selectAnterior(data, filter);

  const totalAtual = atualList.length;
  const totalAnterior = anteriorList.length;

  const cAtual = counts(atualList);
  const cAnterior = counts(anteriorList);

  return ORDEM_ESTAVEL.map((f) => {
    const n = cAtual.get(f) ?? 0;
    const nAnt = cAnterior.get(f) ?? 0;
    const pct = safePct(n, totalAtual);
    const pctAnt = safePct(nAnt, totalAnterior);
    return { familia: f, atual: n, pct, deltaPp: pct - pctAnt };
  });
}
