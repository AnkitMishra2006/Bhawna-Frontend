import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EMOTION_NAMES, EMOTION_COLORS, type HistoryPoint, type EmotionName } from '@/types/emotion';
import LiveEmotionChart from '@/components/LiveEmotionChart';
import EmotionTimeline from '@/components/EmotionTimeline';
import SiteNav from '@/components/SiteNav';
import PageHeader from '@/components/PageHeader';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ReportState {
  report: string;
  history: HistoryPoint[];
  backendLabel: string;
  duration: number;
}

export default function ReportPage() {
  const location = useLocation();
  const state = location.state as ReportState | null;

  if (!state) {
    return (
      <div className="min-h-screen bg-background">
        <SiteNav />
        <div className="max-w-2xl mx-auto px-6 py-32 text-center space-y-6">
          <h1 className="font-serif text-5xl">No report yet</h1>
          <p className="text-muted-foreground">Run an analysis first — we'll generate a detailed emotional reading when you're done.</p>
          <Button asChild className="rounded-full bg-foreground text-background hover:bg-foreground/90">
            <Link to="/analyse">Open analyser</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { report, history, backendLabel, duration } = state;

  const counts: Record<EmotionName, number> = { angry: 0, disgust: 0, fear: 0, happy: 0, neutral: 0, sad: 0, surprise: 0 };
  history.forEach((h) => counts[h.dominant]++);
  const total = history.length || 1;
  const distData = EMOTION_NAMES
    .map((em) => ({ emotion: em, pct: Math.round((counts[em] / total) * 100) }))
    .sort((a, b) => b.pct - a.pct);

  const top = distData[0];

  const downloadReport = () => {
    const content = `Bhawna Session Report\nModel: ${backendLabel}\nDuration: ${duration}s\nFrames: ${history.length}\n\n${report}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'emotion-report.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalDuration = history.length > 0 ? history[history.length - 1].timestamp : duration;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-background">
      <SiteNav />

      <PageHeader
        eyebrow="Session report"
        title={`A ${duration}-second emotional reading`}
        description={`Analysed by ${backendLabel} · ${history.length} frames classified · ${EMOTION_NAMES.length} emotions tracked.`}
        actions={
          <div className="flex gap-2">
            <Button asChild variant="ghost" className="rounded-full">
              <Link to="/compare">Compare models</Link>
            </Button>
            <Button onClick={downloadReport} variant="secondary" className="rounded-full">
              <Download className="w-4 h-4 mr-1.5" /> Download
            </Button>
            <Button asChild className="rounded-full bg-foreground text-background hover:bg-foreground/90">
              <Link to="/analyse">New analysis</Link>
            </Button>
          </div>
        }
      />

      <div className="max-w-[1000px] mx-auto px-6 py-12 space-y-10">
        {/* Headline stat */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border rounded-2xl overflow-hidden hairline">
          <div className="surface-1 p-6">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Dominant</div>
            <div className="font-serif text-3xl mt-2 capitalize" style={{ color: EMOTION_COLORS[top.emotion] }}>
              {top.emotion}
            </div>
            <div className="font-mono text-xs text-muted-foreground mt-1">{top.pct}% of session</div>
          </div>
          <div className="surface-1 p-6">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Frames</div>
            <div className="font-serif text-3xl mt-2">{history.length}</div>
            <div className="font-mono text-xs text-muted-foreground mt-1">~{Math.round(history.length / Math.max(duration, 1))}fps</div>
          </div>
          <div className="surface-1 p-6">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Duration</div>
            <div className="font-serif text-3xl mt-2">{duration}s</div>
            <div className="font-mono text-xs text-muted-foreground mt-1">{backendLabel}</div>
          </div>
        </div>

        {/* AI report */}
        <div className="rounded-3xl surface-1 hairline overflow-hidden">
          <div className="p-6 border-b border-border flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/15 text-primary">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-[0.2em] text-primary">Narrative summary</span>
              <h2 className="font-serif text-2xl">Written by Gemini</h2>
            </div>
          </div>
          <div className="p-8 md:p-12">
            <div className="font-serif italic text-[1.2rem] leading-[1.85] text-foreground/90 whitespace-pre-wrap max-w-2xl">
              {report.split(/\*\*(.*?)\*\*/g).map((part, i) =>
                i % 2 === 1
                  ? <strong key={i} className="not-italic font-sans font-semibold text-foreground">{part}</strong>
                  : <span key={i}>{part}</span>
              )}
            </div>
          </div>
        </div>

        {/* Distribution */}
        <div className="rounded-2xl surface-1 hairline p-6">
          <div className="mb-4">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Distribution</span>
            <h2 className="font-serif text-2xl mt-1">Where the time was spent</h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distData} layout="vertical" margin={{ top: 5, right: 24, left: 0, bottom: 5 }}>
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  unit="%"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="emotion"
                  tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                  tickFormatter={(v: string) => v.charAt(0).toUpperCase() + v.slice(1)}
                  width={80}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 12,
                    color: 'hsl(var(--foreground))',
                  }}
                  cursor={{ fill: 'hsl(var(--secondary))' }}
                />
                <Bar dataKey="pct" radius={[0, 8, 8, 0]}>
                  {distData.map((d) => (
                    <Cell key={d.emotion} fill={EMOTION_COLORS[d.emotion]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Timeline */}
        <div className="rounded-2xl surface-1 hairline p-6">
          <div className="mb-4">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Sequence</span>
            <h2 className="font-serif text-2xl mt-1">Emotion timeline</h2>
          </div>
          <EmotionTimeline history={history} totalDuration={totalDuration} />
        </div>

        {/* Full chart */}
        <LiveEmotionChart history={history} maxPoints={9999} height={340} title="Full session stream" />
      </div>
    </motion.div>
  );
}
