'use client';

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import type { FamiliaSubMix } from '@/lib/aggregations/countByDimension';

import { CHART_COLORS } from './theme';

/*
 * RF-08 — Performance por família × sub-família.
 * Barras agrupadas por família, cor por sub-família.
 */

interface Props {
  readonly data: ReadonlyArray<FamiliaSubMix>;
}

interface PivotRow {
  familiaLabel: string;
  [key: string]: number | string;
}

export function FamiliaSubChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-xs text-muted-foreground">
        Sem dados no recorte.
      </div>
    );
  }

  // Pivota: famílias nas colunas, sub-famílias nas series.
  const subKeys = Array.from(new Set(data.map((d) => d.subLabel)));
  const familiaMap = new Map<string, PivotRow>();
  for (const d of data) {
    const row = familiaMap.get(d.familiaLabel) ?? { familiaLabel: d.familiaLabel };
    row[d.subLabel] = ((row[d.subLabel] as number) ?? 0) + d.total;
    familiaMap.set(d.familiaLabel, row);
  }
  const pivoted = Array.from(familiaMap.values());

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={pivoted} margin={{ top: 8, right: 12, bottom: 0, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gridStroke} vertical={false} />
          <XAxis dataKey="familiaLabel" fontSize={11} stroke={CHART_COLORS.axisStroke} tickLine={false} />
          <YAxis fontSize={10} stroke={CHART_COLORS.axisStroke} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: CHART_COLORS.tooltipBg,
              border: `1px solid ${CHART_COLORS.tooltipBorder}`,
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          {subKeys.map((sub, i) => (
            <Bar key={sub} dataKey={sub} stackId="a" radius={[0, 0, 0, 0]} isAnimationActive={false}>
              {pivoted.map((_, idx) => (
                <Cell key={`c-${idx}`} fill={CHART_COLORS.series[i % CHART_COLORS.series.length]} />
              ))}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap gap-3 text-xs">
        {subKeys.map((sub, i) => (
          <span key={sub} className="inline-flex items-center gap-1.5 text-muted-foreground">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-sm"
              style={{ backgroundColor: CHART_COLORS.series[i % CHART_COLORS.series.length] }}
            />
            {sub}
          </span>
        ))}
      </div>
    </div>
  );
}
