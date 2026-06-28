import { EMOTION_COLORS, type HistoryPoint } from '@/types/emotion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface EmotionTimelineProps {
  history: HistoryPoint[];
  totalDuration: number;
}

export default function EmotionTimeline({ history, totalDuration }: EmotionTimelineProps) {
  if (history.length === 0) return null;

  const tickCount = Math.max(0, Math.floor(totalDuration / 10));
  const ticks = Array.from({ length: tickCount }, (_, i) => (i + 1) * 10);

  return (
    <div className="w-full">
      <div className="flex h-7 w-full rounded-lg overflow-hidden hairline">
        {history.map((point, i) => (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <div
                className="h-full flex-1 min-w-0 transition-opacity hover:opacity-80"
                style={{ backgroundColor: EMOTION_COLORS[point.dominant] }}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs capitalize font-medium">{point.dominant}</p>
              <p className="text-[10px] font-mono text-muted-foreground">{point.timestamp.toFixed(1)}s</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      {ticks.length > 0 && (
        <div className="relative h-4 mt-2">
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute text-[10px] font-mono text-muted-foreground -translate-x-1/2"
              style={{ left: `${(t / totalDuration) * 100}%` }}
            >
              {t}s
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
