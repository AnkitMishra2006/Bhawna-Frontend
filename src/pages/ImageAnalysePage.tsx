import { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Image as ImageIcon,
  Play,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Target,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BACKENDS,
  type BackendId,
  EMOTION_NAMES,
  type EmotionName,
} from "@/types/emotion";
import { useEmotionWebSocket } from "@/hooks/useEmotionWebSocket";
import { generateSessionId } from "@/utils/sessionId";
import ConnectionStatusBadge from "@/components/ConnectionStatusBadge";
import BackendSelector from "@/components/BackendSelector";
import EmotionBadge from "@/components/EmotionBadge";
import LiveEmotionChart from "@/components/LiveEmotionChart";
import ScoreGrid from "@/components/ScoreGrid";
import SiteNav from "@/components/SiteNav";
import PageHeader from "@/components/PageHeader";
import uploadIllustration from "@/assets/illustration-upload.png";

export default function ImageAnalysePage() {
  const navigate = useNavigate();

  const [backend, setBackend] = useState<BackendId>("custom");
  const [sessionId, setSessionId] = useState(generateSessionId);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const imageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageFrameSentRef = useRef(false);

  const port = BACKENDS[backend].port;
  const backendLabel = BACKENDS[backend].label;
  const ws = useEmotionWebSocket(port, sessionId, () => navigate("/login"));

  const canStart = !!imageFile;

  useEffect(() => {
    if (!imageFile) return;
    const image = imageRef.current;
    if (!image) return;

    const objectUrl = URL.createObjectURL(imageFile);
    image.src = objectUrl;

    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  useEffect(() => {
    if (
      !isRunning ||
      ws.status !== "connected" ||
      !imageFile ||
      imageFrameSentRef.current
    ) {
      return;
    }

    imageFrameSentRef.current = true;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (dataUrl) {
        ws.sendFrame(dataUrl, 0);
      }
    };
    reader.readAsDataURL(imageFile);
  }, [isRunning, ws.status, imageFile, ws.sendFrame]);

  useEffect(() => {
    if (!isRunning) return;
    if (ws.frameCount > 0) {
      setIsRunning(false);
      ws.disconnect();
      return;
    }
    if (ws.status === "error") {
      setIsRunning(false);
    }
  }, [isRunning, ws.frameCount, ws.status, ws.disconnect]);

  useEffect(() => {
    return () => {
      ws.disconnect();
    };
  }, [ws.disconnect]);

  const handleStart = () => {
    if (!canStart || isRunning || ws.status !== "idle") return;
    const newId = generateSessionId();
    setSessionId(newId);
    imageFrameSentRef.current = false;
    setIsRunning(true);
    ws.connect(newId);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type.startsWith("image/")) {
      setImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) {
      setImageFile(file);
    }
  };

  const getFaceOverlayStyle = () => {
    if (!ws.faceDetected || !ws.faceBox || !imageRef.current) return null;

    const image = imageRef.current;
    const containerWidth = image.clientWidth;
    const containerHeight = image.clientHeight;
    const sourceWidth = image.naturalWidth || containerWidth;
    const sourceHeight = image.naturalHeight || containerHeight;

    if (
      containerWidth <= 0 ||
      containerHeight <= 0 ||
      sourceWidth <= 0 ||
      sourceHeight <= 0
    ) {
      return null;
    }

    const containerAspect = containerWidth / containerHeight;
    const sourceAspect = sourceWidth / sourceHeight;

    let renderedWidth = containerWidth;
    let renderedHeight = containerHeight;
    let offsetX = 0;
    let offsetY = 0;

    if (containerAspect > sourceAspect) {
      renderedHeight = containerHeight;
      renderedWidth = renderedHeight * sourceAspect;
      offsetX = (containerWidth - renderedWidth) / 2;
    } else {
      renderedWidth = containerWidth;
      renderedHeight = renderedWidth / sourceAspect;
      offsetY = (containerHeight - renderedHeight) / 2;
    }

    return {
      left: offsetX + ws.faceBox.x * renderedWidth,
      top: offsetY + ws.faceBox.y * renderedHeight,
      width: ws.faceBox.width * renderedWidth,
      height: ws.faceBox.height * renderedHeight,
    };
  };

  const faceOverlayStyle = getFaceOverlayStyle();

  const topEmotions = useMemo(() => {
    return [...EMOTION_NAMES]
      .sort((a, b) => ws.currentScores[b] - ws.currentScores[a])
      .slice(0, 3)
      .map((emotion) => ({ emotion, score: ws.currentScores[emotion] }));
  }, [ws.currentScores]);

  const dominant = ws.dominantEmotion;
  const dominantLabel = dominant
    ? dominant.charAt(0).toUpperCase() + dominant.slice(1)
    : "N/A";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background"
    >
      <SiteNav />

      <PageHeader
        eyebrow="Image Lab"
        title="Analyse a single image"
        description="Upload one image, run either EmotionNet or DeepFace, and inspect face-box localization with full score breakdown."
        actions={
          <>
            {isRunning && (
              <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <span className="recording-dot" /> Analysing image
              </span>
            )}
            <ConnectionStatusBadge status={ws.status} port={port} />
          </>
        }
      />

      <div className="max-w-[1200px] mx-auto px-6 py-10 space-y-8">
        <section className="space-y-3">
          <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <span className="text-foreground font-mono mr-2">01</span> Choose a
            model
          </h2>
          <BackendSelector
            selected={backend}
            onChange={setBackend}
            disabled={isRunning}
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <span className="text-foreground font-mono mr-2">02</span> Upload
            image
          </h2>

          <div className="rounded-2xl surface-1 hairline p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <Tabs value="image">
              <TabsList className="bg-secondary">
                <TabsTrigger
                  value="image"
                  className="data-[state=active]:bg-background"
                >
                  <ImageIcon className="w-3.5 h-3.5 mr-1.5" /> Single image
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Button
              onClick={handleStart}
              disabled={!canStart || ws.status !== "idle" || isRunning}
              size="lg"
              className="rounded-full bg-foreground text-background hover:bg-foreground/90"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Analysing
                  image...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-1.5" /> Analyze image
                </>
              )}
            </Button>
          </div>
        </section>

        {ws.status === "error" && (
          <Alert variant="destructive" className="rounded-2xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Could not connect to the backend on port {port}. Make sure the
              FastAPI server is running.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-2xl surface-1 hairline overflow-hidden">
              {!imageFile ? (
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
                  <p className="font-serif text-xl text-foreground">
                    Drop an image here
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    or click to browse · jpg, png, webp
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              ) : (
                <div className="relative aspect-video bg-black overflow-hidden">
                  <img
                    ref={imageRef}
                    alt="Uploaded frame for emotion analysis"
                    className="w-full h-full object-contain"
                  />

                  {faceOverlayStyle && (
                    <div
                      className="absolute pointer-events-none"
                      style={faceOverlayStyle}
                    >
                      <div className="absolute inset-0 rounded-md border-2 border-emerald-400 shadow-[0_0_0_1px_rgba(16,185,129,0.35)]" />
                      <div className="absolute -top-7 left-0 rounded-md bg-emerald-400/90 text-[11px] text-black font-semibold px-2 py-1 whitespace-nowrap">
                        <span className="capitalize">
                          {ws.dominantEmotion || "face"}
                        </span>{" "}
                        <span>{Math.round(ws.confidence)}%</span>
                      </div>
                    </div>
                  )}

                  <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 text-primary text-[11px]">
                    <ImageIcon className="w-3 h-3" /> Single image
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/70 backdrop-blur text-[11px]">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${ws.faceDetected ? "bg-emerald-400" : "bg-muted-foreground"} ${ws.faceDetected ? "animate-pulse" : ""}`}
                    />
                    <span
                      className={
                        ws.faceDetected
                          ? "text-emerald-300"
                          : "text-muted-foreground"
                      }
                    >
                      {ws.faceDetected ? "Face detected" : "No face"}
                    </span>
                  </div>

                  {isRunning && (
                    <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] flex items-center justify-center">
                      <div className="rounded-2xl surface-1 hairline px-5 py-3 flex items-center gap-2.5 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        Analysing image...
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <LiveEmotionChart
              history={ws.history}
              height={280}
              title="Single-image score trace"
            />
          </div>

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

            <div className="rounded-2xl surface-1 hairline p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-widest text-muted-foreground">
                  Top 3 emotions
                </h3>
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
              </div>

              <div className="space-y-3">
                {topEmotions.map((item, index) => {
                  const label =
                    item.emotion.charAt(0).toUpperCase() +
                    item.emotion.slice(1);
                  return (
                    <div
                      key={item.emotion}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground">
                        #{index + 1} {label}
                      </span>
                      <span className="font-mono text-foreground">
                        {item.score.toFixed(2)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl surface-1 hairline p-5 space-y-3">
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground">
                Detection snapshot
              </h3>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground inline-flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" /> Dominant emotion
                </span>
                <span className="font-medium">{dominantLabel}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Confidence
                </span>
                <span className="font-mono">{Math.round(ws.confidence)}%</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Backend</span>
                <span className="font-medium">{backendLabel}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Frames processed</span>
                <span className="font-mono">{ws.frameCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
