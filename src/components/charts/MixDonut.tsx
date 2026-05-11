'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import type { MixFamiliaEntry } from '@/lib/aggregations/mixFamilia';

import { CHART_COLORS } from './theme';

/*
 * Mix de produto em donut chart com legenda lateral.
 * Cores estáveis e padronizadas com a paleta da marca.
 */

const PRODUTO_COLOR: Record<string, string> = {
  graduacao: '#3b82f6', // blue-500
  pos: '#8b5cf6', // violet-500
  tecnico: '#10b981', // emerald-500
  outro: '#94a3b8', // slate-400
};

const PRODUTO_LABEL: Record<string, string> = {
  graduacao: 'Graduação',
  pos: 'Pós-graduação',
  tecnico: 'Técnicos',
  outro: 'Outros',
};

interface Props {
  readonly data: ReadonlyArray<MixFamiliaEntry>;
}

export function MixDonut({ data }: Props) {
  const visible = data.filter((e) => e.atual > 0);
  const total = visible.reduce((s, e) => s + e.atual, 0);

  if (total === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-xs text-muted-foreground">
        Sem matrículas no recorte.
      </div>
    );
  }

  const chartData = visible.map((e) => ({
    name: PRODUTO_LABEL[e.familia] ?? e.familia,
    value: e.atual,
    fill: PRODUTO_COLOR[e.familia] ?? CHART_COLORS.neutral,
    pct: e.pct,
    deltaPp: e.deltaPp,
  }));

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="relative h-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="92%"
              startAngle={90}
              endAngle={-270}
              isAnimationActive={false}
              stroke="white"
              strokeWidth={2}
            >
              {chartData.map((entry, i) => (
                <Cell key={`c-${i}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: CHART_COLORS.tooltipBg,
                border: `1px solid ${CHART_COLORS.tooltipBorder}`,
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value: number, _name: string, item) => [
                `${value} (${(item.payload.pct as number).toFixed(0)}%)`,
                item.payload.name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tabular leading-none">
            {total.toLocaleString('pt-BR')}
          </span>
          <span className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
            matrículas
          </span>
        </div>
      </div>
      <ul className="flex flex-col justify-center gap-2 text-xs">
        {chartData.map((entry) => (
          <li key={entry.name} className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 truncate">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 flex-shrink-0 rounded-sm"
                style={{ backgroundColor: entry.fill }}
              />
              <span className="truncate">{entry.name}</span>
            </span>
            <span className="tabular text-foreground">
              {entry.pct.toFixed(0)}%
              {entry.deltaPp !== 0 && (
                <span
                  className={`ml-1 text-[10px] ${
                    entry.deltaPp > 0
                      ? 'text-emerald-600'
                      : entry.deltaPp < 0
                        ? 'text-rose-600'
                        : 'text-muted-foreground'
                  }`}
                >
                  ({entry.deltaPp > 0 ? '+' : ''}
                  {entry.deltaPp.toFixed(1)}pp)
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
