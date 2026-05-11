import type { Filter } from '@/lib/filters';
import type { DashboardData } from '@/types/domain';

import { selectAtual } from './helpers';

/*
 * Detecção de outliers via z-score por volume.
 * z-score >= 1.5 = significativamente acima da média
 * z-score <= -1.5 = significativamente abaixo
 *
 * Útil pra destacar: "essa vendedora/polo está fora da curva".
 */

export interface Outlier {
  readonly id: string;
  readonly label: string;
  readonly valor: number;
  readonly zscore: number;
  readonly tipo: 'alto' | 'baixo';
}

export interface OutlierResult {
  readonly media: number;
  readonly desvio: number;
  readonly outliers: ReadonlyArray<Outlier>;
}

interface OutlierOptions {
  readonly threshold?: number;
  readonly minSampleSize?: number;
}

function calcZScores(
  pairs: Array<{ id: string; label: string; valor: number }>,
  threshold: number,
): OutlierResult {
  if (pairs.length === 0) return { media: 0, desvio: 0, outliers: [] };
  const values = pairs.map((p) => p.valor);
  const media = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - media) ** 2, 0) / values.length;
  const desvio = Math.sqrt(variance);
  if (desvio === 0) return { media, desvio: 0, outliers: [] };

  const outliers: Outlier[] = pairs
    .map((p) => ({
      id: p.id,
      label: p.label,
      valor: p.valor,
      zscore: (p.valor - media) / desvio,
      tipo: (p.valor > media ? 'alto' : 'baixo') as 'alto' | 'baixo',
    }))
    .filter((o) => Math.abs(o.zscore) >= threshold)
    .sort((a, b) => Math.abs(b.zscore) - Math.abs(a.zscore));

  return { media, desvio, outliers };
}

export function outliersPorPolo(
  data: DashboardData,
  filter: Filter,
  options: OutlierOptions = {},
): OutlierResult {
  const threshold = options.threshold ?? 1.5;
  const minSample = options.minSampleSize ?? 5;
  const matr = selectAtual(data, filter);
  const byId = new Map<string, number>();
  const labels = new Map<string, string>();
  for (const m of matr) {
    byId.set(m.poloId, (byId.get(m.poloId) ?? 0) + 1);
    labels.set(m.poloId, m.poloRaw || m.poloId);
  }
  // Resolve label do canonical
  const polosMap = new Map(data.polos.map((p) => [p.id, p.nomeCanonico]));
  if (byId.size < minSample) return { media: 0, desvio: 0, outliers: [] };

  const pairs = Array.from(byId.entries()).map(([id, valor]) => ({
    id,
    label: polosMap.get(id) ?? labels.get(id) ?? id,
    valor,
  }));
  return calcZScores(pairs, threshold);
}

export function outliersPorVendedora(
  data: DashboardData,
  filter: Filter,
  options: OutlierOptions = {},
): OutlierResult {
  const threshold = options.threshold ?? 1.5;
  const minSample = options.minSampleSize ?? 5;
  const matr = selectAtual(data, filter);
  const byId = new Map<string, number>();
  const labels = new Map<string, string>();
  for (const m of matr) {
    if (m.vendedoraId === 'desconhecido') continue;
    byId.set(m.vendedoraId, (byId.get(m.vendedoraId) ?? 0) + 1);
    labels.set(m.vendedoraId, m.vendedoraNome || m.vendedoraId);
  }
  if (byId.size < minSample) return { media: 0, desvio: 0, outliers: [] };

  const pairs = Array.from(byId.entries()).map(([id, valor]) => ({
    id,
    label: labels.get(id) ?? id,
    valor,
  }));
  return calcZScores(pairs, threshold);
}
