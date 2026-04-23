import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Upload,
  Webcam,
  Image as ImageIcon,
  Play,
  Square,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BACKENDS,
  type BackendId,
  type InputMode,
  type ReportContextKey,
  type ReportContextPayload,
} from "@/types/emotion";
import { useEmotionWebSocket } from "@/hooks/useEmotionWebSocket";
import { useFrameCapture } from "@/hooks/useFrameCapture";
import { generateSessionId } from "@/utils/sessionId";
import { formatSeconds } from "@/utils/formatTime";
import ConnectionStatusBadge from "@/components/ConnectionStatusBadge";
import BackendSelector from "@/components/BackendSelector";
import EmotionBadge from "@/components/EmotionBadge";
import LiveEmotionChart from "@/components/LiveEmotionChart";
import ScoreGrid from "@/components/ScoreGrid";
import SiteNav from "@/components/SiteNav";
import PageHeader from "@/components/PageHeader";
import { cn } from "@/lib/utils";
import uploadIllustration from "@/assets/illustration-upload.png";
import captureIllustration from "@/assets/illustration-capture.png";

const FRAME_CAPTURE_INTERVAL_MS = 120;

type ReportContextOption = {
  key: ReportContextKey;
  label: string;
  description: string;
  prompt: string;
  defaultObjective: string;
};

const REPORT_CONTEXT_OPTIONS: ReportContextOption[] = [
  {
    key: "general",
    label: "General emotional snapshot",
    description:
      "Balanced summary of emotional flow, transitions, and stability.",
    prompt:
      "Write a complete narrative of the emotional journey across the full session and highlight pivotal shifts.",
    defaultObjective:
      "Understand the overall emotional trajectory and key changes.",
  },
  {
    key: "candidate_interview",
    label: "Candidate interview review",
    description:
      "Confidence, composure, stress moments, and response recovery.",
    prompt:
      "Evaluate interview readiness indicators such as confidence pattern, stress spikes, and emotional recovery after difficult segments.",
    defaultObjective:
      "Assess interview communication confidence and pressure handling.",
  },
  {
    key: "education",
    label: "Teaching and learning",
    description:
      "Engagement rhythm, confusion windows, and attention consistency.",
    prompt:
      "Focus on learning engagement arcs, moments that suggest confusion or clarity, and sustained attention quality.",
    defaultObjective:
      "Measure learner engagement and identify difficult moments.",
  },
  {
    key: "customer_support",
    label: "Customer support QA",
    description:
      "Empathy signals, calmness under friction, and tone resilience.",
    prompt:
      "Assess empathy and emotional regulation, especially during difficult or high-friction moments in conversation.",
    defaultObjective:
      "Evaluate support empathy and emotional control during escalations.",
  },
  {
    key: "sales_pitch",
    label: "Sales or persuasion",
    description:
      "Energy, conviction, trust-building windows, and momentum drops.",
    prompt:
      "Analyse persuasive presence, conviction peaks, credibility windows, and emotional momentum drop-offs.",
    defaultObjective:
      "Improve persuasive confidence and trust-building moments.",
  },
  {
    key: "public_speaking",
    label: "Public speaking coaching",
    description: "Stage confidence arc, presence, and nervousness regulation.",
    prompt:
      "Map stage confidence progression and spotlight points of anxiety management versus strong delivery presence.",
    defaultObjective:
      "Coach public-speaking confidence and steady stage presence.",
  },
  {
    key: "content_creation",
    label: "Creator performance",
    description:
      "On-camera authenticity, emotional pacing, and audience resonance.",
    prompt:
      "Review creator authenticity and camera presence with emphasis on emotional pacing that can improve audience retention.",
    defaultObjective:
      "Improve camera presence and emotional pacing for content.",
  },
  {
    key: "ux_research",
    label: "UX research session",
    description:
      "Friction indicators, delight moments, and confusion clusters.",
    prompt:
      "Extract emotional clues tied to product friction, confusion clusters, and delight points to support UX decisions.",
    defaultObjective:
      "Identify UX friction points and positive interaction moments.",
  },
  {
    key: "therapy_coaching",
    label: "Wellbeing coaching",
    description:
      "Reflective emotional trends with supportive, non-diagnostic language.",
    prompt:
      "Provide a supportive reflective emotional summary suitable for wellbeing coaching, without clinical conclusions.",
    defaultObjective:
      "Support reflective self-awareness in a non-clinical coaching context.",
  },
  {
    key: "medical_observation",
    label: "Clinical observation",
    description:
      "Structured symptom-style notes with strict non-diagnostic boundary.",
    prompt:
      "Create a structured observational note for healthcare review while explicitly avoiding diagnosis or treatment claims.",
    defaultObjective: "Create a clear observational note for clinician review.",
  },
];

