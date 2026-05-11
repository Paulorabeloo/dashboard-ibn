import type { Filter } from '@/lib/filters';
import type { DashboardData } from '@/types/domain';

import { selectAnterior, selectAtual } from './helpers';

/*
 * Receita estimada — métrica nova viabilizada pelo schema real.
 * Soma de `valorMensalidade × quantidadeParcelas` em todas as matrículas
 * do recorte. Estimativa porque não considera inadimplência/bolsa/desconto.
 *
 * Ticket médio = média da `valorMensalidade` no recorte.
 */

export interface ReceitaResult {
  readonly receitaEstimada: number;
  readonly receitaAnterior: number;
  readonly deltaAbs: number;
  readonly deltaPct: number;
  readonly ticketMedio: number;
  readonly ticketMedioAnterior: number;
  readonly hasComparison: boolean;
}

function calcReceita(
  matriculas: ReadonlyArray<{ valorMensalidade: number | null; quantidadeParcelas: number | null }>,
): { receita: number; ticket: number; n: number } {
  let receita = 0;
  let somaTicket = 0;
  let n = 0;
  for (const m of matriculas) {
    if (m.valorMensalidade == null || m.valorMensalidade <= 0) continue;
    const parcelas = m.quantidadeParcelas ?? 1;
    receita += m.valorMensalidade * parcelas;
    somaTicket += m.valorMensalidade;
    n += 1;
  }
  return { receita, ticket: n > 0 ? somaTicket / n : 0, n };
}

export function receitaEstimada(data: DashboardData, filter: Filter): ReceitaResult {
  const atual = calcReceita(selectAtual(data, filter));
  const anterior = calcReceita(selectAnterior(data, filter));
  const deltaAbs = atual.receita - anterior.receita;
  const deltaPct = anterior.receita === 0 ? 0 : (deltaAbs / anterior.receita) * 100;
  return {
    receitaEstimada: atual.receita,
    receitaAnterior: anterior.receita,
    deltaAbs,
    deltaPct,
    ticketMedio: atual.ticket,
    ticketMedioAnterior: anterior.ticket,
    hasComparison: filter.cicloId !== 'all' && anterior.receita > 0,
  };
}
