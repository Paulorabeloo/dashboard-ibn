import type { DiaHoraResult } from '@/lib/aggregations/heatmapDiaHora';

/*
 * Heatmap dia × hora — 7 linhas × 24 colunas, cor proporcional ao volume.
 */

interface Props {
  readonly data: DiaHoraResult;
}

export function HeatmapDiaHora({ data }: Props) {
  if (data.maxValor === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
        Sem dados no recorte.
      </div>
    );
  }

  // Mostra só horas com algum dado (compacta)
  const horas = data.horasAtivas.length > 0 ? data.horasAtivas : [9, 10, 11, 12, 13, 14, 15, 16, 17];
  const cellByKey = new Map<string, number>();
  for (const c of data.cells) cellByKey.set(`${c.dia}-${c.hora}`, c.valor);

  return (
    <div className="overflow-x-auto">
      <table className="text-xs tabular">
        <thead>
          <tr>
            <th className="pr-2 text-right text-[10px] font-medium text-muted-foreground">
              dia / hora
            </th>
            {horas.map((h) => (
              <th key={h} className="px-0.5 text-center text-[10px] font-medium text-muted-foreground">
                {String(h).padStart(2, '0')}h
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.diasLabels.map((label, d) => {
            // Total da linha
            const totalLinha = horas.reduce(
              (s, h) => s + (cellByKey.get(`${d}-${h}`) ?? 0),
              0,
            );
            return (
              <tr key={d}>
                <td className="pr-2 text-right text-[10px] font-medium text-muted-foreground">
                  {label}
                </td>
                {horas.map((h) => {
                  const v = cellByKey.get(`${d}-${h}`) ?? 0;
                  const intensity = data.maxValor > 0 ? v / data.maxValor : 0;
                  return (
                    <td key={h} className="px-0.5 py-0.5">
                      <div
                        className="flex h-7 min-w-8 items-center justify-center rounded text-[10px] font-medium"
                        style={{
                          backgroundColor:
                            intensity > 0
                              ? `rgba(59, 130, 246, ${0.08 + intensity * 0.7})`
                              : 'transparent',
                          color: intensity > 0.4 ? 'white' : 'inherit',
                        }}
                        title={`${label} ${String(h).padStart(2, '0')}h: ${v} matrículas`}
                      >
                        {v > 0 ? v : '—'}
                      </div>
                    </td>
                  );
                })}
                <td className="pl-2 text-right text-[10px] font-medium text-muted-foreground">
                  {totalLinha > 0 ? totalLinha : ''}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
