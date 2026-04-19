import { useState, useRef, useCallback, useEffect } from 'react';
import type {
  ConnectionStatus,
  EmotionScores,
  EmotionName,
  HistoryPoint,
  ServerMessage,
  DEFAULT_SCORES,
} from '@/types/emotion';
import { useAuth } from '@/contexts/AuthContext';

const defaultScores: EmotionScores = {
  angry: 0, disgust: 0, fear: 0, happy: 0, neutral: 0, sad: 0, surprise: 0,
};

interface UseEmotionWebSocketReturn {
  status: ConnectionStatus;
  connect: () => void;
  disconnect: () => void;
  sendFrame: (base64Data: string, timestamp: number) => void;
  endSession: () => void;
  currentScores: EmotionScores;
  currentRaw: EmotionScores;
  dominantEmotion: EmotionName | null;
  confidence: number;
  faceDetected: boolean;
  history: HistoryPoint[];
  report: string | null;
  frameCount: number;
}

export function useEmotionWebSocket(port: number, sessionId: string): UseEmotionWebSocketReturn {
  const { getToken } = useAuth();
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [currentScores, setCurrentScores] = useState<EmotionScores>({ ...defaultScores });
  const [currentRaw, setCurrentRaw] = useState<EmotionScores>({ ...defaultScores });
  const [dominantEmotion, setDominantEmotion] = useState<EmotionName | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [report, setReport] = useState<string | null>(null);
  const [frameCount, setFrameCount] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const closedByUsRef = useRef(false);

  const connect = useCallback(() => {
    if (wsRef.current) return;
    closedByUsRef.current = false;
    setStatus('connecting');
    setReport(null);
    setHistory([]);
    setFrameCount(0);
    setCurrentScores({ ...defaultScores });
    setCurrentRaw({ ...defaultScores });
    setDominantEmotion(null);
    setConfidence(0);
    setFaceDetected(false);

    const token = getToken();
    const url = token
      ? `ws://localhost:${port}/ws/${sessionId}?token=${encodeURIComponent(token)}`
      : `ws://localhost:${port}/ws/${sessionId}`;
    const ws = new WebSocket(url);

    ws.onopen = () => setStatus('connected');

    ws.onmessage = (event) => {
      try {
        const msg: ServerMessage = JSON.parse(event.data);
        if (msg.type === 'result') {
          if (msg.face_detected) {
            const smoothed = msg.smoothed_scores || defaultScores;
            const raw = msg.raw_scores || defaultScores;
            setCurrentScores(smoothed);
            setCurrentRaw(raw);
            setDominantEmotion(msg.dominant_emotion || null);
            setConfidence(msg.confidence || 0);
            setFaceDetected(true);
            setFrameCount((c) => c + 1);
            setHistory((prev) => {
              const next = [...prev, {
                timestamp: msg.timestamp,
                dominant: msg.dominant_emotion!,
                scores: smoothed,
              }];
              return next.length > 5000 ? next.slice(-5000) : next;
            });
          } else {
            setFaceDetected(false);
          }
        } else if (msg.type === 'report') {
          setReport(msg.text);
          setStatus('idle');
          ws.close();
          wsRef.current = null;
        } else if (msg.type === 'error') {
          console.error('WS error message:', msg.message);
        } else if ((msg as { type: string }).type === 'auth_error') {
          console.error('WS auth error:', (msg as { message?: string }).message);
          setStatus('error');
          ws.close();
          wsRef.current = null;
        }
      } catch (e) {
        console.error('Failed to parse WS message:', e);
      }
    };

    ws.onerror = () => setStatus('error');

    ws.onclose = () => {
      if (!closedByUsRef.current) {
        setStatus('idle');
      }
      wsRef.current = null;
    };

    wsRef.current = ws;
  }, [port, sessionId, getToken]);

  const disconnect = useCallback(() => {
    closedByUsRef.current = true;
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus('idle');
  }, []);

  const sendFrame = useCallback((base64Data: string, timestamp: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'frame', data: base64Data, timestamp }));
    }
  }, []);

  const endSession = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'end' }));
      setStatus('disconnecting');
    }
  }, []);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        closedByUsRef.current = true;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  return {
    status, connect, disconnect, sendFrame, endSession,
    currentScores, currentRaw, dominantEmotion, confidence,
    faceDetected, history, report, frameCount,
  };
}
