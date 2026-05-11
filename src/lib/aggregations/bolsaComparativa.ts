import { getCiclo } from '@/lib/cycles';
import { applyFilter, type Filter } from '@/lib/filters';
import type { DashboardData } from '@/types/domain';

import { selectAtual } from './helpers';

/*
 * Bolsa comparativa — total atual vs ciclo anterior, delta.
 * Identifica quais convênios estão ganhando ou perdendo terreno.
 */

export interface BolsaComp {
  readonly bolsa: string;
  readonly atual: number;
  readonly anterior: number;
  readonly deltaAbs: number;
  readonly deltaPct: number;
  readonly pctAtual: number;
}

export function bolsaComparativa(
  data: DashboardData,
  filter: Filter,
  limit: number = 12,
): BolsaComp[] {
  const matrAtual = selectAtual(data, filter);
  const totalAtual = matrAtual.length;

  // Ciclo anterior inteiro (não no mesmo offset — total é mais útil aqui)
  let matrAnterior: typeof matrAtual = [];
  if (filter.cicloId !== 'all') {
    const cicloAt = getCiclo(filter.cicloId);
    if (cicloAt?.cicloAnteriorId) {
      const cicloAnt = getCiclo(cicloAt.cicloAnteriorId);
      if (cicloAnt) {
        matrAnterior = applyFilter(data.matriculas, {
          ...filter,
          cicloId: cicloAnt.id,
          dataInicio: cicloAnt.inicio,
          dataFim: cicloAnt.fim,
          mes: null,
          dia: null,
        });
      }
    }
  }

  const atualMap = new Map<string, number>();
  for (const m of matrAtual) {
    const k = m.bolsaConvenio ?? '— Não informado';
    atualMap.set(k, (atualMap.get(k) ?? 0) + 1);
  }
  const anteriorMap = new Map<string, number>();
  for (const m of matrAnterior) {
    const k = m.bolsaConvenio ?? '— Não informado';
    anteriorMap.set(k, (anteriorMap.get(k) ?? 0) + 1);
  }

  const keys = new Set<string>([...atualMap.keys(), ...anteriorMap.keys()]);
  const rows: BolsaComp[] = [];
  for (const k of keys) {
    const atual = atualMap.get(k) ?? 0;
    const anterior = anteriorMap.get(k) ?? 0;
    if (atual === 0 && anterior === 0) continue;
    const deltaAbs = atual - anterior;
    const deltaPct = anterior === 0 ? (atual > 0 ? 100 : 0) : (deltaAbs / anterior) * 100;
    rows.push({
      bolsa: k,
      atual,
      anterior,
      deltaAbs,
      deltaPct,
      pctAtual: totalAtual === 0 ? 0 : (atual / totalAtual) * 100,
    });
  }

  // Ordena pelo maior volume atual (mas mantém as que zeraram visíveis no fim)
  rows.sort((a, b) => {
    if (b.atual !== a.atual) return b.atual - a.atual;
    return b.anterior - a.anterior;
  });

  return rows.slice(0, limit);
}
