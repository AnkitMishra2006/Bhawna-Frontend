export interface User {
  id: string; // MongoDB ObjectId returned as a string by the backend
  email: string;
  name: string;
  picture: string;
  auth_provider?: "email" | "google" | "both";
}

// Allow the backend URL to be overridden via a Vite env variable so the app
// can be pointed at a different host without changing source code.
export const AUTH_BACKEND_URL: string =
  (import.meta.env.VITE_AUTH_BACKEND_URL as string | undefined) ||
  "http://localhost:8000";

export const TOKEN_STORAGE_KEY = "emotiontrack_token";

export interface AuthResult {
  success: boolean;
  error?: string;
}
