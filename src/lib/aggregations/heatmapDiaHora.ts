import type { Filter } from '@/lib/filters';
import type { DashboardData } from '@/types/domain';

import { selectAtual } from './helpers';

/*
 * Heatmap dia da semana × hora do dia — identifica a janela em que
 * matrículas mais entram. Útil pra dimensionar atendimento de gestão.
 */

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

export interface DiaHoraCell {
  readonly dia: number; // 0-6
  readonly hora: number; // 0-23
  readonly valor: number;
}

export interface DiaHoraResult {
  readonly cells: ReadonlyArray<DiaHoraCell>;
  readonly maxValor: number;
  readonly diasLabels: ReadonlyArray<string>;
  readonly horasAtivas: ReadonlyArray<number>;
}

export function heatmapDiaHora(data: DashboardData, filter: Filter): DiaHoraResult {
  const matr = selectAtual(data, filter);
  const grid = new Map<string, number>();
  const horasComDado = new Set<number>();
  let maxValor = 0;

  for (const m of matr) {
    const d = m.dataMatricula.getDay();
    const h = m.dataMatricula.getHours();
    const key = `${d}-${h}`;
    const v = (grid.get(key) ?? 0) + 1;
    grid.set(key, v);
    horasComDado.add(h);
    if (v > maxValor) maxValor = v;
  }

  const cells: DiaHoraCell[] = [];
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      cells.push({ dia: d, hora: h, valor: grid.get(`${d}-${h}`) ?? 0 });
    }
  }

  const horasAtivas = Array.from(horasComDado).sort((a, b) => a - b);

  return { cells, maxValor, diasLabels: DIAS, horasAtivas };
}
