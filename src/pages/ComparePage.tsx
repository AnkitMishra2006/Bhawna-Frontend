import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Upload, Webcam, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  BACKENDS,
  EMOTION_NAMES,
  EMOTION_COLORS,
  DEFAULT_SCORES,
  type InputMode,
} from "@/types/emotion";
import { useEmotionWebSocket } from "@/hooks/useEmotionWebSocket";
import { useFrameCapture } from "@/hooks/useFrameCapture";
import { generateSessionId } from "@/utils/sessionId";
import ConnectionStatusBadge from "@/components/ConnectionStatusBadge";
import EmotionBadge from "@/components/EmotionBadge";
import LiveEmotionChart from "@/components/LiveEmotionChart";
import ScoreGrid from "@/components/ScoreGrid";
import SiteNav from "@/components/SiteNav";
import PageHeader from "@/components/PageHeader";
import compareIllustration from "@/assets/illustration-compare.png";
import uploadIllustration from "@/assets/illustration-upload.png";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const COMPARE_FRAME_CAPTURE_INTERVAL_MS = 150;

export default function ComparePage() {
  const navigate = useNavigate();
  const [inputMode, setInputMode] = useState<InputMode>("upload");
  const [isRunning, setIsRunning] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [uploadAudioStream, setUploadAudioStream] =
    useState<MediaStream | null>(null);
  const [sessionId1] = useState(generateSessionId);
  const [sessionId2] = useState(generateSessionId);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  // Holds the MediaRecorder for webcam audio capture (null when not available).
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioSendQueueRef = useRef<Promise<void>>(Promise.resolve());
  const uploadAudioContextRef = useRef<AudioContext | null>(null);
  const uploadAudioSourceNodeRef = useRef<MediaElementAudioSourceNode | null>(
    null,
  );
  const uploadAudioSourceElementRef = useRef<HTMLMediaElement | null>(null);
  const uploadAudioDestinationRef =
    useRef<MediaStreamAudioDestinationNode | null>(null);

  const ws1 = useEmotionWebSocket(BACKENDS.custom.port, sessionId1, () =>
    navigate("/login"),
  );
  const ws2 = useEmotionWebSocket(BACKENDS.deepface.port, sessionId2, () =>
    navigate("/login"),
  );

  const handleFrame = (base64: string, timestamp: number) => {
    ws1.sendFrame(base64, timestamp);
    ws2.sendFrame(base64, timestamp);
  };

  useFrameCapture(
    videoRef,
    handleFrame,
    isRunning && ws1.status === "connected" && ws2.status === "connected",
    COMPARE_FRAME_CAPTURE_INTERVAL_MS,
  );

  // Attach upload file once the conditionally rendered <video> node exists.
  useEffect(() => {
    if (inputMode !== "upload" || !videoFile) return;
    const video = videoRef.current;
    if (!video) return;

    const objectUrl = URL.createObjectURL(videoFile);
    video.srcObject = null;
    video.src = objectUrl;
    video.load();

    return () => URL.revokeObjectURL(objectUrl);
  }, [inputMode, videoFile]);

  // Bind webcam stream after render so preview always receives the stream.
  useEffect(() => {
    if (inputMode !== "webcam" || !webcamStream) return;
    const video = videoRef.current;
    if (!video) return;

    video.srcObject = webcamStream;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Ignore autoplay rejection; user interaction will resume playback.
      });
    }
  }, [inputMode, webcamStream]);

  // Start upload playback only after both backend sockets are connected.
  useEffect(() => {
    if (
      inputMode === "upload" &&
      isRunning &&
      ws1.status === "connected" &&
      ws2.status === "connected"
    ) {
      void videoRef.current?.play();
    }
  }, [inputMode, isRunning, ws1.status, ws2.status]);

  const queueAudioBlob = (blob: Blob) => {
    audioSendQueueRef.current = audioSendQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        if (!blob || blob.size === 0) return;
        const buffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = "";
        bytes.forEach((b) => (binary += String.fromCharCode(b)));
        const base64 = btoa(binary);
        ws1.sendAudioChunk(base64);
        ws2.sendAudioChunk(base64);
      });

    return audioSendQueueRef.current;
  };

  const createAudioMediaRecorder = (
    stream: MediaStream,
  ): MediaRecorder | null => {
    if (typeof MediaRecorder === "undefined") return null;

    const preferredMimeTypes = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
    ];

    const supportedType = preferredMimeTypes.find((type) =>
      MediaRecorder.isTypeSupported(type),
    );

    try {
      if (supportedType) {
        return new MediaRecorder(stream, {
          mimeType: supportedType,
          audioBitsPerSecond: 128000,
        });
      }
      return new MediaRecorder(stream);
    } catch {
      return null;
    }
  };

  const startRecorderFromStream = (stream: MediaStream | null): boolean => {
    if (!stream || typeof MediaRecorder === "undefined") return false;
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) return false;

    const recorder = createAudioMediaRecorder(new MediaStream(audioTracks));
    if (!recorder) return false;
    recorder.ondataavailable = (event) => {
      void queueAudioBlob(event.data);
    };
    recorder.start(3000);
    mediaRecorderRef.current = recorder;
    return true;
  };

  const startUploadRecorderFromVideoElement = (
    videoElement: HTMLVideoElement | null,
  ): boolean => {
    if (!videoElement || typeof AudioContext === "undefined") {
      return false;
    }

    try {
      if (!uploadAudioContextRef.current) {
        uploadAudioContextRef.current = new AudioContext();
      }
      const context = uploadAudioContextRef.current;
      if (context.state === "suspended") {
        void context.resume().catch(() => undefined);
      }

      if (
        !uploadAudioSourceNodeRef.current ||
        uploadAudioSourceElementRef.current !== videoElement
      ) {
        uploadAudioSourceNodeRef.current?.disconnect();
        uploadAudioSourceNodeRef.current =
          context.createMediaElementSource(videoElement);
        uploadAudioSourceElementRef.current = videoElement;
      }

      if (!uploadAudioDestinationRef.current) {
        uploadAudioDestinationRef.current =
          context.createMediaStreamDestination();
      }

      uploadAudioSourceNodeRef.current.disconnect();
      // Keep upload audio audible locally while mirroring it for backend audio processing.
      uploadAudioSourceNodeRef.current.connect(context.destination);
      uploadAudioSourceNodeRef.current.connect(
        uploadAudioDestinationRef.current,
      );

      return startRecorderFromStream(uploadAudioDestinationRef.current.stream);
    } catch (error) {
      console.warn(
        "Compare upload audio capture via AudioContext failed:",
        error,
      );
      return false;
    }
  };

  const stopUploadAudioCapture = (resetState = true) => {
    uploadAudioStream?.getTracks().forEach((track) => track.stop());
    if (resetState) {
      setUploadAudioStream(null);
    }
  };

  const stopRecorderAndEndSessions = () => {
    const endBoth = () => {
      ws1.endSession();
      ws2.endSession();
    };

    const finishAndEnd = () => {
      void audioSendQueueRef.current.finally(() => {
        stopUploadAudioCapture();
        endBoth();
      });
    };

    const recorder = mediaRecorderRef.current;
    if (
      recorder &&
      (recorder.state === "recording" || recorder.state === "paused")
    ) {
      recorder.onstop = () => {
        finishAndEnd();
      };
      try {
        recorder.requestData();
      } catch {
        // Some recorder implementations may not support requestData here.
      }
      recorder.stop();
      return;
    }

    finishAndEnd();
  };

  const handleStart = () => {
    if (ws1.status !== "idle" || ws2.status !== "idle") return;
    ws1.connect();
    ws2.connect();
    setIsRunning(true);
    if (inputMode === "upload" && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.muted = false;
      stopUploadAudioCapture();

      const startedWithAudioContext = startUploadRecorderFromVideoElement(
        videoRef.current,
      );
      if (!startedWithAudioContext) {
        const captureSource = videoRef.current as HTMLVideoElement & {
          captureStream?: () => MediaStream;
        };
        const captureStream = captureSource.captureStream?.();
        if (captureStream) {
          setUploadAudioStream(captureStream);
          startRecorderFromStream(captureStream);
        }
      }
    }
    // Start audio recording for webcam sessions (sent to both backends).
    const recorder = mediaRecorderRef.current;
    if (inputMode === "webcam" && recorder && recorder.state === "inactive") {
      recorder.onstop = null;
      recorder.ondataavailable = (event) => {
        void queueAudioBlob(event.data);
      };
      recorder.start(3000);
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    if (videoRef.current && inputMode === "upload") videoRef.current.pause();
    stopRecorderAndEndSessions();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("video/")) {
      setVideoFile(file);
    }
  };

  const enableWebcam = async () => {
    try {
      // Request video + audio; fall back to video-only when the mic is denied.
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      setWebcamStream(stream);
      // Create an audio-only MediaRecorder for Whisper transcription.
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) {
        mediaRecorderRef.current = createAudioMediaRecorder(
          new MediaStream(audioTracks),
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    return () => {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.onstop = null;
        recorder.stop();
      }
      mediaRecorderRef.current = null;
      uploadAudioSourceNodeRef.current?.disconnect();
      uploadAudioSourceNodeRef.current = null;
      uploadAudioSourceElementRef.current = null;
      uploadAudioDestinationRef.current = null;
      void uploadAudioContextRef.current?.close().catch(() => undefined);
      uploadAudioContextRef.current = null;
      uploadAudioStream?.getTracks().forEach((track) => track.stop());
      webcamStream?.getTracks().forEach((t) => t.stop());
    };
  }, [webcamStream, uploadAudioStream]);

  const canStart = inputMode === "upload" ? !!videoFile : !!webcamStream;
  const bothReportsDone = !!ws1.report && !!ws2.report;

  const computeAvg = (history: typeof ws1.history) => {
    if (history.length === 0) return { ...DEFAULT_SCORES };
    const sums = { ...DEFAULT_SCORES };
    history.forEach((h) =>
      EMOTION_NAMES.forEach((e) => (sums[e] += h.scores[e])),
    );
    EMOTION_NAMES.forEach(
      (e) => (sums[e] = Math.round(sums[e] / history.length)),
    );
    return sums;
  };

  const avg1 = computeAvg(ws1.history);
  const avg2 = computeAvg(ws2.history);

  const radarData = EMOTION_NAMES.map((em) => ({
    emotion: em.charAt(0).toUpperCase() + em.slice(1),
    [BACKENDS.custom.label]: avg1[em],
    [BACKENDS.deepface.label]: avg2[em],
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background"
    >
      <SiteNav />

      <PageHeader
        eyebrow="Benchmark"
        title="Compare two models, frame for frame"
        description="Stream the same input to EmotionNet and DeepFace simultaneously. See where they agree, where they don't, and which one matches your intuition."
        actions={
          <div className="flex flex-wrap gap-2">
            <ConnectionStatusBadge
              status={ws1.status}
              port={BACKENDS.custom.port}
            />
            <ConnectionStatusBadge
              status={ws2.status}
              port={BACKENDS.deepface.port}
            />
          </div>
        }
      />

      <div className="max-w-[1200px] mx-auto px-6 py-10 space-y-8">
        {/* Shared input */}
        <section className="rounded-2xl surface-1 hairline p-5 space-y-5">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <Tabs
              value={inputMode}
              onValueChange={(v) => {
                if (!isRunning) setInputMode(v as InputMode);
              }}
            >
              <TabsList className="bg-secondary">
                <TabsTrigger
                  value="upload"
                  disabled={isRunning}
                  className="data-[state=active]:bg-background"
                >
                  <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload
                </TabsTrigger>
                <TabsTrigger
                  value="webcam"
                  disabled={isRunning}
                  className="data-[state=active]:bg-background"
                >
                  <Webcam className="w-3.5 h-3.5 mr-1.5" /> Webcam
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {!isRunning ? (
              <Button
                onClick={handleStart}
                disabled={
                  !canStart || ws1.status !== "idle" || ws2.status !== "idle"
                }
                size="lg"
                className="rounded-full bg-foreground text-background hover:bg-foreground/90"
              >
                <Play className="w-4 h-4 mr-1.5" /> Start comparison
              </Button>
            ) : (
              <Button
                onClick={handleStop}
                size="lg"
                variant="destructive"
                className="rounded-full"
              >
                <Square className="w-4 h-4 mr-1.5" /> Stop both
              </Button>
            )}
          </div>

          {inputMode === "upload" && !videoFile ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center min-h-[14rem] py-8 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:surface-2 transition-all group"
            >
              <img
                src={compareIllustration}
                alt=""
                aria-hidden="true"
                width={220}
                height={150}
                loading="lazy"
                className="w-44 md:w-52 h-auto opacity-70 group-hover:opacity-95 transition-opacity duration-500 mb-3"
              />
              <p className="font-serif text-lg">Drop a video to compare</p>
              <p className="text-xs text-muted-foreground mt-1">
                Same input, two models, side by side
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          ) : inputMode === "webcam" && !webcamStream ? (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <img
                src={uploadIllustration}
                alt=""
                aria-hidden="true"
                width={100}
                height={100}
                loading="lazy"
                className="w-24 h-24 opacity-70 animate-float-slow"
              />
              <Button
                onClick={enableWebcam}
                variant="secondary"
                className="rounded-full"
              >
                <Webcam className="w-4 h-4 mr-1.5" /> Enable camera
              </Button>
            </div>
          ) : (
            <video
              ref={videoRef}
              controls={inputMode === "upload"}
              autoPlay={inputMode === "webcam"}
              muted={inputMode === "webcam"}
              playsInline
              className="w-full max-h-72 object-contain rounded-xl bg-black"
              style={
                inputMode === "webcam" ? { transform: "scaleX(-1)" } : undefined
              }
            />
          )}
        </section>

        {/* Side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[
            { ws: ws1, backend: BACKENDS.custom },
            { ws: ws2, backend: BACKENDS.deepface },
          ].map(({ ws, backend }) => (
            <div
              key={backend.id}
              className="space-y-5 rounded-3xl surface-1 hairline p-6 relative overflow-hidden"
            >
              <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{
                  background: `linear-gradient(90deg, transparent, ${backend.color}, transparent)`,
                }}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: backend.color,
                      boxShadow: `0 0 10px ${backend.color}`,
                    }}
                  />
                  <span className="font-serif text-xl">{backend.label}</span>
                </div>
                <ConnectionStatusBadge status={ws.status} port={backend.port} />
              </div>

              <div className="flex justify-center">
                <EmotionBadge
                  emotion={ws.dominantEmotion}
                  confidence={ws.confidence}
                  faceDetected={ws.faceDetected}
                  size="md"
                  isAnalysing={isRunning}
                />
              </div>

              <LiveEmotionChart
                history={ws.history}
                height={220}
                title="Stream"
              />
              <ScoreGrid scores={ws.currentScores} />
            </div>
          ))}
        </div>

        {/* Comparison summary */}
        {bothReportsDone && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="rounded-3xl surface-1 hairline overflow-hidden">
              <div className="border-b border-border p-6">
                <span className="text-xs uppercase tracking-[0.2em] text-primary">
                  Result
                </span>
                <h3 className="font-serif text-2xl mt-2">Comparison summary</h3>
              </div>
              <div className="p-6 md:p-8 space-y-10">
                {/* Radars */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { backend: BACKENDS.custom },
                    { backend: BACKENDS.deepface },
                  ].map(({ backend }) => (
                    <div key={backend.id} className="rounded-2xl surface-2 p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: backend.color }}
                        />
                        <span className="font-serif text-lg">
                          {backend.label}
                        </span>
                      </div>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={radarData}>
                            <PolarGrid stroke="hsl(var(--border))" />
                            <PolarAngleAxis
                              dataKey="emotion"
                              tick={{
                                fill: "hsl(var(--muted-foreground))",
                                fontSize: 10,
                              }}
                            />
                            <PolarRadiusAxis
                              tick={{
                                fill: "hsl(var(--muted-foreground))",
                                fontSize: 9,
                              }}
                            />
                            <Radar
                              name={backend.label}
                              dataKey={backend.label}
                              stroke={backend.color}
                              fill={backend.color}
                              fillOpacity={0.25}
                              strokeWidth={2}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Table */}
                <div className="rounded-2xl surface-2 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-xs uppercase tracking-widest">
                          Emotion
                        </TableHead>
                        <TableHead className="text-xs uppercase tracking-widest text-right">
                          {BACKENDS.custom.label}
                        </TableHead>
                        <TableHead className="text-xs uppercase tracking-widest text-right">
                          {BACKENDS.deepface.label}
                        </TableHead>
                        <TableHead className="text-xs uppercase tracking-widest text-right">
                          Δ
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {EMOTION_NAMES.map((em) => {
                        const winner =
                          avg1[em] > avg2[em]
                            ? "custom"
                            : avg2[em] > avg1[em]
                              ? "deepface"
                              : null;
                        const delta = Math.abs(avg1[em] - avg2[em]);
                        return (
                          <TableRow
                            key={em}
                            className="border-border hover:surface-1"
                          >
                            <TableCell className="capitalize flex items-center gap-2">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: EMOTION_COLORS[em] }}
                              />
                              {em}
                            </TableCell>
                            <TableCell
                              className={`text-right font-mono ${winner === "custom" ? "text-foreground font-semibold" : "text-muted-foreground"}`}
                            >
                              {avg1[em]}%
                            </TableCell>
                            <TableCell
                              className={`text-right font-mono ${winner === "deepface" ? "text-foreground font-semibold" : "text-muted-foreground"}`}
                            >
                              {avg2[em]}%
                            </TableCell>
                            <TableCell className="text-right font-mono text-muted-foreground">
                              {delta}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Reports */}
                <Tabs defaultValue="custom">
                  <TabsList className="bg-secondary">
                    <TabsTrigger
                      value="custom"
                      className="data-[state=active]:bg-background"
                    >
                      {BACKENDS.custom.label} report
                    </TabsTrigger>
                    <TabsTrigger
                      value="deepface"
                      className="data-[state=active]:bg-background"
                    >
                      {BACKENDS.deepface.label} report
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent
                    value="custom"
                    className="mt-6 font-serif italic text-foreground/90 leading-[1.85] whitespace-pre-wrap text-[1.05rem]"
                  >
                    {ws1.report}
                  </TabsContent>
                  <TabsContent
                    value="deepface"
                    className="mt-6 font-serif italic text-foreground/90 leading-[1.85] whitespace-pre-wrap text-[1.05rem]"
                  >
                    {ws2.report}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
