import { useEffect, useMemo, useState } from "react";
import { useLocation, Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertCircle, Download, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  BACKENDS,
  DEFAULT_SCORES,
  EMOTION_NAMES,
  EMOTION_COLORS,
  type AnalysisRecord,
  type BackendId,
  type HistoryPoint,
  type EmotionName,
  type ReportContextPayload,
} from "@/types/emotion";
import { useAuth } from "@/contexts/AuthContext";
import LiveEmotionChart from "@/components/LiveEmotionChart";
import EmotionTimeline from "@/components/EmotionTimeline";
import SiteNav from "@/components/SiteNav";
import PageHeader from "@/components/PageHeader";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import reportIllustration from "@/assets/illustration-report.png";

const API_HOST =
  (import.meta.env.VITE_API_HOST as string | undefined) ||
  (import.meta.env.VITE_WS_HOST as string | undefined) ||
  "localhost";

interface LegacyReportState {
  report: string;
  history: HistoryPoint[];
  backendLabel: string;
  duration: number;
}

interface ReportNavigationState {
  analysisId?: string | null;
  sessionId?: string;
  backendId?: BackendId;
  backendLabel?: string;
  duration?: number;
  reportTextFallback?: string;
  historyFallback?: HistoryPoint[];
  reportContextFallback?: ReportContextPayload | null;
}

type AnyReportState = Partial<LegacyReportState & ReportNavigationState>;

function coerceBackendId(value: string | null | undefined): BackendId {
  return value === "deepface" ? "deepface" : "custom";
}

async function parseError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body?.detail === "string") return body.detail;
  } catch {
    // Ignore parsing errors and use a generic message.
  }
  return `Request failed (${res.status})`;
}

