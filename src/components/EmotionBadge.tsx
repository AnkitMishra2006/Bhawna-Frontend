import { useEffect, useRef, useState } from 'react';
import { EMOTION_COLORS, EMOTION_EMOJIS, type EmotionName } from '@/types/emotion';
import { ScanFace } from 'lucide-react';

interface EmotionBadgeProps {
  emotion: EmotionName | null;
  confidence: number;
  faceDetected: boolean;
  size?: 'sm' | 'md' | 'lg';
  isAnalysing?: boolean;
}

const sizeMap = {
  sm: { emoji: 'text-3xl', name: 'text-[11px]', conf: 'text-2xl', pad: 'p-5', w: 'min-w-[160px]' },
  md: { emoji: 'text-5xl', name: 'text-xs', conf: 'text-3xl', pad: 'p-6', w: 'min-w-[200px]' },
  lg: { emoji: 'text-7xl', name: 'text-xs', conf: 'text-5xl', pad: 'p-8', w: 'min-w-[260px]' },
};

export default function EmotionBadge({ emotion, confidence, faceDetected, size = 'md', isAnalysing }: EmotionBadgeProps) {
  const s = sizeMap[size];
  const [pop, setPop] = useState(false);
  const prevEmotion = useRef<EmotionName | null>(null);

  useEffect(() => {
    if (emotion && emotion !== prevEmotion.current && prevEmotion.current !== null) {
      setPop(true);
      const t = setTimeout(() => setPop(false), 320);
      return () => clearTimeout(t);
    }
    prevEmotion.current = emotion;
  }, [emotion]);

  if (!faceDetected) {
    return (
      <div className={`${s.pad} ${s.w} flex flex-col items-center justify-center rounded-2xl border border-dashed border-border surface-2 text-muted-foreground`}>
        <ScanFace className="w-10 h-10 mb-3 opacity-40" strokeWidth={1.5} />
        <span className="text-xs uppercase tracking-widest">No face detected</span>
      </div>
    );
  }

  if (!emotion) return null;

  const color = EMOTION_COLORS[emotion];

  return (
    <div
      className={`${s.pad} ${s.w} relative flex flex-col items-center justify-center rounded-2xl transition-all duration-500 ${pop ? 'badge-pop' : ''} ${isAnalysing ? 'scanline-overlay' : ''} hairline overflow-hidden`}
      style={{
        background: `linear-gradient(160deg, ${color}1f 0%, ${color}08 60%, transparent 100%), hsl(var(--surface-1))`,
        boxShadow: `0 0 0 1px ${color}33, 0 24px 60px -20px ${color}40`,
      }}
    >
      {/* corner glow */}
      <div
        className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-40 pointer-events-none"
        style={{ backgroundColor: color }}
      />

      <div className={`${s.emoji} ${faceDetected ? 'glow-pulse' : ''} relative z-10 leading-none`}>
        {EMOTION_EMOJIS[emotion]}
      </div>

      <div className={`${s.name} relative z-10 mt-4 uppercase tracking-[0.2em] text-muted-foreground`}>
        Dominant
      </div>
      <div
        className="relative z-10 font-serif text-lg sm:text-xl mt-0.5 capitalize"
        style={{ color }}
      >
        {emotion}
      </div>
      <div className={`${s.conf} relative z-10 font-serif mt-3 leading-none`} style={{ color }}>
        {Math.round(confidence)}
        <span className="text-base align-top opacity-60 ml-0.5">%</span>
      </div>
    </div>
  );
}
