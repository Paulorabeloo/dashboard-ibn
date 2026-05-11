import type { Filter } from '@/lib/filters';
import { applyFilter } from '@/lib/filters';
import type { DashboardData, Matricula } from '@/types/domain';

import { selectAtual } from './helpers';

/*
 * RF-11 / RF-21 (T-407, T-409) — Campanha Amigo Vale Pix.
 *
 * Lista as matrículas que vieram com indicação (`valePix !== null`).
 * Card de conversão: matrículas com origem "indicacao" sobre indicações
 * cadastradas no período.
 */

export interface AmigoValePixEntry {
  readonly id: string;
  /** ISO YYYY-MM-DD */
  readonly data: string;
  readonly poloNome: string;
  /** 🔒 PII */
  readonly alunoNome: string;
  /** 🔒 PII */
  readonly indicadoPor: string;
  /** 🔒 PII */
  readonly comercialNome: string;
  readonly valor: number | null;
  readonly quantidade: number;
}

export function amigoValePixEntries(
  data: DashboardData,
  filter: Filter,
  limit: number = 200,
): AmigoValePixEntry[] {
  const matr = selectAtual(data, filter).filter((m): m is Matricula & { valePix: NonNullable<Matricula['valePix']> } =>
    m.valePix !== null,
  );

  const polosMap = new Map(data.polos.map((p) => [p.id, p.nomeCanonico]));

  matr.sort((a, b) => b.dataMatricula.getTime() - a.dataMatricula.getTime());
  const sliced = matr.slice(0, limit);

  return sliced.map((m) => ({
    id: m.id,
    data: m.dataMatricula.toISOString().slice(0, 10),
    poloNome: polosMap.get(m.poloId) ?? m.poloRaw,
    alunoNome: m.alunoNome,
    indicadoPor: m.valePix.indicadoPor,
    comercialNome: m.vendedoraNome,
    valor: m.valePix.valor,
    quantidade: m.valePix.quantidade,
  }));
}

export interface IndicacaoStats {
  /** Total de matrículas com origem 'indicacao' no recorte. */
  readonly matriculasIndicacao: number;
  /** Total de matrículas com campo 'Indicado por' preenchido (valePix !== null). */
  readonly comIndicadoPor: number;
  /** Total de matrículas no recorte. */
  readonly totalRecorte: number;
  /** % de matrículas via 'origem = indicação' sobre o total. */
  readonly pctOrigem: number;
  /** % de matrículas com 'Indicado por' preenchido sobre o total. */
  readonly pctComIndicador: number;
}

export function statsIndicacao(data: DashboardData, filter: Filter): IndicacaoStats {
  const matr = applyFilter(data.matriculas, filter);
  const matriculasIndicacao = matr.filter((m) => m.origem === 'indicacao').length;
  const comIndicadoPor = matr.filter((m) => m.valePix !== null).length;
  const total = matr.length;
  return {
    matriculasIndicacao,
    comIndicadoPor,
    totalRecorte: total,
    pctOrigem: total === 0 ? 0 : (matriculasIndicacao / total) * 100,
    pctComIndicador: total === 0 ? 0 : (comIndicadoPor / total) * 100,
  };
}
