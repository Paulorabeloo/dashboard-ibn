import { getCiclo } from '@/lib/cycles';
import { applyFilter, type Filter } from '@/lib/filters';
import type { DashboardData } from '@/types/domain';

import { selectAnterior, selectAtual } from './helpers';

/*
 * Projeção simples de fechamento do ciclo.
 *
 * Estratégia: pega a média de matrículas/dia nos últimos 30 dias do
 * ciclo (ou todo o ciclo se mais curto), multiplica pelos dias restantes
 * e soma ao atual. Compara com o ciclo anterior pra dar contexto.
 *
 * Limitações: linear, não captura sazonalidade nem aceleração/desaceleração.
 * Suficiente como "se mantiver o ritmo, fechamos com X".
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const JANELA_DIAS = 30;

export interface ForecastResult {
  /** Ritmo atual em matrículas/dia (média nos últimos 30 dias). */
  readonly ritmoDiario: number;
  /** Dias restantes até o fim do ciclo. */
  readonly diasRestantes: number;
  /** Matrículas já realizadas no ciclo. */
  readonly realizado: number;
  /** Projeção total no fechamento. */
  readonly projetado: number;
  /** Total que o ciclo anterior fez no MESMO ponto + ritmo do mesmo ciclo até o fim. */
  readonly cicloAnteriorTotal: number;
  /** Variação prevista vs ciclo anterior. */
  readonly deltaVsAnterior: number;
  readonly deltaVsAnteriorPct: number;
  /** True se temos dado suficiente pra projetar. */
  readonly confiavel: boolean;
}

export function projecaoFechamento(
  data: DashboardData,
  filter: Filter,
  now: Date = new Date(),
): ForecastResult {
  const matriculasAtual = selectAtual(data, filter);
  const realizado = matriculasAtual.length;

  if (filter.cicloId === 'all') {
    return {
      ritmoDiario: 0,
      diasRestantes: 0,
      realizado,
      projetado: realizado,
      cicloAnteriorTotal: 0,
      deltaVsAnterior: 0,
      deltaVsAnteriorPct: 0,
      confiavel: false,
    };
  }

  const ciclo = getCiclo(filter.cicloId);
  if (!ciclo) {
    return {
      ritmoDiario: 0,
      diasRestantes: 0,
      realizado,
      projetado: realizado,
      cicloAnteriorTotal: 0,
      deltaVsAnterior: 0,
      deltaVsAnteriorPct: 0,
      confiavel: false,
    };
  }

  // Ritmo: matrículas/dia nos últimos JANELA_DIAS do ciclo (capando em now)
  const fimEffective = Math.min(now.getTime(), ciclo.fim.getTime());
  const inicioJanela = Math.max(
    ciclo.inicio.getTime(),
    fimEffective - JANELA_DIAS * DAY_MS,
  );
  const janelaDias = Math.max(1, (fimEffective - inicioJanela) / DAY_MS);

  const matrJanela = data.matriculas.filter(
    (m) =>
      m.dataMatricula.getTime() >= inicioJanela &&
      m.dataMatricula.getTime() <= fimEffective,
  );
  const ritmoDiario = matrJanela.length / janelaDias;

  const diasRestantes = Math.max(
    0,
    Math.floor((ciclo.fim.getTime() - fimEffective) / DAY_MS),
  );

  const projetado = realizado + Math.round(ritmoDiario * diasRestantes);

  // Ciclo anterior — total real (não no ponto comparável)
  const cicloAnteriorTotal = ciclo.cicloAnteriorId
    ? applyFilter(data.matriculas, {
        ...filter,
        cicloId: ciclo.cicloAnteriorId,
        dataInicio: new Date(
          (getCiclo(ciclo.cicloAnteriorId)?.inicio ?? ciclo.inicio).getTime(),
        ),
        dataFim: new Date(
          (getCiclo(ciclo.cicloAnteriorId)?.fim ?? ciclo.fim).getTime(),
        ),
        mes: null,
        dia: null,
      }).length
    : 0;

  const deltaVsAnterior = projetado - cicloAnteriorTotal;
  const deltaVsAnteriorPct =
    cicloAnteriorTotal === 0 ? 0 : (deltaVsAnterior / cicloAnteriorTotal) * 100;

  // Confiável se temos pelo menos 7 dias de janela com dado
  const confiavel = matrJanela.length >= 5 && diasRestantes > 0;

  return {
    ritmoDiario,
    diasRestantes,
    realizado,
    projetado,
    cicloAnteriorTotal,
    deltaVsAnterior,
    deltaVsAnteriorPct,
    confiavel,
  };
}
