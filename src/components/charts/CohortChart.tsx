'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { CohortSeries } from '@/lib/aggregations/cohortByCycle';

import { CHART_COLORS } from './theme';

/*
 * Cohort curves — uma linha por ciclo, eixo X = dia desde o início.
 * Permite ver se o ciclo atual está à frente/atrás dos anteriores.
 */

interface Props {
  readonly series: ReadonlyArray<CohortSeries>;
  readonly currentCicloId?: string | undefined;
}

const CYCLE_COLORS = ['#94a3b8', '#cbd5e1', '#fbbf24', '#10b981', '#3b82f6', '#ef4444'];

export function CohortChart({ series, currentCicloId }: Props) {
  if (series.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-xs text-muted-foreground">
        Sem dados.
      </div>
    );
  }

  // Pivota: x = diaOffset, y = acumulado por ciclo
  const maxDias = Math.max(...series.map((s) => s.pontos.length));
  const data: Array<{ diaOffset: number; [key: string]: number | null }> = [];
  for (let d = 0; d < maxDias; d++) {
    const row: { diaOffset: number; [k: string]: number | null } = { diaOffset: d };
    for (const s of series) {
      const pt = s.pontos[d];
      row[s.cicloId] = pt ? pt.acumulado : null;
    }
    data.push(row);
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gridStroke} vertical={false} />
          <XAxis
            dataKey="diaOffset"
            fontSize={10}
            stroke={CHART_COLORS.axisStroke}
            tickLine={false}
            label={{
              value: 'dia desde o início do ciclo',
              position: 'insideBottom',
              offset: -2,
              fontSize: 10,
              fill: CHART_COLORS.axisStroke,
            }}
          />
          <YAxis
            fontSize={10}
            stroke={CHART_COLORS.axisStroke}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: CHART_COLORS.tooltipBg,
              border: `1px solid ${CHART_COLORS.tooltipBorder}`,
              borderRadius: 8,
              fontSize: 12,
            }}
            labelFormatter={(d: number) => `dia ${d}`}
            formatter={(value: unknown, name: unknown) => [
              value == null ? '—' : Number(value).toLocaleString('pt-BR'),
              String(name),
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
            iconType="line"
            iconSize={14}
          />
          {series.map((s, i) => {
            const isCurrent = s.cicloId === currentCicloId;
            return (
              <Line
                key={s.cicloId}
                type="monotone"
                dataKey={s.cicloId}
                name={s.cicloId}
                stroke={CYCLE_COLORS[i % CYCLE_COLORS.length]}
                strokeWidth={isCurrent ? 2.5 : 1.5}
                strokeOpacity={isCurrent ? 1 : 0.75}
                dot={false}
                isAnimationActive={false}
                connectNulls={false}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
