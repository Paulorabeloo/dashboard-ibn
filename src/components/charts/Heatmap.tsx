import type { HeatmapData } from '@/lib/aggregations/heatmapVendedoraProduto';

/*
 * RF-20 — Heatmap vendedora × produto.
 *
 * Cor da célula é proporcional ao volume da vendedora naquele produto.
 * Acessibilidade: número visível dentro da célula (RNF-06 — cor não é
 * o único portador de significado).
 */

interface Props {
  readonly data: HeatmapData;
}

export function Heatmap({ data }: Props) {
  if (data.rows.length === 0 || data.cols.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
        Sem dados no recorte.
      </div>
    );
  }

  const cellMap = new Map<string, { value: number; pctRow: number }>();
  for (const c of data.cells) {
    cellMap.set(`${c.rowId}::${c.colId}`, { value: c.value, pctRow: c.pctRow });
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="py-1.5 pr-2 font-medium">Vendedora</th>
            {data.cols.map((c) => (
              <th key={c.id} className="py-1.5 pr-1 text-right font-medium">
                {c.label}
              </th>
            ))}
            <th className="py-1.5 pr-2 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row) => {
            const total = data.cols.reduce(
              (s, col) => s + (cellMap.get(`${row.id}::${col.id}`)?.value ?? 0),
              0,
            );
            return (
              <tr key={row.id} className="border-b border-border last:border-0">
                <td className="py-1.5 pr-2">{row.label}</td>
                {data.cols.map((col) => {
                  const cell = cellMap.get(`${row.id}::${col.id}`);
                  const value = cell?.value ?? 0;
                  const pct = cell?.pctRow ?? 0;
                  const intensity = data.maxValue > 0 ? value / data.maxValue : 0;
                  return (
                    <td key={col.id} className="py-0.5 pr-1">
                      <div
                        className="flex flex-col items-end justify-center rounded px-2 py-1 tabular"
                        style={{
                          backgroundColor: intensity > 0
                            ? `rgba(59, 130, 246, ${0.08 + intensity * 0.7})`
                            : 'transparent',
                        }}
                        title={`${value} matrículas (${pct.toFixed(0)}% da vendedora)`}
                      >
                        <span className={value > 0 ? 'font-medium' : 'text-muted-foreground'}>
                          {value > 0 ? value : '—'}
                        </span>
                        {value > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            {pct.toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
                <td className="py-1.5 pr-2 text-right tabular font-medium">
                  {total.toLocaleString('pt-BR')}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
