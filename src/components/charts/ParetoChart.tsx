'use client';

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { ParetoEntry } from '@/lib/aggregations/pareto';

import { CHART_COLORS } from './theme';

/*
 * Pareto — barras ordenadas (volume) + linha de % acumulado.
 * Mostra visualmente a concentração: "top 5 = X% do total".
 */

interface Props {
  readonly entries: ReadonlyArray<ParetoEntry>;
}

export function ParetoChart({ entries }: Props) {
  if (entries.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-xs text-muted-foreground">
        Sem dados.
      </div>
    );
  }

  const data = entries.map((e) => ({
    nome: e.nome,
    total: e.total,
    acumuladoPct: Math.round(e.acumuladoPct * 10) / 10,
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 40, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gridStroke} vertical={false} />
          <XAxis
            dataKey="nome"
            fontSize={10}
            stroke={CHART_COLORS.axisStroke}
            tickLine={false}
            angle={-35}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            yAxisId="left"
            fontSize={10}
            stroke={CHART_COLORS.axisStroke}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            fontSize={10}
            stroke={CHART_COLORS.axisStroke}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
            unit="%"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: CHART_COLORS.tooltipBg,
              border: `1px solid ${CHART_COLORS.tooltipBorder}`,
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value: number, name: string) => {
              if (name === 'acumuladoPct') return [`${value.toFixed(1)}%`, '% acumulado'];
              return [value.toLocaleString('pt-BR'), 'Matrículas'];
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar
            yAxisId="left"
            dataKey="total"
            name="Matrículas"
            fill={CHART_COLORS.primary}
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="acumuladoPct"
            name="% acumulado"
            stroke={CHART_COLORS.negative}
            strokeWidth={2}
            dot={{ r: 3 }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
