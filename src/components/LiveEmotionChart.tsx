import { AreaChart, Area, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { EMOTION_COLORS, EMOTION_NAMES, type HistoryPoint } from '@/types/emotion';

interface LiveEmotionChartProps {
  history: HistoryPoint[];
  maxPoints?: number;
  height?: number;
  title?: string;
}

export default function LiveEmotionChart({ history, maxPoints = 75, height = 280, title = 'Emotion timeline' }: LiveEmotionChartProps) {
  const data = history.length > maxPoints ? history.slice(-maxPoints) : history;

  const chartData = data.map((p) => ({
    time: Math.round(p.timestamp * 10) / 10,
    ...p.scores,
  }));

  return (
    <div className="w-full rounded-2xl surface-1 hairline p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground">{title}</h3>
        <span className="font-mono text-[10px] text-muted-foreground">
          {history.length} frames · last {Math.min(history.length, maxPoints)}
        </span>
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col gap-3 animate-pulse justify-center items-center" style={{ height }}>
          <div className="h-2 bg-secondary rounded w-3/4" />
          <div className="h-2 bg-secondary rounded w-1/2" />
          <div className="h-2 bg-secondary rounded w-2/3" />
          <p className="text-muted-foreground text-xs mt-3 uppercase tracking-widest">Waiting for data…</p>
        </div>
      ) : (
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 4" vertical={false} />
              <XAxis
                dataKey="time"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
                label={{ value: 's', position: 'insideBottomRight', fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 12,
                  color: 'hsl(var(--foreground))',
                  fontSize: 12,
                  boxShadow: '0 10px 40px hsl(0 0% 0% / 0.4)',
                }}
                cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 3' }}
              />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                formatter={(value) => <span className="capitalize text-muted-foreground">{value}</span>}
              />
              {EMOTION_NAMES.map((em) => (
                <Area
                  key={em}
                  type="monotone"
                  dataKey={em}
                  stroke={EMOTION_COLORS[em]}
                  fill={EMOTION_COLORS[em]}
                  fillOpacity={0}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
