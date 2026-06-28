export type EmotionName =
  | "angry"
  | "disgust"
  | "fear"
  | "happy"
  | "neutral"
  | "sad"
  | "surprise";

export const EMOTION_COLORS: Record<EmotionName, string> = {
  angry: "#ef4444",
  disgust: "#22c55e",
  fear: "#a855f7",
  happy: "#eab308",
  neutral: "#94a3b8",
  sad: "#3b82f6",
  surprise: "#f97316",
};

export const EMOTION_EMOJIS: Record<EmotionName, string> = {
  angry: "😠",
  disgust: "🤢",
  fear: "😨",
  happy: "😄",
  neutral: "😐",
  sad: "😢",
  surprise: "😲",
};

export type EmotionScores = Record<EmotionName, number>;

export type ReportContextKey =
  | "general"
  | "content_creation"
  | "medical_observation"
  | "candidate_interview"
  | "education"
  | "customer_support"
  | "sales_pitch"
  | "therapy_coaching"
  | "ux_research"
  | "public_speaking";

export interface ReportContextPayload {
  key: ReportContextKey | string;
  label?: string;
  objective?: string;
  extra_notes?: string;
  focus_prompt?: string;
  template_hint?: string;
}

export interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FrameResult {
  type: "result";
  face_detected: boolean;
  raw_scores?: EmotionScores;
  smoothed_scores?: EmotionScores;
  dominant_emotion?: EmotionName;
  confidence?: number;
  face_box?: FaceBox | null;
  timestamp: number;
  model?: string;
}

export interface ReportMessage {
  type: "report";
  text: string;
  analysis_id?: string | null;
  session_id?: string;
  backend?: BackendId | string;
  report_context?: ReportContextPayload;
}

export interface ErrorMessage {
  type: "error";
  message: string;
}

export interface AuthErrorMessage {
  type: "auth_error";
  message?: string;
}

export type ServerMessage =
  | FrameResult
  | ReportMessage
  | ErrorMessage
  | AuthErrorMessage;

export interface HistoryPoint {
  timestamp: number;
  dominant: EmotionName;
  scores: EmotionScores;
}

export interface AnalysisTimelinePoint {
  frame_index: number;
  timestamp: number;
  face_detected: boolean;
  dominant_emotion?: EmotionName;
  confidence?: number;
  raw_scores?: EmotionScores;
  smoothed_scores?: EmotionScores;
  face_box?: FaceBox | null;
  detection_confidence?: number;
}

export interface AnalysisRecord {
  id: string;
  session_id: string;
  backend: BackendId | string;
  user: {
    id?: string;
    email?: string;
    name?: string;
  };
  created_at: number;
  ended_at: number;
  duration_seconds: number;
  total_frames: number;
  detected_frames: number;
  face_detection_rate: number;
  emotion_distribution: Partial<EmotionScores>;
  timeline: AnalysisTimelinePoint[];
  transcript?: string | null;
  report_text: string;
  report_context?: ReportContextPayload;
}

export type ConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnecting"
  | "error";

export type InputMode = "upload" | "webcam" | "image";
export type BackendId = "custom" | "deepface";

export interface BackendConfig {
  id: BackendId;
  label: string;
  description: string;
  /** Full HTTP(S) base URL of this backend, e.g. "http://localhost:8000". */
  baseUrl: string;
  color: string;
}

/** Remove any trailing slash so paths can be appended safely. */
function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

// Per-backend base URLs, overridable via Vite env vars. This lets the app be
// pointed at deployed backends without touching source — just set these in
// frontend/.env.local (local) or the hosting provider's env settings (deploy).
const CUSTOM_BACKEND_URL: string = stripTrailingSlash(
  (import.meta.env.VITE_CUSTOM_BACKEND_URL as string | undefined) ||
    "http://localhost:8000",
);
const DEEPFACE_BACKEND_URL: string = stripTrailingSlash(
  (import.meta.env.VITE_DEEPFACE_BACKEND_URL as string | undefined) ||
    "http://localhost:8001",
);

export const BACKENDS: Record<BackendId, BackendConfig> = {
  custom: {
    id: "custom",
    label: "Custom EmotionNet",
    description: "Our own CNN trained on the FER dataset",
    baseUrl: CUSTOM_BACKEND_URL,
    color: "#6366f1",
  },
  deepface: {
    id: "deepface",
    label: "DeepFace",
    description: "Open-source library — mini_XCEPTION model",
    baseUrl: DEEPFACE_BACKEND_URL,
    color: "#06b6d4",
  },
};

/**
 * Convert an HTTP(S) base URL into its WebSocket equivalent:
 *   http://host:8000  → ws://host:8000
 *   https://host      → wss://host
 * Keeping the WS scheme in sync with the backend protocol means it works both
 * locally (ws) and behind HTTPS in production (wss) with no code changes.
 */
export function wsBaseFromHttp(httpUrl: string): string {
  const url = stripTrailingSlash(httpUrl);
  if (url.startsWith("https://")) return "wss://" + url.slice("https://".length);
  if (url.startsWith("http://")) return "ws://" + url.slice("http://".length);
  return url; // already ws/wss or scheme-relative
}

/** Short host label for status badges, e.g. "localhost:8000". */
export function backendHostLabel(baseUrl: string): string {
  try {
    return new URL(baseUrl).host;
  } catch {
    return baseUrl;
  }
}

export const EMOTION_NAMES: EmotionName[] = [
  "angry",
  "disgust",
  "fear",
  "happy",
  "neutral",
  "sad",
  "surprise",
];

export const DEFAULT_SCORES: EmotionScores = {
  angry: 0,
  disgust: 0,
  fear: 0,
  happy: 0,
  neutral: 0,
  sad: 0,
  surprise: 0,
};
