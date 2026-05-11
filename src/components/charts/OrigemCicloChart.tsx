'use client';

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { ORDEM_ORIGENS, ORIGEM_LABEL, type OrigemCicloRow } from '@/lib/aggregations/origemPorCiclo';

import { CHART_COLORS } from './theme';

/*
 * Evolução de origens por ciclo — barras empilhadas 100%.
 * Mostra como a composição de canais muda entre ciclos.
 */

interface Props {
  readonly rows: ReadonlyArray<OrigemCicloRow>;
}

export function OrigemCicloChart({ rows }: Props) {
  const ativos = rows.filter((r) => r.total > 0);
  if (ativos.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-xs text-muted-foreground">
        Sem dados.
      </div>
    );
  }

  const data = ativos.map((r) => {
    const obj: { cicloId: string; [k: string]: number | string } = { cicloId: r.cicloId };
    for (const o of ORDEM_ORIGENS) {
      obj[ORIGEM_LABEL[o]] = Math.round(r.pctOrigens[o] * 10) / 10;
    }
    return obj;
  });

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.gridStroke} vertical={false} />
          <XAxis dataKey="cicloId" fontSize={11} stroke={CHART_COLORS.axisStroke} tickLine={false} />
          <YAxis
            fontSize={10}
            stroke={CHART_COLORS.axisStroke}
            tickLine={false}
            axisLine={false}
            unit="%"
            domain={[0, 100]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: CHART_COLORS.tooltipBg,
              border: `1px solid ${CHART_COLORS.tooltipBorder}`,
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value: unknown, name: unknown) => [`${Number(value).toFixed(1)}%`, String(name)]}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {ORDEM_ORIGENS.map((o, i) => (
            <Bar
              key={o}
              dataKey={ORIGEM_LABEL[o]}
              stackId="origem"
              fill={CHART_COLORS.series[i % CHART_COLORS.series.length]}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