export default function ReportPage() {
  const { getToken } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const state = (location.state as AnyReportState | null) ?? null;

  const analysisId =
    (typeof state?.analysisId === "string" && state.analysisId) ||
    searchParams.get("analysis");
  const sessionId =
    (typeof state?.sessionId === "string" && state.sessionId) ||
    searchParams.get("session");

  const backendId = coerceBackendId(
    (typeof state?.backendId === "string" ? state.backendId : null) ||
      searchParams.get("backend"),
  );
  const backendLabel = state?.backendLabel || BACKENDS[backendId].label;

  const [analysis, setAnalysis] = useState<AnalysisRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(analysisId || sessionId));

  useEffect(() => {
    let cancelled = false;
    let timerId: number | null = null;

    const token = getToken();

    const fetchAnalysis = async (
      url: string,
    ): Promise<AnalysisRecord | null> => {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(await parseError(res));
      return (await res.json()) as AnalysisRecord;
    };

    const run = async () => {
      if (!analysisId && !sessionId) {
        setIsLoading(false);
        return;
      }
      if (!token) {
        setError("You are not signed in. Please log in again.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        if (analysisId) {
          const url = `http://${API_HOST}:${BACKENDS[backendId].port}/analysis/${encodeURIComponent(analysisId)}`;
          const data = await fetchAnalysis(url);
          if (!cancelled && data) {
            setAnalysis(data);
            setIsLoading(false);
          }
          if (!cancelled && !data) {
            setError("Report not found for this id.");
            setIsLoading(false);
          }
          return;
        }

        const maxAttempts = 90;
        let attempt = 0;

        const poll = async () => {
          if (cancelled || !sessionId) return;
          attempt += 1;

          try {
            const url =
              `http://${API_HOST}:${BACKENDS[backendId].port}/analysis/by-session/` +
              `${encodeURIComponent(sessionId)}?backend=${backendId}`;
            const data = await fetchAnalysis(url);

            if (cancelled) return;
            if (data) {
              setAnalysis(data);
              setIsLoading(false);
              return;
            }

            if (attempt >= maxAttempts) {
              setError(
                "Report is taking longer than expected. Please try again in a few moments.",
              );
              setIsLoading(false);
              return;
            }

            timerId = window.setTimeout(() => {
              void poll();
            }, 1200);
          } catch (err) {
            if (!cancelled) {
              setError(
                err instanceof Error ? err.message : "Could not load report",
              );
              setIsLoading(false);
            }
          }
        };

        await poll();
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not load report",
          );
          setIsLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
      if (timerId !== null) window.clearTimeout(timerId);
    };
  }, [analysisId, sessionId, backendId, getToken]);

  const fallbackHistory = useMemo(() => {
    if (Array.isArray(state?.historyFallback)) return state.historyFallback;
    if (Array.isArray(state?.history)) return state.history;
    return [] as HistoryPoint[];
  }, [state]);

  const history = useMemo(() => {
    if (!analysis?.timeline || analysis.timeline.length === 0) {
      return fallbackHistory;
    }

    return analysis.timeline
      .filter(
        (point) =>
          point.face_detected &&
          !!point.dominant_emotion &&
          !!point.smoothed_scores,
      )
      .map((point) => ({
        timestamp: point.timestamp,
        dominant: point.dominant_emotion as EmotionName,
        scores: point.smoothed_scores || DEFAULT_SCORES,
      }));
  }, [analysis, fallbackHistory]);

  const reportText =
    analysis?.report_text || state?.reportTextFallback || state?.report || "";

  const reportContext =
    analysis?.report_context || state?.reportContextFallback || null;
  const reportLens = reportContext?.label || "General emotional snapshot";

  const duration = Math.max(
    0,
    Math.round(
      analysis?.duration_seconds ||
        state?.duration ||
        (history.length > 0 ? history[history.length - 1].timestamp : 0),
    ),
  );

  const totalFrames = analysis?.total_frames || history.length;
  const detectedFrames = analysis?.detected_frames || history.length;
  const faceDetectionRate =
    analysis?.face_detection_rate ||
    (totalFrames > 0 ? Math.round((detectedFrames / totalFrames) * 100) : 0);

  const counts: Record<EmotionName, number> = {
    angry: 0,
    disgust: 0,
    fear: 0,
    happy: 0,
    neutral: 0,
    sad: 0,
    surprise: 0,
  };
  history.forEach((h) => {
    counts[h.dominant] += 1;
  });

  const distData = EMOTION_NAMES.map((emotion) => {
    const fromDb = analysis?.emotion_distribution?.[emotion];
    const fromHistory =
      history.length > 0 ? (counts[emotion] / history.length) * 100 : 0;
    return {
      emotion,
      pct: Math.round(typeof fromDb === "number" ? fromDb : fromHistory),
    };
  }).sort((a, b) => b.pct - a.pct);

  const top = distData[0] || { emotion: "neutral" as EmotionName, pct: 0 };
  const totalDuration =
    history.length > 0 ? history[history.length - 1].timestamp : duration;
  const hasContent = Boolean(reportText || history.length || analysis);

  const downloadReport = () => {
    const contextBlock = reportContext
      ? `Lens: ${reportContext.label || reportContext.key}\n` +
        `Objective: ${reportContext.objective || "Not specified"}\n` +
        `Notes: ${reportContext.extra_notes || "None"}\n\n`
      : "";
    const transcript = analysis?.transcript
      ? `\n\nTranscript:\n${analysis.transcript}`
      : "";
    const content =
      `Bhawna Session Report\n` +
      `Model: ${backendLabel}\n` +
      `Duration: ${duration}s\n` +
      `Frames: ${totalFrames}\n` +
      `Detected faces: ${detectedFrames} (${faceDetectionRate.toFixed(1)}%)\n\n` +
      `${contextBlock}` +
      `${reportText}${transcript}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "emotion-report.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <SiteNav />
        <div className="absolute inset-0 bg-aurora opacity-70 pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl surface-1 hairline p-8 md:p-10"
          >
            <div className="grid md:grid-cols-[220px,1fr] gap-8 items-center">
              <img
                src={reportIllustration}
                alt="Preparing report"
                className="w-44 md:w-52 mx-auto animate-float-slow"
                width={208}
                height={208}
              />
              <div className="space-y-5">
                <div>
                  <span className="text-xs uppercase tracking-[0.2em] text-primary">
                    Compiling report
                  </span>
                  <h1 className="font-serif text-4xl mt-2">
                    Turning frames into insight
                  </h1>
                  <p className="text-sm text-muted-foreground mt-3">
                    We are stitching your frame timeline, transcript, and
                    emotion distribution into one detailed session report.
                  </p>
                </div>
                <div className="rounded-full surface-2 hairline p-2">
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary via-accent to-primary"
                      animate={{ x: ["-65%", "105%"] }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      style={{ width: "55%" }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Waiting for backend {BACKENDS[backendId].port} to finish and
                  save your analysis.
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (error && !hasContent) {
    return (
      <div className="min-h-screen bg-background">
        <SiteNav />
        <div className="max-w-2xl mx-auto px-6 py-20 space-y-6">
          <Alert variant="destructive" className="rounded-2xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button
              asChild
              className="rounded-full bg-foreground text-background hover:bg-foreground/90"
            >
              <Link to="/analyse">Open analyser</Link>
            </Button>
            <Button asChild variant="secondary" className="rounded-full">
              <Link to="/compare">Compare models</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!hasContent) {
    return (
      <div className="min-h-screen bg-background">
        <SiteNav />
        <div className="max-w-2xl mx-auto px-6 py-32 text-center space-y-6">
          <h1 className="font-serif text-5xl">No report yet</h1>
          <p className="text-muted-foreground">
            Run an analysis first — we'll generate a detailed emotional reading
            when you're done.
          </p>
          <Button
            asChild
            className="rounded-full bg-foreground text-background hover:bg-foreground/90"
          >
            <Link to="/analyse">Open analyser</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background"
    >
      <SiteNav />

      <PageHeader
        eyebrow="Session report"
        title={`A ${duration}-second emotional reading`}
        description={`Analysed by ${backendLabel} · ${totalFrames} frames processed · ${detectedFrames} faces detected · lens: ${reportLens}.`}
        actions={
          <div className="flex gap-2">
            <Button asChild variant="ghost" className="rounded-full">
              <Link to="/compare">Compare models</Link>
            </Button>
            <Button
              onClick={downloadReport}
              variant="secondary"
              className="rounded-full"
            >
              <Download className="w-4 h-4 mr-1.5" /> Download
            </Button>
            <Button
              asChild
              className="rounded-full bg-foreground text-background hover:bg-foreground/90"
            >
              <Link to="/analyse">New analysis</Link>
            </Button>
          </div>
        }
      />

      <div className="max-w-[1000px] mx-auto px-6 py-12 space-y-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border rounded-2xl overflow-hidden hairline">
          <div className="surface-1 p-6">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Dominant
            </div>
            <div
              className="font-serif text-3xl mt-2 capitalize"
              style={{ color: EMOTION_COLORS[top.emotion] }}
            >
              {top.emotion}
            </div>
            <div className="font-mono text-xs text-muted-foreground mt-1">
              {top.pct}% of session
            </div>
          </div>
          <div className="surface-1 p-6">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Processed frames
            </div>
            <div className="font-serif text-3xl mt-2">{totalFrames}</div>
            <div className="font-mono text-xs text-muted-foreground mt-1">
              ~{Math.round(totalFrames / Math.max(duration, 1))}fps
            </div>
          </div>
          <div className="surface-1 p-6">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Detection rate
            </div>
            <div className="font-serif text-3xl mt-2">
              {faceDetectionRate.toFixed(1)}%
            </div>
            <div className="font-mono text-xs text-muted-foreground mt-1">
              {detectedFrames} frames with face
            </div>
          </div>
          <div className="surface-1 p-6">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Duration
            </div>
            <div className="font-serif text-3xl mt-2">{duration}s</div>
            <div className="font-mono text-xs text-muted-foreground mt-1">
              {backendLabel}
            </div>
          </div>
        </div>

        {reportContext && (
          <div className="rounded-2xl surface-1 hairline p-6 space-y-4">
            <div>
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Report context
              </span>
              <h2 className="font-serif text-2xl mt-1">{reportLens}</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl surface-2 p-4">
                <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  Objective
                </div>
                <p className="text-sm mt-2 leading-relaxed text-foreground/90">
                  {reportContext.objective || "No objective provided."}
                </p>
              </div>
              <div className="rounded-xl surface-2 p-4">
                <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  Additional notes
                </div>
                <p className="text-sm mt-2 leading-relaxed text-foreground/90 whitespace-pre-wrap">
                  {reportContext.extra_notes || "No additional notes provided."}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-3xl surface-1 hairline overflow-hidden">
          <div className="p-6 border-b border-border flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/15 text-primary">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-[0.2em] text-primary">
                Narrative summary
              </span>
              <h2 className="font-serif text-2xl">Generated session report</h2>
            </div>
          </div>
          <div className="p-8 md:p-12">
            <div className="font-serif italic text-[1.2rem] leading-[1.85] text-foreground/90 whitespace-pre-wrap max-w-2xl">
              {reportText.split(/\*\*(.*?)\*\*/g).map((part, i) =>
                i % 2 === 1 ? (
                  <strong
                    key={i}
                    className="not-italic font-sans font-semibold text-foreground"
                  >
                    {part}
                  </strong>
                ) : (
                  <span key={i}>{part}</span>
                ),
              )}
            </div>
          </div>
        </div>

        {analysis?.transcript && (
          <div className="rounded-2xl surface-1 hairline p-6">
            <div className="mb-4">
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Speech context
              </span>
              <h2 className="font-serif text-2xl mt-1">Captured transcript</h2>
            </div>
            <p className="text-sm leading-7 text-foreground/90 whitespace-pre-wrap">
              {analysis.transcript}
            </p>
          </div>
        )}

        <div className="rounded-2xl surface-1 hairline p-6">
          <div className="mb-4">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Distribution
            </span>
            <h2 className="font-serif text-2xl mt-1">
              Where the time was spent
            </h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={distData}
                layout="vertical"
                margin={{ top: 5, right: 24, left: 0, bottom: 5 }}
              >
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 10,
                    fontFamily: "JetBrains Mono",
                  }}
                  unit="%"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="emotion"
                  tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                  tickFormatter={(v: string) =>
                    v.charAt(0).toUpperCase() + v.slice(1)
                  }
                  width={80}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                    color: "hsl(var(--foreground))",
                  }}
                  cursor={{ fill: "hsl(var(--secondary))" }}
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

        <div className="rounded-2xl surface-1 hairline p-6">
          <div className="mb-4">
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Sequence
            </span>
            <h2 className="font-serif text-2xl mt-1">Emotion timeline</h2>
          </div>
          <EmotionTimeline history={history} totalDuration={totalDuration} />
        </div>

        <LiveEmotionChart
          history={history}
          maxPoints={9999}
          height={340}
          title="Full session stream"
        />
      </div>
    </motion.div>
  );
}
