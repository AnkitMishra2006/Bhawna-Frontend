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

export type InputMode = "upload" | "webcam";
export type BackendId = "custom" | "deepface";

export interface BackendConfig {
  id: BackendId;
  label: string;
  description: string;
  port: number;
  color: string;
}

export const BACKENDS: Record<BackendId, BackendConfig> = {
  custom: {
    id: "custom",
    label: "Custom EmotionNet",
    description: "Our own CNN trained on the FER dataset",
    port: 8000,
    color: "#6366f1",
  },
  deepface: {
    id: "deepface",
    label: "DeepFace",
    description: "Open-source library — mini_XCEPTION model",
    port: 8001,
    color: "#06b6d4",
  },
};

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
