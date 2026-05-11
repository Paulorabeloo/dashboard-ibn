import type { Filter } from '@/lib/filters';
import type { DashboardData, Familia, Origem, Polo, SubFamilia } from '@/types/domain';

import { safePct, selectAnterior, selectAtual } from './helpers';

/*
 * Agregações de contagem por dimensão simples (RF-07, RF-08, RF-09, RF-10).
 * Todas funções puras com a mesma forma: aplica filtro, conta, ordena
 * decrescente.
 */

export interface DimensionCount<T = string> {
  readonly key: T;
  readonly label: string;
  readonly total: number;
  readonly pct: number;
  readonly deltaAbs: number;
}

const ORIGEM_LABELS: Record<Origem, string> = {
  lead_sistema: 'Lead do Sistema',
  disparos: 'Disparos',
  indicacao: 'Indicação',
  trafego_pago: 'Tráfego Pago',
  cubo: 'CUBO',
  receptivo: 'Receptivo',
  marketing: 'Marketing',
  colaborar: 'Colaborar',
  transferencia: 'Transferência Externa',
  eventos: 'Eventos',
  acao_empresas: 'Ação Empresas',
  consultoria_educacao: 'Consultoria Educação',
  outro: 'Outro',
};

const FAMILIA_LABELS: Record<Familia, string> = {
  graduacao: 'Graduação',
  pos: 'Pós-graduação',
  tecnico: 'Técnicos',
  outro: 'Outro',
};

const SUBFAMILIA_LABELS: Record<SubFamilia, string> = {
  '100ead': '100% Online (EAD)',
  semi: 'Semi Presencial',
  premium: 'Premium / Híbrido Lab',
  outro: 'Outro',
};

interface CountInputs<K extends string> {
  readonly atual: Map<K, number>;
  readonly anterior: Map<K, number>;
  readonly totalAtual: number;
}

function buildEntries<K extends string>(
  inputs: CountInputs<K>,
  toLabel: (k: K) => string,
): DimensionCount<K>[] {
  const ids = new Set<K>([...inputs.atual.keys(), ...inputs.anterior.keys()]);
  const entries: DimensionCount<K>[] = [];
  for (const id of ids) {
    const total = inputs.atual.get(id) ?? 0;
    const anterior = inputs.anterior.get(id) ?? 0;
    if (total === 0 && anterior === 0) continue;
    entries.push({
      key: id,
      label: toLabel(id),
      total,
      pct: safePct(total, inputs.totalAtual),
      deltaAbs: total - anterior,
    });
  }
  entries.sort((a, b) => b.total - a.total);
  return entries;
}

export function countByPolo(data: DashboardData, filter: Filter): DimensionCount[] {
  const atualList = selectAtual(data, filter);
  const anteriorList = selectAnterior(data, filter);
  const atual = new Map<string, number>();
  const anterior = new Map<string, number>();
  for (const m of atualList) atual.set(m.poloId, (atual.get(m.poloId) ?? 0) + 1);
  for (const m of anteriorList) anterior.set(m.poloId, (anterior.get(m.poloId) ?? 0) + 1);

  const polosMap = new Map<string, Polo>(data.polos.map((p) => [p.id, p]));
  return buildEntries(
    { atual, anterior, totalAtual: atualList.length },
    (id) => polosMap.get(id)?.nomeCanonico ?? id,
  );
}

export function countByOrigem(
  data: DashboardData,
  filter: Filter,
): DimensionCount<Origem>[] {
  const atualList = selectAtual(data, filter);
  const anteriorList = selectAnterior(data, filter);
  const atual = new Map<Origem, number>();
  const anterior = new Map<Origem, number>();
  for (const m of atualList) atual.set(m.origem, (atual.get(m.origem) ?? 0) + 1);
  for (const m of anteriorList) anterior.set(m.origem, (anterior.get(m.origem) ?? 0) + 1);
  return buildEntries(
    { atual, anterior, totalAtual: atualList.length },
    (k) => ORIGEM_LABELS[k],
  );
}

export function countByBolsa(data: DashboardData, filter: Filter): DimensionCount[] {
  const atualList = selectAtual(data, filter);
  const anteriorList = selectAnterior(data, filter);
  const atual = new Map<string, number>();
  const anterior = new Map<string, number>();
  for (const m of atualList) {
    const k = m.bolsaConvenio ?? '— Não informado';
    atual.set(k, (atual.get(k) ?? 0) + 1);
  }
  for (const m of anteriorList) {
    const k = m.bolsaConvenio ?? '— Não informado';
    anterior.set(k, (anterior.get(k) ?? 0) + 1);
  }
  return buildEntries({ atual, anterior, totalAtual: atualList.length }, (k) => k);
}

export interface FamiliaSubMix {
  readonly familia: Familia;
  readonly familiaLabel: string;
  readonly subFamilia: SubFamilia;
  readonly subLabel: string;
  readonly total: number;
}

export function familiaSubFamiliaMix(
  data: DashboardData,
  filter: Filter,
): FamiliaSubMix[] {
  const matr = selectAtual(data, filter);
  const map = new Map<string, FamiliaSubMix>();
  for (const m of matr) {
    const key = `${m.familia}::${m.subFamilia}`;
    const existing = map.get(key);
    if (existing) {
      map.set(key, { ...existing, total: existing.total + 1 });
    } else {
      map.set(key, {
        familia: m.familia,
        familiaLabel: FAMILIA_LABELS[m.familia],
        subFamilia: m.subFamilia,
        subLabel: SUBFAMILIA_LABELS[m.subFamilia],
        total: 1,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}
