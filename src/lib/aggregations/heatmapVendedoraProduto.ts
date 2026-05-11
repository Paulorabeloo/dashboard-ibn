import type { Filter } from '@/lib/filters';
import type { DashboardData, Familia } from '@/types/domain';

import { selectAtual } from './helpers';

/*
 * RF-20 (T-408) — Heatmap vendedora × produto.
 *
 * Identifica especialista vs generalista. Cada célula = matrículas
 * daquela vendedora naquele produto, no recorte filtrado.
 */

export interface HeatmapAxis {
  readonly id: string;
  readonly label: string;
}

export interface HeatmapCell {
  readonly rowId: string;
  readonly colId: string;
  readonly value: number;
  /** Percentual desse produto para essa vendedora (linha = 100%). */
  readonly pctRow: number;
}

export interface HeatmapData {
  readonly rows: ReadonlyArray<HeatmapAxis>;
  readonly cols: ReadonlyArray<HeatmapAxis>;
  readonly cells: ReadonlyArray<HeatmapCell>;
  readonly maxValue: number;
}

const PRODUTO_ORDER: ReadonlyArray<Familia> = ['graduacao', 'pos', 'tecnico', 'outro'];
const PRODUTO_LABELS: Record<Familia, string> = {
  graduacao: 'Graduação',
  pos: 'Pós-graduação',
  tecnico: 'Técnicos',
  outro: 'Outros',
};

export function heatmapVendedoraProduto(
  data: DashboardData,
  filter: Filter,
  topN: number = 12,
): HeatmapData {
  const matriculas = selectAtual(data, filter);
  const vendedoraMap = new Map(data.vendedoras.map((v) => [v.id, v]));

  // Conta por vendedora e produto.
  const totalsByVend = new Map<string, number>();
  const cellsMap = new Map<string, Map<Familia, number>>();
  for (const m of matriculas) {
    if (m.vendedoraId === 'desconhecido') continue;
    totalsByVend.set(m.vendedoraId, (totalsByVend.get(m.vendedoraId) ?? 0) + 1);
    let row = cellsMap.get(m.vendedoraId);
    if (!row) {
      row = new Map();
      cellsMap.set(m.vendedoraId, row);
    }
    row.set(m.familia, (row.get(m.familia) ?? 0) + 1);
  }

  // Top N vendedoras por volume.
  const topVendedoras = Array.from(totalsByVend.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([id]) => id);

  // Considera apenas produtos que tiveram pelo menos 1 matrícula.
  const produtosAtivos = new Set<Familia>();
  for (const id of topVendedoras) {
    const row = cellsMap.get(id);
    if (!row) continue;
    for (const f of row.keys()) produtosAtivos.add(f);
  }

  const cols: HeatmapAxis[] = PRODUTO_ORDER.filter((f) => produtosAtivos.has(f)).map(
    (f) => ({ id: f, label: PRODUTO_LABELS[f] }),
  );

  const rows: HeatmapAxis[] = topVendedoras.map((id) => ({
    id,
    label: vendedoraMap.get(id)?.nome ?? id,
  }));

  const cells: HeatmapCell[] = [];
  let maxValue = 0;
  for (const rowId of topVendedoras) {
    const total = totalsByVend.get(rowId) ?? 0;
    for (const col of cols) {
      const value = cellsMap.get(rowId)?.get(col.id as Familia) ?? 0;
      cells.push({
        rowId,
        colId: col.id,
        value,
        pctRow: total > 0 ? (value / total) * 100 : 0,
      });
      if (value > maxValue) maxValue = value;
    }
  }

  return { rows, cols, cells, maxValue };
}
