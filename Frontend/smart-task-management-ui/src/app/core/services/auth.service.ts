
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, finalize, map, of, tap } from 'rxjs';

import { environment } from '../../../environments/environment';

import { AuthResponse } from '../models/auth/auth-response.model';
import { ApiResponse } from '../models/auth/api-response.model';
import { LoginRequest } from '../models/auth/login-request.model';
import { RegisterRequest } from '../models/auth/register-request.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  // LOGIN
  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<ApiResponse<AuthResponse>>(
        `${this.apiUrl}/auth/login`,
        request
      )
      .pipe(
        map(response => this.unwrap(response)),
        tap(response => this.storeSession(response))
      );
  }

  // REGISTER
  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<ApiResponse<AuthResponse>>(
        `${this.apiUrl}/auth/register`,
        request
      )
      .pipe(
        map(response => this.unwrap(response))
      );
  }

  // REFRESH ACCESS TOKEN
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      throw new Error('No refresh token is available.');
    }

    return this.http
      .post<ApiResponse<AuthResponse>>(
        `${this.apiUrl}/auth/refresh`,
        { refreshToken }
      )
      .pipe(
        map(response => this.unwrap(response)),
        tap(response => this.storeSession(response))
      );
  }

  // LOGOUT
  logout(): Observable<void> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      this.clearSession();
      return of(void 0);
    }

    return this.http
      .post<ApiResponse<unknown>>(
        `${this.apiUrl}/auth/logout`,
        { refreshToken }
      )
      .pipe(
        map(() => void 0),
        finalize(() => this.clearSession())
      );
  }

  // CLEAR SESSION
  clearSession(): void {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('role');
    sessionStorage.removeItem('email');
    sessionStorage.removeItem('fullName');
  }

  // AUTHENTICATION CHECK
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  // GET ACCESS TOKEN
  getAccessToken(): string | null {
    return sessionStorage.getItem('accessToken');
  }

  // GET REFRESH TOKEN
  getRefreshToken(): string | null {
    return sessionStorage.getItem('refreshToken');
  }

  // GET USER ROLE
  getRole(): string {
    return sessionStorage.getItem('role') ?? '';
  }

  // GET USER NAME
  getUserName(): string {
    return sessionStorage.getItem('fullName') ?? '';
  }

  // STORE AUTHENTICATED SESSION
  private storeSession(response: AuthResponse): void {
    sessionStorage.setItem('accessToken', response.accessToken);
    sessionStorage.setItem('refreshToken', response.refreshToken);
    sessionStorage.setItem('role', response.role);
    sessionStorage.setItem('email', response.email);
    sessionStorage.setItem('fullName', response.fullName);
  }

  // UNWRAP API RESPONSE
  private unwrap(
    response: ApiResponse<AuthResponse>
  ): AuthResponse {

    if (!response?.success || !response.data) {
      throw new Error(
        response?.message ||
        'The authentication request could not be completed.'
      );
    }

    return response.data;
  }
}
