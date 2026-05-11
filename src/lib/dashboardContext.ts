import 'server-only';

import { getDashboardData, type DashboardSnapshot } from './data/repository';
import {
  availableMonths,
  parseFilterFromSearchParams,
  type Filter,
} from './filters';

/*
 * Server-only — helper compartilhado por todas as páginas do dashboard.
 *
 * Resolve searchParams, aplica defaults opcionais (ex: mês corrente),
 * busca os dados via repository e devolve tudo pronto para a página
 * computar agregações.
 */

const MES_LABELS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

export function formatMesLabel(ymd: string): string {
  const [y, m] = ymd.split('-');
  if (!y || !m) return ymd;
  const idx = Number(m) - 1;
  return `${MES_LABELS[idx] ?? m}/${y.slice(2)}`;
}

export function formatDiaLabel(ymd: string): string {
  const [y, m, d] = ymd.split('-');
  if (!y || !m || !d) return ymd;
  return `${d}/${m}/${y}`;
}

interface ContextOptions {
  /** Se true e nenhum `mes` foi informado, default para o mês atual. */
  readonly defaultMesAtual?: boolean;
  /** Se true e nenhum `dia` foi informado, default para hoje. */
  readonly defaultDiaHoje?: boolean;
}

export interface DashboardContext {
  readonly filter: Filter;
  readonly data: DashboardSnapshot;
  readonly updatedAtMin: number;
  readonly polosOptions: ReadonlyArray<{ id: string; label: string }>;
  readonly mesOptions: ReadonlyArray<{ id: string; label: string }>;
  readonly recorteHint: string;
}

export async function loadDashboardContext(
  searchParams: Record<string, string | string[] | undefined>,
  options: ContextOptions = {},
): Promise<DashboardContext> {
  let sp = searchParams;
  if (options.defaultDiaHoje && !sp.dia) {
    const now = new Date();
    const ymd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    sp = { ...sp, dia: ymd };
  }
  if (options.defaultMesAtual && !sp.mes && !sp.dia) {
    const now = new Date();
    const ymd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    sp = { ...sp, mes: ymd };
  }

  const filter = parseFilterFromSearchParams(sp);
  const data = await getDashboardData();

  const polosOptions = [...data.polos]
    .sort((a, b) => a.nomeCanonico.localeCompare(b.nomeCanonico))
    .map((p) => ({ id: p.id, label: p.nomeCanonico }));

  const mesOptions = availableMonths(data.matriculas).map((id) => ({
    id,
    label: formatMesLabel(id),
  }));

  const updatedAtMin = Math.max(
    0,
    Math.round((Date.now() - new Date(data.cachedAt).getTime()) / 60000),
  );

  const partes: string[] = [];
  if (filter.dia) partes.push(`dia ${formatDiaLabel(filter.dia)}`);
  else if (filter.mes) partes.push(`mês ${formatMesLabel(filter.mes)}`);
  else if (filter.cicloId !== 'all') partes.push(`ciclo ${filter.cicloId}`);
  else partes.push('todos os ciclos');
  if (filter.poloIds.length > 0) partes.push(`polo ${filter.poloIds.join(', ')}`);
  if (filter.familias.length > 0) partes.push(`produto ${filter.familias.join(', ')}`);
  const recorteHint = partes.join(' · ');

  return { filter, data, updatedAtMin, polosOptions, mesOptions, recorteHint };
}
