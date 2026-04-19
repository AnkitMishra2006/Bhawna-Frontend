export interface User {
  id: number;
  email: string;
  name: string;
  picture: string;
  auth_provider?: 'email' | 'google' | 'both';
}

export const AUTH_BACKEND_URL = 'http://localhost:8000';
export const TOKEN_STORAGE_KEY = 'emotiontrack_token';

export interface AuthResult {
  success: boolean;
  error?: string;
}
