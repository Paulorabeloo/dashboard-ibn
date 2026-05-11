'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { EvolucaoPoint } from '@/lib/aggregations/evolucaoTemporal';

import { CHART_COLORS } from './theme';

/*
 * RF-05 — Evolução temporal de matrículas com média móvel 7d.
 * RNF-07: tooltip on hover, sem data labels que se sobrepõem.
 */

const formatTickX = (d: string): string => {
  const parts = d.split('-');
  return `${parts[2]}/${parts[1]}`;
};

const formatLabelX = (d: string): string => {
  const parts = d.split('-');
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

interface EvolucaoChartProps {
  readonly data: ReadonlyArray<EvolucaoPoint>;
}

export function EvolucaoChart({ data }: EvolucaoChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-xs text-muted-foreground">
        Janela muito ampla para evolução temporal — selecione um ciclo.
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={[...data]} margin={{ top: 8, right: 12, bottom: 0, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gridStroke} vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatTickX}
            fontSize={10}
            stroke={CHART_COLORS.axisStroke}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={32}
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
            labelFormatter={formatLabelX}
            formatter={(value: number, name: string) => [Math.round(value * 10) / 10, name]}
          />
          <Line
            type="monotone"
            dataKey="valorAnterior"
            stroke={CHART_COLORS.neutral}
            strokeWidth={1.5}
            strokeDasharray="2 4"
            dot={false}
            name="Mesmo dia ciclo anterior"
            isAnimationActive={false}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="valor"
            stroke={CHART_COLORS.primary}
            strokeWidth={2}
            dot={false}
            name="Matrículas/dia"
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="mediaMovel"
            stroke={CHART_COLORS.primarySubtle}
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
            name="Média móvel 7d"
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
