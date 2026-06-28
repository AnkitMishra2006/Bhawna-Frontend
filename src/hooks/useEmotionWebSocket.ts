import { useState, useRef, useCallback, useEffect } from "react";
import type {
  ConnectionStatus,
  EmotionScores,
  EmotionName,
  FaceBox,
  HistoryPoint,
  ReportContextPayload,
  ServerMessage,
} from "@/types/emotion";
import { useAuth } from "@/contexts/AuthContext";
import { wsBaseFromHttp } from "@/types/emotion";

const defaultScores: EmotionScores = {
  angry: 0,
  disgust: 0,
  fear: 0,
  happy: 0,
  neutral: 0,
  sad: 0,
  surprise: 0,
};

interface UseEmotionWebSocketReturn {
  status: ConnectionStatus;
  connect: (sessionIdOverride?: string) => void;
  disconnect: () => void;
  sendFrame: (base64Data: string, timestamp: number) => void;
  sendAudioChunk: (base64Data: string) => void;
  endSession: (reportContext?: ReportContextPayload) => void;
  currentScores: EmotionScores;
  currentRaw: EmotionScores;
  dominantEmotion: EmotionName | null;
  confidence: number;
  faceDetected: boolean;
  faceBox: FaceBox | null;
  history: HistoryPoint[];
  report: string | null;
  reportContext: ReportContextPayload | null;
  analysisId: string | null;
  reportSessionId: string | null;
  reportBackend: string | null;
  frameCount: number;
}