const DEFAULT_REPORT_CONTEXT = REPORT_CONTEXT_OPTIONS[0];

function getReportContextOption(key: ReportContextKey): ReportContextOption {
  return (
    REPORT_CONTEXT_OPTIONS.find((option) => option.key === key) ||
    DEFAULT_REPORT_CONTEXT
  );
}

export default function AnalysePage() {
  const navigate = useNavigate();
  const [backend, setBackend] = useState<BackendId>("custom");
  const [inputMode, setInputMode] = useState<InputMode>("upload");
  const [sessionId, setSessionId] = useState(generateSessionId);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);
  const [uploadAudioStream, setUploadAudioStream] =
    useState<MediaStream | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isContextDialogOpen, setIsContextDialogOpen] = useState(false);
  const [reportContextKey, setReportContextKey] =
    useState<ReportContextKey>("general");
  const [reportObjective, setReportObjective] = useState(
    DEFAULT_REPORT_CONTEXT.defaultObjective,
  );
  const [reportExtraNotes, setReportExtraNotes] = useState("");
  const [submittedReportContext, setSubmittedReportContext] =
    useState<ReportContextPayload | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const imageFrameSentRef = useRef(false);
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
  // Ref so event listeners always call the latest handleStop without stale closure.
  const handleStopRef = useRef<() => void>(() => {});

  const port = BACKENDS[backend].port;
  const backendLabel = BACKENDS[backend].label;
  const canStart =
    inputMode === "upload"
      ? !!videoFile
      : inputMode === "webcam"
        ? !!webcamStream
        : !!imageFile;
  const isStreamingMode = inputMode !== "image";
  const ws = useEmotionWebSocket(port, sessionId, () => navigate("/login"));

  const handleFrame = (base64: string, timestamp: number) => {
    ws.sendFrame(base64, timestamp);
  };

  useFrameCapture(
    videoRef,
    handleFrame,
    isStreamingMode && isRunning && ws.status === "connected",
    FRAME_CAPTURE_INTERVAL_MS,
  );

  useEffect(() => {
    if (!isRunning || !startTime) return;
    const id = setInterval(
      () => setElapsed((Date.now() - startTime) / 1000),
      500,
    );
    return () => clearInterval(id);
  }, [isRunning, startTime]);

  // Play the video only once the WebSocket is actually connected.
  // Without this, the video plays while status is still "connecting",
  // useFrameCapture never activates, and zero frames are sent to the backend.
  useEffect(() => {
    if (inputMode === "upload" && isRunning && ws.status === "connected") {
      videoRef.current?.play();
    }
  }, [ws.status, isRunning, inputMode]);

  useEffect(() => {
    if (!ws.report || !ws.reportSessionId) return;
    setIsGeneratingReport(false);
    const resolvedReportContext = ws.reportContext || submittedReportContext;
    const search = new URLSearchParams({
      session: ws.reportSessionId,
      backend,
    });
    if (ws.analysisId) {
      search.set("analysis", ws.analysisId);
    }
    navigate(`/report?${search.toString()}`, {
      state: {
        analysisId: ws.analysisId,
        sessionId: ws.reportSessionId,
        backendId: backend,
        backendLabel,
        duration: Math.round(elapsed),
        reportTextFallback: ws.report,
        historyFallback: ws.history,
        reportContextFallback: resolvedReportContext,
      },
    });
  }, [
    ws.report,
    ws.reportSessionId,
    ws.analysisId,
    ws.reportContext,
    ws.history,
    backend,
    backendLabel,
    elapsed,
    navigate,
    submittedReportContext,
  ]);

  useEffect(() => {
    if (isGeneratingReport && ws.status === "error") {
      setIsGeneratingReport(false);
    }
  }, [isGeneratingReport, ws.status]);

  // Attach the selected upload file only after the <video> node is mounted.
  // The element is conditionally rendered, so direct assignment in onChange can miss.
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

  // Attach the selected image file only after the preview <img> node is mounted.
  useEffect(() => {
    if (inputMode !== "image" || !imageFile) return;
    const image = imageRef.current;
    if (!image) return;

    const objectUrl = URL.createObjectURL(imageFile);
    image.src = objectUrl;

    return () => URL.revokeObjectURL(objectUrl);
  }, [inputMode, imageFile]);

  // Bind webcam stream after render for the same reason as upload mode.
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

  // Auto-stop when an uploaded video reaches its natural end.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || inputMode !== "upload") return;
    const onEnded = () => handleStopRef.current();
    video.addEventListener("ended", onEnded);
    return () => video.removeEventListener("ended", onEnded);
  }, [inputMode]);

  // In image mode, send exactly one frame once the socket is connected.
  useEffect(() => {
    if (
      inputMode !== "image" ||
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
  }, [inputMode, isRunning, ws.status, imageFile, ws.sendFrame]);

  // Image analysis is single-shot: stop run-state after first result.
  useEffect(() => {
    if (inputMode !== "image" || !isRunning) return;
    if (ws.frameCount > 0) {
      setIsRunning(false);
      ws.disconnect();
      return;
    }
    if (ws.status === "error") {
      setIsRunning(false);
    }
  }, [inputMode, isRunning, ws.frameCount, ws.status, ws.disconnect]);

  // Keep the callback ref in sync so video "ended" always triggers latest stop logic.
  useEffect(() => {
    handleStopRef.current = handleStop;
  });

  const queueAudioBlob = (blob: Blob) => {
    audioSendQueueRef.current = audioSendQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        if (!blob || blob.size === 0) return;
        const buffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = "";
        bytes.forEach((b) => (binary += String.fromCharCode(b)));
        ws.sendAudioChunk(btoa(binary));
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
      // Keep upload audio audible to the user while also mirroring it to the
      // recorder stream that feeds backend transcription.
      uploadAudioSourceNodeRef.current.connect(context.destination);
      uploadAudioSourceNodeRef.current.connect(
        uploadAudioDestinationRef.current,
      );

      return startRecorderFromStream(uploadAudioDestinationRef.current.stream);
    } catch (error) {
      console.warn("Upload audio capture via AudioContext failed:", error);
      return false;
    }
  };

  const pauseRecorder = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== "recording") return;
    try {
      recorder.requestData();
    } catch {
      // Some recorder implementations may not support requestData here.
    }
    try {
      recorder.pause();
    } catch {
      // Ignore pause failures and keep recorder running.
    }
  };

  const resumeRecorder = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== "paused") return;
    try {
      recorder.resume();
    } catch {
      // Ignore resume failures and continue frame-only capture.
    }
  };

  const stopRecorderAndEndSession = (reportContext?: ReportContextPayload) => {
    const finishSession = () => {
      void audioSendQueueRef.current.finally(() => {
        stopUploadAudioCapture();
        ws.endSession(reportContext);
      });
    };

    const recorder = mediaRecorderRef.current;
    if (
      recorder &&
      (recorder.state === "recording" || recorder.state === "paused")
    ) {
      recorder.onstop = () => {
        finishSession();
      };
      try {
        recorder.requestData();
      } catch {
        // Continue with stop even if requestData is unsupported.
      }
      recorder.stop();
      return;
    }
    finishSession();
  };

  const stopUploadAudioCapture = (resetState = true) => {
    uploadAudioStream?.getTracks().forEach((track) => track.stop());
    if (resetState) {
      setUploadAudioStream(null);
    }
  };

  const handleStart = () => {
    if (ws.status !== "idle" || isGeneratingReport) return;
    const newId = generateSessionId();
    setSessionId(newId);
    ws.connect(newId);
    setIsRunning(true);
    setIsContextDialogOpen(false);
    setIsGeneratingReport(false);
    setSubmittedReportContext(null);
    setStartTime(Date.now());
    setElapsed(0);

    if (inputMode === "image") {
      imageFrameSentRef.current = false;
      return;
    }

    // For upload mode: reset to start but do NOT play yet.
    // The useEffect watching ws.status will play once "connected".
    if (inputMode === "upload" && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.muted = false;
    }
    // Start audio recording so Whisper can use speech context in the report.
    if (inputMode === "webcam") {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state === "inactive") {
        recorder.onstop = null;
        recorder.ondataavailable = (event) => {
          void queueAudioBlob(event.data);
        };
        recorder.start(3000);
      }
    } else if (inputMode === "upload" && videoRef.current) {
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
  };

  const handleStop = () => {
    if (!isRunning || isGeneratingReport) return;
    setIsRunning(false);
    if (videoRef.current && inputMode === "upload") videoRef.current.pause();
    pauseRecorder();
    setIsContextDialogOpen(true);
  };

  const handleContinueAnalysis = () => {
    setIsContextDialogOpen(false);
    setIsRunning(true);
    resumeRecorder();
    if (inputMode === "upload") {
      void videoRef.current?.play();
    }
  };

  const handleGenerateReport = () => {
    const selectedContext = getReportContextOption(reportContextKey);
    const payload: ReportContextPayload = {
      key: selectedContext.key,
      label: selectedContext.label,
      objective: reportObjective.trim() || selectedContext.defaultObjective,
      extra_notes: reportExtraNotes.trim() || undefined,
    };
    setSubmittedReportContext(payload);
    setIsContextDialogOpen(false);
    setIsGeneratingReport(true);
    stopRecorderAndEndSession(payload);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type.startsWith("image/")) {
      setImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("video/")) {
      setVideoFile(file);
    }
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) {
      setImageFile(file);
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
      // Create an audio-only MediaRecorder so the backend can transcribe speech.
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) {
        mediaRecorderRef.current = createAudioMediaRecorder(
          new MediaStream(audioTracks),
        );
      }
    } catch (err) {
      console.error("Webcam error:", err);
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

  const getFaceOverlayStyle = () => {
    if (!ws.faceDetected || !ws.faceBox) return null;

    const mediaElement =
      inputMode === "image" ? imageRef.current : videoRef.current;
    if (!mediaElement) return null;

    const containerWidth = mediaElement.clientWidth;
    const containerHeight = mediaElement.clientHeight;
    const sourceWidth =
      inputMode === "image"
        ? (mediaElement as HTMLImageElement).naturalWidth || containerWidth
        : (mediaElement as HTMLVideoElement).videoWidth || containerWidth;
    const sourceHeight =
      inputMode === "image"
        ? (mediaElement as HTMLImageElement).naturalHeight || containerHeight
        : (mediaElement as HTMLVideoElement).videoHeight || containerHeight;

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

    const mirroredX =
      inputMode === "webcam"
        ? 1 - ws.faceBox.x - ws.faceBox.width
        : ws.faceBox.x;

    return {
      left: offsetX + mirroredX * renderedWidth,
      top: offsetY + ws.faceBox.y * renderedHeight,
      width: ws.faceBox.width * renderedWidth,
      height: ws.faceBox.height * renderedHeight,
    };
  };

  const faceOverlayStyle = getFaceOverlayStyle();

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
        description="Choose a model, analyse video, webcam, or a single image, and inspect seven emotion scores with face-box overlays."
        actions={
          <>
            {isRunning && (
              <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <span className="recording-dot" />
                {inputMode === "image" ? "Analysing image" : "Recording"}
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
              <span className="text-foreground font-mono mr-2">01</span> Choose
              a model
            </h2>
          </div>
          <BackendSelector
            selected={backend}
            onChange={setBackend}
            disabled={isRunning}
          />
        </section>

        {/* Step 2: Input + Controls */}
        <section className="space-y-3">
          <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <span className="text-foreground font-mono mr-2">02</span> Pick your
            input
          </h2>

          <div className="rounded-2xl surface-1 hairline p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
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
                  <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload video
                </TabsTrigger>
                <TabsTrigger
                  value="webcam"
                  disabled={isRunning}
                  className="data-[state=active]:bg-background"
                >
                  <Webcam className="w-3.5 h-3.5 mr-1.5" /> Live webcam
                </TabsTrigger>
                <TabsTrigger
                  value="image"
                  disabled={isRunning}
                  className="data-[state=active]:bg-background"
                >
                  <ImageIcon className="w-3.5 h-3.5 mr-1.5" /> Single image
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              {inputMode === "image" ? (
                <Button
                  onClick={handleStart}
                  disabled={
                    !canStart ||
                    ws.status !== "idle" ||
                    isGeneratingReport ||
                    isContextDialogOpen ||
                    isRunning
                  }
                  size="lg"
                  className="rounded-full bg-foreground text-background hover:bg-foreground/90"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                      Analysing image...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-1.5" /> Analyze image
                    </>
                  )}
                </Button>
              ) : !isRunning ? (
                <Button
                  onClick={handleStart}
                  disabled={
                    !canStart ||
                    ws.status !== "idle" ||
                    isGeneratingReport ||
                    isContextDialogOpen
                  }
                  size="lg"
                  className="rounded-full bg-foreground text-background hover:bg-foreground/90"
                >
                  <Play className="w-4 h-4 mr-1.5" /> Start analysis
                </Button>
              ) : (
                <Button
                  onClick={handleStop}
                  size="lg"
                  variant="destructive"
                  className="rounded-full"
                  disabled={isGeneratingReport}
                >
                  {isGeneratingReport ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />{" "}
                      Generating report...
                    </>
                  ) : (
                    <>
                      <Square className="w-4 h-4 mr-1.5" /> Stop & get report
                    </>
                  )}
                </Button>
              )}
            </div>
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

        {/* Main */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: video + dominant */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-2xl surface-1 hairline overflow-hidden">
              {inputMode === "upload" && !videoFile ? (
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
                    Drop a video here
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    or click to browse · mp4, mov, webm
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              ) : inputMode === "image" && !imageFile ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleImageDrop}
                  onClick={() => imageInputRef.current?.click()}
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
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageFileChange}
                  />
                </div>
              ) : inputMode === "webcam" && !webcamStream ? (
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
                    <p className="font-serif text-xl text-foreground">
                      Allow camera access
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Stream stays on your device.
                    </p>
                  </div>
                  <Button
                    onClick={enableWebcam}
                    variant="secondary"
                    className="rounded-full"
                  >
                    <Webcam className="w-4 h-4 mr-1.5" /> Enable camera
                  </Button>
                </div>
              ) : (
                <div className="relative aspect-video bg-black overflow-hidden">
                  {inputMode === "image" ? (
                    <img
                      ref={imageRef}
                      alt="Uploaded frame for emotion analysis"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <video
                      ref={videoRef}
                      controls={inputMode === "upload"}
                      autoPlay={inputMode === "webcam"}
                      muted={inputMode === "webcam"}
                      playsInline
                      className="w-full h-full object-contain"
                      style={
                        inputMode === "webcam"
                          ? { transform: "scaleX(-1)" }
                          : undefined
                      }
                    />
                  )}

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

                  {inputMode === "webcam" && (
                    <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live camera
                    </div>
                  )}

                  {inputMode === "image" && (
                    <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 text-primary text-[11px]">
                      <ImageIcon className="w-3 h-3" />
                      Single image
                    </div>
                  )}

                  {isGeneratingReport && (
                    <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px] flex items-center justify-center">
                      <div className="rounded-2xl surface-1 hairline px-5 py-3 flex items-center gap-2.5 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        Creating your report...
                      </div>
                    </div>
                  )}

                  {inputMode === "image" && isRunning && (
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

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-px bg-border rounded-2xl overflow-hidden hairline">
              {[
                { label: "Frames", value: ws.frameCount },
                { label: "Session", value: formatSeconds(elapsed) },
                { label: "Model", value: backendLabel.split(" ")[0] },
              ].map((s) => (
                <div key={s.label} className="surface-1 p-4 text-center">
                  <div className="font-serif text-2xl text-foreground">
                    {s.value}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                    {s.label}
                  </div>
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
        <LiveEmotionChart
          history={ws.history}
          height={300}
          title={
            inputMode === "image"
              ? "Image emotion profile"
              : "Live emotion stream"
          }
        />
      </div>

      <Dialog open={isContextDialogOpen}>
        <DialogContent
          className="max-w-3xl rounded-3xl p-0 overflow-hidden border-border/70"
          onEscapeKeyDown={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          <div className="bg-aurora/70 px-6 py-5 border-b border-border/60">
            <DialogHeader>
              <DialogTitle className="font-serif text-3xl tracking-tight">
                Choose your report lens
              </DialogTitle>
              <DialogDescription className="text-sm text-foreground/75">
                Tailor the analysis to your exact use case before we generate
                the final report.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 py-5 space-y-5 max-h-[72vh] overflow-y-auto">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
                Context presets
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {REPORT_CONTEXT_OPTIONS.map((option) => {
                  const isActive = reportContextKey === option.key;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => {
                        setReportContextKey(option.key);
                        setReportObjective(option.defaultObjective);
                      }}
                      className={cn(
                        "text-left rounded-2xl border p-4 transition-all",
                        isActive
                          ? "border-primary/60 bg-primary/10 shadow-[0_0_0_1px_rgba(0,0,0,0.03)]"
                          : "border-border hover:border-primary/40 hover:bg-secondary/40",
                      )}
                    >
                      <div className="font-serif text-lg leading-tight">
                        {option.label}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                        {option.description}
                      </p>
                      <p className="text-[11px] mt-3 text-foreground/80 leading-relaxed">
                        Prompt: {option.prompt}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Report objective
              </p>
              <Textarea
                value={reportObjective}
                onChange={(event) => setReportObjective(event.target.value)}
                placeholder="What should this report optimize for?"
                className="min-h-[96px] rounded-xl text-sm"
              />
            </div>

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Additional notes
              </p>
              <Textarea
                value={reportExtraNotes}
                onChange={(event) => setReportExtraNotes(event.target.value)}
                placeholder="Optional: role, scenario, audience, known stress points, expected tone..."
                className="min-h-[96px] rounded-xl text-sm"
              />
            </div>
          </div>

          <DialogFooter className="px-6 py-5 border-t border-border/60 bg-secondary/30">
            <Button
              type="button"
              variant="secondary"
              className="rounded-full"
              onClick={handleContinueAnalysis}
            >
              Continue analysis
            </Button>
            <Button
              type="button"
              className="rounded-full bg-foreground text-background hover:bg-foreground/90"
              onClick={handleGenerateReport}
              disabled={isGeneratingReport}
            >
              {isGeneratingReport ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Generating
                  report...
                </>
              ) : (
                "Generate tailored report"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
