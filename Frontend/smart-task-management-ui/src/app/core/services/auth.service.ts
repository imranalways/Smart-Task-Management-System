import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';

import { LoginRequest } from '../models/auth/login-request.model';
import { AuthResponse } from '../models/auth/auth-response.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly http =
    inject(HttpClient);

  private readonly apiUrl =
    environment.apiUrl;

  login(
    request: LoginRequest
  ): Observable<AuthResponse> {

    return this.http.post<AuthResponse>(
      `${this.apiUrl}/auth/login`,
      request
    ).pipe(
      tap(response => {

        localStorage.setItem(
          'accessToken',
          response.accessToken);

        localStorage.setItem(
          'refreshToken',
          response.refreshToken);

        localStorage.setItem(
          'role',
          response.role);

        localStorage.setItem(
          'email',
          response.email);

        localStorage.setItem(
          'fullName',
          response.fullName);
      })
    );
  }

  logout(): void {

    localStorage.clear();
  }

  isAuthenticated(): boolean {

    return !!localStorage.getItem(
      'accessToken');
  }

  getRole(): string {

    return localStorage.getItem(
      'role') ?? '';
  }

  getUserName(): string {

    return localStorage.getItem(
      'fullName') ?? '';
  }
}