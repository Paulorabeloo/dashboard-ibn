import type { Filter } from '@/lib/filters';
import type { DashboardData, Matricula } from '@/types/domain';

import { selectAtual } from './helpers';

/*
 * NS-2 (T-303) — Pace 7d.
 *
 * Conta matrículas nos últimos 7 dias e compara com os 7 dias anteriores
 * para indicar tendência. Usa relógio injetado (default: agora) para
 * permitir testes determinísticos.
 *
 * Threshold de "flat" é ±2% — abaixo disso, não chama de tendência.
 */

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export type Tendencia = 'up' | 'down' | 'flat';

export interface Pace7dResult {
  /** Matrículas nos últimos 7d. */
  readonly atual: number;
  /** Matrículas nos 7d imediatamente anteriores aos atuais. */
  readonly anterior: number;
  /** Média de matrículas por dia nos últimos 7d. */
  readonly mediaMovel: number;
  readonly tendencia: Tendencia;
}

export interface Pace7dOptions {
  /** Relógio injetável (default: new Date()). */
  readonly now?: Date;
}

function inWindow(m: Matricula, t0: number, t1: number): boolean {
  const t = m.dataMatricula.getTime();
  return t >= t0 && t < t1;
}

export function pace7d(
  data: DashboardData,
  filter: Filter,
  options: Pace7dOptions = {},
): Pace7dResult {
  const matriculas = selectAtual(data, filter);

  // Referência: menor entre `now` e `dataFim` do filter.
  const now = options.now ?? new Date();
  const refTime = Math.min(now.getTime(), filter.dataFim.getTime());

  const t1 = refTime;
  const t0 = refTime - SEVEN_DAYS_MS;
  const tPrev0 = t0 - SEVEN_DAYS_MS;

  const atual = matriculas.filter((m) => inWindow(m, t0, t1)).length;
  const anterior = matriculas.filter((m) => inWindow(m, tPrev0, t0)).length;
  const mediaMovel = atual / 7;

  let tendencia: Tendencia;
  if (anterior === 0) {
    tendencia = atual > 0 ? 'up' : 'flat';
  } else {
    const pct = ((atual - anterior) / anterior) * 100;
    if (pct > 2) tendencia = 'up';
    else if (pct < -2) tendencia = 'down';
    else tendencia = 'flat';
  }

  return { atual, anterior, mediaMovel, tendencia };
}
