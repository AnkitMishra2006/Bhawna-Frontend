import { EMOTION_NAMES, type EmotionScores } from '@/types/emotion';
import ScoreBar from './ScoreBar';

interface ScoreGridProps {
  scores: EmotionScores;
}

export default function ScoreGrid({ scores }: ScoreGridProps) {
  const sorted = [...EMOTION_NAMES].sort((a, b) => scores[b] - scores[a]);

  return (
    <div className="rounded-2xl surface-1 hairline p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground">Live scores</h3>
        <span className="font-mono text-[10px] text-muted-foreground">smoothed · 0–100</span>
      </div>
      <div className="flex flex-col gap-2.5">
        {sorted.map((em) => (
          <ScoreBar key={em} emotion={em} value={scores[em]} />
        ))}
      </div>
    </div>
  );
}
