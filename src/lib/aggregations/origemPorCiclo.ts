import { CICLOS } from '@/lib/cycles';
import type { DashboardData, Origem } from '@/types/domain';

/*
 * Origem por ciclo — evolução de canais ao longo dos ciclos.
 * Permite ver se a dependência de Lead do Sistema está caindo,
 * se Tráfego Pago está crescendo, etc.
 */

const ORDEM_ORIGENS: ReadonlyArray<Origem> = [
  'lead_sistema',
  'receptivo',
  'marketing',
  'colaborar',
  'disparos',
  'indicacao',
  'trafego_pago',
  'eventos',
  'acao_empresas',
  'transferencia',
  'cubo',
  'consultoria_educacao',
  'outro',
];

const ORIGEM_LABEL: Record<Origem, string> = {
  lead_sistema: 'Lead do Sistema',
  receptivo: 'Receptivo',
  marketing: 'Marketing',
  colaborar: 'Colaborar',
  disparos: 'Disparos',
  indicacao: 'Indicação',
  trafego_pago: 'Tráfego Pago',
  eventos: 'Eventos',
  acao_empresas: 'Ação Empresas',
  transferencia: 'Transferência Externa',
  cubo: 'CUBO',
  consultoria_educacao: 'Consultoria Educação',
  outro: 'Outro',
};

export interface OrigemCicloRow {
  readonly cicloId: string;
  readonly total: number;
  readonly origens: Record<Origem, number>;
  readonly pctOrigens: Record<Origem, number>;
}

export function origemPorCiclo(data: DashboardData): OrigemCicloRow[] {
  return CICLOS.map((ciclo) => {
    const matr = data.matriculas.filter(
      (m) =>
        m.dataMatricula.getTime() >= ciclo.inicio.getTime() &&
        m.dataMatricula.getTime() <= ciclo.fim.getTime(),
    );

    const counts = ORDEM_ORIGENS.reduce<Record<Origem, number>>(
      (acc, o) => ({ ...acc, [o]: 0 }),
      {} as Record<Origem, number>,
    );
    for (const m of matr) {
      counts[m.origem] = (counts[m.origem] ?? 0) + 1;
    }
    const total = matr.length;
    const pcts = ORDEM_ORIGENS.reduce<Record<Origem, number>>(
      (acc, o) => ({ ...acc, [o]: total === 0 ? 0 : ((counts[o] ?? 0) / total) * 100 }),
      {} as Record<Origem, number>,
    );

    return {
      cicloId: ciclo.id,
      total,
      origens: counts,
      pctOrigens: pcts,
    };
  });
}

export { ORDEM_ORIGENS, ORIGEM_LABEL };
