'use client';

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import type { DimensionCount } from '@/lib/aggregations/countByDimension';

import { CHART_COLORS } from './theme';

/*
 * RF-07 / RF-09 / RF-10 — Barra horizontal ordenada.
 * Usado para Polo, Origem, Bolsa.
 */

interface HorizontalBarsProps {
  readonly data: ReadonlyArray<DimensionCount>;
  readonly color?: string;
  readonly maxItems?: number;
  readonly yWidth?: number;
}

export function HorizontalBars({
  data,
  color = CHART_COLORS.primary,
  maxItems = 12,
  yWidth = 140,
}: HorizontalBarsProps) {
  const sliced = data.slice(0, maxItems).map((d) => ({
    label: d.label,
    total: d.total,
    pct: d.pct,
  }));

  if (sliced.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
        Sem dados no recorte.
      </div>
    );
  }

  const height = Math.max(140, sliced.length * 30 + 16);

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sliced} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 0 }}>
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="label"
            width={yWidth}
            fontSize={11}
            stroke={CHART_COLORS.axisStroke}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: '#f3f4f6' }}
            contentStyle={{
              backgroundColor: CHART_COLORS.tooltipBg,
              border: `1px solid ${CHART_COLORS.tooltipBorder}`,
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value: number, _: string, item) => [
              `${value} (${(item.payload.pct as number).toFixed(1)}%)`,
              'Matrículas',
            ]}
          />
          <Bar
            dataKey="total"
            fill={color}
            radius={[0, 4, 4, 0]}
            isAnimationActive={false}
            label={{
              position: 'right',
              fill: CHART_COLORS.axisStroke,
              fontSize: 11,
              formatter: (v: number) => v,
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
