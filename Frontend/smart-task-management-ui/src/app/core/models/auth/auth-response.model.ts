export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt?: string;
  fullName: string;
  email: string;
  role: string;
}