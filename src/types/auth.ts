export interface User {
  id: string; // MongoDB ObjectId returned as a string by the backend
  email: string;
  name: string;
  picture: string;
  auth_provider?: "email" | "google" | "both";
}

// Base URL of the auth/REST backend. Auth lives on the custom backend, so this
// defaults to VITE_CUSTOM_BACKEND_URL when VITE_AUTH_BACKEND_URL isn't set.
// Override via env so the app can point at a deployed backend with no code change.
export const AUTH_BACKEND_URL: string = (
  (import.meta.env.VITE_AUTH_BACKEND_URL as string | undefined) ||
  (import.meta.env.VITE_CUSTOM_BACKEND_URL as string | undefined) ||
  "http://localhost:8000"
).replace(/\/+$/, "");

export const TOKEN_STORAGE_KEY = "emotiontrack_token";

export interface AuthResult {
  success: boolean;
  error?: string;
}