export function useEmotionWebSocket(
  backendUrl: string,
  sessionId: string,
  onAuthError?: () => void,
): UseEmotionWebSocketReturn {
  const { getToken } = useAuth();
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [currentScores, setCurrentScores] = useState<EmotionScores>({
    ...defaultScores,
  });
  const [currentRaw, setCurrentRaw] = useState<EmotionScores>({
    ...defaultScores,
  });
  const [dominantEmotion, setDominantEmotion] = useState<EmotionName | null>(
    null,
  );
  const [confidence, setConfidence] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceBox, setFaceBox] = useState<FaceBox | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [report, setReport] = useState<string | null>(null);
  const [reportContext, setReportContext] =
    useState<ReportContextPayload | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [reportSessionId, setReportSessionId] = useState<string | null>(null);
  const [reportBackend, setReportBackend] = useState<string | null>(null);
  const [frameCount, setFrameCount] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const closedByUsRef = useRef(false);
  const pendingAudioChunksRef = useRef<string[]>([]);
  const pendingEndContextRef = useRef<ReportContextPayload | undefined>();

  // Keep a ref to the latest onAuthError callback so the connect closure
  // never goes stale — no need to add onAuthError to connect's dep array.
  const onAuthErrorRef = useRef(onAuthError);
  useEffect(() => {
    onAuthErrorRef.current = onAuthError;
  }, [onAuthError]);

  const connect = useCallback(
    (sessionIdOverride?: string) => {
      if (wsRef.current) return;
      closedByUsRef.current = false;
      pendingAudioChunksRef.current = [];
      pendingEndContextRef.current = undefined;
      setStatus("connecting");
      setReport(null);
      setHistory([]);
      setFrameCount(0);
      setCurrentScores({ ...defaultScores });
      setCurrentRaw({ ...defaultScores });
      setDominantEmotion(null);
      setConfidence(0);
      setFaceDetected(false);
      setFaceBox(null);
      setReportContext(null);
      setAnalysisId(null);
      setReportSessionId(null);
      setReportBackend(null);

      const targetSessionId = sessionIdOverride || sessionId;
      const token = getToken();
      const wsBase = wsBaseFromHttp(backendUrl);
      const url = token
        ? `${wsBase}/ws/${targetSessionId}?token=${encodeURIComponent(token)}`
        : `${wsBase}/ws/${targetSessionId}`;
      const ws = new WebSocket(url);

      ws.onopen = () => {
        setStatus("connected");

        if (pendingAudioChunksRef.current.length > 0) {
          const queuedChunks = pendingAudioChunksRef.current;
          pendingAudioChunksRef.current = [];
          queuedChunks.forEach((chunk) => {
            ws.send(JSON.stringify({ type: "audio_chunk", data: chunk }));
          });
        }

        if (pendingEndContextRef.current !== undefined) {
          const queuedContext = pendingEndContextRef.current;
          pendingEndContextRef.current = undefined;
          ws.send(
            JSON.stringify({
              type: "end",
              report_context: queuedContext,
            }),
          );
          setStatus("disconnecting");
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg: ServerMessage = JSON.parse(event.data);
          if (msg.type === "result") {
            // Count every processed frame (face or not) so the UI shows activity
            setFrameCount((c) => c + 1);
            if (msg.face_detected) {
              const smoothed = msg.smoothed_scores || defaultScores;
              const raw = msg.raw_scores || defaultScores;
              setCurrentScores(smoothed);
              setCurrentRaw(raw);
              setDominantEmotion(msg.dominant_emotion || null);
              setConfidence(msg.confidence || 0);
              setFaceDetected(true);
              setFaceBox(msg.face_box ?? null);
              setHistory((prev) => {
                const next = [
                  ...prev,
                  {
                    timestamp: msg.timestamp,
                    dominant: msg.dominant_emotion!,
                    scores: smoothed,
                  },
                ];
                return next.length > 5000 ? next.slice(-5000) : next;
              });
            } else {
              setFaceDetected(false);
              setFaceBox(null);
            }
          } else if (msg.type === "report") {
            setReport(msg.text);
            setReportContext(msg.report_context || null);
            setAnalysisId(msg.analysis_id || null);
            setReportSessionId(msg.session_id || targetSessionId);
            setReportBackend(msg.backend || null);
            setStatus("idle");
            ws.close();
            wsRef.current = null;
          } else if (msg.type === "error") {
            console.error("WS error message:", msg.message);
          } else if (msg.type === "auth_error") {
            console.error("WS auth error:", msg.message);
            setStatus("error");
            ws.close();
            wsRef.current = null;
            // Notify the caller (e.g. to redirect to /login).
            onAuthErrorRef.current?.();
          }
        } catch (e) {
          console.error("Failed to parse WS message:", e);
        }
      };

      ws.onerror = () => setStatus("error");

      ws.onclose = () => {
        if (!closedByUsRef.current) {
          setStatus("idle");
        }
        wsRef.current = null;
      };

      wsRef.current = ws;
    },
    [backendUrl, sessionId, getToken],
  );

  const disconnect = useCallback(() => {
    closedByUsRef.current = true;
    pendingAudioChunksRef.current = [];
    pendingEndContextRef.current = undefined;
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus("idle");
  }, []);

  const sendFrame = useCallback((base64Data: string, timestamp: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ type: "frame", data: base64Data, timestamp }),
      );
    }
  }, []);

  const sendAudioChunk = useCallback((base64Data: string) => {
    const ws = wsRef.current;
    if (!ws || !base64Data) return;

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "audio_chunk", data: base64Data }));
      return;
    }

    if (ws.readyState === WebSocket.CONNECTING) {
      pendingAudioChunksRef.current.push(base64Data);
      if (pendingAudioChunksRef.current.length > 256) {
        pendingAudioChunksRef.current.shift();
      }
    }
  }, []);

  const endSession = useCallback(
    (reportContextPayload?: ReportContextPayload) => {
      const ws = wsRef.current;
      if (!ws) return;

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: "end",
            report_context: reportContextPayload,
          }),
        );
        setStatus("disconnecting");
        return;
      }

      if (ws.readyState === WebSocket.CONNECTING) {
        pendingEndContextRef.current = reportContextPayload;
      }
    },
    [],
  );

  useEffect(() => {
    return () => {
      pendingAudioChunksRef.current = [];
      pendingEndContextRef.current = undefined;
      if (wsRef.current) {
        closedByUsRef.current = true;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  return {
    status,
    connect,
    disconnect,
    sendFrame,
    sendAudioChunk,
    endSession,
    currentScores,
    currentRaw,
    dominantEmotion,
    confidence,
    faceDetected,
    faceBox,
    history,
    report,
    reportContext,
    analysisId,
    reportSessionId,
    reportBackend,
    frameCount,
  };
}
