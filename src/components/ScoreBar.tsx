import { EMOTION_COLORS, EMOTION_EMOJIS, type EmotionName } from '@/types/emotion';

interface ScoreBarProps {
  emotion: EmotionName;
  value: number;
  showLabel?: boolean;
}

export default function ScoreBar({ emotion, value, showLabel = true }: ScoreBarProps) {
  const color = EMOTION_COLORS[emotion];
  return (
    <div className="flex items-center gap-3">
      {showLabel && (
        <div className="flex items-center gap-2 w-24">
          <span className="text-base leading-none">{EMOTION_EMOJIS[emotion]}</span>
          <span className="text-xs capitalize text-muted-foreground">{emotion}</span>
        </div>
      )}
      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(value, 100)}%`,
            backgroundColor: color,
            boxShadow: value > 30 ? `0 0 12px ${color}60` : undefined,
          }}
        />
      </div>
      <span className="text-xs font-mono w-10 text-right text-foreground/70">
        {Math.round(value)}
      </span>
    </div>
  );
}
