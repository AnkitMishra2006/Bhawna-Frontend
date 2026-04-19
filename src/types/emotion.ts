export type EmotionName = 'angry' | 'disgust' | 'fear' | 'happy' | 'neutral' | 'sad' | 'surprise';

export const EMOTION_COLORS: Record<EmotionName, string> = {
  angry: '#ef4444',
  disgust: '#22c55e',
  fear: '#a855f7',
  happy: '#eab308',
  neutral: '#94a3b8',
  sad: '#3b82f6',
  surprise: '#f97316',
};

export const EMOTION_EMOJIS: Record<EmotionName, string> = {
  angry: '😠',
  disgust: '🤢',
  fear: '😨',
  happy: '😄',
  neutral: '😐',
  sad: '😢',
  surprise: '😲',
};

export type EmotionScores = Record<EmotionName, number>;

export interface FrameResult {
  type: 'result';
  face_detected: boolean;
  raw_scores?: EmotionScores;
  smoothed_scores?: EmotionScores;
  dominant_emotion?: EmotionName;
  confidence?: number;
  timestamp: number;
  model?: string;
}

export interface ReportMessage {
  type: 'report';
  text: string;
}

export type ServerMessage = FrameResult | ReportMessage | { type: 'error'; message: string };

export interface HistoryPoint {
  timestamp: number;
  dominant: EmotionName;
  scores: EmotionScores;
}

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnecting' | 'error';

export type InputMode = 'upload' | 'webcam';
export type BackendId = 'custom' | 'deepface';

export interface BackendConfig {
  id: BackendId;
  label: string;
  description: string;
  port: number;
  color: string;
}

export const BACKENDS: Record<BackendId, BackendConfig> = {
  custom: {
    id: 'custom',
    label: 'Custom EmotionNet',
    description: 'Our own CNN trained on the FER dataset',
    port: 8000,
    color: '#6366f1',
  },
  deepface: {
    id: 'deepface',
    label: 'DeepFace',
    description: 'Open-source library — mini_XCEPTION model',
    port: 8001,
    color: '#06b6d4',
  },
};

export const EMOTION_NAMES: EmotionName[] = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise'];

export const DEFAULT_SCORES: EmotionScores = {
  angry: 0, disgust: 0, fear: 0, happy: 0, neutral: 0, sad: 0, surprise: 0,
};
