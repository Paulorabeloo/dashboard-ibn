import { applyFilter, type Filter } from '@/lib/filters';
import type { DashboardData } from '@/types/domain';

import { buildCompareWindow, selectAtual } from './helpers';

/*
 * RF-05 / T-401 — Evolução temporal.
 * Conta matrículas por dia dentro da janela do filtro e adiciona:
 *   - média móvel de 7 dias
 *   - matrículas no mesmo dia do ciclo anterior (overlay opcional)
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export interface EvolucaoPoint {
  /** ISO YYYY-MM-DD para identificar o dia (server-render-safe). */
  readonly date: string;
  /** Matrículas naquele dia. */
  readonly valor: number;
  /** Média móvel das últimas 7 datas (incluindo a atual). */
  readonly mediaMovel: number;
  /** Matrículas no mesmo offset do ciclo anterior (null se sem comparação). */
  readonly valorAnterior: number | null;
}

function formatYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function evolucaoTemporal(data: DashboardData, filter: Filter): EvolucaoPoint[] {
  const matriculas = selectAtual(data, filter);
  const compare = buildCompareWindow(filter);

  const byDay = new Map<string, number>();
  for (const m of matriculas) {
    const key = formatYMD(m.dataMatricula);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }

  // Mesmo offset no ciclo anterior — mapeia dias atuais → dias anteriores.
  const byDayAnterior = new Map<string, number>(); // key = dia atual
  if (compare.cicloAtual && compare.cicloAnterior && compare.filterAnterior) {
    const offsetMs =
      compare.cicloAtual.inicio.getTime() - compare.cicloAnterior.inicio.getTime();
    const matriculasAnt = applyFilter(data.matriculas, compare.filterAnterior);
    for (const m of matriculasAnt) {
      const equivalentTime = m.dataMatricula.getTime() + offsetMs;
      const key = formatYMD(new Date(equivalentTime));
      byDayAnterior.set(key, (byDayAnterior.get(key) ?? 0) + 1);
    }
  }

  const startMs = filter.dataInicio.getTime();
  const endMs = filter.dataFim.getTime();
  const dias: string[] = [];
  for (let t = startMs; t <= endMs; t += DAY_MS) {
    dias.push(formatYMD(new Date(t)));
  }

  // Limita a evolução a no máximo 730 pontos (2 anos) — evita render
  // pesado para ciclo=all em datasets grandes.
  if (dias.length > 730) {
    return [];
  }

  const hasComparison = byDayAnterior.size > 0;
  const result: EvolucaoPoint[] = [];
  for (let i = 0; i < dias.length; i++) {
    const day = dias[i]!;
    const valor = byDay.get(day) ?? 0;
    const windowStart = Math.max(0, i - 6);
    const window = dias.slice(windowStart, i + 1);
    const sum = window.reduce((s, d) => s + (byDay.get(d) ?? 0), 0);
    const mediaMovel = sum / window.length;
    const valorAnterior = hasComparison ? byDayAnterior.get(day) ?? 0 : null;
    result.push({ date: day, valor, mediaMovel, valorAnterior });
  }
  return result;
}
