import { CICLOS } from '@/lib/cycles';
import type { DashboardData, Matricula } from '@/types/domain';

/*
 * Cohort por ciclo — curva acumulada de matrículas dia-a-dia desde o
 * início de cada ciclo. Permite responder "estamos à frente ou atrás
 * do ciclo anterior no mesmo dia D?" de relance.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export interface CohortPoint {
  /** Dias desde o início do ciclo (0 = primeiro dia). */
  readonly diaOffset: number;
  readonly acumulado: number;
}

export interface CohortSeries {
  readonly cicloId: string;
  readonly inicio: string;
  readonly fim: string;
  readonly totalCiclo: number;
  /** Quantos dias do ciclo já passaram (até hoje ou até o fim). */
  readonly diasDecorridos: number;
  readonly pontos: ReadonlyArray<CohortPoint>;
}

interface CohortOptions {
  /** Limita os pontos ao máximo de N dias (alinha eixo X). Default: 180. */
  readonly maxDias?: number;
  /** Ciclos a incluir; vazio = todos. */
  readonly cicloIds?: ReadonlyArray<string>;
  readonly now?: Date;
}

/**
 * Gera N curvas, uma por ciclo, alinhadas pelo "dia desde o início".
 * Cada ponto é o acumulado de matrículas até aquele dia.
 */
export function cohortByCycle(
  data: DashboardData,
  options: CohortOptions = {},
): CohortSeries[] {
  const maxDias = options.maxDias ?? 180;
  const now = options.now ?? new Date();
  const selectedIds = new Set(options.cicloIds ?? CICLOS.map((c) => c.id));

  const series: CohortSeries[] = [];

  for (const ciclo of CICLOS) {
    if (!selectedIds.has(ciclo.id)) continue;

    const inicio = ciclo.inicio;
    const matrCiclo = data.matriculas
      .filter(
        (m: Matricula) =>
          m.dataMatricula.getTime() >= ciclo.inicio.getTime() &&
          m.dataMatricula.getTime() <= ciclo.fim.getTime(),
      )
      .sort((a, b) => a.dataMatricula.getTime() - b.dataMatricula.getTime());

    // Bucketiza por dia offset
    const byDay = new Map<number, number>();
    for (const m of matrCiclo) {
      const off = Math.floor((m.dataMatricula.getTime() - inicio.getTime()) / DAY_MS);
      byDay.set(off, (byDay.get(off) ?? 0) + 1);
    }

    // Quantos dias já se passaram (capa no fim do ciclo OU em hoje)
    const fimEffective = Math.min(ciclo.fim.getTime(), now.getTime());
    const diasDecorridos = Math.max(
      0,
      Math.floor((fimEffective - inicio.getTime()) / DAY_MS),
    );
    const limit = Math.min(diasDecorridos, maxDias);

    const pontos: CohortPoint[] = [];
    let acumulado = 0;
    for (let d = 0; d <= limit; d++) {
      acumulado += byDay.get(d) ?? 0;
      pontos.push({ diaOffset: d, acumulado });
    }

    series.push({
      cicloId: ciclo.id,
      inicio: inicio.toISOString().slice(0, 10),
      fim: ciclo.fim.toISOString().slice(0, 10),
      totalCiclo: matrCiclo.length,
      diasDecorridos,
      pontos,
    });
  }

  return series;
}
