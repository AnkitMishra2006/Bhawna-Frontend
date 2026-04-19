import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, Webcam, Play, Square, AlertCircle, Sparkles, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BACKENDS, type BackendId, type InputMode } from '@/types/emotion';
import { useEmotionWebSocket } from '@/hooks/useEmotionWebSocket';
import { useFrameCapture } from '@/hooks/useFrameCapture';
import { generateSessionId } from '@/utils/sessionId';
import { formatSeconds } from '@/utils/formatTime';
import ConnectionStatusBadge from '@/components/ConnectionStatusBadge';
import BackendSelector from '@/components/BackendSelector';
import EmotionBadge from '@/components/EmotionBadge';
import LiveEmotionChart from '@/components/LiveEmotionChart';
import ScoreGrid from '@/components/ScoreGrid';
import SiteNav from '@/components/SiteNav';
import PageHeader from '@/components/PageHeader';
import uploadIllustration from '@/assets/illustration-upload.png';
import captureIllustration from '@/assets/illustration-capture.png';

export default function AnalysePage() {
  const navigate = useNavigate();
  const [backend, setBackend] = useState<BackendId>('custom');
  const [inputMode, setInputMode] = useState<InputMode>('upload');
  const [sessionId, setSessionId] = useState(generateSessionId);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const port = BACKENDS[backend].port;
  const ws = useEmotionWebSocket(port, sessionId);

  const handleFrame = useCallback((base64: string, timestamp: number) => {
    ws.sendFrame(base64, timestamp);
  }, [ws.sendFrame]);

  useFrameCapture(videoRef, handleFrame, isRunning && ws.status === 'connected', 200);

  useEffect(() => {
    if (!isRunning || !startTime) return;
    const id = setInterval(() => setElapsed((Date.now() - startTime) / 1000), 500);
    return () => clearInterval(id);
  }, [isRunning, startTime]);

  const handleStart = () => {
    const newId = generateSessionId();
    setSessionId(newId);
    setTimeout(() => {
      ws.connect();
      setIsRunning(true);
      setStartTime(Date.now());
      setElapsed(0);
      if (inputMode === 'upload' && videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play();
      }
    }, 0);
  };

  const handleStop = () => {
    ws.endSession();
    setIsRunning(false);
    if (videoRef.current && inputMode === 'upload') videoRef.current.pause();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      if (videoRef.current) videoRef.current.src = URL.createObjectURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('video/')) {
      setVideoFile(file);
      if (videoRef.current) videoRef.current.src = URL.createObjectURL(file);
    }
  };

  const enableWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setWebcamStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error('Webcam error:', err);
    }
  };

  const stopWebcam = () => {
    webcamStream?.getTracks().forEach((t) => t.stop());
    setWebcamStream(null);
  };

  useEffect(() => {
    return () => {
      webcamStream?.getTracks().forEach((t) => t.stop());
    };
  }, [webcamStream]);

  const canStart = inputMode === 'upload' ? !!videoFile : !!webcamStream;
  const backendLabel = BACKENDS[backend].label;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background"
    >
      <SiteNav />

      <PageHeader
        eyebrow="Workspace"
        title="Analyse a session"
        description="Choose a model, drop in a video or grant webcam access, and watch seven emotions stream live as your subject reacts."
        actions={
          <>
            {isRunning && (
              <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <span className="recording-dot" /> Recording
              </span>
            )}
            <ConnectionStatusBadge status={ws.status} port={port} />
          </>
        }
      />

      <div className="max-w-[1200px] mx-auto px-6 py-10 space-y-8">
        {/* Step 1: Model */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              <span className="text-foreground font-mono mr-2">01</span> Choose a model
            </h2>
          </div>
          <BackendSelector selected={backend} onChange={setBackend} disabled={isRunning} />
        </section>

        {/* Step 2: Input + Controls */}
        <section className="space-y-3">
          <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <span className="text-foreground font-mono mr-2">02</span> Pick your input
          </h2>

          <div className="rounded-2xl surface-1 hairline p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <Tabs value={inputMode} onValueChange={(v) => { if (!isRunning) setInputMode(v as InputMode); }}>
              <TabsList className="bg-secondary">
                <TabsTrigger value="upload" disabled={isRunning} className="data-[state=active]:bg-background">
                  <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload video
                </TabsTrigger>
                <TabsTrigger value="webcam" disabled={isRunning} className="data-[state=active]:bg-background">
                  <Webcam className="w-3.5 h-3.5 mr-1.5" /> Live webcam
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              {!isRunning ? (
                <Button
                  onClick={handleStart}
                  disabled={!canStart}
                  size="lg"
                  className="rounded-full bg-foreground text-background hover:bg-foreground/90"
                >
                  <Play className="w-4 h-4 mr-1.5" /> Start analysis
                </Button>
              ) : (
                <Button onClick={handleStop} size="lg" variant="destructive" className="rounded-full">
                  <Square className="w-4 h-4 mr-1.5" /> Stop & get report
                </Button>
              )}
            </div>
          </div>
        </section>

        {ws.status === 'error' && (
          <Alert variant="destructive" className="rounded-2xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Could not connect to the backend on port {port}. Make sure the FastAPI server is running.
            </AlertDescription>
          </Alert>
        )}

        {/* Main */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: video + dominant */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-2xl surface-1 hairline overflow-hidden">
              {inputMode === 'upload' && !videoFile ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center aspect-video border-2 border-dashed border-border m-4 rounded-xl cursor-pointer hover:border-primary/50 hover:surface-2 transition-all group"
                >
                  <img
                    src={uploadIllustration}
                    alt=""
                    aria-hidden="true"
                    width={120}
                    height={120}
                    loading="lazy"
                    className="w-28 h-28 opacity-60 group-hover:opacity-90 group-hover:-translate-y-1 transition-all duration-500 mb-3"
                  />
                  <p className="font-serif text-xl text-foreground">Drop a video here</p>
                  <p className="text-xs text-muted-foreground mt-1">or click to browse · mp4, mov, webm</p>
                  <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
                </div>
              ) : inputMode === 'webcam' && !webcamStream ? (
                <div className="flex flex-col items-center justify-center aspect-video p-4 gap-4">
                  <img
                    src={captureIllustration}
                    alt=""
                    aria-hidden="true"
                    width={120}
                    height={120}
                    loading="lazy"
                    className="w-28 h-28 opacity-70 animate-float-slow"
                  />
                  <div className="text-center">
                    <p className="font-serif text-xl text-foreground">Allow camera access</p>
                    <p className="text-xs text-muted-foreground mt-1">Stream stays on your device.</p>
                  </div>
                  <Button onClick={enableWebcam} variant="secondary" className="rounded-full">
                    <Webcam className="w-4 h-4 mr-1.5" /> Enable camera
                  </Button>
                </div>
              ) : (
                <div className="relative aspect-video bg-black overflow-hidden">
                  <video
                    ref={videoRef}
                    controls={inputMode === 'upload'}
                    autoPlay={inputMode === 'webcam'}
                    muted
                    playsInline
                    className="w-full h-full object-contain"
                    style={inputMode === 'webcam' ? { transform: 'scaleX(-1)' } : undefined}
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/70 backdrop-blur text-[11px]">
                    <span className={`w-1.5 h-1.5 rounded-full ${ws.faceDetected ? 'bg-emerald-400' : 'bg-muted-foreground'} ${ws.faceDetected ? 'animate-pulse' : ''}`} />
                    <span className={ws.faceDetected ? 'text-emerald-300' : 'text-muted-foreground'}>
                      {ws.faceDetected ? 'Face detected' : 'No face'}
                    </span>
                  </div>
                  {inputMode === 'webcam' && (
                    <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live camera
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-px bg-border rounded-2xl overflow-hidden hairline">
              {[
                { label: 'Frames', value: ws.frameCount },
                { label: 'Session', value: formatSeconds(elapsed) },
                { label: 'Model', value: backendLabel.split(' ')[0] },
              ].map((s) => (
                <div key={s.label} className="surface-1 p-4 text-center">
                  <div className="font-serif text-2xl text-foreground">{s.value}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: dominant + scores */}
          <div className="lg:col-span-5 space-y-6">
            <div className="flex justify-center">
              <EmotionBadge
                emotion={ws.dominantEmotion}
                confidence={ws.confidence}
                faceDetected={ws.faceDetected}
                size="lg"
                isAnalysing={isRunning}
              />
            </div>
            <ScoreGrid scores={ws.currentScores} />
          </div>
        </div>

        {/* Live chart full width */}
        <LiveEmotionChart history={ws.history} height={300} title="Live emotion stream" />

        {/* Report Section */}
        {ws.report && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="rounded-3xl surface-1 hairline overflow-hidden">
              <div className="border-b border-border p-6 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/15 text-primary">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-[0.2em] text-primary">AI summary</span>
                    <h3 className="font-serif text-2xl">Session report</h3>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    className="rounded-full"
                    onClick={() => {
                      stopWebcam();
                      setVideoFile(null);
                      setIsRunning(false);
                      setElapsed(0);
                      setStartTime(null);
                      setSessionId(generateSessionId());
                    }}
                  >
                    <RotateCcw className="w-4 h-4 mr-1.5" /> New session
                  </Button>
                  <Button
                    className="rounded-full bg-foreground text-background hover:bg-foreground/90"
                    onClick={() => navigate('/report', {
                      state: {
                        report: ws.report,
                        history: ws.history,
                        backendLabel,
                        duration: Math.round(elapsed),
                      },
                    })}
                  >
                    View full report
                  </Button>
                </div>
              </div>
              <div className="p-6 md:p-10">
                <div className="text-foreground/90 leading-[1.85] whitespace-pre-wrap text-[1.05rem] max-w-3xl font-serif italic">
                  {ws.report.split(/\*\*(.*?)\*\*/g).map((part, i) =>
                    i % 2 === 1
                      ? <strong key={i} className="not-italic font-sans font-semibold text-foreground">{part}</strong>
                      : <span key={i}>{part}</span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
