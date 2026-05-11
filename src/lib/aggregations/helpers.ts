import { getCiclo } from '@/lib/cycles';
import { type Filter, applyFilter } from '@/lib/filters';
import type { Ciclo, DashboardData, Matricula } from '@/types/domain';

/*
 * Helpers compartilhados pelas agregações NS-1..NS-4.
 * Cuidam de "mesmo ponto do ciclo anterior" (RF-19) e de filtragem.
 */

export interface CompareWindow {
  readonly cicloAtual: Ciclo | null;
  readonly cicloAnterior: Ciclo | null;
  /** Filter equivalente aplicável ao ciclo anterior (mesmo offset temporal). */
  readonly filterAnterior: Filter | null;
}

export function buildCompareWindow(filter: Filter): CompareWindow {
  if (filter.cicloId === 'all') {
    return { cicloAtual: null, cicloAnterior: null, filterAnterior: null };
  }
  const cicloAtual = getCiclo(filter.cicloId);
  if (!cicloAtual?.cicloAnteriorId) {
    return { cicloAtual: cicloAtual ?? null, cicloAnterior: null, filterAnterior: null };
  }
  const cicloAnterior = getCiclo(cicloAtual.cicloAnteriorId);
  if (!cicloAnterior) {
    return { cicloAtual, cicloAnterior: null, filterAnterior: null };
  }

  // Mapeia [dataInicio, dataFim] do ciclo atual para os mesmos offsets
  // dentro do ciclo anterior. Garante comparação justa para filtros
  // parciais (ex: "março de 2026" → "março de 2025").
  const offsetStartMs = filter.dataInicio.getTime() - cicloAtual.inicio.getTime();
  const offsetEndMs = filter.dataFim.getTime() - cicloAtual.inicio.getTime();
  const dataInicioAnterior = new Date(cicloAnterior.inicio.getTime() + offsetStartMs);
  const dataFimAnterior = new Date(cicloAnterior.inicio.getTime() + offsetEndMs);

  const filterAnterior: Filter = {
    cicloId: cicloAnterior.id,
    poloIds: filter.poloIds,
    familias: filter.familias,
    dataInicio: dataInicioAnterior,
    dataFim: dataFimAnterior,
    mes: null,
    dia: null,
  };

  return { cicloAtual, cicloAnterior, filterAnterior };
}

export function selectAtual(data: DashboardData, filter: Filter): Matricula[] {
  return applyFilter(data.matriculas, filter);
}

export function selectAnterior(data: DashboardData, filter: Filter): Matricula[] {
  const { filterAnterior } = buildCompareWindow(filter);
  if (!filterAnterior) return [];
  return applyFilter(data.matriculas, filterAnterior);
}

export function safePct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return (numerator / denominator) * 100;
}
