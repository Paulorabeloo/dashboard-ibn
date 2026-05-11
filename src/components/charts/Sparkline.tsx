'use client';

import { Area, AreaChart, ResponsiveContainer } from 'recharts';

interface SparklineProps {
  readonly data: ReadonlyArray<{ valor: number }>;
  readonly color: string;
  readonly height?: number;
}

export function Sparkline({ data, color, height = 32 }: SparklineProps) {
  if (data.length < 2) return <div style={{ height }} />;
  const id = `spark-${color.replace('#', '')}`;
  return (
    <div style={{ height, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={[...data]} margin={{ top: 1, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="valor"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${id})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
